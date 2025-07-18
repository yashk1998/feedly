"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedService = exports.FeedService = void 0;
const axios_1 = __importDefault(require("axios"));
const feedparser_1 = __importDefault(require("feedparser"));
const jsdom_1 = require("jsdom");
const readability_1 = require("@mozilla/readability");
const crypto_1 = __importDefault(require("crypto"));
const index_1 = require("../index");
const index_2 = require("../index");
const index_3 = require("../index");
class FeedService {
    /**
     * Get or create a feed in the database
     */
    async getOrCreateFeed(url) {
        let feed = await index_1.prisma.feed.findUnique({
            where: { url }
        });
        if (!feed) {
            // Validate and parse the feed first
            const feedData = await this.parseFeed(url);
            feed = await index_1.prisma.feed.create({
                data: {
                    url,
                    title: feedData.title,
                    siteUrl: feedData.siteUrl,
                    lastFetchedAt: new Date()
                }
            });
            // Store initial articles
            await this.storeArticles(Number(feed.id), feedData.articles);
        }
        return feed;
    }
    /**
     * Parse RSS/Atom feed from URL
     */
    async parseFeed(url) {
        try {
            const response = await axios_1.default.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'rivsy RSS Reader/1.0'
                }
            });
            return new Promise((resolve, reject) => {
                const feedparser = new feedparser_1.default({});
                const articles = [];
                let feedMeta = {};
                feedparser.on('error', reject);
                feedparser.on('meta', (meta) => {
                    feedMeta = meta;
                });
                feedparser.on('readable', function () {
                    let item;
                    while (item = this.read()) {
                        articles.push({
                            guid: item.guid || item.link || crypto_1.default.randomUUID(),
                            title: item.title || 'Untitled',
                            url: item.link || '',
                            publishedAt: item.date || new Date(),
                            author: item.author,
                            summary: item.summary || item.description || '',
                            content: item.description || item.summary || ''
                        });
                    }
                });
                feedparser.on('end', () => {
                    resolve({
                        title: feedMeta.title || 'Unknown Feed',
                        siteUrl: feedMeta.link || url,
                        articles
                    });
                });
                feedparser.write(response.data);
                feedparser.end();
            });
        }
        catch (error) {
            index_2.logger.error(`Failed to parse feed ${url}:`, error);
            // Fallback to web scraping with readability
            try {
                return await this.scrapeWebsite(url);
            }
            catch (scrapeError) {
                index_2.logger.error(`Failed to scrape website ${url}:`, scrapeError);
                throw new Error(`Unable to parse feed or scrape website: ${url}`);
            }
        }
    }
    /**
     * Scrape website content using readability
     */
    async scrapeWebsite(url) {
        const response = await axios_1.default.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'rivsy RSS Reader/1.0'
            }
        });
        const dom = new jsdom_1.JSDOM(response.data, { url });
        const reader = new readability_1.Readability(dom.window.document);
        const article = reader.parse();
        if (!article) {
            throw new Error('Unable to extract content from website');
        }
        return {
            title: article.title || 'Scraped Content',
            siteUrl: url,
            articles: [{
                    guid: crypto_1.default.createHash('md5').update(url + Date.now()).digest('hex'),
                    title: article.title || 'Untitled',
                    url,
                    publishedAt: new Date(),
                    author: article.byline || undefined,
                    summary: article.excerpt || '',
                    content: article.content || ''
                }]
        };
    }
    /**
     * Store articles in database with deduplication
     */
    async storeArticles(feedId, articles) {
        for (const article of articles) {
            const checksum = crypto_1.default.createHash('sha256')
                .update(article.title + article.url + article.content)
                .digest('hex');
            // Check for global deduplication
            const existingArticle = await index_1.prisma.article.findFirst({
                where: { checksum }
            });
            if (existingArticle) {
                index_2.logger.debug(`Skipping duplicate article: ${article.title}`);
                continue;
            }
            try {
                await index_1.prisma.article.create({
                    data: {
                        feedId,
                        guid: article.guid,
                        title: article.title,
                        url: article.url,
                        publishedAt: article.publishedAt,
                        author: article.author,
                        summaryHtml: article.summary,
                        contentHtml: article.content,
                        checksum
                    }
                });
            }
            catch (error) {
                // Handle duplicate guid for same feed
                if (error.code === 'P2002') {
                    index_2.logger.debug(`Skipping duplicate guid ${article.guid} for feed ${feedId}`);
                    continue;
                }
                throw error;
            }
        }
    }
    /**
     * Refresh a feed and update articles
     */
    async refreshFeed(feedId) {
        const feed = await index_1.prisma.feed.findUnique({
            where: { id: feedId }
        });
        if (!feed) {
            throw new Error(`Feed ${feedId} not found`);
        }
        try {
            const feedData = await this.parseFeed(feed.url);
            // Update feed metadata
            await index_1.prisma.feed.update({
                where: { id: feedId },
                data: {
                    title: feedData.title,
                    siteUrl: feedData.siteUrl,
                    lastFetchedAt: new Date()
                }
            });
            // Store new articles
            await this.storeArticles(feedId, feedData.articles);
            // Cache the refresh time
            await index_3.redis.setEx(`feed:${feedId}:refreshed`, 3600, Date.now().toString());
            index_2.logger.info(`Successfully refreshed feed ${feedId} (${feed.url})`);
        }
        catch (error) {
            index_2.logger.error(`Failed to refresh feed ${feedId}:`, error);
            throw error;
        }
    }
    /**
     * Get feeds that need refreshing based on plan
     */
    async getFeedsToRefresh(planType) {
        const refreshInterval = planType === 'free' ? 360 : 60; // minutes
        const cutoffTime = new Date(Date.now() - refreshInterval * 60 * 1000);
        const feeds = await index_1.prisma.feed.findMany({
            where: {
                OR: [
                    { lastFetchedAt: null },
                    { lastFetchedAt: { lt: cutoffTime } }
                ],
                subscriptions: {
                    some: {}
                }
            },
            select: { id: true }
        });
        return feeds.map(f => Number(f.id));
    }
}
exports.FeedService = FeedService;
exports.feedService = new FeedService();
//# sourceMappingURL=feeds.js.map