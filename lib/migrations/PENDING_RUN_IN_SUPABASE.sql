-- ============================================================
-- PENDING MIGRATIONS — paste this entire file into the
-- Supabase SQL editor and click "Run" once.
-- ============================================================

-- Migration 004: Collaborators table
create table if not exists formulation_collaborators (
  id uuid primary key default gen_random_uuid(),
  formulation_id uuid not null references formulations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null default 'editor' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  unique(formulation_id, invited_email)
);

alter table formulation_collaborators enable row level security;

-- Owners can read, insert, and delete their own collaborator rows
create policy if not exists "Owners manage collaborators"
  on formulation_collaborators
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Collaborators can read rows where they are the invitee
create policy if not exists "Collaborators can read their rows"
  on formulation_collaborators
  for select
  using (user_id = auth.uid());

-- Migration 005: Accuracy fields on formulations
alter table formulations
  add column if not exists target_population text,
  add column if not exists excipients jsonb not null default '[]'::jsonb,
  add column if not exists product_type text;
