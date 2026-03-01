import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { aiService } from './ai'

/**
 * Service for generating article embeddings and topic clusters.
 *
 * Uses pgvector for vector storage and cosine similarity search.
 * Clustering uses a simple centroid-based approach:
 *   1. Generate embeddings for recent articles
 *   2. Find similar article groups via cosine similarity
 *   3. Label clusters with a cheap LLM call
 */

// ─── Embedding Generation ────────────────────────────────────

/**
 * Generate embeddings for articles that don't have one yet.
 * Batches by 20 to avoid rate limits.
 */
export async function generateMissingEmbeddings(maxArticles: number = 100): Promise<number> {
  // Find articles from last 48 hours without embeddings
  const articles = await prisma.article.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      embedding: null,
    },
    select: {
      id: true,
      title: true,
      summaryHtml: true,
      contentHtml: true,
    },
    take: maxArticles,
    orderBy: { createdAt: 'desc' },
  })

  if (articles.length === 0) return 0

  logger.info(`Generating embeddings for ${articles.length} articles...`)
  let generated = 0

  const batchSize = 20
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)

    await Promise.allSettled(
      batch.map(async (article) => {
        try {
          const text = [
            article.title || '',
            (article.summaryHtml || '').replace(/<[^>]*>/g, '').slice(0, 500),
            (article.contentHtml || '').replace(/<[^>]*>/g, '').slice(0, 1500),
          ].join(' ').trim()

          if (text.length < 20) return // Skip too-short articles

          const { embedding, model } = await aiService.generateEmbedding(text)

          // Insert via raw SQL since Prisma doesn't natively support vector type
          await prisma.$executeRawUnsafe(
            `INSERT INTO article_embeddings (article_id, embedding, model, created_at)
             VALUES ($1, $2::vector, $3, NOW())
             ON CONFLICT (article_id) DO NOTHING`,
            article.id,
            `[${embedding.join(',')}]`,
            model
          )

          generated++
        } catch (error) {
          logger.warn(`Embedding failed for article ${article.id}:`, error)
        }
      })
    )

    // Rate limit delay between batches
    if (i + batchSize < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  logger.info(`Generated ${generated} embeddings`)
  return generated
}

// ─── Cluster Generation ──────────────────────────────────────

interface RawCluster {
  articleIds: bigint[]
  titles: string[]
}

/**
 * Generate topic clusters from recent article embeddings.
 *
 * Algorithm:
 *   1. Pick each article as a potential cluster seed
 *   2. Find its nearest neighbors via cosine similarity (>0.8 threshold)
 *   3. Merge overlapping groups
 *   4. Label each cluster with AI
 *   5. Store with 24h expiry
 */
export async function generateTopicClusters(): Promise<number> {
  // Clean up expired clusters
  await prisma.topicCluster.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  // Find similar article pairs from last 48h using pgvector
  const similarPairs: Array<{ id1: bigint; id2: bigint; title1: string; title2: string; similarity: number }> =
    await prisma.$queryRawUnsafe(`
      SELECT
        e1.article_id as id1,
        e2.article_id as id2,
        a1.title as title1,
        a2.title as title2,
        1 - (e1.embedding <=> e2.embedding) as similarity
      FROM article_embeddings e1
      JOIN article_embeddings e2 ON e1.article_id < e2.article_id
      JOIN articles a1 ON a1.id = e1.article_id
      JOIN articles a2 ON a2.id = e2.article_id
      WHERE e1.created_at > NOW() - INTERVAL '48 hours'
        AND e2.created_at > NOW() - INTERVAL '48 hours'
        AND 1 - (e1.embedding <=> e2.embedding) > 0.78
      ORDER BY similarity DESC
      LIMIT 500
    `)

  if (similarPairs.length === 0) {
    logger.info('No similar article pairs found for clustering')
    return 0
  }

  // Build clusters via union-find approach
  const parent = new Map<string, string>()

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x)
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!))
    return parent.get(x)!
  }

  function union(a: string, b: string) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(rb, ra)
  }

  // Map article IDs + titles
  const titleMap = new Map<string, string>()

  for (const pair of similarPairs) {
    const a = pair.id1.toString()
    const b = pair.id2.toString()
    union(a, b)
    if (pair.title1) titleMap.set(a, pair.title1)
    if (pair.title2) titleMap.set(b, pair.title2)
  }

  // Group by cluster root
  const groups = new Map<string, Set<string>>()
  for (const id of parent.keys()) {
    const root = find(id)
    if (!groups.has(root)) groups.set(root, new Set())
    groups.get(root)!.add(id)
  }

  // Filter: only clusters with 3+ articles
  const rawClusters: RawCluster[] = []
  for (const members of groups.values()) {
    if (members.size >= 3) {
      const ids = Array.from(members)
      rawClusters.push({
        articleIds: ids.map((id) => BigInt(id)),
        titles: ids.map((id) => titleMap.get(id) || '').filter(Boolean),
      })
    }
  }

  if (rawClusters.length === 0) {
    logger.info('No clusters with 3+ articles found')
    return 0
  }

  logger.info(`Found ${rawClusters.length} topic clusters, labeling...`)

  // Label each cluster with AI
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
  let created = 0

  for (const cluster of rawClusters.slice(0, 20)) { // Cap at 20 clusters
    try {
      const label = await labelCluster(cluster.titles)

      await prisma.topicCluster.create({
        data: {
          label,
          articleIds: cluster.articleIds,
          score: cluster.articleIds.length / 10, // Simple score based on size
          expiresAt,
        },
      })
      created++
    } catch (error) {
      logger.warn('Failed to create cluster:', error)
    }
  }

  logger.info(`Created ${created} topic clusters`)
  return created
}

