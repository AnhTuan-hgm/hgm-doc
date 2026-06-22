-- Run in the Supabase SQL Editor.
-- Per-client owner guides. Each guide shares the team's template step content
-- (sop_pages slug 'owner-guide-content'); each client's *credentials* are stored
-- in owner_onboarding keyed by session_id = the guide slug.

create table if not exists public.owner_guides (
  slug           text primary key,
  client_name    text not null,
  share_password text,
  created_at     timestamptz not null default now()
);

alter table public.owner_guides enable row level security;

drop policy if exists "anon full access" on public.owner_guides;
create policy "anon full access" on public.owner_guides
  for all to anon using (true) with check (true);
