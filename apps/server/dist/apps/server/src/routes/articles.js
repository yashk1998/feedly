"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const index_1 = require("../index");
const index_2 = require("../index");
const router = (0, express_1.Router)();
// Validation schemas
const querySchema = zod_1.z.object({
    page: zod_1.z.string().optional().default('1'),
    limit: zod_1.z.string().optional().default('20'),
    feedId: zod_1.z.string().optional(),
    unread: zod_1.z.string().optional(),
    search: zod_1.z.string().optional()
});
const markReadSchema = zod_1.z.object({
    articleIds: zod_1.z.array(zod_1.z.number()).optional(),
    all: zod_1.z.boolean().optional()
});
/**
 * GET /api/articles - Get articles with pagination and filters
 */
router.get('/', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const { page, limit, feedId, unread, search } = querySchema.parse(req.query);
        const userId = authReq.userId;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {
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
        const articles = await index_1.prisma.article.findMany({
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
        const total = await index_1.prisma.article.count({ where });
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
        }
        index_2.logger.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});
/**
 * GET /api/articles/:id - Get single article
 */
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const articleId = parseInt(req.params.id);
        const userId = authReq.userId;
        const article = await index_1.prisma.article.findFirst({
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
            await index_1.prisma.articleRead.create({
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
    }
    catch (error) {
        index_2.logger.error('Error fetching article:', error);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});
/**
 * POST /api/articles/mark-read - Mark articles as read
 */
router.post('/mark-read', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const { articleIds, all } = markReadSchema.parse(req.body);
        const userId = authReq.userId;
        if (all) {
            // Mark all unread articles as read
            const unreadArticles = await index_1.prisma.article.findMany({
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
            await index_1.prisma.articleRead.createMany({
                data: readData,
                skipDuplicates: true
            });
            res.json({ message: `Marked ${unreadArticles.length} articles as read` });
        }
        else if (articleIds && articleIds.length > 0) {
            // Mark specific articles as read
            const readData = articleIds.map(articleId => ({
                articleId,
                userId
            }));
            await index_1.prisma.articleRead.createMany({
                data: readData,
                skipDuplicates: true
            });
            res.json({ message: `Marked ${articleIds.length} articles as read` });
        }
        else {
            res.status(400).json({ error: 'Must provide either articleIds or all=true' });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error marking articles as read:', error);
        res.status(500).json({ error: 'Failed to mark articles as read' });
    }
});
/**
 * POST /api/articles/:id/unread - Mark article as unread
 */
router.post('/:id/unread', auth_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const articleId = parseInt(req.params.id);
        const userId = authReq.userId;
        await index_1.prisma.articleRead.deleteMany({
            where: {
                articleId,
                userId
            }
        });
        res.json({ message: 'Article marked as unread' });
    }
    catch (error) {
        index_2.logger.error('Error marking article as unread:', error);
        res.status(500).json({ error: 'Failed to mark article as unread' });
    }
});
exports.default = router;
//# sourceMappingURL=articles.js.map