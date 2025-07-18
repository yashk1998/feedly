import { prisma } from '../index';
import { logger } from '../index';

export class CreditsService {
  
  /**
   * Get current credit usage for a user
   */
  async getCurrentCredits(userId: string): Promise<{ used: number; limit: number; cycleEnd: Date }> {
    const now = new Date();
    
    // Get user's payment info to determine plan
    const payment = await prisma.payment.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    });
    
    const plan = payment?.plan || 'free';
    const limit = plan === 'free' ? 5 : 150;
    
    // Get billing cycle start date
    const cycleStart = payment?.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = payment?.currentPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get or create current cycle credits
    let credits = await prisma.aiCredits.findFirst({
      where: {
        userId,
        cycleStart: {
          lte: now
        },
        cycleEnd: {
          gte: now
        }
      }
    });
    
    if (!credits) {
      credits = await prisma.aiCredits.create({
        data: {
          userId,
          cycleStart,
          cycleEnd,
          used: 0
        }
      });
    }
    
    return {
      used: credits.used,
      limit,
      cycleEnd
    };
  }
  
  /**
   * Check if user can use AI features (not hard-blocked)
   */
  async canUseAI(userId: string): Promise<boolean> {
    const { used } = await this.getCurrentCredits(userId);
    return used < 180; // Hard limit
  }
  
  /**
   * Use a credit for AI summarization
   */
  async useCredit(userId: string): Promise<{ success: boolean; warning?: string; error?: string }> {
    const { used, limit } = await this.getCurrentCredits(userId);
    
    if (used >= 180) {
      return { success: false, error: 'AI credit limit exceeded. Please upgrade your plan or wait for next billing cycle.' };
    }
    
    // Increment usage
    await prisma.aiCredits.updateMany({
      where: {
        userId,
        cycleStart: {
          lte: new Date()
        },
        cycleEnd: {
          gte: new Date()
        }
      },
      data: {
        used: {
          increment: 1
        }
      }
    });
    
    const newUsed = used + 1;
    let warning: string | undefined;
    
    // Send warning email if exceeding soft limit for first time
    if (newUsed === 151) {
      warning = 'You have exceeded your plan limit. You can still use AI features until you reach 180 credits.';
      // TODO: Send email warning
      logger.info(`User ${userId} exceeded soft credit limit`);
    }
    
    return { success: true, warning };
  }
  
  /**
   * Reset credits for a new billing cycle
   */
  async resetCredits(userId: string, cycleStart: Date, cycleEnd: Date): Promise<void> {
    await prisma.aiCredits.create({
      data: {
        userId,
        cycleStart,
        cycleEnd,
        used: 0
      }
    });
    
    logger.info(`Reset credits for user ${userId} for cycle ${cycleStart.toISOString()}`);
  }
  
  /**
   * Get user's plan information
   */
  async getUserPlan(userId: string): Promise<'free' | 'pro' | 'power'> {
    const payment = await prisma.payment.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    });
    
    return payment?.plan || 'free';
  }
}

export const creditsService = new CreditsService(); 