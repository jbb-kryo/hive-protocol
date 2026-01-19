export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0) return false
  if (slug.length > 100) return false
  if (slug !== slug.toLowerCase()) return false
  if (slug.includes(' ')) return false
  if (slug.includes('_')) return false
  if (slug.startsWith('-') || slug.endsWith('-')) return false
  if (/--/.test(slug)) return false
  if (!/^[a-z0-9-]+$/.test(slug)) return false
  return true
}

export function sanitizeSlug(slug: string): string {
  if (isValidSlug(slug)) return slug
  return generateSlug(slug)
}

export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  const slug = sanitizeSlug(baseSlug)
  if (!existingSlugs.includes(slug)) return slug

  let counter = 1
  let uniqueSlug = `${slug}-${counter}`
  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${slug}-${counter}`
  }
  return uniqueSlug
}

export function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'it', 'its', 'as', 'if', 'then',
    'than', 'so', 'such', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'any', 'no', 'not', 'only', 'same', 'how', 'what', 'when',
    'where', 'which', 'who', 'why', 'all', 'also', 'just', 'because',
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))

  const wordCount = new Map<string, number>()
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  })

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
