"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
class AIService {
    constructor() {
        this.azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
        this.azureOpenAIKey = process.env.AZURE_OPENAI_KEY || '';
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    }
    async callAzureOpenAI(prompt, maxTokens = 500) {
        try {
            const response = await axios_1.default.post(`${this.azureOpenAIEndpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`, {
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant that processes news articles and content.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.azureOpenAIKey
                }
            });
            return response.data.choices[0]?.message?.content || '';
        }
        catch (error) {
            index_1.logger.error('Azure OpenAI API error:', error);
            throw new Error('Failed to process AI request');
        }
    }
    /**
     * Summarize an article
     */
    async summarizeArticle(content) {
        const prompt = `
Please provide a concise summary of the following article in 2-3 sentences:

Title: ${content.title}

Content: ${content.content.slice(0, 4000)}

Summary:`;
        return await this.callAzureOpenAI(prompt, 200);
    }
    /**
     * Generate social media post
     */
    async generateSocialPost(content) {
        const platformRules = {
            twitter: 'Keep it under 280 characters, use hashtags, make it engaging and shareable',
            linkedin: 'Professional tone, can be longer, focus on insights and professional value',
            reddit: 'Conversational tone, provide context, encourage discussion'
        };
        const toneInstructions = {
            professional: 'Use formal language, focus on business value and insights',
            casual: 'Use friendly, approachable language, be conversational',
            engaging: 'Use compelling language, ask questions, encourage interaction'
        };
        const prompt = `
Create a ${content.platform} post based on this article:

Title: ${content.title}
Content: ${content.content.slice(0, 3000)}
${content.url ? `URL: ${content.url}` : ''}

Platform rules: ${platformRules[content.platform]}
Tone: ${toneInstructions[content.tone]}

Post:`;
        const maxTokens = content.platform === 'twitter' ? 100 : content.platform === 'linkedin' ? 400 : 300;
        return await this.callAzureOpenAI(prompt, maxTokens);
    }
    /**
     * Extract keywords from article
     */
    async extractKeywords(content) {
        const prompt = `
Extract 5-10 relevant keywords from this article. Return them as a comma-separated list:

Title: ${content.title}
Content: ${content.content.slice(0, 3000)}

Keywords:`;
        const result = await this.callAzureOpenAI(prompt, 100);
        return result.split(',').map(keyword => keyword.trim()).filter(k => k.length > 0);
    }
    /**
     * Analyze sentiment of article
     */
    async analyzeSentiment(content) {
        const prompt = `
Analyze the sentiment of this article and respond with JSON format:

Title: ${content.title}
Content: ${content.content.slice(0, 3000)}

Provide response in this JSON format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "emotions": ["emotion1", "emotion2"]
}

Response:`;
        const result = await this.callAzureOpenAI(prompt, 150);
        try {
            const parsed = JSON.parse(result);
            return {
                sentiment: parsed.sentiment || 'neutral',
                confidence: parsed.confidence || 0.5,
                emotions: parsed.emotions || []
            };
        }
        catch (error) {
            index_1.logger.error('Failed to parse sentiment response:', error);
            return {
                sentiment: 'neutral',
                confidence: 0.5,
                emotions: []
            };
        }
    }
    /**
     * Generate search query suggestions
     */
    async generateSearchSuggestions(query) {
        const prompt = `
Based on this search query: "${query}"

Generate 5 related search suggestions that would help find relevant articles. Return as comma-separated list:

Suggestions:`;
        const result = await this.callAzureOpenAI(prompt, 100);
        return result.split(',').map(suggestion => suggestion.trim()).filter(s => s.length > 0);
    }
    /**
     * Categorize article content
     */
    async categorizeArticle(content) {
        const prompt = `
Categorize this article into one of these categories:
Technology, Business, Science, Health, Politics, Sports, Entertainment, World News, Opinion, Other

Title: ${content.title}
Content: ${content.content.slice(0, 2000)}

Category:`;
        const result = await this.callAzureOpenAI(prompt, 50);
        return result.trim();
    }
    /**
     * Check if service is available
     */
    async healthCheck() {
        try {
            const response = await axios_1.default.get(`${this.azureOpenAIEndpoint}/openai/models?api-version=2024-02-15-preview`, {
                headers: {
                    'api-key': this.azureOpenAIKey
                },
                timeout: 5000
            });
            return response.status === 200;
        }
        catch (error) {
            index_1.logger.error('AI service health check failed:', error);
            return false;
        }
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=ai.js.map