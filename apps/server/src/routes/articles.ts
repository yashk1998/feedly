import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../index';

const router = Router();

// Validation schemas
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  feedId: z.string().optional(),
  unread: z.string().optional(),
  search: z.string().optional()
});

const markReadSchema = z.object({
  articleIds: z.array(z.number()).optional(),
  all: z.boolean().optional()
});

/**
 * GET /api/articles - Get articles with pagination and filters
 */
router.get('/', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { page, limit, feedId, unread, search } = querySchema.parse(req.query);
    const userId = authReq.userId;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
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
    };

    if (feedId) {
      where.feedId = parseInt(feedId);
    }

    if (unread === 'true') {
      where.reads = {
        none: { userId }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summaryHtml: { contains: search } },
        { author: { contains: search } }
      ];
    }

    // Get articles with read status
    const articles = await prisma.article.findMany({
      where,
      include: {
        feed: {
          select: {
            id: true,
            title: true,
            siteUrl: true
          }
        },
        reads: {
          where: { userId },
          select: { readAt: true }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip,
      take: limitNum
    });

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: article.summaryHtml,
      content: article.contentHtml,
      feed: article.feed,
      isRead: article.reads.length > 0,
      readAt: article.reads[0]?.readAt
    }));

    res.json({
      articles: formattedArticles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    logger.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/articles/:id - Get single article
 */
router.get('/:id', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const articleId = parseInt(req.params.id);
    const userId = authReq.userId;

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
      },
      include: {
        feed: {
          select: {
            id: true,
            title: true,
            siteUrl: true
          }
        },
        reads: {
          where: { userId },
          select: { readAt: true }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Auto-mark as read when viewing
    if (article.reads.length === 0) {
      await prisma.articleRead.create({
        data: {
          articleId,
          userId
        }
      });
    }

    res.json({
      id: article.id,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: article.summaryHtml,
      content: article.contentHtml,
      feed: article.feed,
      isRead: true,
      readAt: article.reads[0]?.readAt || new Date()
    });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * POST /api/articles/mark-read - Mark articles as read
 */
router.post('/mark-read', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { articleIds, all } = markReadSchema.parse(req.body);
    const userId = authReq.userId;

    if (all) {
      // Mark all unread articles as read
      const unreadArticles = await prisma.article.findMany({
        where: {
          reads: {
            none: { userId }
          },
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
        },
        select: { id: true }
      });

      const readData = unreadArticles.map(article => ({
        articleId: article.id,
        userId
      }));

      await prisma.articleRead.createMany({
        data: readData,
        skipDuplicates: true
      });

      res.json({ message: `Marked ${unreadArticles.length} articles as read` });
    } else if (articleIds && articleIds.length > 0) {
      // Mark specific articles as read
      const readData = articleIds.map(articleId => ({
        articleId,
        userId
      }));

      await prisma.articleRead.createMany({
        data: readData,
        skipDuplicates: true
      });

      res.json({ message: `Marked ${articleIds.length} articles as read` });
    } else {
      res.status(400).json({ error: 'Must provide either articleIds or all=true' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error marking articles as read:', error);
    res.status(500).json({ error: 'Failed to mark articles as read' });
  }
});

/**
 * POST /api/articles/:id/unread - Mark article as unread
 */
router.post('/:id/unread', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const articleId = parseInt(req.params.id);
    const userId = authReq.userId;

    await prisma.articleRead.deleteMany({
      where: {
        articleId,
        userId
      }
    });

    res.json({ message: 'Article marked as unread' });
  } catch (error) {
    logger.error('Error marking article as unread:', error);
    res.status(500).json({ error: 'Failed to mark article as unread' });
  }
});

export default router; 