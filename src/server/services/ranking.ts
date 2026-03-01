import { prisma } from '@/lib/prisma'
import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'

const INTEREST_VECTOR_TTL = 3600 // 1 hour cache
const MAX_HISTORY_ARTICLES = 100 // Articles to build interest from

/**
 * Build a user interest vector by averaging the embeddings of their
 * recently read and saved articles. Cached in Redis for 1 hour.
 */
export async function getUserInterestVector(userId: string): Promise<number[] | null> {
  // Try cache first
  try {
    const redis = await getRedis()
    const cached = await redis.get(`interest:${userId}`)
    if (cached) return JSON.parse(cached)
  } catch {
    // Redis optional
  }

  // Get IDs of recently read/saved articles
  const readArticleIds = await prisma.articleRead.findMany({
    where: { userId },
    orderBy: { readAt: 'desc' },
    take: MAX_HISTORY_ARTICLES,
    select: { articleId: true },
  })

  const savedArticleIds = await prisma.savedArticle.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    take: 50,
    select: { articleId: true },
  })

  // Combine and deduplicate, saved articles get double weight
  const articleIdSet = new Set<bigint>()
  const weightedIds: { id: bigint; weight: number }[] = []

  for (const s of savedArticleIds) {
    if (!articleIdSet.has(s.articleId)) {
      articleIdSet.add(s.articleId)
      weightedIds.push({ id: s.articleId, weight: 2.0 }) // Saved = 2x weight
    }
  }
  for (const r of readArticleIds) {
    if (!articleIdSet.has(r.articleId)) {
      articleIdSet.add(r.articleId)
      weightedIds.push({ id: r.articleId, weight: 1.0 })
    }
  }

  if (weightedIds.length === 0) return null

  // Fetch embeddings for these articles
  const embeddings = await prisma.$queryRawUnsafe<{ article_id: bigint; embedding: string }[]>(
    `SELECT article_id, embedding::text FROM article_embeddings WHERE article_id = ANY($1::bigint[])`,
    weightedIds.map((w) => w.id)
  )

  if (embeddings.length === 0) return null

  // Build weighted average vector
  const embeddingMap = new Map<string, number[]>()
  for (const row of embeddings) {
    // Parse pgvector text format "[0.1,0.2,...]"
    const vec = row.embedding.replace(/[\[\]]/g, '').split(',').map(Number)
    embeddingMap.set(row.article_id.toString(), vec)
  }

  const dim = embeddingMap.values().next().value?.length || 1536
  const avgVector = new Array(dim).fill(0)
  let totalWeight = 0

  for (const { id, weight } of weightedIds) {
    const vec = embeddingMap.get(id.toString())
    if (!vec) continue
    for (let i = 0; i < dim; i++) {
      avgVector[i] += vec[i] * weight
    }
    totalWeight += weight
  }

  if (totalWeight === 0) return null

  // Normalize
  for (let i = 0; i < dim; i++) {
    avgVector[i] /= totalWeight
  }

  // Cache in Redis
  try {
    const redis = await getRedis()
    await redis.setEx(`interest:${userId}`, INTEREST_VECTOR_TTL, JSON.stringify(avgVector))
  } catch {
    // Redis optional
  }

  return avgVector
}

/**
 * Re-rank article IDs by similarity to the user's interest vector.
 * Returns article IDs sorted by relevance (most similar first).
 */
export async function smartRankArticles(
  userId: string,
  articleIds: bigint[]
): Promise<bigint[]> {
  if (articleIds.length === 0) return []

  const interestVector = await getUserInterestVector(userId)
  if (!interestVector) return articleIds // No interest profile, return original order

  try {
    // Use pgvector to compute similarity scores
    const vectorStr = `[${interestVector.join(',')}]`

    const ranked = await prisma.$queryRawUnsafe<{ article_id: bigint; similarity: number }[]>(
      `SELECT ae.article_id, 1 - (ae.embedding <=> $1::vector) as similarity
       FROM article_embeddings ae
       WHERE ae.article_id = ANY($2::bigint[])
       ORDER BY ae.embedding <=> $1::vector ASC`,
      vectorStr,
      articleIds
    )

    // Build a map of article_id -> rank position
    const rankedIds = ranked.map((r) => r.article_id)

    // Add any article IDs not in embeddings at the end (original order)
    const rankedSet = new Set(rankedIds.map((id) => id.toString()))
    for (const id of articleIds) {
      if (!rankedSet.has(id.toString())) {
        rankedIds.push(id)
      }
    }

    return rankedIds
  } catch (error) {
    logger.warn('Smart ranking failed, falling back to default order:', error)
    return articleIds
  }
}
