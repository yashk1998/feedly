import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export class CreditsService {
  async getCurrentCredits(userId: string): Promise<{ used: number; limit: number; cycleEnd: Date }> {
    const now = new Date()

    const payment = await prisma.payment.findFirst({
      where: { userId, status: 'active' },
    })

    const plan = payment?.plan || 'free'
    const limit = plan === 'free' ? 5 : 150

    const cycleStart = payment?.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1)
    const cycleEnd = payment?.currentPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let credits = await prisma.aiCredits.findFirst({
      where: {
        userId,
        cycleStart: { lte: now },
        cycleEnd: { gte: now },
      },
    })

    if (!credits) {
      credits = await prisma.aiCredits.create({
        data: { userId, cycleStart, cycleEnd, used: 0 },
      })
    }

    return { used: credits.used, limit, cycleEnd }
  }

  async canUseAI(userId: string): Promise<boolean> {
    const { used } = await this.getCurrentCredits(userId)
    return used < 180
  }

  async useCredit(userId: string): Promise<{ success: boolean; warning?: string; error?: string }> {
    const { used, limit } = await this.getCurrentCredits(userId)

    if (used >= 180) {
      return { success: false, error: 'AI credit limit exceeded. Please upgrade your plan or wait for next billing cycle.' }
    }

    await prisma.aiCredits.updateMany({
      where: {
        userId,
        cycleStart: { lte: new Date() },
        cycleEnd: { gte: new Date() },
      },
      data: { used: { increment: 1 } },
    })

    const newUsed = used + 1
    let warning: string | undefined

    if (newUsed === limit + 1) {
      warning = `You have exceeded your plan limit of ${limit} credits. You can still use AI features until you reach 180 credits.`
      logger.info(`User ${userId} exceeded soft credit limit`)
    }

    return { success: true, warning }
  }

  async getUserPlan(userId: string): Promise<'free' | 'pro' | 'power'> {
    const payment = await prisma.payment.findFirst({
      where: { userId, status: 'active' },
    })
    return payment?.plan || 'free'
  }
}

export const creditsService = new CreditsService()
