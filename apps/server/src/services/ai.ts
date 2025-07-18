import axios from 'axios';
import { logger } from '../index';

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

export class AIService {
  private azureOpenAIEndpoint: string;
  private azureOpenAIKey: string;
  private deploymentName: string;
  private deploymentVersion: string;

  constructor() {
    this.azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    this.azureOpenAIKey = process.env.AZURE_OPENAI_KEY || '';
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    this.deploymentVersion = process.env.AZURE_OPENAI_DEPLOYMENT_VERSION || '2024-02-15-preview';
  }

  private async callAzureOpenAI(prompt: string, maxTokens: number = 500): Promise<string> {
    try {
      const response = await axios.post(
        `${this.azureOpenAIEndpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.deploymentVersion}`,
        {
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
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureOpenAIKey
          }
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Azure OpenAI API error:', error);
      throw new Error('Failed to process AI request');
    }
  }

  /**
   * Summarize an article
   */
  async summarizeArticle(content: ArticleContent): Promise<string> {
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
  async generateSocialPost(content: SocialPostContent): Promise<string> {
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
  async extractKeywords(content: ArticleContent): Promise<string[]> {
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
  async analyzeSentiment(content: ArticleContent): Promise<SentimentResult> {
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
    } catch (error) {
      logger.error('Failed to parse sentiment response:', error);
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
  async generateSearchSuggestions(query: string): Promise<string[]> {
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
  async categorizeArticle(content: ArticleContent): Promise<string> {
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
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.azureOpenAIEndpoint}/openai/models?api-version=${this.deploymentVersion}`,
        {
          headers: {
            'api-key': this.azureOpenAIKey
          },
          timeout: 5000
        }
      );
      return response.status === 200;
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService(); 