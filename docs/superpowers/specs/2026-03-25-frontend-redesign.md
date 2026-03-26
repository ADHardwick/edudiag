# Frontend Redesign — Design Spec
Date: 2026-03-25

## Overview

Redesign the public-facing frontend of the SharpKid educational diagnosticians directory. The admin panel is out of scope. The goal is to transform a basic, flat UI into a polished, modern product that builds trust with parents searching for specialists in Texas, New Mexico, and Louisiana.

## Design Direction

**Style:** Modern & Bold
**Color scheme:** Deep navy/indigo hero with light body content
**Cards:** Dark-header feature cards (gradient banner with avatar + name, light body below)
**Typography:** System sans-serif (Inter), bold weights for headings
**Accent:** Indigo-to-violet gradient (`#6366f1` → `#8b5cf6`)

## Route Group Architecture

To add a persistent `SiteNav` and `SiteFooter` to all public pages without affecting the admin panel, we introduce a Next.js App Router route group:

```
app/
  (public)/            ← new route group (no URL segment)
    layout.tsx         ← renders SiteNav + {children} + SiteFooter
    page.tsx           ← homepage (moved from app/page.tsx)
    diagnosticians/
      page.tsx         ← directory (moved from app/diagnosticians/page.tsx)
      [slug]/
        page.tsx       ← listing detail (moved from app/diagnosticians/[slug]/page.tsx)
  admin/               ← unchanged, not wrapped by (public)/layout.tsx
    layout.tsx
    ...
  layout.tsx           ← root layout, unchanged (no nav/footer added here)
```

The existing `app/page.tsx`, `app/diagnosticians/page.tsx`, and `app/diagnosticians/[slug]/page.tsx` are moved into `app/(public)/`. No URL changes result from this — route groups are transparent to the router.

## Pages & Components in Scope

1. `app/(public)/layout.tsx` — new public layout with `SiteNav` + `SiteFooter`
2. `components/SiteNav.tsx` — new sticky dark navbar
3. `components/SiteFooter.tsx` — new dark footer
4. `app/(public)/page.tsx` — homepage with hero + directory grid
5. `app/(public)/diagnosticians/page.tsx` — directory listing page
6. `app/(public)/diagnosticians/[slug]/page.tsx` — listing detail page
7. `components/directory/DiagnosticianCard.tsx` — card redesign
8. `components/directory/FilterBar.tsx` — filter chip restyling
9. `components/directory/DirectoryGrid.tsx` — grid + pagination restyling
10. `components/listing/ProfileDetail.tsx` — profile page redesign
11. `components/listing/LeadForm.tsx` — form styling only

**Out of scope:** `components/directory/MapView.tsx`, all admin components and pages, all API routes, all data fetching logic.

## Tailwind Config

Do NOT change the `primary` token (`#1e3a5f`). The admin sidebar uses `bg-primary` and changing it would break the admin UI. All new public components use explicit indigo/slate/navy hex values or Tailwind's built-in `indigo-*` and `slate-*` palette classes rather than the `primary` token.

## `SiteNav` Component (`components/SiteNav.tsx`)

A client component (needs state for mobile menu).

**Desktop:**
- Sticky, `z-50`, background `#0f172a`, bottom border `rgba(255,255,255,0.08)`
- Height: 56px, horizontal padding: 32px
- Left: logo mark (28×28 rounded-lg with indigo-violet gradient, "S" initial) + "SharpKid" wordmark in white
- Right: "Browse All" link → `/diagnosticians`, then a single gradient "Get Listed →" CTA button (no-op `href="#"` for now). Only these two items — no duplicate "List Your Practice" text link.

**Mobile (< md breakpoint):**
- Logo stays left
- Hamburger icon button right (`≡` / `✕` toggle)
- When open: links stack vertically in a dark dropdown panel below the nav bar (no animation required, simple show/hide with `useState`)
- Mobile menu background: `#1e293b`

## `SiteFooter` Component (`components/SiteFooter.tsx`)

A server component.

- Background `#0f172a`, top border `rgba(255,255,255,0.06)`, padding 40px 32px, margin-top 60px
- Left: "✦ SharpKid" wordmark + `© {new Date().getFullYear()} SharpKid · Serving Texas, New Mexico & Louisiana`
- Right: Privacy, Terms, Contact links (plain `<a>` no-op hrefs for now), slate-500 color

## Homepage (`app/(public)/page.tsx`)

The homepage shows the **hero section followed immediately by the directory grid** — same data as today, no change to fetching. It is not split into a separate landing page.

### Hero Section
- Background: `linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)` with a radial indigo glow overlay (`rgba(99,102,241,0.25)`)
- Eyebrow pill: `"✦ Serving TX · NM · LA"` — indigo-tinted badge (`bg-indigo-500/15 border border-indigo-500/30 text-indigo-300`)
- H1: `"Find the right specialist for your child"` — white, font-black, `"your child"` in indigo-violet gradient text
- Subtext: `"Connect with certified educational diagnosticians across Texas, New Mexico, and Louisiana — specialists in assessing your child's unique learning needs."`
- **Search bar:** frosted glass pill (`bg-white/6 border border-white/12 rounded-xl p-1.5`) containing:
  - Specialty `<select>` (all options from `specialties_lookup`)
  - Divider
  - City/state text input
  - Gradient "Search →" `<button>` — on submit, navigates to `/diagnosticians?specialty=...&state=...`
  - Implemented as a dedicated `'use client'` component `components/HeroSearchBar.tsx`. The hero wrapper and `app/(public)/page.tsx` remain server components — only `HeroSearchBar` is a client component, imported into the hero markup.
