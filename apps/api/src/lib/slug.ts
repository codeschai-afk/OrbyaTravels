/**
 * Generates a URL-safe slug from a title.
 * Format: {sanitized-title}-{6-char random suffix}
 * Unique within a listing type via DB @@unique([slug, type]).
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .substring(0, 48)                // cap base length

  const suffix = Math.random().toString(36).substring(2, 8)  // 6-char base36
  return `${base}-${suffix}`
}

/** Strips the random suffix for display purposes */
export function slugToTitle(slug: string): string {
  return slug
    .replace(/-[a-z0-9]{6}$/, '')   // remove suffix
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
