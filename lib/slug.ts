import slugify from 'slugify'

export function generateSlug(name: string, takenSlugs: string[]): string {
  // No `locale` option — slugify's built-in Unicode map handles accented characters (e.g., María → maria)
  const base = slugify(name, { lower: true, strict: true })
  if (!takenSlugs.includes(base)) return base

  let counter = 2
  while (takenSlugs.includes(`${base}-${counter}`)) {
    counter++
  }
  return `${base}-${counter}`
}
