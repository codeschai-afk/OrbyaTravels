import { describe, it, expect } from 'vitest'
import { generateSlug, slugToTitle } from '../lib/slug.js'

describe('generateSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    const slug = generateSlug('Hotel Sunshine Goa')
    expect(slug).toMatch(/^hotel-sunshine-goa-[a-z0-9]{6}$/)
  })

  it('strips special characters', () => {
    const slug = generateSlug("Rick's Cafe & Bar!")
    expect(slug).not.toMatch(/[^a-z0-9-]/)
  })

  it('collapses multiple spaces/hyphens', () => {
    const slug = generateSlug('Budget  Cars --  Goa')
    expect(slug).not.toMatch(/--/)
    expect(slug).not.toMatch(/  /)
  })

  it('appends a 6-char suffix', () => {
    const slug = generateSlug('Test Listing')
    const parts = slug.split('-')
    expect(parts[parts.length - 1]).toHaveLength(6)
  })

  it('generates unique slugs for the same title', () => {
    const a = generateSlug('Same Title')
    const b = generateSlug('Same Title')
    expect(a).not.toBe(b)
  })

  it('caps base at 48 chars before suffix', () => {
    const long = 'A'.repeat(100)
    const slug = generateSlug(long)
    // total = 48 base + 1 hyphen + 6 suffix = 55 max
    expect(slug.length).toBeLessThanOrEqual(55)
  })
})

describe('slugToTitle', () => {
  it('removes suffix and title-cases the result', () => {
    expect(slugToTitle('hotel-sunshine-goa-abc123')).toBe('Hotel Sunshine Goa')
  })

  it('handles slugs without a suffix gracefully', () => {
    const result = slugToTitle('hotel-sunshine')
    expect(typeof result).toBe('string')
  })
})
