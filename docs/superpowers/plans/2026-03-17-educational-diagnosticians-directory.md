# Educational Diagnosticians Directory — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack directory website where parents find educational diagnosticians by location/specialty, submit lead inquiries, and admins manage all listings and leads.

**Architecture:** Next.js 14 App Router handles both frontend and API routes in a single project. Supabase provides PostgreSQL, authentication (single admin), and file storage for photos. Resend delivers lead notification emails, Google Maps renders the map view, and Upstash Redis enforces rate limiting. Deployed on Vercel.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (DB + Auth + Storage), Resend + React Email, Google Maps JavaScript API + Geocoding API, Upstash Redis (`@upstash/ratelimit`), Vitest + React Testing Library, Vercel

---

## File Map

Every file this plan creates or modifies, with its single responsibility:

```
/
├── app/
│   ├── globals.css                              # CSS custom properties (color tokens, font)
│   ├── layout.tsx                               # Root layout: Inter font, metadata
│   ├── page.tsx                                 # Homepage: hero + FilterBar + DirectoryGrid
│   ├── diagnosticians/
│   │   └── [slug]/
│   │       └── page.tsx                         # Listing page: ProfileDetail + LeadForm
│   ├── admin/
│   │   ├── layout.tsx                           # Admin shell: sidebar + session guard
│   │   ├── login/
│   │   │   └── page.tsx                         # Email/password login form
│   │   ├── page.tsx                             # Dashboard: stats + recent leads
│   │   ├── diagnosticians/
│   │   │   ├── page.tsx                         # Diagnosticians list (DiagnosticianTable)
│   │   │   ├── new/
│   │   │   │   └── page.tsx                     # Create form wrapper
│   │   │   └── [id]/
│   │   │       └── page.tsx                     # Edit form wrapper
│   │   └── leads/
│   │       ├── page.tsx                         # Leads list (LeadsTable)
│   │       └── [id]/
│   │           └── page.tsx                     # Lead detail view
│   └── api/
│       ├── diagnosticians/
│       │   └── route.ts                         # GET /api/diagnosticians (public, filtered)
│       ├── leads/
│       │   └── route.ts                         # POST /api/leads (submit lead)
│       └── admin/
│           ├── diagnosticians/
│           │   ├── route.ts                     # GET + POST /api/admin/diagnosticians
│           │   └── [id]/
│           │       └── route.ts                 # GET + PATCH + DELETE /api/admin/diagnosticians/[id]
│           └── upload-photo/
│               └── route.ts                     # POST /api/admin/upload-photo
├── components/
│   ├── directory/
│   │   ├── DiagnosticianCard.tsx               # Card: photo, name, city/state, tags, CTA
│   │   ├── DirectoryGrid.tsx                   # Renders grid of DiagnosticianCards + pagination
│   │   ├── FilterBar.tsx                       # State dropdown, specialty multi-select, view toggle
│   │   ├── DirectoryPageClient.tsx             # Client wrapper: manages view state, composes FilterBar + Grid/Map
│   │   └── MapView.tsx                         # Google Maps: markers, info windows, filter sync
│   ├── listing/
│   │   ├── ProfileDetail.tsx                   # Full diagnostician profile display
│   │   └── LeadForm.tsx                        # Lead form: fields, honeypot, submission, success state
│   └── admin/
│       ├── AdminSidebar.tsx                    # Left nav: links to diagnosticians, leads, dashboard
│       ├── DiagnosticianTable.tsx              # Admin listings table: sort, published toggle, actions
│       ├── DiagnosticianForm.tsx               # Create/edit form: all fields, photo upload
│       ├── EmailRecipientsInput.tsx            # Add/remove additional email recipients widget
│       ├── LeadsTable.tsx                      # Admin leads table: filter by diagnostician
│       └── StatCard.tsx                        # Dashboard stat display card
├── lib/
│   ├── supabase/
│   │   ├── client.ts                           # Browser Supabase client (singleton)
│   │   └── server.ts                           # Server Supabase client (reads cookies)
│   ├── slug.ts                                 # generateSlug(name, takenSlugs) → unique slug
│   ├── geocoding.ts                            # geocode(city, state, zip) → {lat, lng} | null
│   ├── email.ts                                # sendLeadEmails(recipients[], lead, diagName)
│   └── rate-limit.ts                           # Upstash Ratelimit instance factory
├── emails/
│   └── LeadNotification.tsx                    # React Email template for lead notifications
├── types/
│   └── index.ts                                # Shared TS types: Diagnostician, Lead, Specialty
├── middleware.ts                               # Protect /admin/* — redirect to /admin/login if no session
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql              # All tables + moddatetime trigger + specialty seed data
```

---

## Chunk 1: Project Bootstrap

**Files:**
- Create: `package.json` (via scaffold)
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `types/index.ts`
- Create: `.env.local` (env var template only — values filled manually)

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/austinhardwick/silo/plugin-test
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
```

Accept all defaults. When prompted "Would you like to use Turbopack?", select **No** (Turbopack has occasional issues with some Supabase SSR packages).

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  @upstash/ratelimit @upstash/redis \
  resend @react-email/components react-email \
  @react-google-maps/api \
  slugify
```

```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  vite-tsconfig-paths
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Set up CSS custom properties**

Replace `app/globals.css` content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #ffffff;
  --color-surface: #f8f9fa;
  --color-primary: #1e3a5f;
  --color-accent: #2a9d8f;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}
```

- [ ] **Step 5: Update Tailwind config to expose tokens**

In `tailwind.config.ts`, extend colors:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './emails/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        accent: '#2a9d8f',
        surface: '#f8f9fa',
        'text-primary': '#1a1a2e',
        'text-secondary': '#6b7280',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Set up root layout with Inter font**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Find an Educational Diagnostician',
  description: 'Connect with qualified educational diagnosticians near you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-text-primary`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Create shared TypeScript types**

Create `types/index.ts`:

```typescript
export interface Specialty {
  id: string
  name: string
  slug: string
}

export interface Diagnostician {
  id: string
  name: string
  slug: string
  photo_url: string | null
  bio: string | null
  city: string | null
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
  service_area: string | null
  phone: string | null
  email: string | null
  website: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  specialties?: Specialty[]
  email_recipients?: string[]
}

export interface Lead {
  id: string
  diagnostician_id: string | null
  diagnostician_name: string
  parent_name: string
  parent_email: string
  parent_phone: string
  child_age: number
  child_school: string | null
  child_concerns: string
  message: string | null
  created_at: string
}

export interface LeadFormData {
  diagnostician_id: string
  diagnostician_name: string
  parent_name: string
  parent_email: string
  parent_phone: string
  child_age: number
  child_school?: string
  child_concerns: string
  message?: string
  _hp: string
}
```

- [ ] **Step 8: Create env template**

