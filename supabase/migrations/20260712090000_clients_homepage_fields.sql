-- Homepage (Mission Control) fields on the Client List table.
-- status drives the KPI tiles; onboarding_phase places a client in the
-- Phase 0–5 pipeline; web_project/web_manager feed the Web Team panel.
alter table clients add column if not exists status text not null default 'existing'; -- existing | onboarding | offboarding
alter table clients add column if not exists onboarding_phase smallint;               -- 0–5, only meaningful while status = 'onboarding'
alter table clients add column if not exists web_project text;                        -- website project name (set = "in flight")
alter table clients add column if not exists web_manager text;                        -- Web Team member managing it
alter table clients add column if not exists marketing_assistant text;                -- MA paired with the AM on this client
