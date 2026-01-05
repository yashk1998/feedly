import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../index';
import { logger } from '../index';
import { syncClerkUser } from '../services/users';

export interface AuthenticatedRequest extends Request {
  userId: string;
  user?: any;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = auth.userId;
    authReq.userId = userId;

    const user = await syncClerkUser(userId);
    authReq.user = user;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.email !== 'yash.khivasara@gmail.com') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const auth = getAuth(req);

    if (auth?.userId) {
      const userId = auth.userId;
      authReq.userId = userId;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      authReq.user = user;
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without auth
  }
}; 