Create `.env.local` (commit this as `.env.example` with blank values — do not commit `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_GEOCODING_API_KEY=

# Resend
RESEND_API_KEY=
ADMIN_DEFAULT_EMAIL=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App URL (http://localhost:3000 for dev, production URL for prod)
NEXT_PUBLIC_APP_URL=
```

Add `.env.local` to `.gitignore` (already there by default with create-next-app).

Create `.env.example` with the same keys but empty values and commit it.

- [ ] **Step 9: Delete boilerplate**

Remove `app/page.tsx` placeholder content, `public/` SVGs from Next.js scaffold.

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000` with no errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js project with dependencies and design tokens"
```

---

## Chunk 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Prerequisites:** Create a Supabase project at [supabase.com](https://supabase.com). Copy the project URL and keys into `.env.local`.

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable moddatetime extension for updated_at trigger
-- Install into public schema so it is universally accessible without search_path issues
create extension if not exists moddatetime;

-- specialties_lookup (seed data included below)
create table specialties_lookup (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

-- diagnosticians
create table diagnosticians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  photo_url text,
  bio text,
  city text,
  state text,
  zip text,
  lat float,
  lng float,
  service_area text,
  phone text,
  email text,
  website text,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- moddatetime trigger: keeps updated_at current on every UPDATE
create trigger handle_updated_at
  before update on diagnosticians
  for each row
  execute procedure moddatetime(updated_at);

-- diagnostician_specialties join table
create table diagnostician_specialties (
  diagnostician_id uuid references diagnosticians(id) on delete cascade,
  specialty_id uuid references specialties_lookup(id) on delete cascade,
  primary key (diagnostician_id, specialty_id)
);

-- leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  diagnostician_id uuid references diagnosticians(id) on delete set null,
  diagnostician_name text not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  child_age smallint not null check (child_age between 3 and 21),
  child_school text,
  child_concerns text not null,
  message text,
  created_at timestamptz default now()
);

-- listing_email_recipients
create table listing_email_recipients (
  id uuid primary key default gen_random_uuid(),
  diagnostician_id uuid references diagnosticians(id) on delete cascade,
  email text not null
);

-- Row Level Security
-- Enable RLS on all tables; service role key bypasses RLS automatically.
-- Anon key (used by public API routes) must only access what the policies allow.

alter table diagnosticians enable row level security;
alter table specialties_lookup enable row level security;
alter table diagnostician_specialties enable row level security;
alter table leads enable row level security;
alter table listing_email_recipients enable row level security;

-- Public read-only access for published diagnosticians and related data
create policy "public can read published diagnosticians"
  on diagnosticians for select
  using (is_published = true);

create policy "public can read specialties_lookup"
  on specialties_lookup for select
  using (true);

create policy "public can read diagnostician_specialties"
  on diagnostician_specialties for select
  using (true);

-- leads: public can insert only (no read — leads are admin-only via service role)
create policy "public can insert leads"
  on leads for insert
  with check (true);

-- listing_email_recipients: no public access (admin-only via service role)
-- (no policy needed — RLS enabled with no policy = deny all for anon/authenticated)

-- Seed specialties
insert into specialties_lookup (name, slug) values
  ('ADHD', 'adhd'),
  ('Dyslexia', 'dyslexia'),
  ('Dysgraphia', 'dysgraphia'),
  ('Dyscalculia', 'dyscalculia'),
  ('Autism Spectrum', 'autism-spectrum'),
  ('Learning Disabilities', 'learning-disabilities'),
  ('Intellectual Disabilities', 'intellectual-disabilities'),
  ('Gifted Assessment', 'gifted-assessment'),
  ('Speech & Language', 'speech-language'),
  ('Emotional & Behavioral', 'emotional-behavioral'),
  ('Bilingual Assessment', 'bilingual-assessment'),
  ('Early Childhood', 'early-childhood');
```

- [ ] **Step 2: Run migration in Supabase SQL editor**

Go to Supabase Dashboard → SQL Editor → paste and run `001_initial_schema.sql`.

Verify: All 5 tables appear in Table Editor. `specialties_lookup` has 12 rows.

Then verify the `updated_at` trigger works by running in the SQL editor:

```sql
-- Insert a test row
insert into diagnosticians (name, slug) values ('Trigger Test', 'trigger-test');

-- Wait 1 second, then update it
update diagnosticians set bio = 'test' where slug = 'trigger-test';

-- Confirm updated_at changed
select created_at, updated_at from diagnosticians where slug = 'trigger-test';
-- updated_at should be LATER than created_at

-- Clean up
delete from diagnosticians where slug = 'trigger-test';
```

Expected: `updated_at > created_at` confirms the trigger is working.

- [ ] **Step 3: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → New bucket:
- Name: `diagnostician-photos`
- Public: **ON**
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/
git commit -m "feat: add initial database schema and specialty seed data"
```

---

## Chunk 3: Core Library Utilities

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/slug.ts`
- Create: `lib/geocoding.ts`
- Create: `lib/email.ts`
- Create: `lib/rate-limit.ts`
- Create: `emails/LeadNotification.tsx`
- Create: `__tests__/lib/slug.test.ts`
- Create: `__tests__/lib/geocoding.test.ts`
- Create: `__tests__/lib/email.test.ts`

### 3a — Supabase clients

- [ ] **Step 1: Write browser Supabase client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write server Supabase client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

`createServiceClient()` is used in admin API routes that need to bypass Row Level Security.

### 3b — Slug generation (TDD)

- [ ] **Step 3: Write failing slug tests**

Create `__tests__/lib/slug.test.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — expect failure**

```bash
npm test __tests__/lib/slug.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/slug'`

- [ ] **Step 5: Implement slug generation**

Create `lib/slug.ts`:

```typescript
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
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npm test __tests__/lib/slug.test.ts
```

Expected: PASS (5 tests)

### 3c — Geocoding (TDD)

- [ ] **Step 7: Write failing geocoding tests**

Create `__tests__/lib/geocoding.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { geocode } from '@/lib/geocoding'

describe('geocode', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('returns lat/lng on success', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 30.2672, lng: -97.7431 } } }],
      }),
    })
    const result = await geocode('Austin', 'TX', '78701')
    expect(result).toEqual({ lat: 30.2672, lng: -97.7431 })
  })

  it('returns null when status is not OK', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    })
    const result = await geocode('Nowhere', 'XX', '00000')
    expect(result).toBeNull()
  })

  it('returns null on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const result = await geocode('Austin', 'TX', '78701')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 8: Run tests — expect failure**

```bash
npm test __tests__/lib/geocoding.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/geocoding'`

- [ ] **Step 9: Implement geocoding**

Create `lib/geocoding.ts`:

```typescript
export async function geocode(
  city: string,
  state: string,
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const address = encodeURIComponent(`${city}, ${state} ${zip}`)
  const key = process.env.GOOGLE_GEOCODING_API_KEY!
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${key}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results.length) return null
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  } catch {
    return null
  }
}
```

- [ ] **Step 10: Run tests — expect pass**

```bash
npm test __tests__/lib/geocoding.test.ts
```

Expected: PASS (3 tests)

### 3d — Email utility

- [ ] **Step 11: Create React Email template**

Create `emails/LeadNotification.tsx`:

```typescript
import {
  Html, Head, Body, Container, Heading, Text, Hr, Link, Section
} from '@react-email/components'

interface LeadNotificationProps {
  diagnosticianName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  childAge: number
  childSchool?: string
  childConcerns: string
  message?: string
  adminLeadUrl: string
}

export function LeadNotification({
  diagnosticianName, parentName, parentEmail, parentPhone,
  childAge, childSchool, childConcerns, message, adminLeadUrl,
}: LeadNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f8f9fa' }}>
        <Container style={{ background: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px', margin: '40px auto' }}>
          <Heading style={{ color: '#1e3a5f', fontSize: '20px', marginBottom: '8px' }}>
            New Inquiry for {diagnosticianName}
          </Heading>
          <Hr />
          <Section>
            <Text><strong>Parent/Guardian:</strong> {parentName}</Text>
            <Text><strong>Email:</strong> {parentEmail}</Text>
            <Text><strong>Phone:</strong> {parentPhone}</Text>
            <Text><strong>Child's Age:</strong> {childAge}</Text>
            {childSchool && <Text><strong>Child's School:</strong> {childSchool}</Text>}
            <Text><strong>Concerns:</strong> {childConcerns}</Text>
            {message && <Text><strong>Message:</strong> {message}</Text>}
          </Section>
          <Hr />
          <Link href={adminLeadUrl} style={{ color: '#1e3a5f' }}>View in admin panel</Link>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 12: Create email sender utility**

Create `lib/email.ts`:

```typescript
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { LeadNotification } from '@/emails/LeadNotification'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface LeadEmailPayload {
  diagnosticianName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  childAge: number
  childSchool?: string
  childConcerns: string
  message?: string
  leadId: string
}

export async function sendLeadEmails(recipients: string[], payload: LeadEmailPayload) {
  const adminLeadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${payload.leadId}`
  // `render()` is async in @react-email/render v3+; must be awaited
  const html = await render(LeadNotification({ ...payload, adminLeadUrl }))

  const sends = recipients.map((to) =>
    resend.emails.send({
      from: 'Directory <noreply@yourdomain.com>',
      to,
      subject: `New Inquiry for ${payload.diagnosticianName}`,
      html,
    })
  )

  await Promise.allSettled(sends)
}
```

Note: Replace `noreply@yourdomain.com` with a Resend-verified sender domain. `NEXT_PUBLIC_APP_URL` is already in the env template from Chunk 1 Step 8.

**Naming convention note:** `LeadEmailPayload` uses camelCase (matching React/JS conventions for function arguments). The API route in Chunk 8 will map from the snake_case form body to this camelCase payload explicitly — this is intentional and documented here so the handoff is clear.

### 3e — Email tests

- [ ] **Step 13: Write failing email tests**

Add `__tests__/lib/email.test.ts` to the **Files** list for Chunk 3, then create it:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend before importing email module
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock-id' }) },
  })),
}))

