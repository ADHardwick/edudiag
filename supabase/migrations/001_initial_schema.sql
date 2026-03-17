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
