import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Placeholder for payments functionality
router.post('/webhook', async (req: Request, res: Response) => {
  res.json({ message: 'Webhook received' });
});

router.get('/plans', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ message: 'Plans endpoint coming soon', userId: authReq.userId });
});

export default router; 