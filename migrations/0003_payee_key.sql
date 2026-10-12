-- Identifies who a slip paid (a shop's Biller ID or a masked account), so the next slip from them can reuse the note and tag.
ALTER TABLE entries ADD COLUMN payee_key TEXT;
CREATE INDEX entries_payee_key ON entries (payee_key) WHERE payee_key IS NOT NULL;
