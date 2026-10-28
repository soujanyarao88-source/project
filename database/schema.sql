-- CivicTrack database schema for Supabase PostgreSQL
-- Run this script in Supabase Dashboard -> SQL Editor -> New query.
create extension if not exists pgcrypto;

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  title varchar(100) not null check (char_length(trim(title)) between 1 and 100),
  category varchar(40) not null check (category in (
    'Roads & potholes', 'Garbage & sanitation', 'Water supply',
    'Streetlights', 'Drainage', 'Public safety', 'Other'
  )),
  location varchar(160) not null check (char_length(trim(location)) between 1 and 160),
  description varchar(1500) not null check (char_length(trim(description)) between 1 and 1500),
  reporter_name varchar(80),
  contact varchar(100),
  status varchar(20) not null default 'Pending'
    check (status in ('Pending', 'In Progress', 'Resolved')),
  resolution_note varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issues_created_at_idx on public.issues (created_at desc);
create index if not exists issues_status_idx on public.issues (status);
create index if not exists issues_category_idx on public.issues (category);

-- The Express backend uses its server-only Supabase service-role key and performs
-- authorization checks. RLS remains enabled so browser/anon clients cannot access rows.
alter table public.issues enable row level security;

-- No policies are created intentionally. The public anon/authenticated roles have
-- no direct table access; all application reads/writes go through the Express API.
-- Keep the service-role key only in backend/.env and never expose it to the browser.
