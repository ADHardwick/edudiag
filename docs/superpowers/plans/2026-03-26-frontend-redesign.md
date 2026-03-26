# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public-facing frontend of SharpKid into a polished modern product with a dark hero, indigo/violet accent, and dark-header feature cards — without touching the admin panel.

**Architecture:** Introduce a Next.js App Router route group `app/(public)/` whose layout wraps `SiteNav` and `SiteFooter` around all public pages. Admin routes (`/admin/**`) remain outside this group and are visually unchanged. All new public components use explicit Tailwind indigo/slate classes — the `primary` Tailwind token (`#1e3a5f`) is never modified (the admin sidebar depends on it).

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v3, Supabase, `next/image`

**Spec:** `docs/superpowers/specs/2026-03-25-frontend-redesign.md`

---

## Chunk 1: Navigation, Footer, and Route Group

### Task 1: Create `SiteNav` component

**Files:**
- Create: `components/SiteNav.tsx`

- [ ] **Step 1: Create `components/SiteNav.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 h-14 flex items-center justify-between px-8 relative"
      style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          S
        </span>
        SharpKid
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="/diagnosticians"
          className="text-slate-400 text-sm font-medium hover:text-white transition-colors"
        >
          Browse All
        </Link>
        <a
          href="#"
          className="text-sm font-semibold text-white px-4 py-[7px] rounded-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          Get Listed →
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-white text-xl leading-none"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        {menuOpen ? '✕' : '≡'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="absolute top-14 left-0 right-0 flex flex-col z-50"
          style={{ background: '#1e293b' }}
        >
          <Link
            href="/diagnosticians"
            className="px-6 py-4 text-slate-300 text-sm font-medium border-b border-white/5"
            onClick={() => setMenuOpen(false)}
          >
            Browse All
          </Link>
          <a
            href="#"
            className="px-6 py-4 text-slate-300 text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Get Listed →
          </a>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/SiteNav.tsx
git commit -m "feat: add SiteNav component with mobile hamburger menu"
```

---

### Task 2: Create `SiteFooter` component

**Files:**
- Create: `components/SiteFooter.tsx`

- [ ] **Step 1: Create `components/SiteFooter.tsx`**

```tsx
export function SiteFooter() {
  return (
    <footer
      className="px-8 py-10 mt-[60px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div>
        <p className="text-white font-extrabold text-sm">✦ SharpKid</p>
        <p className="text-slate-500 text-xs mt-1">
          © {new Date().getFullYear()} SharpKid · Serving Texas, New Mexico &amp; Louisiana
        </p>
      </div>
      <div className="flex gap-5">
        <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Privacy</a>
        <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Terms</a>
        <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Contact</a>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/SiteFooter.tsx
git commit -m "feat: add SiteFooter component"
```

---

### Task 3: Create `app/(public)/` route group and move public pages

The route group adds SiteNav + SiteFooter to all public pages without touching `/admin/**`. Route groups are transparent to the router — URLs don't change.

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/page.tsx` (moved from `app/page.tsx`)
- Create: `app/(public)/diagnosticians/page.tsx` (moved from `app/diagnosticians/page.tsx`)
- Create: `app/(public)/diagnosticians/[slug]/page.tsx` (moved from `app/diagnosticians/[slug]/page.tsx`)
- Delete: `app/page.tsx`, `app/diagnosticians/page.tsx`, `app/diagnosticians/[slug]/page.tsx`

- [ ] **Step 1: Create `app/(public)/layout.tsx`**

```tsx
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}
```

- [ ] **Step 2: Copy `app/page.tsx` → `app/(public)/page.tsx`**

Copy the file verbatim. The hero redesign happens in Task 5.

- [ ] **Step 3: Copy `app/diagnosticians/page.tsx` → `app/(public)/diagnosticians/page.tsx`**

Copy verbatim. Minor restyle in Task 8.

- [ ] **Step 4: Copy `app/diagnosticians/[slug]/page.tsx` → `app/(public)/diagnosticians/[slug]/page.tsx`**

Copy verbatim. Layout update in Task 11.

- [ ] **Step 5: Delete original files**

```bash
rm app/page.tsx
rm -rf app/diagnosticians
```

`rm -rf app/diagnosticians` is safe — all files in it were already copied to `app/(public)/diagnosticians/` in steps 3–4.

- [ ] **Step 6: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: introduce (public) route group — public pages now wrapped by SiteNav and SiteFooter"
```

---

## Chunk 2: Homepage Hero

### Task 4: Create `HeroSearchBar` client component

