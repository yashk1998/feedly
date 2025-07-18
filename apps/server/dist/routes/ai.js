"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const index_1 = require("../index");
const index_2 = require("../index");
const credits_1 = require("../services/credits");
const ai_1 = require("../services/ai");
const router = (0, express_1.Router)();
// Validation schemas
const summarizeSchema = zod_1.z.object({
    articleId: zod_1.z.number()
});
const socialPostSchema = zod_1.z.object({
    articleId: zod_1.z.number(),
    platform: zod_1.z.enum(['twitter', 'linkedin', 'reddit']),
    tone: zod_1.z.enum(['professional', 'casual', 'engaging']).optional().default('engaging')
});
/**
 * GET /api/ai/credits - Get user's AI credit usage
 */
router.get('/credits', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const credits = await credits_1.creditsService.getCurrentCredits(userId);
        const plan = await credits_1.creditsService.getUserPlan(userId);
        res.json({
            used: credits.used,
            limit: credits.limit,
            remaining: Math.max(0, credits.limit - credits.used),
            cycleEnd: credits.cycleEnd,
            plan
        });
    }
    catch (error) {
        index_2.logger.error('Error fetching AI credits:', error);
        res.status(500).json({ error: 'Failed to fetch AI credits' });
    }
});
/**
 * POST /api/ai/summarize - Summarize an article
 */
router.post('/summarize', auth_1.requireAuth, async (req, res) => {
    try {
        const { articleId } = summarizeSchema.parse(req.body);
        const userId = req.userId;
        // Check if user can use AI features
        const canUse = await credits_1.creditsService.canUseAI(userId);
        if (!canUse) {
            return res.status(403).json({
                error: 'AI credit limit exceeded. Please upgrade your plan or wait for next billing cycle.'
            });
        }
        // Get article
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
            }
        });
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        // Use a credit
        const creditResult = await credits_1.creditsService.useCredit(userId);
        if (!creditResult.success) {
            return res.status(403).json({ error: creditResult.error });
        }
        // Generate summary
        const summary = await ai_1.aiService.summarizeArticle({
            title: article.title || '',
            content: article.contentHtml || article.summaryHtml || '',
            url: article.url || ''
        });
        // Mark article as read since user is engaging with it
        await index_1.prisma.articleRead.upsert({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error summarizing article:', error);
        res.status(500).json({ error: 'Failed to summarize article' });
    }
});
/**
 * POST /api/ai/social-post - Generate social media post
 */
router.post('/social-post', auth_1.requireAuth, async (req, res) => {
    try {
        const { articleId, platform, tone } = socialPostSchema.parse(req.body);
        const userId = req.userId;
        // Check user plan (social posting is paid feature)
        const plan = await credits_1.creditsService.getUserPlan(userId);
        if (plan === 'free') {
            return res.status(403).json({
                error: 'Social media post generation is available for Pro and Power plans only.'
            });
        }
        // Get article
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
            }
        });
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        // Generate social post
        const post = await ai_1.aiService.generateSocialPost({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error generating social post:', error);
        res.status(500).json({ error: 'Failed to generate social post' });
    }
});
/**
 * POST /api/ai/extract-keywords - Extract keywords from article
 */
router.post('/extract-keywords', auth_1.requireAuth, async (req, res) => {
    try {
        const { articleId } = summarizeSchema.parse(req.body);
        const userId = req.userId;
        // Check user plan
        const plan = await credits_1.creditsService.getUserPlan(userId);
        if (plan === 'free') {
            return res.status(403).json({
                error: 'Keyword extraction is available for Pro and Power plans only.'
            });
        }
        // Get article
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
            }
        });
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        // Extract keywords
        const keywords = await ai_1.aiService.extractKeywords({
            title: article.title || '',
            content: article.contentHtml || article.summaryHtml || ''
        });
        res.json({
            keywords,
            articleId
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error extracting keywords:', error);
        res.status(500).json({ error: 'Failed to extract keywords' });
    }
});
/**
 * POST /api/ai/sentiment - Analyze article sentiment
 */
router.post('/sentiment', auth_1.requireAuth, async (req, res) => {
    try {
        const { articleId } = summarizeSchema.parse(req.body);
        const userId = req.userId;
        // Check user plan
        const plan = await credits_1.creditsService.getUserPlan(userId);
        if (plan === 'free') {
            return res.status(403).json({
                error: 'Sentiment analysis is available for Pro and Power plans only.'
            });
        }
        // Get article
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
            }
        });
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        // Analyze sentiment
        const sentiment = await ai_1.aiService.analyzeSentiment({
            title: article.title || '',
            content: article.contentHtml || article.summaryHtml || ''
        });
        res.json({
            sentiment,
            articleId
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        index_2.logger.error('Error analyzing sentiment:', error);
        res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map