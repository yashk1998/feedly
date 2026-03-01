/**
 * Parses search queries with operators into structured filters.
 *
 * Supported operators:
 *   intitle:keyword    — match article title
 *   author:name        — match article author
 *   feed:name          — match feed title
 *   before:YYYY-MM-DD  — published before date
 *   after:YYYY-MM-DD   — published after date
 *   is:read            — read articles only
 *   is:unread          — unread articles only
 *   is:saved           — saved articles only
 *   bare words         — full-text search across title + summary
 */

export interface ParsedSearch {
  freeText: string
  intitle: string[]
  author: string[]
  feed: string[]
  before: Date | null
  after: Date | null
  is: string[]
}

const OPERATOR_RE = /(?:^|\s)(intitle|author|feed|before|after|is):(?:"([^"]+)"|(\S+))/gi

export function parseSearchQuery(raw: string): ParsedSearch {
  const result: ParsedSearch = {
    freeText: '',
    intitle: [],
    author: [],
    feed: [],
    before: null,
    after: null,
    is: [],
  }

  let remaining = raw

  let match: RegExpExecArray | null
  // Reset lastIndex for global regex
  OPERATOR_RE.lastIndex = 0
  while ((match = OPERATOR_RE.exec(raw)) !== null) {
    const op = match[1].toLowerCase()
    const value = match[2] || match[3] // quoted or unquoted

    switch (op) {
      case 'intitle':
        result.intitle.push(value)
        break
      case 'author':
        result.author.push(value)
        break
      case 'feed':
        result.feed.push(value)
        break
      case 'before': {
        const d = new Date(value)
        if (!isNaN(d.getTime())) result.before = d
        break
      }
      case 'after': {
        const d = new Date(value)
        if (!isNaN(d.getTime())) result.after = d
        break
      }
      case 'is':
        result.is.push(value.toLowerCase())
        break
    }

    // Remove matched operator from remaining text
    remaining = remaining.replace(match[0], ' ')
  }

  result.freeText = remaining.replace(/\s+/g, ' ').trim()
  return result
}

/**
 * Convert ParsedSearch into Prisma `where` conditions for the Article model.
 */
export function buildPrismaFilter(parsed: ParsedSearch, userId: string) {
  const conditions: any[] = []

  // Free text → search title + summary
  if (parsed.freeText) {
    conditions.push({
      OR: [
        { title: { contains: parsed.freeText, mode: 'insensitive' } },
        { summaryHtml: { contains: parsed.freeText, mode: 'insensitive' } },
      ],
    })
  }

  // intitle: operator
  for (const term of parsed.intitle) {
    conditions.push({ title: { contains: term, mode: 'insensitive' } })
  }

  // author: operator
  for (const term of parsed.author) {
    conditions.push({ author: { contains: term, mode: 'insensitive' } })
  }

  // feed: operator
  for (const term of parsed.feed) {
    conditions.push({ feed: { title: { contains: term, mode: 'insensitive' } } })
  }

  // before: / after: date filters
  if (parsed.before || parsed.after) {
    const dateFilter: any = {}
    if (parsed.before) dateFilter.lt = parsed.before
    if (parsed.after) dateFilter.gt = parsed.after
    conditions.push({ publishedAt: dateFilter })
  }

  // is: status filters
  for (const status of parsed.is) {
    switch (status) {
      case 'read':
        conditions.push({ reads: { some: { userId } } })
        break
      case 'unread':
        conditions.push({ reads: { none: { userId } } })
        break
      case 'saved':
        conditions.push({ savedArticles: { some: { userId } } })
        break
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}