// Mock @react-email/render
vi.mock('@react-email/render', () => ({
  render: vi.fn().mockResolvedValue('<html>mock email</html>'),
}))

import { sendLeadEmails } from '@/lib/email'
import { Resend } from 'resend'

describe('sendLeadEmails', () => {
  const payload = {
    diagnosticianName: 'Jane Smith',
    parentName: 'John Parent',
    parentEmail: 'parent@test.com',
    parentPhone: '555-1234',
    childAge: 8,
    childConcerns: 'Reading difficulties',
    leadId: 'lead-abc',
  }

  beforeEach(() => { vi.clearAllMocks() })

  it('sends one email per recipient', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'id' })
    ;(Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }))

    await sendLeadEmails(['admin@test.com', 'extra@test.com'], payload)
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('uses the correct email subject', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'id' })
    ;(Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }))

    await sendLeadEmails(['admin@test.com'], payload)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'New Inquiry for Jane Smith' })
    )
  })

  it('does not throw if a send fails', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('Resend error'))
    ;(Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }))

    await expect(sendLeadEmails(['admin@test.com'], payload)).resolves.not.toThrow()
  })
})
```

- [ ] **Step 14: Run email tests — expect failure**

```bash
npm test __tests__/lib/email.test.ts
```

Expected: FAIL — module not found or mock issues

- [ ] **Step 15: Run email tests after implementation — expect pass**

(Run after Step 12 above is complete.)

```bash
npm test __tests__/lib/email.test.ts
```

Expected: PASS (3 tests)

### 3g — Rate limiter

- [ ] **Step 16: Create rate limiter**

Create `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

export function getRateLimiter(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: false,
    })
  }
  return ratelimit
}
```

- [ ] **Step 17: Run all lib tests**

```bash
npm test
```

Expected: PASS (11 tests across 3 files: slug ×5, geocoding ×3, email ×3)

- [ ] **Step 18: Commit**

```bash
git add -A
git commit -m "feat: add core library utilities (supabase, slug, geocoding, email, rate-limit)"
```

---

## Chunk 4: Admin Authentication

**Files:**
- Create: `middleware.ts`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/layout.tsx`
- Create: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create middleware to protect admin routes**

Create `middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAdminApiPath = pathname.startsWith('/api/admin')
  const isAdminPagePath = pathname.startsWith('/admin')
  const isLoginPath = pathname === '/admin/login'

  // API routes: return 401 JSON (not a redirect — clients aren't browsers)
  if (isAdminApiPath && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Page routes: redirect to login
  if (isAdminPagePath && !isLoginPath && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Already logged in? Redirect away from login page
  if (isLoginPath && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  // Match bare /admin AND all sub-paths AND all /api/admin/* routes
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
```

- [ ] **Step 2: Create admin sidebar**

Create `components/admin/AdminSidebar.tsx`:

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/diagnosticians', label: 'Diagnosticians' },
  { href: '/admin/leads', label: 'Leads' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-primary text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <span className="font-semibold text-sm tracking-wide uppercase">Admin Panel</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === href ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm rounded-md hover:bg-white/10 text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create admin layout**

Create `app/admin/layout.tsx`:

```typescript
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Create admin login page**

Create `app/admin/login/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Invalid email or password.')
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-primary mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create admin account in Supabase**

In Supabase Dashboard → Authentication → Users → Invite user (or "Add user"):
- Enter your admin email and a strong password.
- This is the only admin account for V1.

- [ ] **Step 6: Verify auth flow**

```bash
npm run dev
```

1. Navigate to `http://localhost:3000/admin` — should redirect to `/admin/login`
2. Log in with admin credentials — should redirect to `/admin`
3. Click "Sign out" — should redirect to `/admin/login`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add admin authentication, middleware, and sidebar layout"
```

---

## Chunk 5: Admin Diagnosticians CRUD API

**Files:**
- Create: `app/api/admin/diagnosticians/route.ts`
- Create: `app/api/admin/diagnosticians/[id]/route.ts`
- Create: `app/api/admin/upload-photo/route.ts`

All admin API routes use `createServiceClient()` to bypass Row Level Security.

- [ ] **Step 1: Create GET + POST /api/admin/diagnosticians**

Create `app/api/admin/diagnosticians/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/slug'
import { geocode } from '@/lib/geocoding'

// GET /api/admin/diagnosticians?page=1&limit=20&search=jane
export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 20)))
  const search = searchParams.get('search') ?? ''
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`, { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count ?? 0, page, limit })
}

// POST /api/admin/diagnosticians
export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { specialties, emailRecipients, ...fields } = body

  // Validate required fields
  if (!fields.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Generate unique slug
  const { data: existing } = await supabase.from('diagnosticians').select('slug')
  const takenSlugs = (existing ?? []).map((d: { slug: string }) => d.slug)
  const slug = generateSlug(fields.name, takenSlugs)

  // Geocode on create (unconditional)
  let lat: number | null = null
  let lng: number | null = null
  let geocodeWarning = false
  if (fields.city || fields.state || fields.zip) {
    const coords = await geocode(fields.city ?? '', fields.state ?? '', fields.zip ?? '')
    if (coords) { lat = coords.lat; lng = coords.lng }
    else { geocodeWarning = true }
  }

  // Insert diagnostician
  const { data: diag, error } = await supabase
    .from('diagnosticians')
    .insert({ ...fields, slug, lat, lng })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert specialties
  if (specialties?.length) {
    await supabase.from('diagnostician_specialties').insert(
      specialties.map((id: string) => ({ diagnostician_id: diag.id, specialty_id: id }))
    )
  }

  // Insert email recipients
  if (emailRecipients?.length) {
    await supabase.from('listing_email_recipients').insert(
      emailRecipients.map((email: string) => ({ diagnostician_id: diag.id, email }))
    )
  }

  return NextResponse.json({ data: diag, geocodeWarning }, { status: 201 })
}
```

- [ ] **Step 2: Create GET + PATCH + DELETE /api/admin/diagnosticians/[id]**

