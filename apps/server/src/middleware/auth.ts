import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../index';
import { logger } from '../index';

export interface AuthenticatedRequest extends Request {
  userId: string;
  user?: any;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    authReq.userId = userId;
    
    // Optionally fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // Create user if doesn't exist (first time login)
      const clerkUser = (req as any).auth?.user;
      if (clerkUser) {
        const newUser = await prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.fullName || '',
            tz: clerkUser.publicMetadata?.timezone as string || null
          }
        });
        authReq.user = newUser;
      }
    } else {
      authReq.user = user;
    }

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
    const { userId } = getAuth(req);
    
    if (userId) {
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