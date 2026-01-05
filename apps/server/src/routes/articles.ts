import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../index';
import { feedService } from '../services/feeds';

const router = Router();

// Validation schemas
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  feedId: z.string().optional(),
  category: z.string().optional(),
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
    const { page, limit, feedId, unread, search, category } = querySchema.parse(req.query);
    const userId = authReq.userId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const subscriptionFilter: any = {
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
    };

    if (category && category !== 'all') {
      subscriptionFilter.category = category;
    }

    const where: any = {
      feed: {
        subscriptions: {
          some: subscriptionFilter
        }
      }
    };

    if (feedId) {
      const feedIdNum = parseInt(feedId, 10);
      if (!Number.isNaN(feedIdNum)) {
        where.feedId = BigInt(feedIdNum);
      }
    }

    if (unread === 'true') {
      where.reads = {
        none: { userId }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summaryHtml: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ];
    }

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
        },
        savedArticles: {
          where: { userId },
          select: { savedAt: true }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip,
      take: limitNum
    });

    const total = await prisma.article.count({ where });

    const formattedArticles = articles.map((article) => ({
      id: Number(article.id),
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: article.summaryHtml,
      content: article.contentHtml,
      feed: {
        id: Number(article.feed.id),
        title: article.feed.title,
        siteUrl: article.feed.siteUrl
      },
      isRead: article.reads.length > 0,
      readAt: article.reads[0]?.readAt || null,
      isSaved: article.savedArticles.length > 0,
      savedAt: article.savedArticles[0]?.savedAt || null
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
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const articleId = parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const userId = authReq.userId;

    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
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
        },
        savedArticles: {
          where: { userId },
          select: { savedAt: true }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.reads.length === 0) {
      await prisma.articleRead.create({
        data: {
          articleId: BigInt(articleId),
          userId
        }
      });
    }

    res.json({
      id: Number(article.id),
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: article.summaryHtml,
      content: article.contentHtml,
      feed: {
        id: Number(article.feed.id),
        title: article.feed.title,
        siteUrl: article.feed.siteUrl
      },
      isRead: true,
      readAt: article.reads[0]?.readAt || new Date(),
      isSaved: article.savedArticles.length > 0,
      savedAt: article.savedArticles[0]?.savedAt || null
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

      const readData = unreadArticles.map((article) => ({
        articleId: article.id,
        userId
      }));

      await prisma.articleRead.createMany({
        data: readData,
        skipDuplicates: true
      });

      res.json({ message: `Marked ${unreadArticles.length} articles as read` });
      return;
    }

    if (articleIds && articleIds.length > 0) {
      const readData = articleIds.map((articleId) => ({
        articleId: BigInt(articleId),
        userId
      }));

      await prisma.articleRead.createMany({
        data: readData,
        skipDuplicates: true
      });

      res.json({ message: `Marked ${articleIds.length} articles as read` });
      return;
    }

    res.status(400).json({ error: 'Must provide either articleIds or all=true' });
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
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const articleId = parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const userId = authReq.userId;

    await prisma.articleRead.deleteMany({
      where: {
        articleId: BigInt(articleId),
        userId
      }
    });

    res.json({ message: 'Article marked as unread' });
  } catch (error) {
    logger.error('Error marking article as unread:', error);
    res.status(500).json({ error: 'Failed to mark article as unread' });
  }
});

/**
 * GET /api/articles/saved - Get saved articles
 */
router.get('/saved', requireAuth, async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const userId = authReq.userId;

    const savedArticles = await prisma.savedArticle.findMany({
      where: { userId },
      include: {
        article: {
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
        }
      },
      orderBy: {
        savedAt: 'desc'
      }
    });

    const formattedArticles = savedArticles.map((saved) => ({
      id: Number(saved.article.id),
      title: saved.article.title,
      url: saved.article.url,
      publishedAt: saved.article.publishedAt,
      author: saved.article.author,
      summary: saved.article.summaryHtml,
      feed: {
        id: Number(saved.article.feed.id),
        title: saved.article.feed.title,
        siteUrl: saved.article.feed.siteUrl
      },
      isRead: saved.article.reads.length > 0,
      readAt: saved.article.reads[0]?.readAt || null,
      isSaved: true,
      savedAt: saved.savedAt
    }));

    res.json({ articles: formattedArticles });
  } catch (error) {
    logger.error('Error fetching saved articles:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
});