Create `app/api/admin/diagnosticians/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { geocode } from '@/lib/geocoding'

// Next.js 14.2+ requires params to be awaited. Use Promise<{id}> signature for forward-compatibility.
type Params = { params: Promise<{ id: string }> }

// GET /api/admin/diagnosticians/[id]
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('diagnosticians')
    .select(`
      *,
      specialties:diagnostician_specialties(specialty:specialties_lookup(*)),
      email_recipients:listing_email_recipients(email)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/admin/diagnosticians/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServiceClient()
  const body = await request.json()
  const { specialties, emailRecipients, ...fields } = body

  // Fetch current record to determine if geocoding is needed
  const { data: current } = await supabase
    .from('diagnosticians')
    .select('city, state, zip')
    .eq('id', id)
    .single()

  let geocodeWarning = false
  // Only geocode if the request actually includes location fields AND they differ from current values
  const locationChanged =
    ('city' in fields || 'state' in fields || 'zip' in fields) &&
    (fields.city !== current?.city || fields.state !== current?.state || fields.zip !== current?.zip)

  if (locationChanged && (fields.city || fields.state || fields.zip)) {
    const coords = await geocode(fields.city ?? '', fields.state ?? '', fields.zip ?? '')
    if (coords) { fields.lat = coords.lat; fields.lng = coords.lng }
    else { fields.lat = null; fields.lng = null; geocodeWarning = true }
  }

  // Update diagnostician
  const { data: diag, error } = await supabase
    .from('diagnosticians')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace specialties
  if (specialties !== undefined) {
    await supabase.from('diagnostician_specialties').delete().eq('diagnostician_id', id)
    if (specialties.length) {
      await supabase.from('diagnostician_specialties').insert(
        specialties.map((specialtyId: string) => ({ diagnostician_id: id, specialty_id: specialtyId }))
      )
    }
  }

  // Replace email recipients
  if (emailRecipients !== undefined) {
    await supabase.from('listing_email_recipients').delete().eq('diagnostician_id', id)
    if (emailRecipients.length) {
      await supabase.from('listing_email_recipients').insert(
        emailRecipients.map((email: string) => ({ diagnostician_id: id, email }))
      )
    }
  }

  return NextResponse.json({ data: diag, geocodeWarning })
}

// DELETE /api/admin/diagnosticians/[id]
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServiceClient()

  // Fetch photo URL before deleting (for Storage cleanup)
  const { data: diag } = await supabase
    .from('diagnosticians')
    .select('photo_url')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('diagnosticians')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort photo cleanup from Storage
  if (diag?.photo_url) {
    const path = diag.photo_url.split('/diagnostician-photos/')[1]
    if (path) {
      await supabase.storage.from('diagnostician-photos').remove([path])
    }
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create photo upload route**

Create `app/api/admin/upload-photo/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const oldUrl = formData.get('oldUrl') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Delete old file if replacing
  if (oldUrl) {
    const oldPath = oldUrl.split('/diagnostician-photos/')[1]
    if (oldPath) {
      await supabase.storage.from('diagnostician-photos').remove([oldPath])
    }
  }

  const ext = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('diagnostician-photos')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('diagnostician-photos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
```

- [ ] **Step 4: Smoke test with curl**

Start dev server, then log in via the browser at `http://localhost:3000/admin/login`. The API routes are protected by middleware — unauthenticated requests return `401`. To test via curl, use the Supabase dashboard to call the API directly, or use the admin UI smoke test in Chunk 6 instead.

To verify the auth protection is working:

```bash
# Should return 401 — not authenticated
curl -X POST http://localhost:3000/api/admin/diagnosticians \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

Expected: `{"error":"Unauthorized"}` with status `401`. If you see `201`, the middleware is not running correctly — check the matcher config.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin diagnosticians CRUD API routes"
```

---

## Chunk 6: Admin Diagnosticians UI

**Files:**
- Create: `components/admin/DiagnosticianTable.tsx`
- Create: `components/admin/DiagnosticianForm.tsx`
- Create: `components/admin/EmailRecipientsInput.tsx`
- Create: `app/admin/diagnosticians/page.tsx`
- Create: `app/admin/diagnosticians/new/page.tsx`
- Create: `app/admin/diagnosticians/[id]/page.tsx`

Note: `components/admin/StatCard.tsx` is created in Chunk 10 (Admin Leads & Dashboard) alongside the dashboard page that uses it.

- [ ] **Step 1: Create EmailRecipientsInput component**

Create `components/admin/EmailRecipientsInput.tsx`:

```typescript
'use client'
import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (emails: string[]) => void
}

export function EmailRecipientsInput({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  function add() {
    const email = input.trim().toLowerCase()
    if (!email || !email.includes('@') || value.includes(email)) return
    onChange([...value, email])
    setInput('')
  }

  function remove(email: string) {
    onChange(value.filter((e) => e !== email))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="recipient@email.com"
          className="flex-1 border border-border rounded-md px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((email) => (
            <li key={email} className="flex items-center justify-between bg-surface rounded px-3 py-1 text-sm">
              <span>{email}</span>
              <button
                type="button"
                onClick={() => remove(email)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create DiagnosticianForm component**

Create `components/admin/DiagnosticianForm.tsx`:

```typescript
'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { EmailRecipientsInput } from './EmailRecipientsInput'
import type { Diagnostician, Specialty } from '@/types'

interface Props {
  diagnostician?: Partial<Diagnostician>
  specialtiesOptions: Specialty[]
}

export function DiagnosticianForm({ diagnostician, specialtiesOptions }: Props) {
  const router = useRouter()
  const isEdit = !!diagnostician?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geocodeWarning, setGeocodeWarning] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(diagnostician?.photo_url ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: diagnostician?.name ?? '',
    bio: diagnostician?.bio ?? '',
    city: diagnostician?.city ?? '',
    state: diagnostician?.state ?? '',
    zip: diagnostician?.zip ?? '',
    service_area: diagnostician?.service_area ?? '',
    phone: diagnostician?.phone ?? '',
    email: diagnostician?.email ?? '',
    website: diagnostician?.website ?? '',
    is_published: diagnostician?.is_published ?? false,
    photo_url: diagnostician?.photo_url ?? '',
    specialties: diagnostician?.specialties?.map((s) => s.id) ?? [],
    emailRecipients: diagnostician?.email_recipients ?? [],
  })

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function uploadPhoto(): Promise<string | null> {
    const file = fileRef.current?.files?.[0]
    if (!file) return null
    const fd = new FormData()
    fd.append('file', file)
    if (form.photo_url) fd.append('oldUrl', form.photo_url)
    const res = await fetch('/api/admin/upload-photo', { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = await res.json()
    return url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setGeocodeWarning(false)

    let photo_url = form.photo_url
    if (fileRef.current?.files?.[0]) {
      const url = await uploadPhoto()
      if (url) photo_url = url
    }

    const payload = { ...form, photo_url, specialties: form.specialties, emailRecipients: form.emailRecipients }
    const url = isEdit
      ? `/api/admin/diagnosticians/${diagnostician!.id}`
      : '/api/admin/diagnosticians'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
      return
    }

    if (json.geocodeWarning) setGeocodeWarning(true)
    else router.push('/admin/diagnosticians')

    if (json.geocodeWarning) {
      setTimeout(() => router.push('/admin/diagnosticians'), 2500)
    }
  }

  const inputCls = 'w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
  const labelCls = 'block text-sm font-medium text-text-secondary mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">{error}</div>}
      {geocodeWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-4 py-3 text-sm">
          Address could not be geocoded. Listing saved but will not appear on the map.
        </div>
      )}

      {/* Basic info */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea className={inputCls} rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Photo</label>
            {photoPreview && <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-2" />}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setPhotoPreview(URL.createObjectURL(f))
              }}
            />
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Specialties</h2>
        <div className="grid grid-cols-2 gap-2">
          {specialtiesOptions.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.specialties.includes(s.id)}
                onChange={(e) => {
                  set('specialties', e.target.checked
                    ? [...form.specialties, s.id]
                    : form.specialties.filter((id: string) => id !== s.id)
                  )
                }}
              />
              {s.name}
            </label>
          ))}
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Location</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>City</label>
            <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input className={inputCls} maxLength={2} placeholder="TX" value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>ZIP</label>
            <input className={inputCls} value={form.zip} onChange={(e) => set('zip', e.target.value)} />
          </div>
          <div className="col-span-3">
            <label className={labelCls}>Service Area</label>
            <input className={inputCls} placeholder="e.g. Greater Austin area, Travis County" value={form.service_area} onChange={(e) => set('service_area', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input className={inputCls} type="url" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Lead email recipients */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-1">Additional Lead Recipients</h2>
        <p className="text-xs text-text-secondary mb-3">
          The default admin email always receives leads. Add extra addresses here.
        </p>
        <EmailRecipientsInput
          value={form.emailRecipients}
          onChange={(emails) => set('emailRecipients', emails)}
        />
      </section>

      {/* Published */}
      <section>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm font-medium">Published (visible on public directory)</span>
        </label>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/diagnosticians')}
          className="px-6 py-2 border border-border rounded-md text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create DiagnosticianTable component**

Create `components/admin/DiagnosticianTable.tsx`:

```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Diagnostician } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
}

export function DiagnosticianTable({ diagnosticians: initial }: Props) {
  const [items, setItems] = useState(initial)
  const router = useRouter()

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/diagnosticians/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((d) => d.id !== id))
  }

  async function togglePublished(id: string, current: boolean) {
    await fetch(`/api/admin/diagnosticians/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !current }),
    })
    setItems((prev) => prev.map((d) => d.id === id ? { ...d, is_published: !current } : d))
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-text-secondary">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Location</th>
            <th className="text-left px-4 py-3 font-medium">Specialties</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((d) => (
            <tr key={d.id} className="hover:bg-surface/50">
              <td className="px-4 py-3 font-medium text-text-primary">{d.name}</td>
              <td className="px-4 py-3 text-text-secondary">{[d.city, d.state].filter(Boolean).join(', ')}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {d.specialties?.slice(0, 2).map((s) => (
                    <span key={s.id} className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">{s.name}</span>
                  ))}
                  {(d.specialties?.length ?? 0) > 2 && (
                    <span className="text-xs text-text-secondary">+{(d.specialties?.length ?? 0) - 2}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => togglePublished(d.id, d.is_published)}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    d.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {d.is_published ? 'Published' : 'Draft'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/admin/diagnosticians/${d.id}`} className="text-primary hover:underline text-xs">Edit</Link>
                  <button onClick={() => handleDelete(d.id, d.name)} className="text-red-500 hover:underline text-xs">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No diagnosticians yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create admin diagnosticians list page**

Create `app/admin/diagnosticians/page.tsx`:

```typescript
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianTable } from '@/components/admin/DiagnosticianTable'

export default async function AdminDiagnosticiansPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`)
    .order('name')

  const diagnosticians = (data ?? []).map((d: any) => ({
    ...d,
    specialties: d.specialties?.map((s: any) => s.specialty) ?? [],
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-primary">Diagnosticians</h1>
        <Link
          href="/admin/diagnosticians/new"
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + New Listing
        </Link>
      </div>
      <DiagnosticianTable diagnosticians={diagnosticians} />
    </div>
  )
}
```

- [ ] **Step 5: Create new diagnostician page**

Create `app/admin/diagnosticians/new/page.tsx`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianForm } from '@/components/admin/DiagnosticianForm'

export default async function NewDiagnosticianPage() {
  const supabase = createServiceClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">New Listing</h1>
      <DiagnosticianForm specialtiesOptions={specialtiesOptions ?? []} />
    </div>
  )
}
```

- [ ] **Step 6: Create edit diagnostician page**

Create `app/admin/diagnosticians/[id]/page.tsx`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianForm } from '@/components/admin/DiagnosticianForm'
import { notFound } from 'next/navigation'

export default async function EditDiagnosticianPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const [{ data: diag }, { data: specialtiesOptions }] = await Promise.all([
    supabase
      .from('diagnosticians')
      .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*)), email_recipients:listing_email_recipients(email)`)
      .eq('id', params.id)
      .single(),
    supabase.from('specialties_lookup').select('*').order('name'),
  ])

  if (!diag) notFound()

  const diagnostician = {
    ...diag,
    specialties: diag.specialties?.map((s: any) => s.specialty) ?? [],
    email_recipients: diag.email_recipients?.map((r: any) => r.email) ?? [],
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Edit: {diag.name}</h1>
      <DiagnosticianForm diagnostician={diagnostician} specialtiesOptions={specialtiesOptions ?? []} />
    </div>
  )
}
```

- [ ] **Step 7: Manual smoke test**

```bash
npm run dev
```

1. Go to `/admin/diagnosticians` — table renders
2. Click "+ New Listing" — form renders
3. Fill in Name, City, State, ZIP, pick specialties, click "Create Listing"
4. Verify redirect back to list, new entry visible
5. Click "Edit" on entry, change bio, save
6. Click "Delete" — confirm dialog → removed from table

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add admin diagnosticians UI (table, create/edit form, photo upload)"
```

