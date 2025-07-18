import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Placeholder for admin functionality
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ message: 'Admin stats coming soon', userId: authReq.userId });
});

export default router; 