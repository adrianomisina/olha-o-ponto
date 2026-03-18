import express from 'express';
import { MercadoPagoConfig, Preference, Payment as MercadoPagoPayment } from 'mercadopago';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Company } from '../models/Company';
import { Payment as PaymentModel } from '../models/Payment';
import { getAppUrl } from '../utils/appUrl';

const router = express.Router();

const getMercadoPagoAccessToken = () =>
  process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const getMercadoPagoClient = () => {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new Error('Credencial do Mercado Pago não configurada');
  }

  return new MercadoPagoConfig({ accessToken });
};

const getMercadoPagoErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const apiMessage =
      (error as any).message ||
      (error as any).cause?.[0]?.description ||
      (error as any).error;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
  }

  return 'Erro ao processar pagamento';
};

const planPrices: Record<string, number> = {
  basic: 49.90,
  professional: 149.90,
  enterprise: 399.90
};

const planLimits: Record<string, number> = {
  basic: 10,
  professional: 30,
  enterprise: 100
};

router.post('/create-preference', authenticate, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'ID da empresa não encontrado no token' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const selectedPlan = typeof plan === 'string' && planPrices[plan] ? plan : company.plan;
    const price = planPrices[selectedPlan] || 0;
    if (price === 0) {
      return res.status(400).json({ message: 'Plano inválido' });
    }

    const appUrl = getAppUrl(req);
    const preference = new Preference(getMercadoPagoClient());
    const result = await preference.create({
      body: {
        items: [
          {
            id: selectedPlan,
            title: `Plano ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} - Teste Grátis 7 Dias`,
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: company.email,
          name: company.name
        },
        back_urls: {
          success: `${appUrl}/admin?payment=success`,
          failure: `${appUrl}/admin?payment=failure`,
          pending: `${appUrl}/admin?payment=pending`
        },
        auto_return: 'approved',
        external_reference: company._id.toString(),
        notification_url: `${appUrl}/api/payments/webhook`,
        // metadata to track trial
        metadata: {
          company_id: company._id.toString(),
          plan: selectedPlan,
          is_trial: true
        }
      }
    });

    company.mercadoPagoPreferenceId = result.id;
    await company.save();

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    res.status(500).json({ message: getMercadoPagoErrorMessage(error) });
  }
});

router.post('/simulate', authenticate, async (req: AuthRequest, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Simulação indisponível em produção' });
    }

    const company = await Company.findById(req.user?.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const paymentId = `simulated_${Date.now()}`;

    company.subscriptionStatus = 'paid';
    company.employeesLimit = planLimits[company.plan] || company.employeesLimit;
    await company.save();

    await PaymentModel.findOneAndUpdate(
      { mercadoPagoPaymentId: paymentId },
      {
        companyId: company._id,
        mercadoPagoPaymentId: paymentId,
        amount: planPrices[company.plan] || 0,
        status: 'approved',
        plan: company.plan,
        paymentMethod: 'simulation',
        date: new Date()
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.json({ message: 'Pagamento simulado com sucesso', paymentId });
  } catch (error) {
    console.error('Erro ao simular pagamento:', error);
    res.status(500).json({ message: 'Erro ao simular pagamento' });
  }
});

// Get payment history for company with pagination
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = { companyId: req.user?.companyId };
    const total = await PaymentModel.countDocuments(query);
    const payments = await PaymentModel.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      payments,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
});

// Webhook for Mercado Pago notifications
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const mpPaymentClient = new MercadoPagoPayment(getMercadoPagoClient());
      const payment = await mpPaymentClient.get({ id: String(data.id) });
      const companyId = payment.external_reference || payment.metadata?.company_id;
      const plan = payment.metadata?.plan;

      if (!companyId || !plan || !planPrices[plan]) {
        return res.sendStatus(200);
      }

      const company = await Company.findById(companyId);
      if (!company) {
        return res.sendStatus(200);
      }

      if (payment.status === 'approved') {
        company.subscriptionStatus = 'paid';
        company.plan = plan;
        company.employeesLimit = planLimits[plan];
        await company.save();
      } else if (payment.status === 'pending' || payment.status === 'in_process') {
        company.subscriptionStatus = 'pending';
        await company.save();
      }

      await PaymentModel.findOneAndUpdate(
        { mercadoPagoPaymentId: String(payment.id || data.id) },
        {
          companyId: company._id,
          mercadoPagoPaymentId: String(payment.id || data.id),
          amount: payment.transaction_amount || planPrices[plan],
          status: payment.status || 'pending',
          plan,
          paymentMethod: payment.payment_method_id || payment.payment_type_id || 'unknown',
          date: payment.date_approved ? new Date(payment.date_approved) : new Date()
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.sendStatus(500);
  }
});

export default router;