---

## Chunk 7: Public Directory (API + Pages)

**Files:**
- Create: `app/api/diagnosticians/route.ts`
- Create: `components/directory/DiagnosticianCard.tsx`
- Create: `components/directory/DirectoryGrid.tsx`
- Create: `components/directory/FilterBar.tsx`
- Create: `components/directory/DirectoryPageClient.tsx`
- Create: `app/page.tsx`
- Create: `app/diagnosticians/page.tsx`
- Create: `app/diagnosticians/[slug]/page.tsx`
- Create: `components/listing/ProfileDetail.tsx`

- [ ] **Step 1: Create public diagnosticians API**

Create `app/api/diagnosticians/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const state = searchParams.get('state')
  const city = searchParams.get('city')
  const specialties = searchParams.getAll('specialty')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 12)))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`, { count: 'exact' })
    .eq('is_published', true)
    .order('name')
    .range(from, to)

  if (state) query = query.eq('state', state.toUpperCase())
  if (city) query = query.ilike('city', `%${city}%`)

  // Specialty OR filter: match any of the selected specialty slugs
  if (specialties.length) {
    const { data: matchedSpecialties } = await supabase
      .from('specialties_lookup')
      .select('id')
      .in('slug', specialties)
    const specialtyIds = (matchedSpecialties ?? []).map((s: { id: string }) => s.id)
    if (specialtyIds.length) {
      const { data: matchedDiags } = await supabase
        .from('diagnostician_specialties')
        .select('diagnostician_id')
        .in('specialty_id', specialtyIds)
      const ids = [...new Set((matchedDiags ?? []).map((r: { diagnostician_id: string }) => r.diagnostician_id))]
      if (ids.length) query = query.in('id', ids)
      else return NextResponse.json({ data: [], total: 0, page, limit })
    }
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const diagnosticians = (data ?? []).map((d: any) => ({
    ...d,
    specialties: d.specialties?.map((s: any) => s.specialty) ?? [],
  }))

  return NextResponse.json({ data: diagnosticians, total: count ?? 0, page, limit })
}
```

- [ ] **Step 2: Create DiagnosticianCard component**

Create `components/directory/DiagnosticianCard.tsx`:

```typescript
import Image from 'next/image'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

interface Props {
  diagnostician: Diagnostician
}

