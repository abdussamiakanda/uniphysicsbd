-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Tables: contests, universities, contest_teams (teams reference universities)

-- Contests (one per year)
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  intro_text text,
  problem_a_note text,
  problem_b_note text,
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pre-entered universities (avoids typos; used for team dropdown and dedicated uni pages)
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  acronym text,
  url text,
  logo_url text,
  founded int,
  location text,
  division text,
  type text,
  description text,
  created_at timestamptz default now()
);

-- Add optional columns if table already existed (safe to run)
alter table public.universities add column if not exists acronym text;
alter table public.universities add column if not exists url text;
alter table public.universities add column if not exists logo_url text;
alter table public.universities add column if not exists founded int;
alter table public.universities add column if not exists location text;
alter table public.universities add column if not exists division text;
alter table public.universities add column if not exists type text;
alter table public.universities add column if not exists description text;

-- One row per team per contest. Team number is unique per contest.
-- university_id references universities (single source of truth for spelling).
create table if not exists public.contest_teams (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  team_number int not null,
  university_id uuid not null references public.universities(id) on delete restrict,
  members_text text,
  sponsor text,
  problem text not null check (problem in ('A', 'B')),
  medal text not null check (medal in ('Gold', 'Silver', 'Bronze', 'Acc')),
  created_at timestamptz default now(),
  unique(contest_id, team_number)
);

-- Drop old tables if migrating from previous schema
drop table if exists public.contest_stats;
drop table if exists public.contest_medal_summary;

-- If migrating from schema that had contest_teams with university text, run this once then drop column:
-- alter table public.contest_teams add column university_id uuid references public.universities(id);
-- update ... ; alter table public.contest_teams drop column university; alter table public.contest_teams alter column university_id set not null;

-- RLS
alter table public.contests enable row level security;
alter table public.universities enable row level security;
alter table public.contest_teams enable row level security;

create policy "Public read contests" on public.contests for select using (true);
create policy "Public read universities" on public.universities for select using (true);
create policy "Public read contest_teams" on public.contest_teams for select using (true);

create policy "Authenticated full access contests" on public.contests for all using (auth.role() = 'authenticated');
create policy "Authenticated full access universities" on public.universities for all using (auth.role() = 'authenticated');
create policy "Authenticated full access contest_teams" on public.contest_teams for all using (auth.role() = 'authenticated');

-- Indexes
create index if not exists idx_contest_teams_contest_id on public.contest_teams(contest_id);
create index if not exists idx_contest_teams_university_id on public.contest_teams(university_id);
create index if not exists idx_contests_year on public.contests(year desc);
create index if not exists idx_universities_slug on public.universities(slug);
