import axios from 'axios'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// ─── Types ──────────────────────────────────────────────────

interface ArticleContent {
  title: string
  content: string
  url?: string
}

interface SocialPostContent extends ArticleContent {
  platform: 'twitter' | 'linkedin' | 'reddit'
  tone: 'professional' | 'casual' | 'engaging'
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  emotions?: string[]
}

type CacheType = 'summary' | 'keywords' | 'sentiment' | 'social-post'

// ─── Provider Abstraction ───────────────────────────────────

interface ProviderConfig {
  name: string
  call: (systemPrompt: string, userPrompt: string, maxTokens: number) => Promise<string>
}

function createAzureOpenAIProvider(): ProviderConfig {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || ''
  const key = process.env.AZURE_OPENAI_KEY || ''
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
  const version = process.env.AZURE_OPENAI_DEPLOYMENT_VERSION || '2024-02-15-preview'

  return {
    name: `azure-openai/${deployment}`,
    call: async (systemPrompt, userPrompt, maxTokens) => {
      const res = await axios.post(
        `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${version}`,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        },
        { headers: { 'Content-Type': 'application/json', 'api-key': key } }
      )
      return res.data.choices[0]?.message?.content || ''
    },
  }
}

function createGeminiProvider(): ProviderConfig {
  const key = process.env.GEMINI_API_KEY || ''
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

  return {
    name: `gemini/${model}`,
    call: async (systemPrompt, userPrompt, maxTokens) => {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
      return res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    },
  }
}

function createOpenAIProvider(): ProviderConfig {
  const key = process.env.OPENAI_API_KEY || ''
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  return {
    name: `openai/${model}`,
    call: async (systemPrompt, userPrompt, maxTokens) => {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        },
        { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
      )
      return res.data.choices[0]?.message?.content || ''
    },
  }
}

