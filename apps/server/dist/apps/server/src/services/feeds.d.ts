interface ParsedFeed {
    title: string;
    siteUrl: string;
    articles: ParsedArticle[];
}
interface ParsedArticle {
    guid: string;
    title: string;
    url: string;
    publishedAt: Date;
    author?: string;
    summary: string;
    content: string;
}
export declare class FeedService {
    /**
     * Fetch full article content from URL using multiple strategies
     * Priority: 1) Direct fetch with browser headers, 2) Retry with different UA
     */
    fetchFullArticleContent(url: string): Promise<{
        content: string;
        excerpt: string;
    } | null>;
    /**
     * Get or create a feed in the database
     */
    getOrCreateFeed(url: string): Promise<{
        url: string;
        id: bigint;
        title: string | null;
        siteUrl: string | null;
        lastFetchedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Parse RSS/Atom feed from URL
     * Extracts content:encoded if available for full article content
     */
    parseFeed(url: string): Promise<ParsedFeed>;
    /**
     * Scrape website content using readability with realistic headers
     */
    scrapeWebsite(url: string): Promise<ParsedFeed>;
    /**
     * Store articles in database with deduplication
     * fetchFullContent: whether to fetch full article from URL (slower but more content)
     */
    storeArticles(feedId: bigint, articles: ParsedArticle[], fetchFullContent?: boolean): Promise<void>;
    /**
     * Refresh a feed and update articles
     */
    refreshFeed(feedId: number): Promise<void>;
    /**
     * Get feeds that need refreshing based on plan
     */
    getFeedsToRefresh(planType: 'free' | 'paid'): Promise<number[]>;
}
export declare const feedService: FeedService;
export {};
//# sourceMappingURL=feeds.d.ts.map