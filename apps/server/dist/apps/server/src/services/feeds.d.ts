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
     * Get or create a feed in the database
     */
    getOrCreateFeed(url: string): Promise<{
        id: bigint;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        title: string | null;
        siteUrl: string | null;
        lastFetchedAt: Date | null;
    }>;
    /**
     * Parse RSS/Atom feed from URL
     */
    parseFeed(url: string): Promise<ParsedFeed>;
    /**
     * Scrape website content using readability
     */
    scrapeWebsite(url: string): Promise<ParsedFeed>;
    /**
     * Store articles in database with deduplication
     */
    storeArticles(feedId: number, articles: ParsedArticle[]): Promise<void>;
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