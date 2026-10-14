-- A bill paid in full for friends: a JSON list of their parts [{id, friend, satang, forgivenAt?}]. Your own share is the rest.
ALTER TABLE entries ADD COLUMN shares TEXT;
-- On a "received" entry: the friend's share it pays back, so it settles that debt instead of counting as income. One payback per share.
ALTER TABLE entries ADD COLUMN share TEXT;
CREATE UNIQUE INDEX entries_share ON entries (share) WHERE share IS NOT NULL;
