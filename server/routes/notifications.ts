import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { sendPushNotification } from '../services/notificationService';

const router = express.Router();

router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const { subscription } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Check if subscription already exists
    const exists = user.pushSubscriptions?.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions?.push(subscription);
      await user.save();
    }

    res.status(201).json({ message: 'Inscrito com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar inscrição push:', error);
    res.status(500).json({ message: 'Erro ao salvar inscrição' });
  }
});

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/test', authenticate, async (req: AuthRequest, res) => {
  try {
    await sendPushNotification(req.user?.id!, {
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste do Olha o Ponto!',
      url: '/admin/settings'
    });
    res.json({ message: 'Notificação enviada' });
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    res.status(500).json({ message: 'Erro ao enviar' });
  }
});

export default router;