/**
 * Label a cluster based on its article titles.
 * Uses the cheapest available AI provider.
 */
async function labelCluster(titles: string[]): Promise<string> {
  try {
    // Use a direct provider call for the label
    const titleList = titles.slice(0, 10).join('\n- ')

    // We'll use the AI service's provider infrastructure
    // by calling summarize with a custom prompt via the provider
    const hasAzure = !!process.env.AZURE_OPENAI_KEY
    const hasBedrock = !!process.env.AWS_ACCESS_KEY_ID
    const hasGemini = !!process.env.GEMINI_API_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    if (!hasAzure && !hasBedrock && !hasGemini && !hasOpenAI) {
      // Fallback: derive label from common words in titles
      return deriveLabel(titles)
    }

    // Import and use the provider directly
    const { default: axios } = await import('axios')

    const systemPrompt = 'Generate a short topic label (2-5 words) for a group of related articles. Return ONLY the label, nothing else.'
    const userPrompt = `Articles:\n- ${titleList}`

    if (hasAzure) {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT || ''
      const key = process.env.AZURE_OPENAI_KEY || ''
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
      const version = process.env.AZURE_OPENAI_DEPLOYMENT_VERSION || '2024-02-15-preview'

      const res = await axios.post(
        `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${version}`,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 20,
          temperature: 0.2,
        },
        { headers: { 'Content-Type': 'application/json', 'api-key': key } }
      )
      return (res.data.choices[0]?.message?.content || '').trim() || deriveLabel(titles)
    }

    if (hasGemini) {
      const key = process.env.GEMINI_API_KEY || ''
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 20, temperature: 0.2 },
        }
      )
      return (res.data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim() || deriveLabel(titles)
    }

    if (hasOpenAI) {
      const key = process.env.OPENAI_API_KEY || ''
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 20,
          temperature: 0.2,
        },
        { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
      )
      return (res.data.choices[0]?.message?.content || '').trim() || deriveLabel(titles)
    }

    return deriveLabel(titles)
  } catch (error) {
    logger.warn('Cluster labeling failed, using fallback:', error)
    return deriveLabel(titles)
  }
}

/**
 * Fallback: derive a label from common words in titles.
 */
function deriveLabel(titles: string[]): string {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'than',
    'its', 'it', 'this', 'that', 'these', 'those', 'and', 'but', 'or',
    'not', 'no', 'how', 'what', 'why', 'when', 'where', 'who', 'which',
    'new', 'says', 'said', 'get', 'gets', 'just', 'more', 'after',
  ])

  const wordCounts = new Map<string, number>()
  for (const title of titles) {
    const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    }
  }

  const topWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

  return topWords.join(' & ') || 'Related Stories'
}

// ─── API Helpers ──────────────────────────────────────────────

/**
 * Get active topic clusters with article details.
 */
export async function getActiveClusters(limit: number = 10) {
  const clusters = await prisma.topicCluster.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  // Fetch article details for each cluster
  const enrichedClusters = await Promise.all(
    clusters.map(async (cluster) => {
      const articles = await prisma.article.findMany({
        where: { id: { in: cluster.articleIds } },
        select: {
          id: true,
          title: true,
          url: true,
          publishedAt: true,
          author: true,
          feed: { select: { title: true, siteUrl: true } },
        },
        orderBy: { publishedAt: 'desc' },
      })

      return {
        id: Number(cluster.id),
        label: cluster.label,
        articleCount: articles.length,
        score: cluster.score,
        createdAt: cluster.createdAt.toISOString(),
        expiresAt: cluster.expiresAt.toISOString(),
        articles: articles.map((a) => ({
          id: Number(a.id),
          title: a.title,
          url: a.url,
          publishedAt: a.publishedAt?.toISOString() ?? null,
          author: a.author,
          feedTitle: a.feed.title,
          feedSiteUrl: a.feed.siteUrl,
        })),
      }
    })
  )

  return enrichedClusters
}

/**
 * Find articles similar to a given article using pgvector.
 */
export async function findSimilarArticles(articleId: number, limit: number = 5) {
  const results: Array<{ id: bigint; title: string; url: string | null; similarity: number; feed_title: string | null }> =
    await prisma.$queryRawUnsafe(`
      SELECT
        a.id,
        a.title,
        a.url,
        f.title as feed_title,
        1 - (e1.embedding <=> e2.embedding) as similarity
      FROM article_embeddings e1
      JOIN article_embeddings e2 ON e1.article_id != e2.article_id
      JOIN articles a ON a.id = e2.article_id
      JOIN feeds f ON f.id = a.feed_id
      WHERE e1.article_id = $1
        AND 1 - (e1.embedding <=> e2.embedding) > 0.7
      ORDER BY similarity DESC
      LIMIT $2
    `, BigInt(articleId), limit)

  return results.map((r) => ({
    id: Number(r.id),
    title: r.title,
    url: r.url,
    feedTitle: r.feed_title,
    similarity: Number(r.similarity),
  }))
}
