interface ArticleContent {
    title: string;
    content: string;
    url?: string;
}
interface SocialPostContent extends ArticleContent {
    platform: 'twitter' | 'linkedin' | 'reddit';
    tone: 'professional' | 'casual' | 'engaging';
}
interface SentimentResult {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions?: string[];
}
export declare class AIService {
    private azureOpenAIEndpoint;
    private azureOpenAIKey;
    private deploymentName;
    constructor();
    private callAzureOpenAI;
    /**
     * Summarize an article
     */
    summarizeArticle(content: ArticleContent): Promise<string>;
    /**
     * Generate social media post
     */
    generateSocialPost(content: SocialPostContent): Promise<string>;
    /**
     * Extract keywords from article
     */
    extractKeywords(content: ArticleContent): Promise<string[]>;
    /**
     * Analyze sentiment of article
     */
    analyzeSentiment(content: ArticleContent): Promise<SentimentResult>;
    /**
     * Generate search query suggestions
     */
    generateSearchSuggestions(query: string): Promise<string[]>;
    /**
     * Categorize article content
     */
    categorizeArticle(content: ArticleContent): Promise<string>;
    /**
     * Check if service is available
     */
    healthCheck(): Promise<boolean>;
}
export declare const aiService: AIService;
export {};
//# sourceMappingURL=ai.d.ts.map