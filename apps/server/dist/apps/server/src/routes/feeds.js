"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const index_1 = require("../index");
const index_2 = require("../index");
const feeds_1 = require("../services/feeds");
const router = (0, express_1.Router)();
// Validation schemas
const addFeedSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    category: zod_1.z.string().optional()
});
const updateFeedSchema = zod_1.z.object({
    category: zod_1.z.string().optional()
});
/**
 * GET /api/feeds - Get user's subscribed feeds
 */
router.get('/', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const userId = authReq.userId;
        // Get user's personal feeds
        const personalFeeds = await index_1.prisma.subscription.findMany({
            where: {
                userId,
                teamId: null
            },
            include: {
                feed: {
                    include: {
                        _count: {
                            select: {
                                articles: {
                                    where: {
                                        reads: {
                                            none: {
                                                userId
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        // Get team feeds
        const teamFeeds = await index_1.prisma.subscription.findMany({
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
                feed: {
                    include: {
                        _count: {
                            select: {
                                articles: {
                                    where: {
                                        reads: {
                                            none: {
                                                userId
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const feeds = [...personalFeeds, ...teamFeeds].map(sub => ({
            id: sub.feed.id,
            url: sub.feed.url,
            title: sub.feed.title,
            siteUrl: sub.feed.siteUrl,
            category: sub.category,
            unreadCount: sub.feed._count.articles,
            lastFetched: sub.feed.lastFetchedAt,
            teamId: sub.teamId,
            subscriptionId: sub.id
        }));
        res.json({ feeds });
    }
    catch (error) {
        index_2.logger.error('Error fetching feeds:', error);
        res.status(500).json({ error: 'Failed to fetch feeds' });
    }
});
/**
 * POST /api/feeds - Subscribe to a new feed
 */
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { url, category } = addFeedSchema.parse(req.body);
        const userId = req.userId;
        // Check if user already subscribed
        const existingSubscription = await index_1.prisma.subscription.findFirst({
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
        const feed = await feeds_1.feedService.getOrCreateFeed(url);
        // Create subscription
        const subscription = await index_1.prisma.subscription.create({
            data: {
                userId,
                feedId: feed.id,
                category: category || 'General'
            },
            include: {
                feed: true
            }
        });
        res.status(201).json({
            id: subscription.feed.id,
            url: subscription.feed.url,
            title: subscription.feed.title,
            siteUrl: subscription.feed.siteUrl,
            category: subscription.category,
            subscriptionId: subscription.id
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error adding feed:', error);
        res.status(500).json({ error: 'Failed to add feed' });
    }
});
/**
 * PUT /api/feeds/:id - Update feed subscription
 */
router.put('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const subscriptionId = parseInt(req.params.id);
        const { category } = updateFeedSchema.parse(req.body);
        const userId = req.userId;
        // Check if user owns this subscription
        const subscription = await index_1.prisma.subscription.findFirst({
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
        const updated = await index_1.prisma.subscription.update({
            where: { id: subscriptionId },
            data: { category },
            include: { feed: true }
        });
        res.json({
            id: updated.feed.id,
            url: updated.feed.url,
            title: updated.feed.title,
            category: updated.category,
            subscriptionId: updated.id
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error updating feed:', error);
        res.status(500).json({ error: 'Failed to update feed' });
    }
});
/**
 * DELETE /api/feeds/:id - Unsubscribe from feed
 */
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const subscriptionId = parseInt(req.params.id);
        const userId = req.userId;
        // Check if user owns this subscription
        const subscription = await index_1.prisma.subscription.findFirst({
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
        await index_1.prisma.subscription.delete({
            where: { id: subscriptionId }
        });
        res.json({ message: 'Unsubscribed successfully' });
    }
    catch (error) {
        index_2.logger.error('Error deleting feed:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});
exports.default = router;
//# sourceMappingURL=feeds.js.map