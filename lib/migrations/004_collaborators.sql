-- Collaborators for formulations
-- Run in Supabase SQL editor

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

-- Owner can manage their own formulation's collaborators
create policy "owner_all" on formulation_collaborators
  for all using (owner_id = auth.uid());

-- Collaborator can read their own invite
create policy "collaborator_read" on formulation_collaborators
  for select using (
    user_id = auth.uid()
    or invited_email = (select email from auth.users where id = auth.uid())
  );

-- Allow collaborators to read formulations they were invited to
-- (The application layer enforces this via the API, not RLS on formulations table
--  to avoid complicating the existing owner-only RLS policy)