/**
 * POST /api/articles/:id/save - Save article for later
 */
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const userId = (req as unknown as AuthenticatedRequest).userId;

    // Verify article exists and user has access
    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
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

    await prisma.savedArticle.upsert({
      where: {
        articleId_userId: {
          articleId: BigInt(articleId),
          userId
        }
      },
      update: {},
      create: {
        articleId: BigInt(articleId),
        userId
      }
    });

    res.json({ message: 'Article saved', isSaved: true });
  } catch (error) {
    logger.error('Error saving article:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

/**
 * DELETE /api/articles/:id/save - Remove article from saved
 */
router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const userId = (req as unknown as AuthenticatedRequest).userId;

    await prisma.savedArticle.deleteMany({
      where: {
        articleId: BigInt(articleId),
        userId
      }
    });

    res.json({ message: 'Article removed from saved', isSaved: false });
  } catch (error) {
    logger.error('Error removing saved article:', error);
    res.status(500).json({ error: 'Failed to remove saved article' });
  }
});

/**
 * POST /api/articles/:id/read - Mark single article as read
 */
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const userId = (req as unknown as AuthenticatedRequest).userId;

    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
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

    await prisma.articleRead.upsert({
      where: {
        articleId_userId: {
          articleId: BigInt(articleId),
          userId
        }
      },
      update: {},
      create: {
        articleId: BigInt(articleId),
        userId
      }
    });

    res.json({ message: 'Article marked as read' });
  } catch (error) {
    logger.error('Error marking article as read:', error);
    res.status(500).json({ error: 'Failed to mark article as read' });
  }
});

/**
 * POST /api/articles/:id/fetch-content - Fetch full article content from source URL
 */
router.post('/:id/fetch-content', requireAuth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id, 10);
    if (Number.isNaN(articleId)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const userId = (req as unknown as AuthenticatedRequest).userId;

    // Find article and verify access
    const article = await prisma.article.findFirst({
      where: {
        id: BigInt(articleId),
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
        },
        savedArticles: {
          where: { userId },
          select: { savedAt: true }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!article.url) {
      return res.status(400).json({ error: 'Article has no source URL' });
    }

    // Fetch full content from the article URL
    logger.info(`Fetching full content for article ${articleId} from ${article.url}`);
    const extracted = await feedService.fetchFullArticleContent(article.url);

    if (!extracted || !extracted.content) {
      return res.status(422).json({
        error: 'Could not extract content from the article URL. The website may be blocking content extraction.',
        suggestion: 'Try visiting the original article directly.'
      });
    }

    // Update the article with full content
    await prisma.article.update({
      where: { id: BigInt(articleId) },
      data: {
        contentHtml: extracted.content,
        summaryHtml: extracted.excerpt || article.summaryHtml
      }
    });

    logger.info(`Successfully fetched full content for article ${articleId}`);

    // Return updated article
    res.json({
      id: Number(article.id),
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      author: article.author,
      summary: extracted.excerpt || article.summaryHtml,
      content: extracted.content,
      feed: {
        id: Number(article.feed.id),
        title: article.feed.title,
        siteUrl: article.feed.siteUrl
      },
      isRead: article.reads.length > 0,
      readAt: article.reads[0]?.readAt || null,
      isSaved: article.savedArticles.length > 0,
      savedAt: article.savedArticles[0]?.savedAt || null
    });
  } catch (error) {
    logger.error('Error fetching full article content:', error);
    res.status(500).json({ error: 'Failed to fetch article content' });
  }
});

export default router;