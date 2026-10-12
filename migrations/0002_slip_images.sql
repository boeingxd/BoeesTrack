-- 1 when the slip's picture is stored in the SLIPS bucket under the entry's slip_ref.
ALTER TABLE entries ADD COLUMN has_image INTEGER NOT NULL DEFAULT 0;
