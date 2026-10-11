# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

BoeesTrack is a personal daily/monthly money tracker for one user (the owner, a student in Thailand, amounts in baht), live at https://track.boee.ing. The owner is new to building apps and is learning: explain unfamiliar concepts. Read `PRODUCT.md` (what and why) and `CONCEPT.md` (design concept and the owner's decisions) before any UI work.

## Commands

- `npm run dev`, `npm test` (vitest, plain Node, `src/**/*.test.ts`), `npm run lint`.
- `npm run build` is also the typecheck (`tsc -b && vite build`). `npm run check` adds a `wrangler deploy --dry-run`.
- Deploy is `npm run build` THEN `npm run deploy`. `deploy` is only `wrangler deploy` and ships whatever is already in `dist/client`. The "triggers" step can take ~15 minutes.
- Never commit, push or deploy unless asked. Ask before editing `.gitignore`.
- No formatter is configured. Do not run prettier (it rewrites files to spaces and 80 columns). Style is tabs, double quotes, semicolons.

## Stack and gotchas

- Frontend `src/react-app` (React 19, TypeScript, Vite); API is Hono on one Cloudflare Worker in `src/worker`. D1 is chosen but not created, so all data is sample data in React state (`lib/sample.ts`) and must stay labelled as such.
- Login is Cloudflare Access (Google, owner only). The Worker verifies the `Cf-Access-Jwt-Assertion` token on `/api/*` (`src/worker/access.ts`). For local dev set `ACCESS_BYPASS=true` in git-ignored `.dev.vars`; never put it in `wrangler.json`. `TEAM_DOMAIN` and `POLICY_AUD` in `wrangler.json` are public identifiers.
- Keep `compatibility_date` at `2026-08-18`: a newer date broke the local runtime and tests. `workers_dev` and `preview_urls` are off on purpose.
- `slipsScreenShots/` holds the owner's real slips: git-ignored, never quote or commit them. Never fabricate real-looking transaction data.

## Money and dates

- Amounts are integer satang (฿1 = 100). Only entries of kind `spent` count toward budgets; `received` and `saved` do not.
- Daily allowance = `floor((budget − spentBeforeToday) / daysLeftInclToday)` in whole baht (`lib/allowance.ts`). Show averages and similar figures in whole baht.
- Pure logic lives in `src/react-app/lib` with tests next to it; keep screens thin.

## Design rules

- Concept: a ruled notebook with slips clipped in. Use the tokens in `src/react-app/styles/tokens.css`; no inline colours or font names. Geist and Geist Mono are self-hosted via fontsource.
- One red only, for the margin line and warnings. No cards, colourful tiles, or charts beyond ink-only bars.
- The owner mostly uses a phone: everything must work at 320px wide with no horizontal overflow and tap targets of at least 44px.
