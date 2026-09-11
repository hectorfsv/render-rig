# Render Rig

Hector's console for fal.ai. **Live: https://hectorfsv.github.io/render-rig/**

One file — `index.html`, no build step, no dependencies — served by GitHub
Pages. Everything that costs money lives in n8n.

```
GitHub Pages (this repo)          n8n  (hectorfsv.app.n8n.cloud)
  index.html  ──── POST ────────▶  /webhook/kling-form                 submit
              ──── GET  ────────▶  /webhook/kling-form?jobId=..&p=..   poll
              ──── link ────────▶  /webhook/kling-download             save the file
```

**The passphrase is not in this page.** `Detect & Prepare` compares it
server-side and an unauthenticated request dies at `Respond Denied` (401)
before any fal.ai call, so a wrong password costs nothing. The poll is gated
too — n8n execution ids are sequential and would otherwise be enumerable.

---

## START HERE NEXT SESSION

**1. Nothing has ever been paid for through this console.** Every part is
proven structurally and for free. The cheapest real tests, in order:

| | | |
|---|---|---|
| **$0.08** | Upscale | no prompt, under a minute — **proves the whole chain end to end** |
| **$0.06** | Image (Krea) | one sentence |
| **$0.336** | Video, 3s, audio off | the cheapest real clip |

**2. Verify before changing anything:** `./test/run.sh` → 476 assertions, ~2 min,
read-only, nothing sent or spent.

**3. Open questions, roughly in order of value**
- `cfg_scale` on the ignored 360° orbit — the one untried lever. ~$0.34 at 3s.
- NBP `safety_tolerance` above 4 — every IP refusal so far ran at the default.
- Frame interpolation (`fal-ai/film` / `rife` / `amt-interpolation`) or Kling's
  free `end_image_url` for a seamless Gargantua loop. Hector accepted the
  cross-dissolve for now.
- Krea `styles` / `moodboards` — parked, needs a catalog of opaque ids the
  schema does not provide.
- `[TEMP] Rig Field Probe` (`sAouEujoMPiayzcL`) is deactivated but **not
  deleted** — needs Hector's explicit OK.
- `GOYIM` is short and guessable on a public endpoint with no rate limiting.

---

## Shape

```
lock screen  ->  hub (4 cards)  ->  console            + guide
                                    sources / stage / controls / session
```

**The mode IS the model.** There is no engine dropdown, so no control on screen
can belong to an engine you are not using.

| Mode | Engine | From |
|---|---|---|
| Video | Kling 3.0 Pro | $0.336 (3s, audio off) |
| Image | Krea 2 Large | $0.06 |
| Compose | Nano Banana Pro | $0.15 |
| Upscale | Topaz | $0.08 |

**Desktop** is one fluid layout (`clamp()` against `vw`/`100dvh`), capped at
2400px, three columns, no page scroll. **Phone** is stage-first: the stage owns
the screen and the controls come up as a sheet, with cost + Generate always on
the lip. **Landscape** splits side by side.

## Traps — do not re-learn these

- **A rule that SETS `display` beats one that HIDES it, if it is more specific.
  This has bitten this file three times.** Standing fix:
  `[hidden]{display:none!important}` and
  `.screen:not(.on),.hub:not(.on),.console:not(.on){display:none!important}`.
  Never write a `display` value in a state-modifier rule without scoping it to
  the visible state.
- **Never set the `hidden` attribute for something that is only hidden at one
  breakpoint** — it survives a resize and blanks a desktop column. Use a data
  attribute and CSS scoped to `body:not(.wide)`.
- **A window between two fixed steps always gets the smaller one**, and that is
  true of a fluid rule that still contains a fixed step: `columns:430px`
  collapsed to one 896px column at 1040px wide, missing two columns by 6px.
- **Comparing two elements' bounding rects does not detect spilled text.** A
  `nowrap` box gets COMPRESSED and paints over its neighbour while the rects say
  "no overlap". `scrollWidth` vs `clientWidth` is the question.
- **`align-items:center` on overflowing content pushes it off BOTH edges.** It
  ate the header on iPhone and clipped the rail label. Use `margin:auto`.