export function DiagnosticianCard({ diagnostician: d }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {d.photo_url ? (
          <Image src={d.photo_url} alt={d.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-2xl text-text-secondary flex-shrink-0">
            {d.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-text-primary">{d.name}</h3>
          {(d.city || d.state) && (
            <p className="text-sm text-text-secondary">{[d.city, d.state].filter(Boolean).join(', ')}</p>
          )}
        </div>
      </div>
      {d.specialties && d.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {d.specialties.slice(0, 3).map((s) => (
            <span key={s.id} className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">{s.name}</span>
          ))}
          {d.specialties.length > 3 && (
            <span className="text-xs text-text-secondary self-center">+{d.specialties.length - 3} more</span>
          )}
        </div>
      )}
      {d.bio && <p className="text-sm text-text-secondary line-clamp-2">{d.bio}</p>}
      <Link
        href={`/diagnosticians/${d.slug}`}
        className="mt-auto inline-block text-center bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        View Profile
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Create DirectoryGrid component**

Create `components/directory/DirectoryGrid.tsx`:

```typescript
import Link from 'next/link'
import { DiagnosticianCard } from './DiagnosticianCard'
import type { Diagnostician } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
  total: number
  page: number
  limit: number
}

export function DirectoryGrid({ diagnosticians, total, page, limit }: Props) {
  const totalPages = Math.ceil(total / limit)

  if (!diagnosticians.length) {
    return (
      <div className="text-center py-16 text-text-secondary">
        <p className="text-lg">No diagnosticians found.</p>
        <p className="text-sm mt-2">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">{total} result{total !== 1 ? 's' : ''}</p>
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
              href={`?page=${p}`}
              className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-border'}`}
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

- [ ] **Step 4: Create FilterBar component**

Create `components/directory/FilterBar.tsx`:

```typescript
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { Specialty } from '@/types'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
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

  const updateParam = useCallback((key: string, value: string | string[] | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v))
    } else if (value) {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const selectedSpecialties = searchParams.getAll('specialty')
  const selectedState = searchParams.get('state') ?? ''

  function toggleSpecialty(slug: string) {
    const next = selectedSpecialties.includes(slug)
      ? selectedSpecialties.filter((s) => s !== slug)
      : [...selectedSpecialties, slug]
    updateParam('specialty', next)
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap gap-4 items-end">
      {/* State filter */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">State</label>
        <select
          value={selectedState}
          onChange={(e) => updateParam('state', e.target.value || null)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Specialty filter */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Specialties</label>
        <div className="flex flex-wrap gap-1 max-w-lg">
          {specialtiesOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSpecialty(s.slug)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                selectedSpecialties.includes(s.slug)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="ml-auto">
        <label className="block text-xs font-medium text-text-secondary mb-1">View</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => onViewChange('grid')}
            className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-primary text-white' : 'bg-white text-text-secondary'}`}
          >
            Grid
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`px-3 py-2 text-sm ${view === 'map' ? 'bg-primary text-white' : 'bg-white text-text-secondary'}`}
          >
            Map
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create DirectoryPageClient component**

`FilterBar` and view state management require a Client Component. Create `components/directory/DirectoryPageClient.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { FilterBar } from './FilterBar'
import { DirectoryGrid } from './DirectoryGrid'
import type { Diagnostician, Specialty } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
  total: number
  page: number
  specialtiesOptions: Specialty[]
}

export function DirectoryPageClient({ diagnosticians, total, page, specialtiesOptions }: Props) {
  const [view, setView] = useState<'grid' | 'map'>('grid')

  return (
    <div className="space-y-6">
      <FilterBar specialtiesOptions={specialtiesOptions} view={view} onViewChange={setView} />
      {/* MapView wired in Chunk 9 — map toggle visible but non-functional until then */}
      <DirectoryGrid diagnosticians={diagnosticians} total={total} page={page} limit={12} />
    </div>
  )
}
```

> **Why a Client Component?** `FilterBar`'s `onViewChange` prop is a function. Next.js App Router cannot serialize functions as Server Component props — only Client Components may receive functions as props. Keeping `FilterBar`, `DirectoryGrid`, and `MapView` inside a single `'use client'` wrapper solves both issues cleanly.

- [ ] **Step 6: Create homepage**

Create `app/page.tsx`:

> **Note:** This page uses `NEXT_PUBLIC_APP_URL` for a server-side self-fetch. Ensure this env var is set in both `.env.local` (development) and the Vercel project settings (production) to avoid a runtime error on Vercel.

```typescript
import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty ? [searchParams.specialty] : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`, { cache: 'no-store' })
  const { data: diagnosticians = [], total = 0 } = await res.json()

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Find an Educational Diagnostician</h1>
        <p className="text-lg text-white/80 max-w-xl mx-auto">
          Connect with qualified professionals who specialize in assessing your child's learning needs.
        </p>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <DirectoryPageClient
          diagnosticians={diagnosticians}
          total={total}
          page={page}
          specialtiesOptions={specialtiesOptions ?? []}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create diagnosticians directory page**

Create `app/diagnosticians/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'

export default async function DiagnosticiansPage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty ? [searchParams.specialty] : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`, { cache: 'no-store' })
  const { data: diagnosticians = [], total = 0 } = await res.json()

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-2">
        <h1 className="text-2xl font-bold text-primary">All Diagnosticians</h1>
        <DirectoryPageClient
          diagnosticians={diagnosticians}
          total={total}
          page={page}
          specialtiesOptions={specialtiesOptions ?? []}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create ProfileDetail component**

Create `components/listing/ProfileDetail.tsx`:

```typescript
import Image from 'next/image'
import type { Diagnostician } from '@/types'

interface Props { diagnostician: Diagnostician }

export function ProfileDetail({ diagnostician: d }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        {d.photo_url ? (
          <Image src={d.photo_url} alt={d.name} width={96} height={96} className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center text-4xl text-text-secondary">
            {d.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-primary">{d.name}</h1>
          {(d.city || d.state) && <p className="text-text-secondary">{[d.city, d.state].filter(Boolean).join(', ')}</p>}
        </div>
      </div>

      {d.bio && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">About</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{d.bio}</p>
        </section>
      )}

      {d.specialties && d.specialties.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Specialties & Services</h2>
          <div className="flex flex-wrap gap-2">
            {d.specialties.map((s) => (
              <span key={s.id} className="bg-accent/10 text-accent text-sm px-3 py-1 rounded-full">{s.name}</span>
            ))}
          </div>
        </section>
      )}

      {d.service_area && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Service Area</h2>
          <p className="text-text-secondary text-sm">{d.service_area}</p>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Contact Information</h2>
        <div className="space-y-1 text-sm text-text-secondary">
          {d.phone && <p>📞 <a href={`tel:${d.phone}`} className="hover:text-primary">{d.phone}</a></p>}
          {d.email && <p>✉️ <a href={`mailto:${d.email}`} className="hover:text-primary">{d.email}</a></p>}
          {d.website && <p>🌐 <a href={d.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{d.website}</a></p>}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 9: Create listing page**

Create `app/diagnosticians/[slug]/page.tsx`:

```typescript
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
    <div className="min-h-screen bg-surface">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border p-8">
              <ProfileDetail diagnostician={diagnostician} />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-primary mb-4">Request a Consultation</h2>
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

- [ ] **Step 10: Verify directory pages**

1. Navigate to `http://localhost:3000` — hero + filter bar + grid renders
2. Navigate to `/diagnosticians` — same grid, no hero
3. Add a filter (`?state=TX`) — URL updates and grid filters
4. Click "View Profile" on a card — listing page renders

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add public directory API, homepage, listing pages, filter bar, and DirectoryPageClient"
```

---

## Chunk 8: Lead Form + Email Routing

**Files:**
- Create: `components/listing/LeadForm.tsx`
- Create: `app/api/leads/route.ts`

- [ ] **Step 1: Create LeadForm component**

Create `components/listing/LeadForm.tsx`:

```typescript
'use client'
import { useState } from 'react'

interface Props {
  diagnosticianId: string
  diagnosticianName: string
}

const AGE_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 3)

