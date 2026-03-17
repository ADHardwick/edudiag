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
| Rate Limiting | Upstash Redis (via `@upstash/ratelimit`) |
| Photo Storage Bucket | `diagnostician-photos` (Supabase Storage, **public bucket**) |
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

### `specialties_lookup`
```sql
id      uuid PRIMARY KEY DEFAULT gen_random_uuid()
name    text NOT NULL
slug    text UNIQUE NOT NULL
```

### `diagnostician_specialties` (join table)
```sql
diagnostician_id    uuid REFERENCES diagnosticians(id) ON DELETE CASCADE
specialty_id        uuid REFERENCES specialties_lookup(id) ON DELETE CASCADE
PRIMARY KEY (diagnostician_id, specialty_id)
```

### `leads`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
diagnostician_id    uuid REFERENCES diagnosticians(id) ON DELETE SET NULL
diagnostician_name  text NOT NULL
parent_name         text NOT NULL
parent_email        text NOT NULL
parent_phone        text NOT NULL
child_age           smallint NOT NULL CHECK (child_age BETWEEN 3 AND 21)
child_school        text
child_concerns      text NOT NULL
message             text
created_at          timestamptz DEFAULT now()
```

### `listing_email_recipients`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
diagnostician_id    uuid REFERENCES diagnosticians(id) ON DELETE CASCADE
email               text NOT NULL
```

**Schema notes:**
- `lat`/`lng` populated server-side via Google Geocoding API. **Geocoding runs unconditionally on every new listing creation.** On edits, geocoding runs only when city, state, or zip has changed. If geocoding fails (API error or no result), the save completes successfully with `lat`/`lng` set to NULL (non-blocking); admin sees a warning toast. The listing appears in grid view but is excluded from map view.
- `slug` generation: kebab-case from name; collisions resolved by appending `-2`, `-3`, etc. (e.g., `jane-smith`, `jane-smith-2`). Slugs are not editable after creation in V1. No redirects for V1.
- `updated_at` is kept current via a Supabase `moddatetime` extension trigger applied to the `diagnosticians` table on row update.
- Default admin email stored in env var (`ADMIN_DEFAULT_EMAIL`), never in DB
- `specialties_lookup` is seeded manually; no admin UI in V1
- `diagnostician_specialties` join table — specialties are referenced by `specialty_id` (UUID), not slug or name
- `leads.diagnostician_name` is denormalized at insert time so the lead detail view remains readable if the diagnostician is later deleted (`diagnostician_id` becomes NULL via `ON DELETE SET NULL`)
- Deleting a diagnostician cascades to `diagnostician_specialties` and `listing_email_recipients`; associated leads have `diagnostician_id` set to NULL but are retained (audit trail)
- Photo storage: bucket `diagnostician-photos`, configured as **public** in Supabase Storage. `photo_url` stores the full public URL (no signed URL generation needed at read time). Photo replacement: old file is deleted from Storage before saving the new URL. On diagnostician deletion, the photo file is also deleted. V1 accepts orphaned files if deletion fails (non-blocking).

---

## Pages & Routing

### Public Routes

| Route | Description |
|---|---|
| `/` | Homepage: hero, search bar, state/city + specialty filters, directory grid |
| `/diagnosticians` | Full directory (same filters, paginated). The `/search` path is an alias — `?state=TX&specialty=adhd` query params work on both `/` and `/diagnosticians`. No separate `/search` page. |
| `/diagnosticians/[slug]` | Individual listing: full profile + lead form |

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
| `/api/diagnosticians` | GET | Filtered/paginated public results (published only) |
| `/api/admin/diagnosticians` | GET | List all diagnosticians for admin (includes unpublished; supports `?page`, `?limit`, `?search` by name) |
| `/api/admin/diagnosticians` | POST | Create listing (includes specialties array in body) |
| `/api/admin/diagnosticians/[id]` | GET | Fetch single diagnostician for admin edit form (includes specialties + email recipients) |
| `/api/admin/diagnosticians/[id]` | PATCH | Update listing (includes specialties array + email recipients array in body) |
| `/api/admin/diagnosticians/[id]` | DELETE | Delete listing + cascade cleanup |
| `/api/admin/upload-photo` | POST | Upload photo to Supabase Storage, return URL |

Email recipients are managed via the `PATCH /api/admin/diagnosticians/[id]` endpoint. The request body includes an `emailRecipients` array (list of email strings). On save, the server replaces all `listing_email_recipients` rows for that diagnostician with the new array (delete-then-insert). No separate endpoint is needed.

### `/api/diagnosticians` Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `state` | string | Filter by state abbreviation (e.g., `TX`) |
| `city` | string | Filter by city name (case-insensitive, partial match) |
| `specialty` | string (repeatable) | Filter by `specialties_lookup.slug`. Multiple values supported via repeated params (e.g., `?specialty=adhd&specialty=dyslexia`). Results must match **at least one** selected specialty (OR logic). |
| `page` | integer | Page number, 1-indexed (default: `1`) |
| `limit` | integer | Results per page (default: `12`, max: `48`) |