This is the only client component in the hero. The homepage itself remains a server component.

**Files:**
- Create: `components/HeroSearchBar.tsx`

- [ ] **Step 1: Create `components/HeroSearchBar.tsx`**

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Specialty } from '@/types'

interface Props {
  specialtiesOptions: Specialty[]
}

export function HeroSearchBar({ specialtiesOptions }: Props) {
  const router = useRouter()
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (specialty) params.set('specialty', specialty)
    if (location) params.set('state', location)
    router.push(`/diagnosticians?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row max-w-[520px] mx-auto rounded-xl p-1.5 gap-1 sm:gap-0"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2.5 text-white"
        style={{ color: specialty ? 'white' : '#94a3b8' }}
        aria-label="Filter by specialty"
      >
        <option value="" style={{ background: '#1e293b', color: 'white' }}>All Specialties</option>
        {specialtiesOptions.map((s) => (
          <option key={s.id} value={s.slug} style={{ background: '#1e293b', color: 'white' }}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="hidden sm:block w-px my-2" style={{ background: 'rgba(255,255,255,0.1)' }} />

      <input
        type="text"
        placeholder="City or state…"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2.5 placeholder-slate-500 text-white"
        aria-label="Filter by city or state"
      />

      <button
        type="submit"
        className="text-white text-sm font-bold px-5 py-2.5 rounded-lg shrink-0"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        Search →
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/HeroSearchBar.tsx
git commit -m "feat: add HeroSearchBar client component"
```

---

### Task 5: Rewrite homepage with hero section

**Files:**
- Modify: `app/(public)/page.tsx`

Replace the entire file. Data fetching logic is unchanged — only the JSX is rewritten.

- [ ] **Step 1: Replace `app/(public)/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'
import { HeroSearchBar } from '@/components/HeroSearchBar'
import type { Diagnostician } from '@/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>
}) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase
    .from('specialties_lookup')
    .select('*')
    .order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty
    ? [searchParams.specialty]
    : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  let diagnosticians: Diagnostician[] = []
  let total = 0
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const json = await res.json()
      diagnosticians = json.data ?? []
      total = json.total ?? 0
    }
  } catch {
    // fetch failed — show empty directory rather than crashing
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 pt-[72px] pb-20 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        }}
      >
        {/* Radial glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />

        <div className="relative">
          {/* Eyebrow pill */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest rounded-full px-3.5 py-1.5 mb-6"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
            }}
          >
            ✦ Serving TX · NM · LA
          </span>

          {/* H1 */}
          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
            Find the right specialist
            <br />
            for{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #818cf8, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              your child
            </span>
          </h1>

          <p className="text-[17px] text-slate-400 max-w-[480px] mx-auto leading-relaxed mb-10">
            Connect with certified educational diagnosticians across Texas, New Mexico, and
            Louisiana — specialists in assessing your child&apos;s unique learning needs.
          </p>

          {/* Search bar — client component */}
          <HeroSearchBar specialtiesOptions={specialtiesOptions ?? []} />

          {/* Stats row */}
          <div className="flex justify-center gap-10 mt-11 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">40+</p>
              <p className="text-[11px] tracking-wider text-slate-500 mt-0.5">Specialists</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">12</p>
              <p className="text-[11px] tracking-wider text-slate-500 mt-0.5">Specialties</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">3 States</p>
              <p className="text-[11px] tracking-wider text-slate-500 mt-0.5">TX · NM · LA</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Directory section ─────────────────────────────────────────────── */}
      {/* No <h1> here — the hero H1 serves that role */}
      <div className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DirectoryPageClient
            diagnosticians={diagnosticians}
            total={total}
            page={page}
            specialtiesOptions={specialtiesOptions ?? []}
          />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/page.tsx"
git commit -m "feat: redesign homepage with dark hero, search bar, and stats row"
```

---

## Chunk 3: Directory Components

### Task 6: Redesign `DiagnosticianCard`

Full redesign — dark-header feature card style. Props and data access are unchanged.

**Files:**
- Modify: `components/directory/DiagnosticianCard.tsx`

- [ ] **Step 1: Replace `components/directory/DiagnosticianCard.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

interface Props {
  diagnostician: Diagnostician
}

export function DiagnosticianCard({ diagnostician: d }: Props) {
  const initial = d.name.charAt(0)
  const location = [d.city, d.state].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 transition-all hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:ring-indigo-200">
      {/* Dark header */}
      <div
        className="p-5 flex items-center gap-3.5"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        {d.photo_url ? (
          <Image
            src={d.photo_url}
            alt={d.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-extrabold text-white border-2 border-white/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initial}
          </div>
        )}
        <div>
          <p className="text-white font-bold text-base leading-tight">{d.name}</p>
          {location && <p className="text-indigo-300 text-xs mt-0.5">📍 {location}</p>}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 pb-5 flex flex-col gap-3">
        {d.specialties && d.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.specialties.slice(0, 3).map((s) => (
              <span
                key={s.id}
                className="bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold px-2.5 py-0.5"
              >
                {s.name}
              </span>
            ))}
            {d.specialties.length > 3 && (
              <span className="text-xs text-slate-400 self-center">
                +{d.specialties.length - 3} more
              </span>
            )}
          </div>
        )}
        {d.bio && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{d.bio}</p>
        )}
        <Link
          href={`/diagnosticians/${d.slug}`}
          aria-label={`View profile for ${d.name}`}
          className="block text-center text-white text-sm font-bold py-2.5 rounded-lg mt-auto"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          View Profile →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/directory/DiagnosticianCard.tsx
git commit -m "feat: redesign DiagnosticianCard with dark-header feature card style"
```

---

### Task 7: Restyle `FilterBar`

Same props, same logic — only classNames change. Replace `bg-primary` with `bg-indigo-600`. Add "Filter:" label prefix. Reshape state dropdown and specialty buttons as pill chips.

**Files:**
- Modify: `components/directory/FilterBar.tsx`

- [ ] **Step 1: Replace `components/directory/FilterBar.tsx`**

```tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { Specialty } from '@/types'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

interface Props {
  specialtiesOptions: Specialty[]
  view: 'grid' | 'map'
  onViewChange: (view: 'grid' | 'map') => void
}

export function FilterBar({ specialtiesOptions, view, onViewChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | string[] | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(key)
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v))
      } else if (value) {
        params.set(key, value)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const selectedSpecialties = searchParams.getAll('specialty')
  const selectedState = searchParams.get('state') ?? ''

  function toggleSpecialty(slug: string) {
    const next = selectedSpecialties.includes(slug)
      ? selectedSpecialties.filter((s) => s !== slug)
      : [...selectedSpecialties, slug]
    updateParam('specialty', next)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center mb-7">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mr-1">
        Filter:
      </span>

      {/* State dropdown — pill chip shape */}
      <select
        id="state-filter"
        value={selectedState}
        onChange={(e) => updateParam('state', e.target.value || null)}
        className="border-2 border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white"
        aria-label="Filter by state"
      >
        <option value="">All States</option>
        {US_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Specialty pill chips */}
      {specialtiesOptions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => toggleSpecialty(s.slug)}
          aria-pressed={selectedSpecialties.includes(s.slug)}
          className={`border-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            selectedSpecialties.includes(s.slug)
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {s.name}
        </button>
      ))}

      {/* Grid / Map view toggle */}
      <div className="ml-auto flex rounded-lg border border-slate-200 overflow-hidden">
        <button
          onClick={() => onViewChange('grid')}
          aria-pressed={view === 'grid'}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'grid'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => onViewChange('map')}
          aria-pressed={view === 'map'}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'map'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Map
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/directory/FilterBar.tsx
git commit -m "feat: restyle FilterBar with indigo pill chips and updated view toggle"
```

---

### Task 8: Restyle `DirectoryGrid` and update `/diagnosticians` page wrapper

Replace `bg-primary` pagination with indigo. Update the `/diagnosticians` page body background to `bg-slate-50`.

**Files:**
- Modify: `components/directory/DirectoryGrid.tsx`
- Modify: `app/(public)/diagnosticians/page.tsx`

- [ ] **Step 1: Replace `components/directory/DirectoryGrid.tsx`**

```tsx
import Link from 'next/link'
import { DiagnosticianCard } from './DiagnosticianCard'
import type { Diagnostician } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
  total: number
  page: number
  limit: number
  searchParamsString?: string
}

