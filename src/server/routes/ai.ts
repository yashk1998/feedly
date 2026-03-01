import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { creditsService } from '../services/credits'
import { aiService } from '../services/ai'

const summarizeSchema = z.object({
  articleId: z.number(),
})

const socialPostSchema = z.object({
  articleId: z.number(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']),
  tone: z.enum(['professional', 'casual', 'engaging']).optional().default('engaging'),
})

const app = new Hono()

// Helper: fetch article and verify access
async function getArticle(articleId: number, userId: string) {
  return prisma.article.findFirst({
    where: {
      id: BigInt(articleId),
      feed: {
        subscriptions: {
          some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
        },
      },
    },
  })
}

// GET /api/ai/credits
app.get('/credits', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')
    const credits = await creditsService.getCurrentCredits(userId)
    const plan = await creditsService.getUserPlan(userId)

    return c.json({
      used: credits.used,
      limit: credits.limit,
      remaining: Math.max(0, credits.limit - credits.used),
      cycleEnd: credits.cycleEnd,
      plan,
    })
  } catch (error) {
    logger.error('Error fetching AI credits:', error)
    return c.json({ error: 'Failed to fetch AI credits' }, 500)
  }
})

// POST /api/ai/summarize
app.post('/summarize', requireAuth, zValidator('json', summarizeSchema), async (c) => {
  try {
    const { articleId } = c.req.valid('json')
    const userId = c.get('userId')

    const article = await getArticle(articleId, userId)
    if (!article) return c.json({ error: 'Article not found' }, 404)

    // Try cache first (no credit charge)
    const { text, model, cached } = await aiService.summarizeArticle(
      { title: article.title || '', content: article.contentHtml || article.summaryHtml || '', url: article.url || '' },
      articleId,
      userId
    )

    // Only charge credit if not from cache
    if (!cached) {
      const canUse = await creditsService.canUseAI(userId)
      if (!canUse) {
        return c.json({ error: 'AI credit limit exceeded. Upgrade your plan or wait for next billing cycle.' }, 403)
      }
      const creditResult = await creditsService.useCredit(userId)
      if (!creditResult.success) {
        return c.json({ error: creditResult.error }, 403)
      }

      return c.json({ summary: text, model, cached: false, creditsUsed: 1, warning: creditResult.warning })
    }

    return c.json({ summary: text, model, cached: true, creditsUsed: 0 })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error summarizing article:', error)
    return c.json({ error: 'Failed to summarize article' }, 500)
  }
})

// POST /api/ai/social-post
app.post('/social-post', requireAuth, zValidator('json', socialPostSchema), async (c) => {
  try {
    const { articleId, platform, tone } = c.req.valid('json')
    const userId = c.get('userId')

    const plan = await creditsService.getUserPlan(userId)
    if (plan === 'free') {
      return c.json({ error: 'Social media post generation is available for Pro and Power plans only.' }, 403)
    }

    const article = await getArticle(articleId, userId)
    if (!article) return c.json({ error: 'Article not found' }, 404)

    const { text, model, cached } = await aiService.generateSocialPost(
      { title: article.title || '', content: article.contentHtml || article.summaryHtml || '', url: article.url || '', platform, tone },
      articleId,
      userId
    )

    return c.json({
      post: text,
      platform,
      model,
      cached,
      characterCount: text.length,
      maxLength: platform === 'twitter' ? 280 : platform === 'linkedin' ? 3000 : 40000,
    })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error generating social post:', error)
    return c.json({ error: 'Failed to generate social post' }, 500)
  }
})

// POST /api/ai/extract-keywords
app.post('/extract-keywords', requireAuth, zValidator('json', summarizeSchema), async (c) => {
  try {
    const { articleId } = c.req.valid('json')
    const userId = c.get('userId')

    const plan = await creditsService.getUserPlan(userId)
    if (plan === 'free') {
      return c.json({ error: 'Keyword extraction is available for Pro and Power plans only.' }, 403)
    }

    const article = await getArticle(articleId, userId)
    if (!article) return c.json({ error: 'Article not found' }, 404)

    const { keywords, model, cached } = await aiService.extractKeywords(
      { title: article.title || '', content: article.contentHtml || article.summaryHtml || '' },
      articleId,
      userId
    )

    return c.json({ keywords, articleId, model, cached })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error extracting keywords:', error)
    return c.json({ error: 'Failed to extract keywords' }, 500)
  }
})

// POST /api/ai/sentiment
app.post('/sentiment', requireAuth, zValidator('json', summarizeSchema), async (c) => {
  try {
    const { articleId } = c.req.valid('json')
    const userId = c.get('userId')

    const plan = await creditsService.getUserPlan(userId)
    if (plan === 'free') {
      return c.json({ error: 'Sentiment analysis is available for Pro and Power plans only.' }, 403)
    }

    const article = await getArticle(articleId, userId)
    if (!article) return c.json({ error: 'Article not found' }, 404)

    const { result, model, cached } = await aiService.analyzeSentiment(
      { title: article.title || '', content: article.contentHtml || article.summaryHtml || '' },
      articleId,
      userId
    )

    return c.json({ sentiment: result, articleId, model, cached })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error analyzing sentiment:', error)
    return c.json({ error: 'Failed to analyze sentiment' }, 500)
  }
})

// POST /api/ai/translate
const translateSchema = z.object({
  articleId: z.number(),
  targetLang: z.string().min(2).max(5),
})

app.post('/translate', requireAuth, zValidator('json', translateSchema), async (c) => {
  try {
    const { articleId, targetLang } = c.req.valid('json')
    const userId = c.get('userId')

    const article = await getArticle(articleId, userId)
    if (!article) return c.json({ error: 'Article not found' }, 404)

    const { translatedTitle, translatedContent, model, cached } = await aiService.translateArticle(
      { title: article.title || '', content: article.contentHtml || article.summaryHtml || '' },
      targetLang,
      articleId,
      userId
    )

    if (!cached) {
      const canUse = await creditsService.canUseAI(userId)
      if (!canUse) {
        return c.json({ error: 'AI credit limit exceeded.' }, 403)
      }
      await creditsService.useCredit(userId)
    }

    return c.json({ translatedTitle, translatedContent, targetLang, model, cached })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error translating article:', error)
    return c.json({ error: 'Failed to translate article' }, 500)
  }
})

// POST /api/ai/digest — generate a digest for the user
const digestSchema = z.object({
  articleCount: z.number().min(1).max(20).optional().default(10),
})

app.post('/digest', requireAuth, zValidator('json', digestSchema), async (c) => {
  try {
    const { articleCount } = c.req.valid('json')
    const userId = c.get('userId')

    const { digest, model, cached } = await aiService.generateDigest(userId, articleCount)

    // Save digest to database
    await prisma.digest.create({
      data: {
        userId,
        articleCount,
        content: digest,
        model: model || null,
      },
    })

    return c.json({ digest, model, cached })
  } catch (error) {
    if (error instanceof z.ZodError) return c.json({ error: 'Invalid input', details: error.errors }, 400)
    logger.error('Error generating digest:', error)
    return c.json({ error: 'Failed to generate digest' }, 500)
  }
})

// GET /api/ai/digests — list past digests
app.get('/digests', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const digests = await prisma.digest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return c.json({
      digests: digests.map((d) => ({
        id: Number(d.id),
        articleCount: d.articleCount,
        content: d.content,
        model: d.model,
        sentAt: d.sentAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Error fetching digests:', error)
    return c.json({ error: 'Failed to fetch digests' }, 500)
  }
})

export default app
