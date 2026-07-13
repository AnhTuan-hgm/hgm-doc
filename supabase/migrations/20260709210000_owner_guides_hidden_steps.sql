-- Per-client "hide a step" support: a client guide can hide steps it doesn't need
-- (e.g. no Cloudflare account) without ever touching the shared master template
-- (owner-guide-content in sop_pages), which every guide's step content is read from.
alter table owner_guides
    add column if not exists hidden_steps jsonb not null default '[]'::jsonb;
