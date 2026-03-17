# Educational Diagnosticians Directory — Design Spec

**Date:** 2026-03-17
**Status:** Approved

---

## Overview

A directory website for Educational Diagnosticians that allows parents and guardians to find qualified professionals by location and specialty, view full profiles, and submit lead inquiries. An admin panel allows full management of listings and lead data.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password, single admin) |
| File Storage | Supabase Storage (diagnostician photos) |
| Email | Resend (React Email templates) |
| Map | Google Maps JavaScript API + Geocoding API |
| Deployment | Vercel |

---

## Database Schema

### `diagnosticians`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
slug          text UNIQUE NOT NULL
photo_url     text
bio           text
specialties   text[]
city          text
state         text
zip           text
lat           float
lng           float
service_area  text
phone         text
email         text
website       text
is_published  boolean DEFAULT false
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### `leads`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
diagnostician_id    uuid REFERENCES diagnosticians(id)
parent_name         text NOT NULL
parent_email        text NOT NULL
parent_phone        text NOT NULL
child_age           text NOT NULL
child_school        text
child_concerns      text NOT NULL
message             text
created_at          timestamptz DEFAULT now()
```

### `listing_email_recipients`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
diagnostician_id    uuid REFERENCES diagnosticians(id)
email               text NOT NULL
```

### `specialties_lookup`
```sql
id      uuid PRIMARY KEY DEFAULT gen_random_uuid()
name    text NOT NULL
slug    text UNIQUE NOT NULL
```

**Notes:**
- `lat`/`lng` populated server-side via Google Geocoding API on create/update
- `slug` auto-generated from name (URL-safe, unique)
- Default admin email stored in env var (`ADMIN_DEFAULT_EMAIL`), never in DB
- `specialties_lookup` is seeded manually; no UI in V1

---

## Pages & Routing

### Public Routes

| Route | Description |
|---|---|
| `/` | Homepage: hero, search bar, state/city + specialty filters, directory grid |
| `/diagnosticians` | Full directory (same filters, paginated) |
| `/diagnosticians/[slug]` | Individual listing: full profile + lead form |
| `/search?state=TX&specialty=adhd` | URL-driven filter results (shareable) |

### Admin Routes (protected)