function createBedrockProvider(): ProviderConfig {
  const region = process.env.AWS_BEDROCK_REGION || 'us-east-1'
  const accessKey = process.env.AWS_ACCESS_KEY_ID || ''
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  const model = process.env.AWS_BEDROCK_MODEL || 'anthropic.claude-3-haiku-20240307-v1:0'

  return {
    name: `bedrock/${model.split('.').pop() || model}`,
    call: async (systemPrompt, userPrompt, maxTokens) => {
      // Bedrock uses AWS Signature V4 — use the AWS SDK invoke
      const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime')

      const client = new BedrockRuntimeClient({
        region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      })

      // Determine payload format based on model provider
      let body: string
      if (model.startsWith('anthropic.')) {
        // Anthropic Claude models on Bedrock
        body = JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: maxTokens,
          temperature: 0.3,
        })
      } else if (model.startsWith('amazon.titan')) {
        // Amazon Titan models
        body = JSON.stringify({
          inputText: `${systemPrompt}\n\n${userPrompt}`,
          textGenerationConfig: { maxTokenCount: maxTokens, temperature: 0.3 },
        })
      } else if (model.startsWith('meta.llama')) {
        // Meta Llama models on Bedrock
        body = JSON.stringify({
          prompt: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`,
          max_gen_len: maxTokens,
          temperature: 0.3,
        })
      } else {
        // Default: Anthropic-style messages API (works for most Bedrock models)
        body = JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: maxTokens,
          temperature: 0.3,
        })
      }

      const command = new InvokeModelCommand({
        modelId: model,
        contentType: 'application/json',
        accept: 'application/json',
        body: new TextEncoder().encode(body),
      })

      const response = await client.send(command)
      const result = JSON.parse(new TextDecoder().decode(response.body))

      // Extract text based on model response format
      if (result.content?.[0]?.text) return result.content[0].text // Claude
      if (result.results?.[0]?.outputText) return result.results[0].outputText // Titan
      if (result.generation) return result.generation // Llama
      return result.completion || ''
    },
  }
}

// ─── Provider Selection ─────────────────────────────────────

function getProvider(task: 'summary' | 'social' | 'keywords' | 'sentiment' | 'translate' | 'digest'): ProviderConfig {
  // Priority: Azure OpenAI → AWS Bedrock → Gemini → OpenAI
  const hasAzure = !!process.env.AZURE_OPENAI_KEY
  const hasBedrock = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_BEDROCK_REGION
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  // Social posts & translations need better language quality — prefer larger models
  if (task === 'social' || task === 'translate') {
    if (hasAzure) return createAzureOpenAIProvider()
    if (hasOpenAI) return createOpenAIProvider()
    if (hasBedrock) return createBedrockProvider()
    if (hasGemini) return createGeminiProvider()
  }

  // Summary, keywords, sentiment, digest → cheapest configured provider
  if (hasAzure) return createAzureOpenAIProvider()
  if (hasBedrock) return createBedrockProvider()
  if (hasGemini) return createGeminiProvider()
  if (hasOpenAI) return createOpenAIProvider()

  throw new Error('No AI provider configured. Set AZURE_OPENAI_KEY, AWS_ACCESS_KEY_ID+AWS_BEDROCK_REGION, GEMINI_API_KEY, or OPENAI_API_KEY.')
}

/**
 * Get provider for a specific user, checking their BYOK keys first.
 * Falls back to system-level provider if no user key is configured.
 */
async function getProviderForUser(
  userId: string,
  task: 'summary' | 'social' | 'keywords' | 'sentiment' | 'translate' | 'digest'
): Promise<ProviderConfig> {
  try {
    const userKeys = await prisma.userApiKey.findMany({
      where: { userId, isActive: true },
    })

    for (const key of userKeys) {
      if (key.provider === 'openai' && key.apiKey) {
        return {
          name: `user-openai/${key.model || 'gpt-4o-mini'}`,
          call: async (systemPrompt, userPrompt, maxTokens) => {
            const res = await axios.post(
              'https://api.openai.com/v1/chat/completions',
              {
                model: key.model || 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
                ],
                max_tokens: maxTokens,
                temperature: 0.3,
              },
              { headers: { Authorization: `Bearer ${key.apiKey}`, 'Content-Type': 'application/json' } }
            )
            return res.data.choices[0]?.message?.content || ''
          },
        }
      }

      if (key.provider === 'anthropic' && key.apiKey) {
        return {
          name: `user-anthropic/${key.model || 'claude-3-haiku-20240307'}`,
          call: async (systemPrompt, userPrompt, maxTokens) => {
            const res = await axios.post(
              'https://api.anthropic.com/v1/messages',
              {
                model: key.model || 'claude-3-haiku-20240307',
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                max_tokens: maxTokens,
                temperature: 0.3,
              },
              {
                headers: {
                  'x-api-key': key.apiKey,
                  'anthropic-version': '2023-06-01',
                  'Content-Type': 'application/json',
                },
              }
            )
            return res.data.content?.[0]?.text || ''
          },
        }
      }

      if (key.provider === 'google' && key.apiKey) {
        const model = key.model || 'gemini-2.0-flash-lite'
        return {
          name: `user-gemini/${model}`,
          call: async (systemPrompt, userPrompt, maxTokens) => {
            const res = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.apiKey}`,
              {
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
              },
              { headers: { 'Content-Type': 'application/json' } }
            )
            return res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          },
        }
      }

      if (key.provider === 'groq' && key.apiKey) {
        const model = key.model || 'llama-3.1-8b-instant'
        return {
          name: `user-groq/${model}`,
          call: async (systemPrompt, userPrompt, maxTokens) => {
            const res = await axios.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
                ],
                max_tokens: maxTokens,
                temperature: 0.3,
              },
              { headers: { Authorization: `Bearer ${key.apiKey}`, 'Content-Type': 'application/json' } }
            )
            return res.data.choices[0]?.message?.content || ''
          },
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to check user API keys, falling back to system:', err)
  }

  return getProvider(task)
}

// ─── Content Truncation ─────────────────────────────────────

