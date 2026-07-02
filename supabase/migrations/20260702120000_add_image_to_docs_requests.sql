-- Bug reports from the team help menu can attach a screenshot (data URL).
alter table "public"."docs_requests" add column if not exists "image" text;