- **An empty state is not the design.** Every real layout bug here showed up
  only with content on the stage. `./test/run.sh shots` renders the populated
  state by driving the app's own submit → poll → land path.
- **A percentage cannot know a font's metrics.** The rail marquee measures its
  own copy pitch after `document.fonts.ready` and derives the duration, so the
  speed is the constant. IBM Plex Mono is a webfont and Safari measures it
  differently.
- **GitHub Pages sends `cache-control: max-age=600` and Safari's Cmd+R does not
  bypass it.** Use Cmd+Option+R, and `curl` the live file before believing a fix
  failed.
- **`git push` dies on any real asset** — `http.postBuffer` defaults to 1 MB;
  this repo is set to 500 MB + HTTP/1.1.
- **Hector uses Safari, on the phone and the desktop.** The only automation here
  is headless Chromium. When a fix cannot be tested in Safari, remove the
  mechanism rather than tune it — no z-index or paint-order fixes.

## More notes for future edits

- **Every request is a CORS "simple" request on purpose.** Both POSTs send
  `FormData`, never `application/json` — a JSON content-type triggers an
  `OPTIONS` preflight the n8n webhook cannot answer, and login would fail while
  generate still worked.
- **`viewport-fit=cover` is set**, so body padding must keep its
  `env(safe-area-inset-*)` terms or the primary button lands under the home
  indicator.
- **`html,body{height:100%}` fights `min-height:100dvh`** — `height:100%`
  resolves against iOS's *large* viewport. Set it on `html` only.
- **Mono (IBM Plex Mono) is for numeric readouts only** — cost, timers,
  dimensions. Everything else is Chakra Petch.
- **The lock-screen hero is an inlined WebP data URI** (~17.5 KB base64). Stills
  inline fine; video does not — it would never be cached and would bloat the
  page.
- **Sources are downscaled to 1536px in-browser before upload.** Six full-size
  photos would be ~20 MB of base64 through the webhook. **Upscale is the one
  exception** — it sends the original, because upscaling a downscaled file is
  pointless.
- Prices here are measured off fal's pricing pages, not guessed. **fal has no
  per-request cost API**, so re-check them there if they ever look wrong.

## Local preview

Open `index.html` directly for layout only — the API calls go to the live n8n
instance and `file://` is not an allowed origin. Use `./test/run.sh shots` for
rendered previews, and test the real flow on the deployed URL.

## Contract with n8n

**Omission is meaningful.** A blank optional becomes `null` upstream and is
dropped from the fal body so the model applies its own default. Never send a
placeholder to mean "unset". The source tray is addressed **by index**
(`end_image_idx`, `elements:[{frontal,refs[],voice_id}]`).

**Order matters: n8n plumbing before UI.** Shipping a control the workflow does
not forward reproduces the exact "Krea ignores the seed" bug — a control that
lies.

`Restore Context`, `Restore Image Context` and `No Prompt Passthrough` used to
**whitelist** fields, silently dropping every new one. All three were **deleted,
not extended** — they now spread `Detect & Prepare` through. Do not reintroduce a
whitelist.

Full field contract: `../../research/fal-model-capability-audit.md` §BUILD LOG.
Full narrative: `../../research/kling-render-rig-redesign.md`.

## Tests

```
./test/run.sh            everything (476 assertions, ~2 min)
./test/run.sh mobile     6 phone/landscape viewports x 4 modes
./test/run.sh desktop    5 wide viewports: console, hub, guide
./test/run.sh price      every figure the guide quotes vs what the meter computes
./test/run.sh tape       rail marquee: pitch, seam, direction, speed
./test/run.sh shots      previews into test/build/
```

Read-only. Nothing is sent and nothing is spent — the auth POST is stubbed and
submit/poll are answered locally.

**Every harness is regenerated from the current `index.html` on every run.**
`test/build/` is disposable and gitignored. A harness that was a stale copy of
the page cost this project hours, twice; so did a stale screenshot. Never edit
anything in `test/build/`.

Previews render with `transition:none` on purpose: an infinite CSS animation
stops headless virtual time advancing, so a 0.14s transition never settles and
a screenshot shows the *previous* state.
