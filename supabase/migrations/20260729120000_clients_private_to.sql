-- Private/test clients: when private_to is set to a team email, the UI hides
-- the client from everyone except that person (Client List, /home Mission
-- Control, notification-bell roster count). Used for e.g. the HGM TEST client.
alter table clients add column if not exists private_to text;