| Route | Description |
|---|---|
| `/admin/login` | Admin login page |
| `/admin` | Dashboard: stats + recent leads |
| `/admin/diagnosticians` | Listings table (published/unpublished toggle) |
| `/admin/diagnosticians/new` | Create listing |
| `/admin/diagnosticians/[id]` | Edit listing |
| `/admin/leads` | All leads (filterable by diagnostician) |
| `/admin/leads/[id]` | Lead detail view |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/leads` | POST | Submit lead → save to DB → send emails via Resend |
| `/api/diagnosticians` | GET | Filtered/paginated results for directory |
| `/api/admin/diagnosticians` | POST | Create listing |
| `/api/admin/diagnosticians/[id]` | PATCH | Update listing |
| `/api/admin/upload-photo` | POST | Upload photo to Supabase Storage |

---

## Lead Form

### Fields

| Field | Type | Required |
|---|---|---|
| Parent/Guardian Name | text | Yes |
| Email Address | email | Yes |
| Phone Number | tel | Yes |
| Child's Age | number/select (3–21) | Yes |
| Child's Current School | text | No |
| Child's Concerns | textarea | Yes |
| Message / Additional Notes | textarea | No |

### Submission Flow

1. User submits form on `/diagnosticians/[slug]`
2. `POST /api/leads` validates fields server-side
3. Lead row inserted into `leads` table
4. Query `listing_email_recipients` for this diagnostician
5. Build recipient list: `[ADMIN_DEFAULT_EMAIL env var]` + any listing-specific emails
6. Send email via Resend to all recipients (individual sends to avoid CC exposure)
7. Email subject: `New Inquiry for [Diagnostician Name]`
8. Email body: all form fields + link to `/admin/leads/[id]`
9. Return 200 → show success message on page

### Spam Protection

- Honeypot hidden field (server-side check)
- Rate limit: 3 submissions per IP per hour (Next.js middleware)

### Email Recipient Management (Admin)

- Each listing edit page includes an "Additional Email Recipients" section
- Admin can add/remove email addresses per listing
- `ADMIN_DEFAULT_EMAIL` (env var) is always included at send time — not editable per listing

---

## Map View

- Toggle between **Grid View** and **Map View** on homepage and `/diagnosticians`
- Google Maps renders one marker per diagnostician with valid `lat`/`lng`
- Clicking a marker opens an info window: photo thumbnail, name, city/state, top specialties, "View Profile" link
- Filters apply to both grid and map simultaneously
- Geocoding runs server-side on listing create/update; coordinates stored in DB
- Listings without valid coordinates are excluded from map view, visible in grid
- Clean map style (Google Maps Light base or subtle custom theme)
- Custom markers in site primary color
- Mobile: map collapses to reduced height, markers remain tappable

---

## Admin Panel

### Authentication

- Supabase Auth (email/password), single admin account
- Next.js middleware protects all `/admin/*` routes
- Unauthenticated requests redirect to `/admin/login`
- No public-facing login link

### Diagnosticians Management

- **List view:** Sortable table — name, city/state, specialties, published status, edit/delete actions
- **Create/Edit form:**
  - All listing fields (name, photo, bio, specialties, location, service area, contact info, website)
  - Photo upload → Supabase Storage → saves public URL
  - Specialties: multi-select from `specialties_lookup`
  - Additional Email Recipients: add/remove per listing
  - Published toggle: unpublished = hidden from public directory
- **Geocoding:** triggered automatically on save when city/state/zip changes

### Leads Management

- **List view:** Table — parent name, diagnostician, date, email; filterable by diagnostician
- **Detail view:** All submitted fields, diagnostician, timestamp
- No delete in V1 (audit trail preserved)

### Dashboard

- Total published diagnosticians
- Total leads (all time + last 30 days)
- Recent leads (last 5, with link to leads table)

### Specialties

- Managed directly in Supabase dashboard (seeded table)
- No admin UI in V1

---

## Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| Background | `#FFFFFF` | Page backgrounds |
| Surface | `#F8F9FA` | Section breaks, card backgrounds |
| Primary | Deep navy / slate blue | CTAs, headings, active states |
| Accent | Warm teal / soft green | Tags, highlights, success states |
| Text Primary | `#1A1A2E` | Body copy, headings |
| Text Secondary | Medium gray | Supporting copy, labels |
| Border | `#E5E7EB` | Inputs, card borders |

### Typography

- **Headings:** Inter or Plus Jakarta Sans
- **Body:** Inter
- **Fallback:** `system-ui` stack

### Spacing & Shape

- Border radius: 8–12px on cards, 6px on inputs/buttons
- Shadows: subtle `box-shadow` on cards (no heavy drop shadows)

### Key Components

| Component | Description |
|---|---|
| `DiagnosticianCard` | Photo, name, city/state, specialty tags, "View Profile" CTA |
| `ProfilePage` | Two-column: left = full profile, right = sticky lead form |
| `LeadForm` | White card, labeled inputs, primary color submit button |
| `FilterBar` | State dropdown + specialty multi-select + grid/map toggle |
| `AdminTable` | Data table with status badges and action buttons |
| `AdminForm` | Full-width labeled form with section groupings |

### Responsiveness

- Mobile-first throughout
- Directory grid: 3-col desktop → 2-col tablet → 1-col mobile
- Profile page: side-by-side desktop → stacked mobile (lead form below profile)
- Map: full-width desktop, reduced height mobile

### Design Tooling

UI/UX Pro Max skill + 21st.dev MCP components used during implementation for component inspiration and polish.

---

## V1 Scope Boundaries

**In scope:**
- Public directory with search/filter (state/city, specialty)
- Map view (Google Maps)
- Individual listing pages with lead form
- Lead form email routing (admin default + per-listing additional recipients)
- Admin panel: listings CRUD, leads read-only, dashboard
- Admin authentication (single account)

**Out of scope for V1:**
- Diagnostician self-registration or profile management
- Public user accounts
- Payments or premium listings
- Email notifications to parents/guardians (confirmation emails)
- Specialty management UI in admin
- Bulk import of listings
- Analytics beyond basic lead counts
