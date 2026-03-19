import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Company } from '../models/Company';
import { getSubscriptionBlockedMessage, getSubscriptionSnapshot } from '../utils/subscription';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    companyId: string;
  };
  company?: {
    id: string;
    subscriptionStatus: string;
    trialEndsAt: string;
    accessBlocked: boolean;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const company = await Company.findById(decoded.companyId).select('subscriptionStatus trialEndsAt createdAt');

    if (!company) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    const snapshot = getSubscriptionSnapshot(company);
    if (company.subscriptionStatus !== snapshot.effectiveStatus) {
      company.subscriptionStatus = snapshot.effectiveStatus;
      if (!company.trialEndsAt) {
        company.trialEndsAt = snapshot.trialEndsAt;
      }
      await company.save();
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      companyId: decoded.companyId
    };
    req.company = {
      id: decoded.companyId,
      subscriptionStatus: snapshot.effectiveStatus,
      trialEndsAt: snapshot.trialEndsAt.toISOString(),
      accessBlocked: snapshot.isBlocked,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

export const requireActiveSubscription = (options?: { allowPaths?: string[] }) => {
  const allowPaths = options?.allowPaths || [];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.company?.accessBlocked) {
      return next();
    }

    const isAllowedPath = allowPaths.some((path) => req.path === path || req.path.startsWith(`${path}/`));
    if (isAllowedPath) {
      return next();
    }

    return res.status(402).json({
      code: 'SUBSCRIPTION_BLOCKED',
      message: getSubscriptionBlockedMessage(new Date(req.company.trialEndsAt)),
      subscriptionStatus: req.company.subscriptionStatus,
      trialEndsAt: req.company.trialEndsAt,
    });
  };
};
