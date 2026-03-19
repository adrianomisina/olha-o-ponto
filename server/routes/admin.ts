import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireActiveSubscription, requireRole, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { TimeRecord } from '../models/TimeRecord';
import { Company } from '../models/Company';
import { TimeAdjustment } from '../models/TimeAdjustment';
import { AccessRequest } from '../models/AccessRequest';
import { validateEmail, validatePassword, passwordValidationMessage } from '../utils/validation';
import { sendPushNotification } from '../services/notificationService';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));
router.use(requireActiveSubscription({ allowPaths: ['/dashboard', '/settings'] }));

// Get admin dashboard stats
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user?.companyId;
    
    const employeeCount = await User.countDocuments({ companyId, role: 'employee', isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = await TimeRecord.find({ 
      companyId, 
      timestamp: { $gte: today } 
    }).populate('userId', 'name').sort({ timestamp: 1 });

    // Group by user to see who is present
    const presentUsers = new Set(todayRecords.map(r => r.userId._id.toString()));

    const pendingAdjustments = await TimeAdjustment.countDocuments({ companyId, status: 'pending' });
    const company = await Company.findById(companyId);

    res.json({
      totalEmployees: employeeCount,
      presentToday: presentUsers.size,
      absentToday: employeeCount - presentUsers.size,
      recentActivity: todayRecords.slice(-5).reverse(),
      pendingAdjustments,
      employeesLimit: company?.employeesLimit || 0,
      subscriptionStatus: req.company?.subscriptionStatus || company?.subscriptionStatus || 'active',
      trialEndsAt: req.company?.trialEndsAt || company?.trialEndsAt?.toISOString?.(),
      accessBlocked: req.company?.accessBlocked || false,
      plan: company?.plan || 'free'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all employees with pagination
router.get('/employees', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = { companyId: req.user?.companyId, role: 'employee', isActive: true };
    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      employees,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add employee
router.post('/employees', async (req: AuthRequest, res) => {
  try {
    const { name, email, password, position, department } = req.body;
    const companyId = req.user?.companyId;

    if (name?.length > 100) return res.status(400).json({ message: 'Nome muito longo (máx 100 caracteres)' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Por favor, insira um email válido' });
    if (email?.length > 100) return res.status(400).json({ message: 'Email muito longo (máx 100 caracteres)' });
    if (password?.length > 128) return res.status(400).json({ message: 'Senha muito longa (máx 128 caracteres)' });
    if (!validatePassword(password)) return res.status(400).json({ message: passwordValidationMessage });
    if (position?.length > 100) return res.status(400).json({ message: 'Cargo muito longo (máx 100 caracteres)' });
    if (department?.length > 100) return res.status(400).json({ message: 'Departamento muito longo (máx 100 caracteres)' });

    // Check limits
    const company = await Company.findById(companyId);
    const currentCount = await User.countDocuments({ companyId, isActive: true });
    
    if (company && currentCount >= company.employeesLimit) {
      return res.status(403).json({ 
        message: `Limite de funcionários atingido para o plano ${company.plan.toUpperCase()}. Seu limite atual é de ${company.employeesLimit} funcionários. Por favor, faça um upgrade nas configurações.` 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, email, password: hashedPassword, role: 'employee', companyId, position, department
    });

    await user.save();
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk add employees
router.post('/employees/bulk', async (req: AuthRequest, res) => {
  try {
    const { employees } = req.body;
    const companyId = req.user?.companyId;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ message: 'Nenhum funcionário fornecido' });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Empresa não encontrada' });

    const currentCount = await User.countDocuments({ companyId, isActive: true });
    if (currentCount + employees.length > company.employeesLimit) {
      return res.status(403).json({ 
        message: `Limite de funcionários seria excedido. Restam ${company.employeesLimit - currentCount} vagas.` 
      });
    }

    const results = { success: 0, errors: [] as string[] };
    const defaultPassword = await bcrypt.hash('mudar123', 10);

    for (const emp of employees) {
      try {
        const { name, email, position, department } = emp;
        
        if (!name || !email || !validateEmail(email)) {
          results.errors.push(`Dados inválidos para: ${name || email}`);
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.errors.push(`Email já em uso: ${email}`);
          continue;
        }

        const user = new User({
          name, email, password: defaultPassword, role: 'employee', companyId, position, department
        });
        await user.save();
        results.success++;
      } catch (err) {
        results.errors.push(`Erro ao processar: ${emp.email}`);
      }
    }

    res.json({ 
      message: `${results.success} funcionários adicionados com sucesso.`,
      errors: results.errors 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
router.delete('/employees/:id', async (req: AuthRequest, res) => {
  try {
    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user?.companyId, role: 'employee', isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports with pagination
router.get('/reports', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, userId, type } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let query: any = { companyId: req.user?.companyId };
    
    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    if (userId && userId !== 'all') {
      query.userId = userId;
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const total = await TimeRecord.countDocuments(query);
    const records = await TimeRecord.find(query)
      .populate('userId', 'name department')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({
      records,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all adjustments with pagination
router.get('/adjustments', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = { companyId: req.user?.companyId };
    const total = await TimeAdjustment.countDocuments(query);
    const adjustments = await TimeAdjustment.find(query)
      .populate('userId', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      adjustments,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company settings
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    const company = await Company.findById(req.user?.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company settings
router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (name?.length > 100) return res.status(400).json({ message: 'Nome muito longo (máx 100 caracteres)' });
    if (email && !validateEmail(email)) return res.status(400).json({ message: 'Por favor, insira um email válido' });
    if (email?.length > 100) return res.status(400).json({ message: 'Email muito longo (máx 100 caracteres)' });
    if (phone?.length > 20) return res.status(400).json({ message: 'Telefone muito longo (máx 20 caracteres)' });
    if (address?.length > 200) return res.status(400).json({ message: 'Endereço muito longo (máx 200 caracteres)' });

    const company = await Company.findByIdAndUpdate(
      req.user?.companyId,
      { name, email, phone, address },
      { new: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee access recovery requests
router.get('/access-requests', async (req: AuthRequest, res) => {
  try {
    const requests = await AccessRequest.find({ companyId: req.user?.companyId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      requests,
      totalOpen: requests.filter(request => request.status === 'open').length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resolve employee access recovery request
router.put('/access-requests/:id/resolve', async (req: AuthRequest, res) => {
  try {
    const { resolutionNote } = req.body;

    if (resolutionNote?.length > 500) {
      return res.status(400).json({ message: 'Nota de resolução muito longa (máx 500 caracteres)' });
    }

    const accessRequest = await AccessRequest.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user?.companyId, status: 'open' },
      {
        status: 'resolved',
        resolvedBy: req.user?.id,
        resolvedAt: new Date(),
        resolutionNote
      },
      { returnDocument: 'after' }
    );

    if (!accessRequest) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    if (accessRequest.userId) {
      await sendPushNotification(accessRequest.userId.toString(), {
        title: 'Solicitação de Acesso Atualizada',
        body: 'O administrador tratou sua solicitação de acesso.',
        url: '/login'
      });
    }

    res.json(accessRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk approve or reject adjustments
router.put('/adjustments/bulk', async (req: AuthRequest, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    const results = [];
    for (const id of ids) {
      const adjustment = await TimeAdjustment.findOne({ _id: id, companyId: req.user?.companyId, status: 'pending' });
      if (adjustment) {
        adjustment.status = status;
        adjustment.reviewedBy = req.user?.id as any;
        adjustment.reviewedAt = new Date();
        await adjustment.save();

        if (status === 'approved') {
          if (adjustment.originalRecordId) {
            await TimeRecord.findByIdAndUpdate(adjustment.originalRecordId, {
              timestamp: adjustment.proposedTimestamp,
              type: adjustment.proposedType,
              notes: `Ajustado via aprovação: ${adjustment.reason}`
            });
          } else {
            const newRecord = new TimeRecord({
              userId: adjustment.userId,
              companyId: adjustment.companyId,
              timestamp: adjustment.proposedTimestamp,
              type: adjustment.proposedType,
              notes: `Criado via aprovação: ${adjustment.reason}`
            });
            await newRecord.save();
          }
        }
        results.push(id);

        // Notify employee
        sendPushNotification(adjustment.userId.toString(), {
          title: `Solicitação de Ajuste ${status === 'approved' ? 'Aprovada' : 'Rejeitada'}`,
          body: `Seu ajuste para ${adjustment.proposedType} foi ${status === 'approved' ? 'aprovado' : 'rejeitado'}.`,
          url: '/app/adjustments'
        });
      }
    }

    res.json({ message: `${results.length} solicitações processadas`, processedIds: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject adjustment
router.put('/adjustments/:id', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const adjustment = await TimeAdjustment.findOne({ _id: req.params.id, companyId: req.user?.companyId });
    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }

    adjustment.status = status;
    adjustment.reviewedBy = req.user?.id as any;
    adjustment.reviewedAt = new Date();
    await adjustment.save();

    if (status === 'approved') {
      if (adjustment.originalRecordId) {
        // Update existing record
        await TimeRecord.findByIdAndUpdate(adjustment.originalRecordId, {
          timestamp: adjustment.proposedTimestamp,
          type: adjustment.proposedType,
          notes: `Ajustado via aprovação: ${adjustment.reason}`
        });
      } else {
        // Create new record
        const newRecord = new TimeRecord({
          userId: adjustment.userId,
          companyId: adjustment.companyId,
          timestamp: adjustment.proposedTimestamp,
          type: adjustment.proposedType,
          notes: `Criado via aprovação: ${adjustment.reason}`
        });
        await newRecord.save();
      }
    }

    res.json(adjustment);

    // Notify employee
    sendPushNotification(adjustment.userId.toString(), {
      title: `Solicitação de Ajuste ${status === 'approved' ? 'Aprovada' : 'Rejeitada'}`,
      body: `Seu ajuste para ${adjustment.proposedType} foi ${status === 'approved' ? 'aprovado' : 'rejeitado'}.`,
      url: '/app/adjustments'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
