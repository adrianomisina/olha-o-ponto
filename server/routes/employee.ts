import express from 'express';
import { authenticate, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { TimeRecord } from '../models/TimeRecord';
import { TimeAdjustment } from '../models/TimeAdjustment';
import { User } from '../models/User';
import { notifyAdmins } from '../services/notificationService';

const router = express.Router();

router.use(authenticate);
router.use(requireActiveSubscription({ allowPaths: ['/dashboard'] }));

// Get employee dashboard data
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    if (req.company?.accessBlocked) {
      return res.json({
        todayRecords: [],
        lastRecord: null,
        subscriptionStatus: req.company.subscriptionStatus,
        trialEndsAt: req.company.trialEndsAt,
        accessBlocked: true,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await TimeRecord.find({
      userId: req.user?.id,
      timestamp: { $gte: today }
    }).sort({ timestamp: 1 });

    const lastRecord = records.length > 0 ? records[records.length - 1] : null;

    res.json({
      todayRecords: records,
      lastRecord,
      subscriptionStatus: req.company?.subscriptionStatus || 'paid',
      trialEndsAt: req.company?.trialEndsAt,
      accessBlocked: false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Punch clock (bater ponto)
router.post('/time-record', async (req: AuthRequest, res) => {
  try {
    const { type, location, notes } = req.body;

    if (notes?.length > 500) return res.status(400).json({ message: 'Notas muito longas (máx 500 caracteres)' });

    const record = new TimeRecord({
      userId: req.user?.id,
      companyId: req.user?.companyId,
      type,
      location,
      notes
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get history
router.get('/time-records', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await TimeRecord.countDocuments({ userId: req.user?.id });
    const records = await TimeRecord.find({ userId: req.user?.id })
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

// Create an adjustment request
router.post('/adjustments', async (req: AuthRequest, res) => {
  try {
    const { proposedTimestamp, proposedType, reason, originalRecordId } = req.body;

    if (reason?.length > 500) return res.status(400).json({ message: 'Motivo muito longo (máx 500 caracteres)' });

    const adjustment = new TimeAdjustment({
      userId: req.user?.id,
      companyId: req.user?.companyId,
      proposedTimestamp,
      proposedType,
      reason,
      originalRecordId
    });

    await adjustment.save();

    // Notify admins about the new adjustment request
    const user = await User.findById(req.user?.id);
    notifyAdmins(req.user?.companyId!, {
      title: 'Nova Solicitação de Ajuste',
      body: `${user?.name || 'Um funcionário'} solicitou um ajuste de ponto.`,
      url: '/admin/approvals'
    });

    res.status(201).json(adjustment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee's adjustment requests
router.get('/adjustments', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await TimeAdjustment.countDocuments({ userId: req.user?.id });
    const adjustments = await TimeAdjustment.find({ userId: req.user?.id })
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

export default router;
