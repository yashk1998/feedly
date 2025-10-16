import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../index';
import { feedService } from '../services/feeds';

const router = Router();

// Validation schemas
const addFeedSchema = z.object({
  url: z.string().url(),
  category: z.string().optional()
});

const updateFeedSchema = z.object({
  category: z.string().optional()
});

/**
 * GET /api/feeds - Get user's subscribed feeds
 */
router.get('/', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.userId;

    const personalSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        teamId: null
      },
      include: {
        feed: true
      }
    });

    const teamSubscriptions = await prisma.subscription.findMany({
      where: {
        team: {
          members: {
            some: {
              userId
            }
          }
        }
      },
      include: {
        feed: true
      }
    });

    const allSubscriptions = [...personalSubscriptions, ...teamSubscriptions];
    const feedIds = Array.from(new Set(allSubscriptions.map((sub) => Number(sub.feedId))));

    let totalArticleCounts: Array<{ feedId: bigint; _count: { _all: number } }> = [];
    let unreadArticleCounts: Array<{ feedId: bigint; _count: { _all: number } }> = [];

    if (feedIds.length > 0) {
      [totalArticleCounts, unreadArticleCounts] = await Promise.all([
        prisma.article.groupBy({
          by: ['feedId'],
          where: {
            feedId: { in: feedIds.map((id) => BigInt(id)) }
          },
          _count: {
            _all: true
          }
        }),
        prisma.article.groupBy({
          by: ['feedId'],
          where: {
            feedId: { in: feedIds.map((id) => BigInt(id)) },
            reads: {
              none: {
                userId
              }
            }
          },
          _count: {
            _all: true
          }
        })
      ]);
    }

    const totalMap = new Map<number, number>(
      totalArticleCounts.map((entry) => [Number(entry.feedId), entry._count._all])
    );
    const unreadMap = new Map<number, number>(
      unreadArticleCounts.map((entry) => [Number(entry.feedId), entry._count._all])
    );

    const feeds = allSubscriptions.map((sub) => {
      const feedId = Number(sub.feedId);
      const lastFetchedAt = sub.feed.lastFetchedAt ? sub.feed.lastFetchedAt.toISOString() : null;
      const lastFetchedAgeMs = sub.feed.lastFetchedAt
        ? Date.now() - sub.feed.lastFetchedAt.getTime()
        : undefined;
      const twelveHoursInMs = 12 * 60 * 60 * 1000;

      return {
        id: feedId,
        subscriptionId: Number(sub.id),
        url: sub.feed.url,
        title: sub.feed.title,
        siteUrl: sub.feed.siteUrl,
        category: sub.category || 'General',
        lastFetchedAt,
        unreadCount: unreadMap.get(feedId) || 0,
        totalArticles: totalMap.get(feedId) || 0,
        isTeamFeed: sub.teamId !== null,
        isActive:
          typeof lastFetchedAgeMs === 'number' ? lastFetchedAgeMs < twelveHoursInMs : false
      };
    });

    res.json({ feeds });
  } catch (error) {
    logger.error('Error fetching feeds:', error);
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

/**
 * POST /api/feeds - Subscribe to a new feed
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { url, category } = addFeedSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    // Check if user already subscribed
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        teamId: null,
        feed: {
          url
        }
      }
    });

    if (existingSubscription) {
      return res.status(409).json({ error: 'Already subscribed to this feed' });
    }

    // Get or create feed
    const feed = await feedService.getOrCreateFeed(url);
    
    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        feedId: feed.id,
        category: category || 'General'
      },
      include: {
        feed: true
      }
    });

    const feedId = Number(subscription.feedId);
    const unreadCount = await prisma.article.count({
      where: {
        feedId: subscription.feedId,
        reads: {
          none: {
            userId
          }
        }
      }
    });

    const totalArticles = await prisma.article.count({
      where: {
        feedId: subscription.feedId
      }
    });

    res.status(201).json({
      feed: {
        id: feedId,
        subscriptionId: Number(subscription.id),
        url: subscription.feed.url,
        title: subscription.feed.title,
        siteUrl: subscription.feed.siteUrl,
        category: subscription.category || 'General',
        lastFetchedAt: subscription.feed.lastFetchedAt
          ? subscription.feed.lastFetchedAt.toISOString()
          : null,
        unreadCount,
        totalArticles,
        isTeamFeed: false,
        isActive: true
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error adding feed:', error);
    res.status(500).json({ error: 'Failed to add feed' });
  }
});

router.post('/:id/refresh', requireAuth, async (req, res) => {
  try {
    const feedId = parseInt(req.params.id, 10);
    if (Number.isNaN(feedId)) {
      return res.status(400).json({ error: 'Invalid feed id' });
    }

    const userId = (req as AuthenticatedRequest).userId;

    const subscription = await prisma.subscription.findFirst({
      where: {
        feedId: BigInt(feedId),
        OR: [
          { userId },
          {
            team: {
              members: {
                some: {
                  userId
                }
              }
            }
          }
        ]
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await feedService.refreshFeed(feedId);

    res.json({ message: 'Feed refreshed successfully' });
  } catch (error) {
    logger.error('Error refreshing feed:', error);
    res.status(500).json({ error: 'Failed to refresh feed' });
  }
});

/**
 * PUT /api/feeds/:id - Update feed subscription
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const { category } = updateFeedSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    // Check if user owns this subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        OR: [
          { userId },
          {
            team: {
              members: {
                some: {
                  userId,
                  role: { in: ['owner', 'editor'] }
                }
              }
            }
          }
        ]
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { category },
      include: { feed: true }
    });

    res.json({
      feed: {
        id: Number(updated.feed.id),
        subscriptionId: Number(updated.id),
        url: updated.feed.url,
        title: updated.feed.title,
        siteUrl: updated.feed.siteUrl,
        category: updated.category || 'General',
        lastFetchedAt: updated.feed.lastFetchedAt
          ? updated.feed.lastFetchedAt.toISOString()
          : null
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error updating feed:', error);
    res.status(500).json({ error: 'Failed to update feed' });
  }
});

/**
 * DELETE /api/feeds/:id - Unsubscribe from feed
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const userId = (req as AuthenticatedRequest).userId;

    // Check if user owns this subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        OR: [
          { userId },
          {
            team: {
              members: {
                some: {
                  userId,
                  role: { in: ['owner', 'editor'] }
                }
              }
            }
          }
        ]
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.subscription.delete({
      where: { id: subscriptionId }
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    logger.error('Error deleting feed:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

export default router; 