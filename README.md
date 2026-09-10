# Render Rig

Front end for Hector's fal.ai render rig — Kling 3.0 Pro video, Krea 2 Large and
Nano Banana Pro stills. One page, five screens: login, form, progress, result, guide.

Live: https://hectorfsv.github.io/render-rig/

## How it works

This repo is **only the front end**. It is a single static `index.html` with no build
step and no dependencies. Everything that costs money lives in n8n.

```
GitHub Pages (this repo)          n8n  (hectorfsv.app.n8n.cloud)
  index.html  ──── POST ────────▶  /webhook/kling-form      submit a job
              ──── GET  ────────▶  /webhook/kling-form?jobId=..&p=..   poll
              ──── link ────────▶  /webhook/kling-download  save the file
```

## Auth

The passphrase is **not in this page**. `Detect & Prepare` in the n8n workflow compares it
server-side and an unauthenticated request dies at `Respond Denied` (401) before reaching
any fal.ai call — so a wrong password costs nothing. The poll is gated too, because n8n
execution ids are sequential and would otherwise be enumerable.

## Notes for future edits

- **Every request is a CORS "simple" request on purpose.** Both POSTs send `FormData`, never
  `application/json` — a JSON content-type triggers an `OPTIONS` preflight that the n8n
  webhook cannot answer, and login would fail while generate still worked.
- **Do not centre the layout with `align-items:center`.** Content taller than the viewport
  then overflows off *both* edges and the top becomes unreachable on iOS Safari. `.rig` uses
  `margin:auto` instead, which centres when it fits and top-aligns when it does not.
- `viewport-fit=cover` is set, so body padding must keep its `env(safe-area-inset-*)` terms.
- Mono (IBM Plex Mono) is for numeric readouts only — cost, timers, dimensions. Everything
  else is Chakra Petch.
- The lock-screen hero is an inlined WebP data URI (~17.5 KB base64). Stills inline fine;
  video does not — it would never be cached and would bloat the page.

## Local preview

Open `index.html` directly. The API calls go to the live n8n instance, so login and
generate work from `file://` only if that origin is allowed — normally just preview the
layout and test the real flow on the deployed URL.