/** Truncate to ~N tokens (rough: 1 token ≈ 4 chars), respecting sentence boundaries */
function truncateContent(text: string, maxChars: number = 6000): string {
  if (!text || text.length <= maxChars) return text

  // Strip HTML tags first
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.length <= maxChars) return clean

  // Cut at last sentence boundary before limit
  const cut = clean.slice(0, maxChars)
  const lastPeriod = cut.lastIndexOf('.')
  if (lastPeriod > maxChars * 0.5) return cut.slice(0, lastPeriod + 1)
  return cut + '...'
}

// ─── Cache Layer ────────────────────────────────────────────

async function getCached(articleId: number, userId: string, type: CacheType): Promise<string | null> {
  try {
    const cached = await prisma.aiCache.findUnique({
      where: { articleId_userId_type: { articleId: BigInt(articleId), userId, type } },
    })
    return cached?.content ?? null
  } catch {
    return null
  }
}

async function setCache(articleId: number, userId: string, type: CacheType, content: string, model: string) {
  try {
    await prisma.aiCache.upsert({
      where: { articleId_userId_type: { articleId: BigInt(articleId), userId, type } },
      update: { content, model },
      create: { articleId: BigInt(articleId), userId, type, content, model },
    })
  } catch (error) {
    logger.error('Failed to cache AI result:', error)
  }
}

// ─── Optimized Prompts ──────────────────────────────────────
// Designed to be concise and structured for smaller/cheaper models.

const SYSTEM_PROMPTS = {
  summary: `You summarize news articles. Be concise, factual, and neutral. Output 2-3 sentences capturing the key points. No fluff, no opinions.`,

  keywords: `Extract keywords from articles. Return ONLY a comma-separated list of 5-8 specific, relevant keywords. No numbering, no explanations.`,

  sentiment: `Analyze article sentiment. Return ONLY valid JSON:
{"sentiment":"positive|negative|neutral","confidence":0.0-1.0,"emotions":["emotion1","emotion2"]}
No other text.`,

  social: {
    twitter: `Write a tweet about this article. Max 270 chars. Include 1-2 relevant hashtags. Be engaging and informative. No quotes around the tweet.`,
    linkedin: `Write a LinkedIn post about this article. 2-3 paragraphs. Professional tone. End with a question to drive engagement. No quotes.`,
    reddit: `Write a Reddit comment about this article. Conversational, add your perspective, mention key facts. 2-3 sentences. No quotes.`,
  },

  translate: `You are a professional translator. Translate the following text accurately while preserving meaning, tone, and formatting. Keep HTML tags intact. Return ONLY the translation, no explanations.`,

  digest: `You create concise news digests. Given a list of article titles and summaries, write a cohesive 3-5 paragraph digest that covers the key stories. Group related items together. Use clear headings. Be informative and engaging. No fluff.`,
}

// ─── AI Service ─────────────────────────────────────────────

export class AIService {
  async summarizeArticle(content: ArticleContent, articleId?: number, userId?: string): Promise<{ text: string; model: string; cached: boolean }> {
    // Check cache
    if (articleId && userId) {
      const cached = await getCached(articleId, userId, 'summary')
      if (cached) return { text: cached, model: 'cache', cached: true }
    }

    const provider = userId ? await getProviderForUser(userId, 'summary') : getProvider('summary')
    const truncated = truncateContent(content.content)
    const userPrompt = `Title: ${content.title}\n\nArticle:\n${truncated}`

    try {
      const text = await provider.call(SYSTEM_PROMPTS.summary, userPrompt, 150)

      if (articleId && userId) {
        await setCache(articleId, userId, 'summary', text, provider.name)
      }

      return { text, model: provider.name, cached: false }
    } catch (error) {
      logger.error(`AI summarization failed (${provider.name}):`, error)
      throw new Error('Failed to summarize article')
    }
  }