- **Stats row:** `40+ Specialists | 12 Specialties | 3 States TX · NM · LA` with `rgba(255,255,255,0.08)` vertical dividers

### Directory Section (below hero)
- Light slate background `bg-slate-50`, `max-w-6xl mx-auto px-4 py-8`
- Renders `FilterBar` and `DirectoryGrid` (same as today, restyled)
- The standalone `<h1>All Diagnosticians</h1>` that currently appears on `/diagnosticians` is **omitted on the homepage** — the hero H1 serves that role. The `/diagnosticians` page retains its own heading.
- Data fetching is unchanged — the homepage fetches and renders page 1 of results exactly as it does today.

## Directory Listing Page (`app/(public)/diagnosticians/page.tsx`)

Same page content as today. Restyled body only — no changes to data fetching or component props.

## `FilterBar` Component

Restyled — same props and behavior, new visual treatment:

- Filter label: small uppercase slate-500 "Filter:" prefix
- Specialty buttons → pill chips: `bg-white border-2 border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600`
- Active chip: `bg-indigo-600 border-indigo-600 text-white`
- State dropdown: same pill shape, consistent with specialty chips
- Results count: right-aligned, `text-sm text-slate-400`
- **Grid/Map view toggle buttons:** replace `bg-primary` with `bg-indigo-600` for the active state; inactive state stays `bg-white text-slate-500`

## `DirectoryGrid` Component

Restyled grid + pagination:

- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`
- Pagination controls: replace `bg-primary` with `bg-indigo-600 hover:bg-indigo-700` for active page; inactive pages: white with slate border

## `DiagnosticianCard` Component

Full redesign with dark-header feature card style:

**Card container:** `bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:ring-indigo-200 transition-all`

**Card header** (`bg-gradient-to-br from-[#0f172a] to-[#1e1b4b]`, `p-5`):
- Avatar: 48×48 circle, `border-2 border-white/20`
  - If `photo_url`: `<Image>` with `object-cover`
  - If no photo: gradient background (`from-indigo-500 to-violet-500`) with initial letter in white
- Name: `text-white font-bold text-base`
- Location: `text-indigo-300 text-xs mt-0.5`

**Card body** (`p-4 pb-5`):
- Specialty tags: `bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold px-2.5 py-0.5`, max 3 shown + "+N more"
- Bio: 2-line clamp, `text-slate-500 text-sm leading-relaxed mb-4`
- CTA button: full-width, `bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg py-2.5 text-sm font-bold text-center`

## Listing Detail Page (`app/(public)/diagnosticians/[slug]/page.tsx`)

Keep 2/3 + 1/3 grid layout, restyled panels.

**Profile panel** (`lg:col-span-2`):
- White card, `rounded-2xl overflow-hidden`
- Dark header band at top: same gradient as card header, larger avatar (80×80), name (xl, white, bold), location (indigo-300), specialty tags (indigo pill badges)
- White body below: bio section, contact links (phone, email, website as styled anchor links with icons), service area

**Lead form panel** (`lg:col-span-1`):
- White card, `rounded-2xl`, sticky `top-6`
- "Request a Consultation" heading in indigo-700
- Input focus rings: `focus:ring-2 focus:ring-indigo-500`
- Submit button: `bg-gradient-to-r from-indigo-500 to-violet-500` full-width
- Success state: keep existing `✅` emoji but wrap in an indigo-tinted card (`bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center`)
- Error states: unchanged behavior, existing red styling is fine

## `ProfileDetail` Component

Add dark header band (same gradient as `DiagnosticianCard` header) containing the large avatar, name, location, and specialty tags. Specialties move to the header — they are removed from the white body.

White body order (intentional change from current implementation):
1. Bio section with a section heading
2. Contact section: phone, email, website as pill-style anchor links — **moved up** from the bottom so it is prominent
3. Service area: displayed below contact

## `LeadForm` Component

Style updates only — no logic, validation, or submission changes:
- Input/textarea: `rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`
- Submit button: `bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-lg py-2.5`
- Success state wrapper: `bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center`

## Responsive Behavior

| Breakpoint | Nav | Hero | Grid |
|---|---|---|---|
| mobile (<md) | Hamburger menu | Stacked search bar, smaller type | 1 column |
| tablet (md) | Full links | Full hero | 2 columns |
| desktop (lg+) | Full links | Full hero | 3 columns |

Profile detail page stacks to single column on mobile (form below profile).

## Success Criteria

- All public pages (`/`, `/diagnosticians`, `/diagnosticians/[slug]`) match the approved mockup
- Admin panel (`/admin/**`) is visually unchanged — no nav/footer appears, no color changes
- No TypeScript errors
- No existing functionality broken (filters, pagination, lead form submission, map view)
- Mobile layout works at 375px width
