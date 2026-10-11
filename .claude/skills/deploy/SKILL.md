---
name: deploy
description: Test, build and deploy BoeesTrack to https://track.boee.ing, then confirm the site answers.
disable-model-invocation: true
---

Deploy BoeesTrack. Stop at the first failing step and report its output; do not continue past a failure.

1. `npm test` and `npm run lint`. Lint warnings in `worker-configuration.d.ts` are known and fine.
2. `npm run build`. This must come before the deploy: `npm run deploy` does not build and would ship stale files from `dist/client`.
3. `npm run deploy`. Run it in the background: Cloudflare's "triggers" step can take about 15 minutes. Report the Current Version ID when it finishes.
4. `curl -sI https://track.boee.ing | head -1`. The site is behind Cloudflare Access, so a redirect (302) to the login page means it is up. A 5xx means something is wrong.

Report what shipped in plain words. Do not commit or push.