export function DirectoryGrid({
  diagnosticians,
  total,
  page,
  limit,
  searchParamsString = '',
}: Props) {
  const totalPages = Math.ceil(total / limit)

  function buildPageUrl(p: number): string {
    const params = new URLSearchParams(searchParamsString)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  if (!diagnosticians.length) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg">No diagnosticians found.</p>
        <p className="text-sm mt-2">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-slate-400 text-right mb-4">
        {total} result{total !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {diagnosticians.map((d) => (
          <DiagnosticianCard key={d.id} diagnostician={d} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildPageUrl(p)}
              className={`px-3 py-1.5 rounded text-sm font-semibold ${
                p === page
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `app/(public)/diagnosticians/page.tsx`**

Update only the outer wrapper div — data fetching and component props are unchanged:

Change:
```tsx
<div className="min-h-screen bg-surface">
  <div className="max-w-6xl mx-auto px-4 py-8 space-y-2">
    <h1 className="text-2xl font-bold text-primary">All Diagnosticians</h1>
```

To:
```tsx
<div className="min-h-screen bg-slate-50">
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold text-slate-800 mb-6">All Diagnosticians</h1>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/directory/DirectoryGrid.tsx "app/(public)/diagnosticians/page.tsx"
git commit -m "feat: restyle DirectoryGrid pagination with indigo and update diagnosticians page"
```

---

## Chunk 4: Profile and Form Components

### Task 9: Redesign `ProfileDetail`

Add a dark gradient header band (matching DiagnosticianCard header) at the top of the component. The header contains the avatar (80×80), name, location, and specialty tags. Move contact info above service area. The component now manages its own internal padding — the outer card wrapper in the listing page (Task 11) removes its own padding.

**Files:**
- Modify: `components/listing/ProfileDetail.tsx`

- [ ] **Step 1: Replace `components/listing/ProfileDetail.tsx`**

```tsx
import Image from 'next/image'
import type { Diagnostician } from '@/types'

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

interface Props {
  diagnostician: Diagnostician
}

export function ProfileDetail({ diagnostician: d }: Props) {
  const location = [d.city, d.state].filter(Boolean).join(', ')
  const initial = d.name.charAt(0)

  return (
    <>
      {/* Dark header band */}
      <div
        className="p-6 flex items-start gap-4"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        {d.photo_url ? (
          <Image
            src={d.photo_url}
            alt={d.name}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-3xl font-extrabold text-white border-2 border-white/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initial}
          </div>
        )}
        <div className="pt-1">
          <h1 className="text-xl font-bold text-white">{d.name}</h1>
          {location && (
            <p className="text-indigo-300 text-sm mt-0.5">📍 {location}</p>
          )}
          {d.specialties && d.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {d.specialties.map((s) => (
                <span
                  key={s.id}
                  className="bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold px-2.5 py-0.5 border border-indigo-500/30"
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* White body */}
      <div className="p-8 space-y-6">
        {/* 1. Bio */}
        {d.bio && (
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-2">About</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{d.bio}</p>
          </section>
        )}

        {/* 2. Contact — moved up, pill-style links */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Contact Information</h2>
          <div className="flex flex-wrap gap-2">
            {d.phone && (
              <a
                href={`tel:${d.phone}`}
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                📞 {d.phone}
              </a>
            )}
            {d.email && (
              <a
                href={`mailto:${d.email}`}
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                ✉️ {d.email}
              </a>
            )}
            {isSafeUrl(d.website) && (
              <a
                href={d.website!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                🌐 {d.website}
              </a>
            )}
          </div>
        </section>

        {/* 3. Service area */}
        {d.service_area && (
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-2">Service Area</h2>
            <p className="text-slate-500 text-sm">{d.service_area}</p>
          </section>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/listing/ProfileDetail.tsx
git commit -m "feat: redesign ProfileDetail with dark header band and reordered sections"
```

---

### Task 10: Restyle `LeadForm`

Style updates only — all logic, validation, and submission code is unchanged. Change input borders to slate-200, focus rings to indigo, submit button to gradient, success state to indigo-tinted card.

**Files:**
- Modify: `components/listing/LeadForm.tsx`

- [ ] **Step 1: Replace `components/listing/LeadForm.tsx`**

```tsx
'use client'
import { useState } from 'react'

interface Props {
  diagnosticianId: string
  diagnosticianName: string
}

const AGE_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 3)

export function LeadForm({ diagnosticianId, diagnosticianName }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'ratelimited'>(
    'idle'
  )
  const [form, setForm] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    child_age: '',
    child_school: '',
    child_concerns: '',
    message: '',
    _hp: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        child_age: Number(form.child_age),
        diagnostician_id: diagnosticianId,
        diagnostician_name: diagnosticianName,
      }),
    })
    if (res.ok) {
      setStatus('success')
    } else if (res.status === 429) {
      setStatus('ratelimited')
    } else {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-semibold text-indigo-700">Your inquiry has been sent!</p>
        <p className="text-sm text-slate-500 mt-1">You&apos;ll be contacted soon.</p>
      </div>
    )
  }

  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="_hp"
        value={form._hp}
        onChange={(e) => set('_hp', e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
        aria-hidden="true"
      />

      <div>
        <label htmlFor="parent_name" className={labelCls}>Your Name *</label>
        <input
          id="parent_name"
          className={inputCls}
          value={form.parent_name}
          onChange={(e) => set('parent_name', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="parent_email" className={labelCls}>Email *</label>
        <input
          id="parent_email"
          type="email"
          className={inputCls}
          value={form.parent_email}
          onChange={(e) => set('parent_email', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="parent_phone" className={labelCls}>Phone *</label>
        <input
          id="parent_phone"
          type="tel"
          className={inputCls}
          value={form.parent_phone}
          onChange={(e) => set('parent_phone', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="child_age" className={labelCls}>Child&apos;s Age *</label>
        <select
          id="child_age"
          className={inputCls}
          value={form.child_age}
          onChange={(e) => set('child_age', e.target.value)}
          required
        >
          <option value="">Select age</option>
          {AGE_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="child_school" className={labelCls}>Child&apos;s Current School</label>
        <input
          id="child_school"
          className={inputCls}
          value={form.child_school}
          onChange={(e) => set('child_school', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="child_concerns" className={labelCls}>Child&apos;s Concerns *</label>
        <textarea
          id="child_concerns"
          className={inputCls}
          rows={3}
          value={form.child_concerns}
          onChange={(e) => set('child_concerns', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="message" className={labelCls}>Additional Notes</label>
        <textarea
          id="message"
          className={inputCls}
          rows={2}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-xs">Something went wrong. Please try again.</p>
      )}
      {status === 'ratelimited' && (
        <p className="text-yellow-700 text-xs">Too many submissions. Please wait before trying again.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/listing/LeadForm.tsx
git commit -m "feat: restyle LeadForm with indigo focus rings, gradient submit, and indigo success state"
```

---

### Task 11: Update listing detail page layout

Update card wrappers to match the spec: `rounded-2xl overflow-hidden` on the profile panel (so ProfileDetail's dark header band bleeds to the card edges), `rounded-2xl` on the form panel, `bg-slate-50` page background, `text-indigo-700` form heading.

**Files:**
- Modify: `app/(public)/diagnosticians/[slug]/page.tsx`

- [ ] **Step 1: Replace `app/(public)/diagnosticians/[slug]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileDetail } from '@/components/listing/ProfileDetail'
import { LeadForm } from '@/components/listing/LeadForm'

export default async function ListingPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: d } = await supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`)
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!d) notFound()

  const diagnostician = {
    ...d,
    specialties: d.specialties?.map((s: any) => s.specialty) ?? [],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile panel — overflow-hidden so dark header band fills to edges */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <ProfileDetail diagnostician={diagnostician} />
            </div>
          </div>

          {/* Lead form panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-indigo-700 mb-4">
                Request a Consultation
              </h2>
              <LeadForm
                diagnosticianId={diagnostician.id}
                diagnosticianName={diagnostician.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/diagnosticians/[slug]/page.tsx"
git commit -m "feat: update listing detail page layout — rounded-2xl overflow-hidden profile panel, indigo form heading"
```

---

## Chunk 5: Final Verification

### Task 12: TypeScript check and visual smoke test

Confirm zero TypeScript errors and visually verify all public pages against the approved mockup (`docs/superpowers/specs/2026-03-25-frontend-redesign.md`).

**Files:** no changes

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 2: Start dev server and verify each route**

```bash
npm run dev
```

Check the following routes at `http://localhost:3000`:

| Route | What to verify |
|---|---|
| `/` | Dark hero, eyebrow pill, gradient H1, search bar, stats row, card grid below |
| `/diagnosticians` | Dark nav, dark-header cards, indigo pill chips in FilterBar, indigo active pagination |
| `/diagnosticians/[slug]` | Dark header band on profile, contact pills, indigo form heading, gradient submit button |
| `/admin` | Admin panel is visually **unchanged** — no SiteNav, no SiteFooter, navy sidebar intact |
| Mobile (375px) | Hamburger appears, dropdown opens on click, hero stacks, single-column grid |

- [ ] **Step 3: Verify admin isolation**

Navigate to `/admin` and confirm:
- SiteNav is absent
- SiteFooter is absent
- `bg-primary` navy sidebar is intact (unchanged)
- No indigo styles appear

- [ ] **Step 4: Final commit (if any fixes were needed)**

If any TypeScript or visual issues were found and fixed in steps 1–3:

```bash
git add -A
git commit -m "fix: address visual and TypeScript issues from smoke test"
```

If no issues, no commit needed.
