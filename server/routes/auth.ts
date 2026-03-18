import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { AccessRequest } from '../models/AccessRequest';
import { validateEmail } from '../utils/validation';
import { notifyAdmins } from '../services/notificationService';
import { getAppUrl } from '../utils/appUrl';
import { isEmailDeliveryConfigured, sendEmployeeAccessRequestEmail, sendPasswordResetEmail } from '../services/emailService';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

router.post('/register', async (req, res) => {
  let company = null;
  try {
    const { companyName, userName, email, password, plan } = req.body;

    if (companyName?.length > 100) return res.status(400).json({ message: 'Nome da empresa muito longo (máx 100 caracteres)' });
    if (userName?.length > 100) return res.status(400).json({ message: 'Nome de usuário muito longo (máx 100 caracteres)' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Por favor, insira um email válido' });
    if (email?.length > 100) return res.status(400).json({ message: 'Email muito longo (máx 100 caracteres)' });
    if (password?.length > 128) return res.status(400).json({ message: 'Senha muito longa (máx 128 caracteres)' });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create company
    company = new Company({
      name: companyName,
      email,
      plan: plan || 'basic',
      employeesLimit: plan === 'professional' ? 30 : plan === 'enterprise' ? 100 : 10,
      subscriptionStatus: 'pending'
    });
    await company.save();

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: userName,
      email,
      password: hashedPassword,
      role: 'admin',
      companyId: company._id,
      isActive: true
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, companyId: company._id.toString() },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyId: company._id }
    });
  } catch (error) {
    if (company?._id) {
      await Company.findByIdAndDelete(company._id).catch(() => undefined);
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register-employee', async (req, res) => {
  try {
    const { companyId, name, email, password } = req.body;

    if (!companyId) return res.status(400).json({ message: 'ID da empresa é obrigatório' });
    if (!name || !email || !password) return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Email inválido' });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Empresa não encontrada' });

    const currentCount = await User.countDocuments({ companyId, isActive: true });
    if (currentCount >= company.employeesLimit) {
      return res.status(403).json({ message: 'Limite de funcionários da empresa atingido' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email já cadastrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      companyId,
      isActive: true
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, companyId: company._id.toString() },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyId: user.companyId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/company/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).select('name');
    if (!company) return res.status(404).json({ message: 'Empresa não encontrada' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!validateEmail(email)) return res.status(400).json({ message: 'Por favor, insira um email válido' });

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Credenciais inválidas ou conta inativa' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ 
        message: `Esta conta não tem permissão de ${role === 'admin' ? 'Administrador' : 'Funcionário'}` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, companyId: user.companyId.toString() },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyId: user.companyId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role = 'admin', message } = req.body;
    if (!validateEmail(email)) return res.status(400).json({ message: 'Por favor, insira um email válido' });

    if (role === 'employee') {
      const employee = await User.findOne({ email, role: 'employee', isActive: true });
      if (!employee) {
        return res.json({ message: 'Se encontrarmos este funcionário, avisaremos o administrador responsável.' });
      }

      const trimmedMessage = typeof message === 'string' && message.trim()
        ? message.trim()
        : 'Preciso recuperar meu acesso ao sistema.';

      const existingRequest = await AccessRequest.findOne({
        companyId: employee.companyId,
        email,
        status: 'open'
      });

      if (existingRequest) {
        existingRequest.message = trimmedMessage;
        existingRequest.userId = employee._id;
        existingRequest.employeeName = employee.name;
        existingRequest.resolvedBy = undefined;
        existingRequest.resolvedAt = undefined;
        existingRequest.resolutionNote = undefined;
        await existingRequest.save();
      } else {
        await AccessRequest.create({
          companyId: employee.companyId,
          userId: employee._id,
          employeeName: employee.name,
          email,
          message: trimmedMessage
        });
      }

      await notifyAdmins(employee.companyId.toString(), {
        title: 'Solicitação de Acesso',
        body: `${employee.name} pediu ajuda para recuperar o acesso.`,
        url: '/admin/approvals'
      });

      const admins = await User.find({ companyId: employee.companyId, role: 'admin', isActive: true }).select('name email');
      const approvalsUrl = `${getAppUrl(req)}/admin/approvals`;
      await Promise.all(admins.map(admin =>
        sendEmployeeAccessRequestEmail({
          to: admin.email,
          adminName: admin.name,
          employeeName: employee.name,
          employeeEmail: employee.email,
          message: trimmedMessage,
          approvalsUrl
        }).catch(error => {
          console.error('Error sending access request email:', error);
        })
      ));

      return res.json({ message: 'Sua solicitação foi enviada ao administrador da empresa.' });
    }

    const user = await User.findOne({ email, role: 'admin', isActive: true });
    if (!user) {
      return res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const appUrl = getAppUrl(req);
    const resetUrl = `${appUrl}/reset-password/${token}`;

    if (!isEmailDeliveryConfigured()) {
      console.warn(`[PASSWORD RESET DISABLED] Link for ${email}: ${resetUrl}`);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          message: 'Email não configurado. Use o link de recuperação retornado para continuar em desenvolvimento.',
          resetUrl
        });
      }

      return res.status(503).json({
        message: 'A recuperação por email não está configurada no momento. Tente novamente mais tarde.'
      });
    }

    try {
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetUrl
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);

      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          message: 'Falha no envio do email. Use o link de recuperação retornado para continuar em desenvolvimento.',
          resetUrl
        });
      }

      return res.status(502).json({
        message: 'Não foi possível enviar o email de recuperação agora. Verifique a configuração de email e tente novamente.'
      });
    }

    res.json({ message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (password?.length > 128) return res.status(400).json({ message: 'Senha muito longa (máx 128 caracteres)' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