export function LeadForm({ diagnosticianId, diagnosticianName }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'ratelimited'>('idle')
  const [form, setForm] = useState({
    parent_name: '', parent_email: '', parent_phone: '',
    child_age: '', child_school: '', child_concerns: '', message: '', _hp: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // child_age is stored as a string in form state (select value); convert to number for the API
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
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-semibold text-primary">Your inquiry has been sent!</p>
        <p className="text-sm text-text-secondary mt-1">You'll be contacted soon.</p>
      </div>
    )
  }

  const inputCls = 'w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
  const labelCls = 'block text-xs font-medium text-text-secondary mb-1'

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
        <label className={labelCls}>Your Name *</label>
        <input className={inputCls} value={form.parent_name} onChange={(e) => set('parent_name', e.target.value)} required />
      </div>
      <div>
        <label className={labelCls}>Email *</label>
        <input type="email" className={inputCls} value={form.parent_email} onChange={(e) => set('parent_email', e.target.value)} required />
      </div>
      <div>
        <label className={labelCls}>Phone *</label>
        <input type="tel" className={inputCls} value={form.parent_phone} onChange={(e) => set('parent_phone', e.target.value)} required />
      </div>
      <div>
        <label className={labelCls}>Child's Age *</label>
        <select className={inputCls} value={form.child_age} onChange={(e) => set('child_age', e.target.value)} required>
          <option value="">Select age</option>
          {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Child's Current School</label>
        <input className={inputCls} value={form.child_school} onChange={(e) => set('child_school', e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Child's Concerns *</label>
        <textarea className={inputCls} rows={3} value={form.child_concerns} onChange={(e) => set('child_concerns', e.target.value)} required />
      </div>
      <div>
        <label className={labelCls}>Additional Notes</label>
        <textarea className={inputCls} rows={2} value={form.message} onChange={(e) => set('message', e.target.value)} />
      </div>

      {status === 'error' && <p className="text-red-600 text-xs">Something went wrong. Please try again.</p>}
      {status === 'ratelimited' && <p className="text-yellow-700 text-xs">Too many submissions. Please wait before trying again.</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-primary text-white rounded-md py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create leads API route**

Create `app/api/leads/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getRateLimiter } from '@/lib/rate-limit'
import { sendLeadEmails } from '@/lib/email'

export async function POST(request: NextRequest) {
  // Per spec: rate limit check (step 3) runs before honeypot check (step 4).
  // This intentionally consumes rate limit quota before reading the body so that
  // bots that don't set the honeypot are still throttled without parsing the body first.
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'anonymous'
  const limiter = getRateLimiter()
  const { success } = await limiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const body = await request.json()

  // Honeypot check — silently succeed without doing anything (no DB insert, no email)
  if (body._hp && body._hp !== '') {
    return NextResponse.json({ ok: true })
  }

  // Validate required fields
  const required = ['diagnostician_id', 'diagnostician_name', 'parent_name', 'parent_email', 'parent_phone', 'child_age', 'child_concerns']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  const childAge = Number(body.child_age)
  if (isNaN(childAge) || childAge < 3 || childAge > 21) {
    return NextResponse.json({ error: 'child_age must be between 3 and 21' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Insert lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      diagnostician_id: body.diagnostician_id,
      diagnostician_name: body.diagnostician_name,
      parent_name: body.parent_name,
      parent_email: body.parent_email,
      parent_phone: body.parent_phone,
      child_age: childAge,
      child_school: body.child_school ?? null,
      child_concerns: body.child_concerns,
      message: body.message ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch additional recipients for this diagnostician
  const { data: recipients } = await supabase
    .from('listing_email_recipients')
    .select('email')
    .eq('diagnostician_id', body.diagnostician_id)

  const allRecipients = [
    process.env.ADMIN_DEFAULT_EMAIL!,
    ...(recipients ?? []).map((r: { email: string }) => r.email),
  ].filter(Boolean)

  // Send emails (best effort — don't fail the request if email fails)
  try {
    await sendLeadEmails(allRecipients, {
      diagnosticianName: body.diagnostician_name,
      parentName: body.parent_name,
      parentEmail: body.parent_email,
      parentPhone: body.parent_phone,
      childAge,
      childSchool: body.child_school,
      childConcerns: body.child_concerns,
      message: body.message,
      leadId: lead.id,
    })
  } catch (err) {
    console.error('Lead email send failed (non-blocking):', err)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Verify end-to-end lead submission**

1. Navigate to any listing page
2. Fill in the lead form and submit
3. Check Supabase → `leads` table has a new row
4. Check your email inbox (`ADMIN_DEFAULT_EMAIL`) for the notification

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add lead form component and email routing API"
```

---

## Chunk 9: Map View

**Files:**
- Create: `components/directory/MapView.tsx`
- Modify: `components/directory/DirectoryPageClient.tsx` (add MapView to view toggle)
- Modify: `app/page.tsx` (complete replacement — identical, ensures MapView import resolves correctly)
- Modify: `app/diagnosticians/page.tsx` (complete replacement — identical, ensures MapView import resolves correctly)

- [ ] **Step 1: Create MapView component**

Create `components/directory/MapView.tsx`:

```typescript
'use client'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

// MARKER_ICON is defined inside the component (after isLoaded) because
// `new google.maps.Point()` requires the Maps API to be loaded first.
// A plain object cast `{ x, y } as google.maps.Point` is not a valid Point
// instance and will fail at runtime.

interface Props {
  diagnosticians: Diagnostician[]
}

export function MapView({ diagnosticians }: Props) {
  const [selected, setSelected] = useState<Diagnostician | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    if (!diagnosticians.length) return
    const bounds = new google.maps.LatLngBounds()
    diagnosticians.forEach((d) => {
      if (d.lat && d.lng) bounds.extend({ lat: d.lat, lng: d.lng })
    })
    map.fitBounds(bounds)
  }, [diagnosticians])

  const withCoords = diagnosticians.filter((d) => d.lat && d.lng)

  if (!isLoaded) return <div className="h-[500px] bg-surface rounded-xl flex items-center justify-center text-text-secondary">Loading map…</div>

  // Must be defined after isLoaded — google.maps.Point is only available once the API loads
  const markerIcon = {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: '#1e3a5f',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1,
    scale: 1.5,
    anchor: new google.maps.Point(12, 22),
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '500px' }}
        zoom={5}
        center={{ lat: 39.5, lng: -98.35 }}
        options={{ styles: MAP_STYLES, streetViewControl: false, mapTypeControl: false }}
        onLoad={onLoad}
      >
        {withCoords.map((d) => (
          <Marker
            key={d.id}
            position={{ lat: d.lat!, lng: d.lng! }}
            icon={markerIcon}
            onClick={() => setSelected(d)}
          />
        ))}
        {selected && selected.lat && selected.lng && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="p-1 max-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                {selected.photo_url && (
                  <Image src={selected.photo_url} alt={selected.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-sm text-primary">{selected.name}</p>
                  <p className="text-xs text-text-secondary">{[selected.city, selected.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
              {selected.specialties && selected.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selected.specialties.slice(0, 2).map((s) => (
                    <span key={s.id} className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{s.name}</span>
                  ))}
                </div>
              )}
              <Link href={`/diagnosticians/${selected.slug}`} className="text-xs text-primary font-medium hover:underline">
                View Profile →
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
```

- [ ] **Step 2: Add MapView to DirectoryPageClient and update page files**

Update `components/directory/DirectoryPageClient.tsx` to include `MapView`:

```typescript
'use client'
import { useState } from 'react'
import { FilterBar } from './FilterBar'
import { DirectoryGrid } from './DirectoryGrid'
import { MapView } from './MapView'
import type { Diagnostician, Specialty } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
  total: number
  page: number
  specialtiesOptions: Specialty[]
}

export function DirectoryPageClient({ diagnosticians, total, page, specialtiesOptions }: Props) {
  const [view, setView] = useState<'grid' | 'map'>('grid')

  return (
    <div className="space-y-6">
      <FilterBar specialtiesOptions={specialtiesOptions} view={view} onViewChange={setView} />
      {view === 'grid' ? (
        <DirectoryGrid diagnosticians={diagnosticians} total={total} page={page} limit={12} />
      ) : (
        <MapView diagnosticians={diagnosticians} />
      )}
    </div>
  )
}
```

Replace `app/diagnosticians/page.tsx` with the complete file (no changes to data fetching — only the import path resolves correctly now that `DirectoryPageClient` has `MapView`):

```typescript
import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'

export default async function DiagnosticiansPage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty ? [searchParams.specialty] : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`, { cache: 'no-store' })
  const { data: diagnosticians = [], total = 0 } = await res.json()

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-2">
        <h1 className="text-2xl font-bold text-primary">All Diagnosticians</h1>
        <DirectoryPageClient
          diagnosticians={diagnosticians}
          total={total}
          page={page}
          specialtiesOptions={specialtiesOptions ?? []}
        />
      </div>
    </div>
  )
}
```

Replace `app/page.tsx` with the complete file:

```typescript
import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty ? [searchParams.specialty] : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`, { cache: 'no-store' })
  const { data: diagnosticians = [], total = 0 } = await res.json()

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Find an Educational Diagnostician</h1>
        <p className="text-lg text-white/80 max-w-xl mx-auto">
          Connect with qualified professionals who specialize in assessing your child's learning needs.
        </p>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <DirectoryPageClient
          diagnosticians={diagnosticians}
          total={total}
          page={page}
          specialtiesOptions={specialtiesOptions ?? []}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify map view**

1. Navigate to `http://localhost:3000`
2. Click "Map" toggle — Google Maps renders with markers for diagnosticians that have lat/lng
3. Click a marker — info window opens showing name, city/state, up to 2 specialty tags, and a "View Profile →" link
4. Click "View Profile →" inside the info window — navigates to the listing page
5. Switch back to "Grid" toggle — DirectoryGrid reappears, filters are unchanged
6. Select a state from the State dropdown — URL updates (e.g., `?state=TX`), then switch to Map view and confirm only markers for that state are visible

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add map view with Google Maps markers and info windows"
```

---

## Chunk 10: Admin Leads & Dashboard

**Files:**
- Create: `components/admin/LeadsTable.tsx`
- Create: `components/admin/StatCard.tsx`
- Create: `app/admin/leads/page.tsx`
- Create: `app/admin/leads/[id]/page.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create StatCard component**

Create `components/admin/StatCard.tsx`:

```typescript
interface Props {
  label: string
  value: number | string
}

export function StatCard({ label, value }: Props) {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create LeadsTable component**

Create `components/admin/LeadsTable.tsx`:

```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Lead } from '@/types'

interface Props {
  leads: Lead[]
  diagnosticianOptions: { id: string; name: string }[]
}

export function LeadsTable({ leads, diagnosticianOptions }: Props) {
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? leads.filter((l) => l.diagnostician_id === filter || l.diagnostician_name.toLowerCase().includes(filter.toLowerCase()))
    : leads

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Filter by Diagnostician</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All Diagnosticians</option>
          {diagnosticianOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-text-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Parent</th>
              <th className="text-left px-4 py-3 font-medium">Diagnostician</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-surface/50">
                <td className="px-4 py-3 font-medium">{l.parent_name}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {l.diagnostician_name}
                  {!l.diagnostician_id && <span className="ml-1 text-xs text-gray-400">(deleted)</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{l.parent_email}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="text-primary hover:underline text-xs">View</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create leads list page**

Create `app/admin/leads/page.tsx`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { LeadsTable } from '@/components/admin/LeadsTable'

export default async function AdminLeadsPage() {
  const supabase = createServiceClient()
  const [{ data: leads }, { data: diagnosticians }] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('diagnosticians').select('id, name').order('name'),
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Leads</h1>
      <LeadsTable leads={leads ?? []} diagnosticianOptions={diagnosticians ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: Create lead detail page**

Create `app/admin/leads/[id]/page.tsx`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', params.id).single()
  if (!lead) notFound()

  const fields = [
    { label: 'Diagnostician', value: lead.diagnostician_name + (!lead.diagnostician_id ? ' (deleted)' : '') },
    { label: 'Parent/Guardian', value: lead.parent_name },
    { label: 'Email', value: lead.parent_email },
    { label: 'Phone', value: lead.parent_phone },
    { label: "Child's Age", value: lead.child_age },
    { label: "Child's School", value: lead.child_school ?? '—' },
    { label: 'Concerns', value: lead.child_concerns },
    { label: 'Message', value: lead.message ?? '—' },
    { label: 'Submitted', value: new Date(lead.created_at).toLocaleString() },
  ]

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/leads" className="text-text-secondary hover:text-primary text-sm">← Leads</Link>
        <h1 className="text-2xl font-semibold text-primary">Lead Detail</h1>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 max-w-xl">
        <dl className="space-y-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</dt>
              <dd className="mt-0.5 text-sm text-text-primary">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create admin dashboard**

Create `app/admin/page.tsx`:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/admin/StatCard'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalPublished },
    { count: totalLeads },
    { count: recentLeads },
    { data: latestLeads },
  ] = await Promise.all([
    supabase.from('diagnosticians').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('id, parent_name, diagnostician_name, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Published Listings" value={totalPublished ?? 0} />
        <StatCard label="Total Leads" value={totalLeads ?? 0} />
        <StatCard label="Leads (Last 30 Days)" value={recentLeads ?? 0} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Leads</h2>
          <Link href="/admin/leads" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {(latestLeads ?? []).map((l) => (
            <Link key={l.id} href={`/admin/leads/${l.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-text-primary">{l.parent_name}</p>
                <p className="text-xs text-text-secondary">for {l.diagnostician_name}</p>
              </div>
              <p className="text-xs text-text-secondary">{new Date(l.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
          {!(latestLeads ?? []).length && (
            <p className="px-4 py-6 text-sm text-text-secondary text-center">No leads yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Verify admin leads and dashboard**

1. Navigate to any listing page (`/diagnosticians/[slug]`), fill in the lead form, and submit
2. Navigate to `/admin/leads` — lead appears in table
3. Click "View" — detail page shows all fields, "(deleted)" indicator absent
4. Navigate to `/admin` — stats show 1 lead, recent leads list shows entry

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add admin leads management and dashboard with stats"
```

---

## Chunk 11: Final Polish & Deployment

**Files:**
- Create: `.env.example` (ensure committed)
- Modify: `README.md` (deployment checklist)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass. Fix any failing tests before proceeding.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. Fix any type errors before proceeding.

- [ ] **Step 3: Create Vercel project and configure environment variables**

In Vercel Dashboard → New Project → Import your git repo.

Add all environment variables from `.env.example` with production values:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_GEOCODING_API_KEY`
- `RESEND_API_KEY`, `ADMIN_DEFAULT_EMAIL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)

- [ ] **Step 4: Deploy**

```bash
git push origin main
```

Vercel auto-deploys on push. Monitor the Vercel dashboard for build status.

- [ ] **Step 5: Post-deployment verification checklist**

- [ ] Homepage loads and shows directory
- [ ] Filters update results
- [ ] Map view loads and shows markers
- [ ] Listing page loads with lead form
- [ ] Lead form submits → email received at `ADMIN_DEFAULT_EMAIL`
- [ ] Lead appears in `/admin/leads`
- [ ] Admin login works at `/admin/login`
- [ ] Create/edit/delete diagnostician works
- [ ] Published toggle works

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: finalize deployment configuration and env template"
```