Specialty filtering queries `diagnostician_specialties` joined against `specialties_lookup.slug`. Only published diagnosticians (`is_published = true`) are returned from public routes.

---

## Lead Form

### Fields

| Field | Type | Required |
|---|---|---|
| Parent/Guardian Name | text | Yes |
| Email Address | email | Yes |
| Phone Number | tel | Yes |
| Child's Age | select (3–21) | Yes |
| Child's Current School | text | No |
| Child's Concerns | textarea | Yes |
| Message / Additional Notes | textarea | No |

### Submission Flow

1. User submits form on `/diagnosticians/[slug]`
2. `POST /api/leads` validates fields server-side
3. Rate limit check via Upstash Redis (3 submissions per IP per hour); return 429 if exceeded
4. Honeypot field checked; silently return 200 if triggered (no email sent, no DB insert)
5. Lead row inserted into `leads` table (including denormalized `diagnostician_name`)
6. Query `listing_email_recipients` for this diagnostician
7. Build recipient list: `[ADMIN_DEFAULT_EMAIL env var]` + any listing-specific emails
8. Send individual email per recipient via Resend (no CC/BCC — no address exposure)
9. Email subject: `New Inquiry for [Diagnostician Name]`
10. Email body: all form fields + link to `/admin/leads/[id]`
11. Return 200 → show success message on page

### Spam Protection

- **Honeypot field:** Hidden `<input type="text" name="_hp" tabindex="-1" autocomplete="off">` included in HTML form. Value must be empty string in POST body. If non-empty, server silently returns 200 (no DB insert, no email sent).
- **Rate limit:** 3 submissions per IP per hour via Upstash Redis + Next.js middleware. Returns 429 with user-friendly error message if exceeded.

### Email Recipient Management (Admin)

- Each listing edit page includes an "Additional Email Recipients" section
- Admin can add/remove email addresses per listing (`listing_email_recipients` rows)
- `ADMIN_DEFAULT_EMAIL` (env var) is always included at send time — not editable per listing

---

## Map View

- Toggle between **Grid View** and **Map View** on homepage and `/diagnosticians`
- Filters apply to both views simultaneously; switching views preserves active filters
- Google Maps renders one marker per diagnostician with valid `lat`/`lng`
- Clicking a marker opens an info window: photo thumbnail, name, city/state, top 2 specialties, "View Profile" link
- Geocoding runs server-side on listing create/update; coordinates stored in DB
- Listings without valid coordinates are excluded from map view, visible in grid
- Clean map style (Google Maps Light base or subtle custom theme)
- Custom markers in site primary color (`#1E3A5F`)
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
  - Photo upload → Supabase Storage → old file deleted if replacing → saves new public URL
  - Specialties: multi-select from `specialties_lookup` (stored as `diagnostician_specialties` join rows)
  - Additional Email Recipients: add/remove per listing
  - Published toggle: unpublished = hidden from public directory
- **Geocoding:** triggered automatically on save when city/state/zip changes
- **Delete:** hard deletes the diagnostician record; cascades to `diagnostician_specialties` and `listing_email_recipients`; sets `leads.diagnostician_id` to NULL (leads preserved). Admin prompted to confirm before deletion.

### Leads Management

- **List view:** Table — parent name, diagnostician name, date, email; filterable by diagnostician
- **Detail view:** All submitted fields, diagnostician name, timestamp. If `diagnostician_id` is NULL (diagnostician deleted), display the denormalized `diagnostician_name` with a "(deleted)" indicator.
- No delete in V1 (audit trail preserved)

### Dashboard

- Total published diagnosticians
- Total leads (all time + rolling 30-day window from current timestamp)
- Recent leads (last 5, with link to leads table)

### Specialties

- Managed directly in Supabase dashboard (seeded table)
- No admin UI in V1

---

## Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| Background | `#FFFFFF` | Page backgrounds |
| Surface | `#F8F9FA` | Section breaks, card backgrounds |
| Primary | `#1E3A5F` | CTAs, headings, active states, map markers |
| Accent | `#2A9D8F` | Tags, highlights, success states |
| Text Primary | `#1A1A2E` | Body copy, headings |
| Text Secondary | `#6B7280` | Supporting copy, labels |
| Border | `#E5E7EB` | Inputs, card borders |

### Typography

- **Headings:** Inter (chosen for consistency with body; eliminates the need to load a second font)
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
| `LeadForm` | White card, labeled inputs, primary color (`#1E3A5F`) submit button |
| `FilterBar` | State dropdown + specialty multi-select (multiple slugs, OR logic) + grid/map toggle |
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
- Slug editing or old-URL redirects after slug generation
