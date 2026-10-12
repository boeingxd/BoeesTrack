CREATE TABLE entries (
	id TEXT PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('spent', 'received', 'saved', 'adjust')),
	satang INTEGER NOT NULL,
	at INTEGER NOT NULL,
	category TEXT,
	note TEXT NOT NULL,
	slip_ref TEXT,
	pot TEXT
);
CREATE UNIQUE INDEX entries_slip_ref ON entries (slip_ref) WHERE slip_ref IS NOT NULL;
CREATE INDEX entries_at ON entries (at);

CREATE TABLE pots (
	name TEXT PRIMARY KEY,
	target INTEGER NOT NULL,
	monthly INTEGER NOT NULL
);

CREATE TABLE categories (
	name TEXT PRIMARY KEY,
	position INTEGER NOT NULL
);
INSERT INTO categories (name, position) VALUES
	('Food & drink', 1),
	('Groceries', 2),
	('Transport', 3),
	('Shopping', 4),
	('Leisure', 5),
	('Hangouts', 6),
	('Bills', 7),
	('Health', 8),
	('Education', 9),
	('Other', 10);

CREATE TABLE plan (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	monthly INTEGER NOT NULL,
	daily_mode TEXT NOT NULL CHECK (daily_mode IN ('auto', 'off', 'fixed')),
	daily_fixed INTEGER
);
INSERT INTO plan (id, monthly, daily_mode, daily_fixed) VALUES (1, 2000000, 'auto', NULL);
