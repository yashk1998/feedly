export declare class CreditsService {
    /**
     * Get current credit usage for a user
     */
    getCurrentCredits(userId: string): Promise<{
        used: number;
        limit: number;
        cycleEnd: Date;
    }>;
    /**
     * Check if user can use AI features (not hard-blocked)
     */
    canUseAI(userId: string): Promise<boolean>;
    /**
     * Use a credit for AI summarization
     */
    useCredit(userId: string): Promise<{
        success: boolean;
        warning?: string;
        error?: string;
    }>;
    /**
     * Reset credits for a new billing cycle
     */
    resetCredits(userId: string, cycleStart: Date, cycleEnd: Date): Promise<void>;
    /**
     * Get user's plan information
     */
    getUserPlan(userId: string): Promise<'free' | 'pro' | 'power'>;
}
export declare const creditsService: CreditsService;
//# sourceMappingURL=credits.d.ts.map