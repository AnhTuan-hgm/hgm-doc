-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- The app uses the public anon key for all reads/writes (internal tool), so each
-- table needs RLS policies that allow the anon role. This file:
--   1. Fixes the "new row violates row-level security policy" error when adding
--      Overview tabs/cards on the dashboard (overview_tabs / overview_cards).
--   2. Creates the docs_requests table used by the footer "Send new docs request"
--      form and the /requests page.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix RLS on existing overview tables
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.overview_tabs  enable row level security;
alter table public.overview_cards enable row level security;

drop policy if exists "anon full access" on public.overview_tabs;
create policy "anon full access" on public.overview_tabs
  for all to anon using (true) with check (true);

drop policy if exists "anon full access" on public.overview_cards;
create policy "anon full access" on public.overview_cards
  for all to anon using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. docs_requests table (+ RLS)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.docs_requests (
  id          uuid primary key default gen_random_uuid(),
  requester   text,
  title       text not null,
  request_for text not null,            -- clients | webteam | am | ma
  priority    text not null default 'medium', -- low | medium | high | urgent
  details     text,
  status      text not null default 'open',   -- open | done
  created_at  timestamptz not null default now()
);

alter table public.docs_requests enable row level security;

drop policy if exists "anon full access" on public.docs_requests;
create policy "anon full access" on public.docs_requests
  for all to anon using (true) with check (true);