  async generateSocialPost(content: SocialPostContent, articleId?: number, userId?: string): Promise<{ text: string; model: string; cached: boolean }> {
    const cacheKey = `social-post-${content.platform}` as CacheType

    if (articleId && userId) {
      const cached = await getCached(articleId, userId, cacheKey)
      if (cached) return { text: cached, model: 'cache', cached: true }
    }

    const provider = userId ? await getProviderForUser(userId, 'social') : getProvider('social')
    const systemPrompt = SYSTEM_PROMPTS.social[content.platform]
    const truncated = truncateContent(content.content, 3000)
    const userPrompt = `Article: "${content.title}"\n\n${truncated}${content.url ? `\n\nURL: ${content.url}` : ''}`

    try {
      const maxTokens = content.platform === 'twitter' ? 80 : content.platform === 'linkedin' ? 350 : 200
      const text = await provider.call(systemPrompt, userPrompt, maxTokens)

      if (articleId && userId) {
        await setCache(articleId, userId, cacheKey, text, provider.name)
      }

      return { text, model: provider.name, cached: false }
    } catch (error) {
      logger.error(`Social post generation failed (${provider.name}):`, error)
      throw new Error('Failed to generate social post')
    }
  }

  async extractKeywords(content: ArticleContent, articleId?: number, userId?: string): Promise<{ keywords: string[]; model: string; cached: boolean }> {
    if (articleId && userId) {
      const cached = await getCached(articleId, userId, 'keywords')
      if (cached) {
        return { keywords: cached.split(',').map((k) => k.trim()), model: 'cache', cached: true }
      }
    }

    const provider = userId ? await getProviderForUser(userId, 'keywords') : getProvider('keywords')
    const truncated = truncateContent(content.content, 4000)
    const userPrompt = `Title: ${content.title}\n\nArticle:\n${truncated}`

    try {
      const raw = await provider.call(SYSTEM_PROMPTS.keywords, userPrompt, 80)
      const keywords = raw.split(',').map((k) => k.trim()).filter((k) => k.length > 0 && k.length < 50)

      if (articleId && userId) {
        await setCache(articleId, userId, 'keywords', keywords.join(', '), provider.name)
      }

      return { keywords, model: provider.name, cached: false }
    } catch (error) {
      logger.error(`Keyword extraction failed (${provider.name}):`, error)
      throw new Error('Failed to extract keywords')
    }
  }

  async analyzeSentiment(content: ArticleContent, articleId?: number, userId?: string): Promise<{ result: SentimentResult; model: string; cached: boolean }> {
    if (articleId && userId) {
      const cached = await getCached(articleId, userId, 'sentiment')
      if (cached) {
        try {
          return { result: JSON.parse(cached), model: 'cache', cached: true }
        } catch { /* cache corrupted, regenerate */ }
      }
    }

    const provider = userId ? await getProviderForUser(userId, 'sentiment') : getProvider('sentiment')
    const truncated = truncateContent(content.content, 3000)
    const userPrompt = `Title: ${content.title}\n\nArticle:\n${truncated}`

    try {
      const raw = await provider.call(SYSTEM_PROMPTS.sentiment, userPrompt, 100)
      // Extract JSON from response (handle models that add markdown fences)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null

      const result: SentimentResult = {
        sentiment: parsed?.sentiment || 'neutral',
        confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : 0.5,
        emotions: Array.isArray(parsed?.emotions) ? parsed.emotions : [],
      }

      if (articleId && userId) {
        await setCache(articleId, userId, 'sentiment', JSON.stringify(result), provider.name)
      }

      return { result, model: provider.name, cached: false }
    } catch (error) {
      logger.error(`Sentiment analysis failed (${provider.name}):`, error)
      return { result: { sentiment: 'neutral', confidence: 0.5, emotions: [] }, model: 'fallback', cached: false }
    }
  }
  async translateArticle(
    content: ArticleContent,
    targetLang: string,
    articleId?: number,
    userId?: string
  ): Promise<{ translatedTitle: string; translatedContent: string; model: string; cached: boolean }> {
    const cacheKey = `translation-${targetLang}` as CacheType

    if (articleId && userId) {
      const cached = await getCached(articleId, userId, cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          return { translatedTitle: parsed.title, translatedContent: parsed.content, model: 'cache', cached: true }
        } catch { /* cache corrupted */ }
      }
    }

    const provider = userId ? await getProviderForUser(userId, 'translate') : getProvider('translate')
    const truncated = truncateContent(content.content, 5000)

