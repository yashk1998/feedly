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
// Realistic browser User-Agents (rotate to avoid detection)
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];
// Get random User-Agent
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
// Get realistic browser headers
function getBrowserHeaders(url) {
    const urlObj = new URL(url);
    return {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': `${urlObj.protocol}//${urlObj.host}/`,
    };
}
// Clean and normalize HTML content
function cleanHtmlContent(html) {
    if (!html)
        return '';
    // Remove script and style tags
    let cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
    return cleaned.trim();
}
// Check if content is substantial (not just a teaser)
function isContentSubstantial(content) {
    if (!content)
        return false;
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 500;
}
class FeedService {
    /**
     * Fetch full article content from URL using multiple strategies
     * Priority: 1) Direct fetch with browser headers, 2) Retry with different UA
     */
    async fetchFullArticleContent(url) {
        const strategies = [
            { name: 'chrome', headers: getBrowserHeaders(url) },
            { name: 'firefox', headers: { ...getBrowserHeaders(url), 'User-Agent': USER_AGENTS[2] } },
            { name: 'safari', headers: { ...getBrowserHeaders(url), 'User-Agent': USER_AGENTS[3] } },
        ];
        for (const strategy of strategies) {
            try {
                index_2.logger.debug(`Trying ${strategy.name} strategy for ${url}`);
                const config = {
                    timeout: 20000,
                    headers: strategy.headers,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 400,
                    // Handle compressed responses
                    decompress: true,
                };
                const response = await axios_1.default.get(url, config);
                if (!response.data || typeof response.data !== 'string') {
                    index_2.logger.debug(`Empty or invalid response from ${url}`);
                    continue;
                }
                const dom = new jsdom_1.JSDOM(response.data, { url });
                const reader = new readability_1.Readability(dom.window.document, {
                    charThreshold: 100, // Lower threshold to capture more content
                });
                const article = reader.parse();
                if (article && article.content && isContentSubstantial(article.content)) {
                    index_2.logger.info(`Successfully extracted content from ${url} using ${strategy.name}`);
                    return {
                        content: cleanHtmlContent(article.content),
                        excerpt: article.excerpt || ''
                    };
                }
            }
            catch (error) {
                const errorMsg = error.message;
                index_2.logger.debug(`Strategy ${strategy.name} failed for ${url}: ${errorMsg}`);
                // Continue to next strategy
            }
        }
        index_2.logger.warn(`All extraction strategies failed for ${url}`);
        return null;
    }
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
            // Store initial articles (don't fetch full content on initial load for speed)
            await this.storeArticles(feed.id, feedData.articles, false);
        }
        return feed;
    }
    /**
     * Parse RSS/Atom feed from URL
     * Extracts content:encoded if available for full article content
     */
    async parseFeed(url) {
        try {
            const response = await axios_1.default.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
                }
            });
            return new Promise((resolve, reject) => {
                const feedparser = new feedparser_1.default({
                    addmeta: true, // Include meta in each article
                });
                const articles = [];
                let feedMeta = {};
                feedparser.on('error', reject);
                feedparser.on('meta', (meta) => {
                    feedMeta = meta;
                });
                feedparser.on('readable', function () {
                    let item = this.read();
                    while (item) {
                        // Extract content from multiple possible fields
                        // Priority: content:encoded > content > description > summary
                        let fullContent = '';
                        let summary = '';
                        // Check for content:encoded (RSS 1.0/2.0 with content module)
                        // feedparser normalizes this to item['content:encoded'] or in item['rss:content:encoded']
                        const contentEncoded = item['content:encoded']?.['#'] ||
                            item['content:encoded'] ||
                            (item['content'] && item['content']['#']) ||
                            '';
                        // Get description/summary
                        const description = item.description || '';
                        const itemSummary = item.summary || '';
                        // Determine best content source
                        if (contentEncoded && contentEncoded.length > 200) {
                            // content:encoded typically has full article
                            fullContent = cleanHtmlContent(contentEncoded);
                            summary = itemSummary || description.substring(0, 500);
                        }
                        else if (description && description.length > itemSummary.length) {
                            fullContent = cleanHtmlContent(description);
                            summary = itemSummary || description.substring(0, 300);
                        }
                        else {
                            fullContent = cleanHtmlContent(itemSummary || description);
                            summary = description || itemSummary;
                        }
                        articles.push({
                            guid: item.guid || item.link || crypto_1.default.randomUUID(),
                            title: item.title || 'Untitled',
                            url: item.link || item.origlink || '',
                            publishedAt: item.date || item.pubdate || new Date(),
                            author: item.author || item['dc:creator']?.['#'] || item['dc:creator'] || undefined,
                            summary: summary.substring(0, 1000), // Limit summary length
                            content: fullContent
                        });
                        item = this.read();
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
     * Scrape website content using readability with realistic headers
     */
    async scrapeWebsite(url) {
        const response = await axios_1.default.get(url, {
            timeout: 30000,
            headers: getBrowserHeaders(url),
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
                    content: cleanHtmlContent(article.content || '')
                }]
        };
    }
    /**
     * Store articles in database with deduplication
     * fetchFullContent: whether to fetch full article from URL (slower but more content)
     */
    async storeArticles(feedId, articles, fetchFullContent = false) {
        for (const article of articles) {
            // Use URL for checksum to properly detect duplicates
            const checksum = crypto_1.default.createHash('sha256')
                .update(article.url || article.title + article.guid)
                .digest('hex');
            // Check for global deduplication
            const existingArticle = await index_1.prisma.article.findFirst({
                where: { checksum }
            });
            if (existingArticle) {
                index_2.logger.debug(`Skipping duplicate article: ${article.title}`);
                continue;
            }
            let fullContent = article.content;
            let summary = article.summary;
            // Only fetch full content if explicitly enabled AND current content is not substantial
            if (fetchFullContent && article.url && !isContentSubstantial(fullContent)) {
                const extracted = await this.fetchFullArticleContent(article.url);
                if (extracted && isContentSubstantial(extracted.content)) {
                    fullContent = extracted.content;
                    if (!summary || summary.length < 50) {
                        summary = extracted.excerpt || summary;
                    }
                    index_2.logger.debug(`Extracted full content for: ${article.title}`);
                }
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
                        summaryHtml: summary,
                        contentHtml: fullContent,
                        checksum
                    }
                });
                index_2.logger.debug(`Stored article: ${article.title}`);
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
        const feedIdBigInt = BigInt(feedId);
        const feed = await index_1.prisma.feed.findUnique({
            where: { id: feedIdBigInt }
        });
        if (!feed) {
            throw new Error(`Feed ${feedId} not found`);
        }
        try {
            const feedData = await this.parseFeed(feed.url);
            // Update feed metadata
            await index_1.prisma.feed.update({
                where: { id: feedIdBigInt },
                data: {
                    title: feedData.title,
                    siteUrl: feedData.siteUrl,
                    lastFetchedAt: new Date()
                }
            });
            // Store new articles (don't fetch full content during refresh for speed)
            await this.storeArticles(feedIdBigInt, feedData.articles, false);
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