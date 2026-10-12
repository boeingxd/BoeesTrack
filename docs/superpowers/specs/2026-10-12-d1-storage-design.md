# D1 storage: design

Date: 2026-10-12. Status: draft for owner review.

## Goal

Everything the owner does in BoeesTrack survives a reload. Today all data is sample data in React state (`App.tsx`, seeded from `lib/sample.ts`). After this work the live app starts empty and stores real data in Cloudflare D1, behind the existing Cloudflare Access check.

Success: on the phone, add a spend, reload, and it is still there, with no sample data mixed in.

## Decisions (from the owner)

- The live app starts empty. Sample data stays for local dev and tests only, labelled as such.
- Saving is optimistic: the change shows at once, is sent in the background, and is undone with a short message if the save fails.
- Scope: everything that exists today persists (entries from hand and from slips, bank check-in, add and rename pots, monthly budget, new categories). Edit and delete of entries are out of scope.
- Approach A: real tables and small API routes (not a JSON blob).

## Out of scope

Edit/delete entries, offline queue, real slip upload and OCR (the slips screen keeps `sampleSlips`), delete-a-pot, importing sample data.

## 1. Database

One migration, `migrations/0001_init.sql`. Amounts are integer satang; `at` is UTC milliseconds.

- `entries(id TEXT PRIMARY KEY, kind TEXT NOT NULL, satang INTEGER NOT NULL, at INTEGER NOT NULL, category TEXT, note TEXT NOT NULL, slip_ref TEXT, pot TEXT)`. `kind` is checked to be one of `spent`, `received`, `saved`, `adjust`. `slip_ref` has a unique index where it is not null, so a slip cannot be saved twice.
- `pots(name TEXT PRIMARY KEY, target INTEGER NOT NULL, monthly INTEGER NOT NULL)`.
- `categories(name TEXT PRIMARY KEY, position INTEGER NOT NULL)`, seeded with the 10 defaults from `DEFAULT_CATEGORIES`.
- `plan(id INTEGER PRIMARY KEY CHECK (id = 1), monthly INTEGER NOT NULL, daily_mode TEXT NOT NULL, daily_fixed INTEGER)`. One row, seeded with ฿20,000 monthly and daily `auto`.

Renaming a pot updates the `pots` row and its entries' `pot` in one `db.batch`, so both happen or neither.

## 2. Worker routes

New `src/worker/data.ts`, mounted in `index.ts` under the existing `/api/*` Access middleware.

- `GET /api/data` returns `{ entries, pots, categories, plan }`.
- `POST /api/entries` takes an array of entries (hand-added spend, check-in adjustment, or a batch of slips) and inserts them in one batch.
- `POST /api/pots`, `PUT /api/pots/:name` (rename/edit), `PUT /api/plan`, `POST /api/categories`.

Every body is validated in the Worker and rejected with 400 if invalid: `kind` is one of the four, `satang` is an integer, `at` is an integer, a `saved` entry has a pot, pot names are unique, category names are non-empty. Duplicate pot name or slip ref returns 409. Validation lives in a pure function so it can be tested in plain Node.

## 3. App side

- `src/react-app/lib/api.ts`: one function per route; the only place dates convert to and from milliseconds.
- `App.tsx` loads once on start. While loading it shows a quiet "Loading" page; on failure it shows a message with a retry. The initial `useState` values for entries, pots, categories and plan are no longer sample data.
- Each change (`addEntries`, `addCheckIn`, `addPot`, `editPot`, `setPlan`, `addCategory`) updates state first, calls the API, and on failure restores the previous state and shows a short message.
- `sample.ts` stays for tests; `sampleSlips` is still used by the slips screen until slip upload exists.
- Design rules still apply: tokens only, works at 320px, tap targets of at least 44px, whole baht.

## 4. Local development

`npm run dev` uses wrangler's local D1 (a file on the dev machine). The migration is applied locally with `npx wrangler d1 migrations apply boeestrack --local`. `ACCESS_BYPASS=true` in `.dev.vars` keeps working. Local and live data are separate.

## 5. Tests and checks

- Plain-Node tests (`src/**/*.test.ts`): row-to-entry mapping, body validation, the undo-on-failure helper.
- D1 itself is not run in tests. It is checked by hand on the local database: add, reload, still there.
- `npm test`, `npm run lint`, `npm run build`, `npm run check` (dry-run deploy).

## 6. Deploy steps (the owner runs these)

1. `npx wrangler d1 create boeestrack`, then paste the printed `database_id` into `wrangler.json` as the `d1_databases` binding (the id is a public identifier).
2. `npx wrangler d1 migrations apply boeestrack --remote`.
3. `npm run build` then `npm run deploy`, only when asked.

## Risks

- `compatibility_date` stays `2026-08-18`. If local D1 does not run on that date, report it; do not change the date.
- Pot rename depends on unique pot names, so the Worker rejects duplicates.
- Money is validated in the Worker, not trusted from the browser.
