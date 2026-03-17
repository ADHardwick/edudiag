import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/slug'

describe('generateSlug', () => {
  it('generates a kebab-case slug from a name', () => {
    expect(generateSlug('Jane Smith', [])).toBe('jane-smith')
  })

  it('handles names with special characters', () => {
    expect(generateSlug('Dr. María García', [])).toBe('dr-maria-garcia')
  })

  it('appends -2 when slug already exists', () => {
    expect(generateSlug('Jane Smith', ['jane-smith'])).toBe('jane-smith-2')
  })

  it('appends -3 when -2 already exists', () => {
    expect(generateSlug('Jane Smith', ['jane-smith', 'jane-smith-2'])).toBe('jane-smith-3')
  })

  it('returns base slug when taken list is empty', () => {
    expect(generateSlug('John Doe', [])).toBe('john-doe')
  })
})
