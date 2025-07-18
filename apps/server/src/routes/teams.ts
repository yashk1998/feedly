import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Placeholder for teams functionality
router.get('/', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ message: 'Teams feature coming soon', userId: authReq.userId });
});

export default router; 