    // Translate title and content in one call for efficiency
    const userPrompt = `Translate to ${targetLang}:\n\nTITLE: ${content.title}\n\nCONTENT:\n${truncated}`

    try {
      const raw = await provider.call(SYSTEM_PROMPTS.translate, userPrompt, 2000)

      // Parse the response — try to extract title and content
      let translatedTitle = content.title
      let translatedContent = raw

      const titleMatch = raw.match(/^TITLE:\s*(.+?)(?:\n|CONTENT:)/is)
      const contentMatch = raw.match(/CONTENT:\s*([\s\S]+)/i)

      if (titleMatch && contentMatch) {
        translatedTitle = titleMatch[1].trim()
        translatedContent = contentMatch[1].trim()
      } else {
        // If model didn't follow format, use entire response as content
        // and try a shorter call for just the title
        translatedContent = raw
      }

      if (articleId && userId) {
        await setCache(articleId, userId, cacheKey, JSON.stringify({ title: translatedTitle, content: translatedContent }), provider.name)
      }

      return { translatedTitle, translatedContent, model: provider.name, cached: false }
    } catch (error) {
      logger.error(`Translation failed (${provider.name}):`, error)
      throw new Error('Failed to translate article')
    }
  }

  /**
   * Generate an embedding vector for text content.
   * Uses Azure OpenAI embeddings (text-embedding-ada-002 / text-embedding-3-small)
   * or OpenAI directly as fallback.
   */
  async generateEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
    const truncated = truncateContent(text, 8000) // ~2000 tokens
    const hasAzure = !!process.env.AZURE_OPENAI_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    if (hasAzure) {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT || ''
      const key = process.env.AZURE_OPENAI_KEY || ''
      const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002'
      const version = process.env.AZURE_OPENAI_DEPLOYMENT_VERSION || '2024-02-15-preview'

      const res = await axios.post(
        `${endpoint}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${version}`,
        { input: truncated },
        { headers: { 'Content-Type': 'application/json', 'api-key': key } }
      )
      return { embedding: res.data.data[0].embedding, model: `azure/${embeddingDeployment}` }
    }

    if (hasOpenAI) {
      const key = process.env.OPENAI_API_KEY || ''
      const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'

      const res = await axios.post(
        'https://api.openai.com/v1/embeddings',
        { input: truncated, model: embeddingModel },
        { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
      )
      return { embedding: res.data.data[0].embedding, model: `openai/${embeddingModel}` }
    }

    throw new Error('No embedding provider configured. Set AZURE_OPENAI_KEY or OPENAI_API_KEY.')
  }

  async generateDigest(userId: string, articleCount: number = 10): Promise<{ digest: string; model: string; cached: boolean }> {
    const provider = await getProviderForUser(userId, 'digest')

    // Fetch user's recent unread articles
    const articles = await prisma.article.findMany({
      where: {
        feed: {
          subscriptions: {
            some: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
          },
        },
        reads: { none: { userId } },
        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { publishedAt: 'desc' },
      take: articleCount,
      select: {
        title: true,
        summaryHtml: true,
        feed: { select: { title: true } },
        publishedAt: true,
      },
    })

    if (articles.length === 0) {
      return { digest: 'No new articles in the last 24 hours. You\'re all caught up!', model: 'none', cached: false }
    }

    const articlesText = articles.map((a, i) =>
      `${i + 1}. [${a.feed.title}] ${a.title}\n   ${(a.summaryHtml || '').replace(/<[^>]*>/g, '').slice(0, 200)}`
    ).join('\n\n')

    const userPrompt = `Here are ${articles.length} recent articles from the user's feeds:\n\n${articlesText}`

    try {
      const digest = await provider.call(SYSTEM_PROMPTS.digest, userPrompt, 800)
      return { digest, model: provider.name, cached: false }
    } catch (error) {
      logger.error(`Digest generation failed (${provider.name}):`, error)
      throw new Error('Failed to generate digest')
    }
  }
}

export const aiService = new AIService()
