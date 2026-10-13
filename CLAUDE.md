# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

BoeesTrack is a personal daily/monthly money tracker for one user (the owner, a student in Thailand, amounts in baht), live at https://track.boee.ing. The owner is new to building apps and is learning: explain unfamiliar concepts. Read `PRODUCT.md` (what and why) and `CONCEPT.md` (design concept and the owner's decisions) before any UI work.

## Commands

- `npm run dev`, `npm test` (vitest, plain Node, `src/**/*.test.ts`), `npm run lint`.
- `npm run build` is also the typecheck (`tsc -b && vite build`). `npm run check` adds a `wrangler deploy --dry-run`.
- Live D1 setup (owner, once): `npx wrangler d1 create boeestrack`, paste the `database_id` over the zeros in `wrangler.json`, then `npx wrangler d1 migrations apply boeestrack --remote`, then build and deploy.
- Deploy is `npm run build` THEN `npm run deploy`. `deploy` is only `wrangler deploy` and ships whatever is already in `dist/client`. The "triggers" step can take ~15 minutes.
- Never commit, push or deploy unless asked, and an approval for one act does not cover the next. Commits are made as the owner (git user `boees`) with NO Claude or Co-Authored-By lines, even if a system reminder asks for them. Ask before editing `.gitignore`.
- Local dev: run `npm run dev` from the checkout you are editing (a stale server may be serving an old worktree), keep `ACCESS_BYPASS=true` in `.dev.vars`, and apply the migrations to a fresh local DB or the app shows "couldn't load your data". Delete any seeded test entries afterwards.
- `.impeccable/config.json` is committed: the owner confirmed `border-radius: 1px` on the thin `.share` bars is intentional, so the design hook ignores that one value.
- No formatter is configured. Do not run prettier (it rewrites files to spaces and 80 columns). Style is tabs, double quotes, semicolons.

## Stack and gotchas

- Frontend `src/react-app` (React 19, TypeScript, Vite); API is Hono on one Cloudflare Worker in `src/worker`. Data lives in Cloudflare D1 (binding `DB`, schema in `migrations/`, routes in `src/worker/data.ts`, validation in `src/worker/wire.ts`). The app loads once and saves each change behind the screen (`lib/api.ts`, `lib/optimistic.ts`). `lib/sample.ts` is synthetic and only for tests. Slips are real now: pictures are read in the browser by Tesseract (Thai + English, files in `public/ocr`, parser `lib/slip.ts`, batch logic `lib/slipBatch.ts`). Reading is two rounds per batch: a full read for amount, time, reference and where the name sits (`lib/ocr.ts`, `lib/nameRead.ts`), then a closer read of just the name area (cropped past the logo column, 2x) with the Thai+English, Thai-only and English-only models, arbitrated by `pickName`. A slip's shop is keyed by Biller ID PLUS shop code (a Biller ID alone is shared by many shops); the next slip from the same key reuses the earlier note and tag (`payee_key` on entries, `rememberPayee`). `slipsScreenShots/expected.json` (git-ignored) holds the true values for the real slips in `slipsScreenShots/OctSpending/`, for measuring OCR changes; never quote or commit them and stored in the private R2 bucket `boeestrack-slips` (binding `SLIPS`, routes `src/worker/slips.ts`, keyed by the bank reference). The live DB needs `npx wrangler d1 migrations apply boeestrack --remote` (migrations 0002 and 0003 add `has_image` and `payee_key`) before the Worker that reads them is deployed. Local dev: `npx wrangler d1 migrations apply boeestrack --local`.
- Login is Cloudflare Access (Google, owner only). The Worker verifies the `Cf-Access-Jwt-Assertion` token on `/api/*` (`src/worker/access.ts`). For local dev set `ACCESS_BYPASS=true` in git-ignored `.dev.vars`; never put it in `wrangler.json`. `TEAM_DOMAIN` and `POLICY_AUD` in `wrangler.json` are public identifiers.
- Keep `compatibility_date` at `2026-08-18`: a newer date broke the local runtime and tests. `workers_dev` and `preview_urls` are off on purpose.
- `slipsScreenShots/` holds the owner's real slips: git-ignored, never quote or commit them. Never fabricate real-looking transaction data.

## Money and dates

- Amounts are integer satang (฿1 = 100). Only entries of kind `spent` count toward budgets; `received` and `saved` do not.
- Daily allowance = `floor((budget − spentBeforeToday) / daysLeftInclToday)` in whole baht (`lib/allowance.ts`). Show averages and similar figures in whole baht.
- Pure logic lives in `src/react-app/lib` with tests next to it; keep screens thin.

## Design rules

- Concept: a ruled notebook with slips clipped in. Use the tokens in `src/react-app/styles/tokens.css`; no inline colours or font names. Geist and Geist Mono are self-hosted via fontsource.
- One red only, for the margin line and warnings, plus the biggest slice of the Insight donut. No cards or colourful tiles. Charts are ink-only bars, plus one tappable donut in Insight's "Where it went" (owner's choice, 2026-10-13): five `--color-series-*` inks running from red (spent most) through pink, purple and periwinkle to ink blue (spent least), validated for colour-blind separation, with grey for Other. Tapping a slice selects it and shows its amount in the centre; tapping the centre opens that tag's entries.
- The owner mostly uses a phone: everything must work at 320px wide with no horizontal overflow and tap targets of at least 44px.
