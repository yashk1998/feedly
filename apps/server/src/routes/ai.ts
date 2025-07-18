import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../index';
import { creditsService } from '../services/credits';
import { aiService } from '../services/ai';

const router = Router();

// Validation schemas
const summarizeSchema = z.object({
  articleId: z.number()
});

const socialPostSchema = z.object({
  articleId: z.number(),
  platform: z.enum(['twitter', 'linkedin', 'reddit']),
  tone: z.enum(['professional', 'casual', 'engaging']).optional().default('engaging')
});

/**
 * GET /api/ai/credits - Get user's AI credit usage
 */
router.get('/credits', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.userId;
    const credits = await creditsService.getCurrentCredits(userId);
    const plan = await creditsService.getUserPlan(userId);

    res.json({
      used: credits.used,
      limit: credits.limit,
      remaining: Math.max(0, credits.limit - credits.used),
      cycleEnd: credits.cycleEnd,
      plan
    });
  } catch (error) {
    logger.error('Error fetching AI credits:', error);
    res.status(500).json({ error: 'Failed to fetch AI credits' });
  }
});

/**
 * POST /api/ai/summarize - Summarize an article
 */
router.post('/summarize', requireAuth, async (req, res) => {
  try {
    const { articleId } = summarizeSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    // Check if user can use AI features
    const canUse = await creditsService.canUseAI(userId);
    if (!canUse) {
      return res.status(403).json({ 
        error: 'AI credit limit exceeded. Please upgrade your plan or wait for next billing cycle.' 
      });
    }

    // Get article
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        feed: {
          subscriptions: {
            some: {
              OR: [
                { userId },
                {
                  team: {
                    members: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Use a credit
    const creditResult = await creditsService.useCredit(userId);
    if (!creditResult.success) {
      return res.status(403).json({ error: creditResult.error });
    }

    // Generate summary
    const summary = await aiService.summarizeArticle({
      title: article.title || '',
      content: article.contentHtml || article.summaryHtml || '',
      url: article.url || ''
    });

    // Mark article as read since user is engaging with it
    await prisma.articleRead.upsert({
      where: {
        articleId_userId: {
          articleId,
          userId
        }
      },
      create: {
        articleId,
        userId
      },
      update: {}
    });

    res.json({
      summary,
      warning: creditResult.warning,
      creditsUsed: 1
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error summarizing article:', error);
    res.status(500).json({ error: 'Failed to summarize article' });
  }
});

/**
 * POST /api/ai/social-post - Generate social media post
 */
router.post('/social-post', requireAuth, async (req, res) => {
  try {
    const { articleId, platform, tone } = socialPostSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    // Check user plan (social posting is paid feature)
    const plan = await creditsService.getUserPlan(userId);
    if (plan === 'free') {
      return res.status(403).json({ 
        error: 'Social media post generation is available for Pro and Power plans only.' 
      });
    }

    // Get article
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        feed: {
          subscriptions: {
            some: {
              OR: [
                { userId },
                {
                  team: {
                    members: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Generate social post
    const post = await aiService.generateSocialPost({
      title: article.title || '',
      content: article.contentHtml || article.summaryHtml || '',
      url: article.url || '',
      platform,
      tone
    });

    res.json({
      post,
      platform,
      characterCount: post.length,
      maxLength: platform === 'twitter' ? 280 : platform === 'linkedin' ? 3000 : 40000
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error generating social post:', error);
    res.status(500).json({ error: 'Failed to generate social post' });
  }
});

/**
 * POST /api/ai/extract-keywords - Extract keywords from article
 */
router.post('/extract-keywords', requireAuth, async (req, res) => {
  try {
    const { articleId } = summarizeSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    // Check user plan
    const plan = await creditsService.getUserPlan(userId);
    if (plan === 'free') {
      return res.status(403).json({ 
        error: 'Keyword extraction is available for Pro and Power plans only.' 
      });
    }

    // Get article
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        feed: {
          subscriptions: {
            some: {
              OR: [
                { userId },
                {
                  team: {
                    members: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Extract keywords
    const keywords = await aiService.extractKeywords({
      title: article.title || '',
      content: article.contentHtml || article.summaryHtml || ''
    });

    res.json({
      keywords,
      articleId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error extracting keywords:', error);
    res.status(500).json({ error: 'Failed to extract keywords' });
  }
});

/**
 * POST /api/ai/sentiment - Analyze article sentiment
 */
router.post('/sentiment', requireAuth, async (req, res) => {
  try {
    const { articleId } = summarizeSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    // Check user plan
    const plan = await creditsService.getUserPlan(userId);
    if (plan === 'free') {
      return res.status(403).json({ 
        error: 'Sentiment analysis is available for Pro and Power plans only.' 
      });
    }

    // Get article
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        feed: {
          subscriptions: {
            some: {
              OR: [
                { userId },
                {
                  team: {
                    members: {
                      some: { userId }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Analyze sentiment
    const sentiment = await aiService.analyzeSentiment({
      title: article.title || '',
      content: article.contentHtml || article.summaryHtml || ''
    });

    res.json({
      sentiment,
      articleId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

export default router; 