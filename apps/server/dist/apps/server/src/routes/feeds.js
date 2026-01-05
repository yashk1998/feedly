"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jsdom_1 = require("jsdom");
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
        const personalSubscriptions = await index_1.prisma.subscription.findMany({
            where: {
                userId,
                teamId: null
            },
            include: {
                feed: true
            }
        });
        const teamSubscriptions = await index_1.prisma.subscription.findMany({
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
        let totalArticleCounts = [];
        let unreadArticleCounts = [];
        if (feedIds.length > 0) {
            [totalArticleCounts, unreadArticleCounts] = await Promise.all([
                index_1.prisma.article.groupBy({
                    by: ['feedId'],
                    where: {
                        feedId: { in: feedIds.map((id) => BigInt(id)) }
                    },
                    _count: {
                        _all: true
                    }
                }),
                index_1.prisma.article.groupBy({
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
        const totalMap = new Map(totalArticleCounts.map((entry) => [Number(entry.feedId), entry._count._all]));
        const unreadMap = new Map(unreadArticleCounts.map((entry) => [Number(entry.feedId), entry._count._all]));
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
                isActive: typeof lastFetchedAgeMs === 'number' ? lastFetchedAgeMs < twelveHoursInMs : false
            };
        });
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
        const feedId = Number(subscription.feedId);
        const unreadCount = await index_1.prisma.article.count({
            where: {
                feedId: subscription.feedId,
                reads: {
                    none: {
                        userId
                    }
                }
            }
        });
        const totalArticles = await index_1.prisma.article.count({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error adding feed:', error);
        res.status(500).json({ error: 'Failed to add feed' });
    }
});
router.post('/:id/refresh', auth_1.requireAuth, async (req, res) => {
    try {
        const feedId = parseInt(req.params.id, 10);
        if (Number.isNaN(feedId)) {
            return res.status(400).json({ error: 'Invalid feed id' });
        }
        const userId = req.userId;
        const subscription = await index_1.prisma.subscription.findFirst({
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
        await feeds_1.feedService.refreshFeed(feedId);
        res.json({ message: 'Feed refreshed successfully' });
    }
    catch (error) {
        index_2.logger.error('Error refreshing feed:', error);
        res.status(500).json({ error: 'Failed to refresh feed' });
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
/**
 * POST /api/feeds/import-opml - Import feeds from OPML file
 */
router.post('/import-opml', auth_1.requireAuth, async (req, res) => {
    try {
        const { opmlContent } = req.body;
        const userId = req.userId;
        if (!opmlContent || typeof opmlContent !== 'string') {
            return res.status(400).json({ error: 'OPML content is required' });
        }
        // Parse OPML XML
        const dom = new jsdom_1.JSDOM(opmlContent, { contentType: 'text/xml' });
        const doc = dom.window.document;
        // Extract all outline elements with xmlUrl (these are feed entries)
        const outlines = doc.querySelectorAll('outline[xmlUrl]');
        const feedsToImport = [];
        outlines.forEach((outline) => {
            const xmlUrl = outline.getAttribute('xmlUrl');
            if (xmlUrl) {
                // Get category from parent outline if it exists
                const parentOutline = outline.parentElement;
                let category = 'General';
                if (parentOutline && parentOutline.tagName === 'outline' && !parentOutline.hasAttribute('xmlUrl')) {
                    category = parentOutline.getAttribute('title') || parentOutline.getAttribute('text') || 'General';
                }
                feedsToImport.push({
                    title: outline.getAttribute('title') || outline.getAttribute('text') || '',
                    xmlUrl,
                    htmlUrl: outline.getAttribute('htmlUrl') || undefined,
                    category
                });
            }
        });
        if (feedsToImport.length === 0) {
            return res.status(400).json({ error: 'No valid feeds found in OPML file' });
        }
        // Import feeds
        const results = {
            imported: 0,
            skipped: 0,
            failed: 0,
            feeds: []
        };
        for (const feedData of feedsToImport) {
            try {
                // Check if user already subscribed
                const existingSubscription = await index_1.prisma.subscription.findFirst({
                    where: {
                        userId,
                        teamId: null,
                        feed: {
                            url: feedData.xmlUrl
                        }
                    }
                });
                if (existingSubscription) {
                    results.skipped++;
                    results.feeds.push({
                        url: feedData.xmlUrl,
                        title: feedData.title,
                        status: 'skipped'
                    });
                    continue;
                }
                // Get or create feed
                const feed = await feeds_1.feedService.getOrCreateFeed(feedData.xmlUrl);
                // Create subscription
                await index_1.prisma.subscription.create({
                    data: {
                        userId,
                        feedId: feed.id,
                        category: feedData.category
                    }
                });
                results.imported++;
                results.feeds.push({
                    url: feedData.xmlUrl,
                    title: feed.title || feedData.title,
                    status: 'imported'
                });
            }
            catch (error) {
                index_2.logger.error(`Failed to import feed ${feedData.xmlUrl}:`, error);
                results.failed++;
                results.feeds.push({
                    url: feedData.xmlUrl,
                    title: feedData.title,
                    status: 'failed'
                });
            }
        }
        res.json({
            message: `Imported ${results.imported} feeds, skipped ${results.skipped} existing, ${results.failed} failed`,
            results
        });
    }
    catch (error) {
        index_2.logger.error('Error importing OPML:', error);
        res.status(500).json({ error: 'Failed to import OPML file' });
    }
});
exports.default = router;
//# sourceMappingURL=feeds.js.map