-- Client brand logo, shown on Client List cards (separate from the cover photo).
alter table clients add column if not exists logo_url text;
-- Instagram-style handle shown under the client name on the card (stored without the @).
alter table clients add column if not exists handle text;
