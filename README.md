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

## The console

Three panes on a wide screen, one column on a phone (controls first there, so you
are not scrolling past an empty stage to reach anything you can touch).

```
SOURCES          STAGE                 CONTROLS
tray of images   last result lives     mode, engine, prompt,
you dropped or   here and stays        aspect, resolution, seed,
promoted from    while you set up      cost meter, Generate
a past render    the next run
                 ------ SESSION STRIP ------
```

**Sources** feed Nano Banana Pro's `/edit`, whose `image_urls` is an array - it
combines every source into one picture. Krea is text-only and the meter says so
out loud when sources are loaded and Krea is selected. Video uses the first
source only.

**Upscale** runs on Topaz. Its price is set by output resolution, so the meter
computes the exact figure from the source's dimensions rather than estimating.

**Seed** can be locked, so you can change one word and see what that word did.

## What each mode costs

| mode | price |
|---|---|
| Kling 3.0 Pro video | $0.112/s, $0.168/s with audio |
| Krea 2 Large | $0.06 |
| Nano Banana Pro | $0.15 at 1K or 2K, $0.30 at 4K |
| Topaz upscale | $0.08 to 24MP, $0.16 to 48MP, $0.32 to 96MP |

1K and 2K cost the same on Nano Banana Pro, so 1K is never worth picking.

## More notes for future edits

- **Sources are downscaled to 1536px in-browser before upload.** Six full-size
  photos would be ~20MB of base64 through the n8n webhook. Upscale is the one
  exception - it sends the original, because upscaling a downscaled file is
  pointless.
- **`[hidden]` must keep its `!important`.** Any class that sets `display` beats
  a bare `[hidden]`, which is how the result buttons once rendered with no result.
- **`Restore Image Context` in the n8n workflow whitelists fields.** A new field
  added to `Detect & Prepare` is silently dropped before the submit nodes unless
  it is also listed there.
- Prices above are measured off fal's pricing pages, not guessed. fal has no
  per-request cost API, so re-check them there if they look wrong.
