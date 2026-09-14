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

**Where it stands (2026-09-14 morning).** Balance **$23.04**. Five modes in daily use.
Full narrative: `../../research/kling-render-rig-redesign.md` (read the 2026-09-14 day
section first). Three n8n deploys today, all verified by
`./scripts/check-rig-guards.sh` (101), `./scripts/check-rig-enhancer.sh` (170 + 65)
and free live executions.

**What changed today**
- **The prompt writer SEES the sources.** `Write Image Brief` -> `Ask the Writer`
  (HTTP to api.x.ai, grok-4.3) -> `Read Writer Reply` replaced the chain node; every
  Compose/edit/Design source is attached to the writer's request. On the 5211 set it
  named who is in each image correctly where the blind writer had it backwards.
  ~$0.003-0.014 per call. The video writer is still blind.
- **A locked seed revises the last render.** The prompt Grok wrote comes back with
  every render (`written`), the page remembers it, and while the seed stays locked to
  that render a change goes up as `prior_prompt` - Grok edits its own prompt. The same
  words again skip the writer. Every Image/Compose run now carries a real seed.
- **Quoted words are a code guarantee** (`Restore Image Context`): a `"..."` in the
  caption that the writer dropped is appended verbatim. Fixes the 5454 class.
- **Price and seed are recorded server-side** on every row; refused jobs close as
  `failed` at $0.
- **Nano Banana 2 measured and set aside** (Hector: keep NBP). It refuses copyrighted
  characters NBP accepts (free refusals); on a non-IP compose both kept identities, NBP a
  touch closer on his face, $0.12 vs $0.15 at 2K. The `nb2` wiring stays dormant in n8n.
- **Design warns when the Words box is empty** and the caption names a flyer, poster,
  infographic, invitation, menu, sign, meme etc., or carries quoted words (5460).

**Open, roughly in order of value**
- The Nano Banana photo recipe's palette slot turned a black-robed subject B&W (5439):
  a palette should be a grade he named, not the subject's own colours.
- Same HTTP pattern for `Enhance Video Prompt` so the i2v writer sees the start frame.
- Determinism: same prompt + seed twice, once. It is the one unmeasured premise of the
  revision feature.
- Per-person codes (spec'd), server-side budgets, `cfg_scale` on the orbit, NBP
  `safety_tolerance` above 4, the seamless Gargantua loop, Krea styles/moodboards.
- Three `[TEMP]` probe workflows are deactivated and undeleted (rebuilt today as a vision
  probe, a seeing-writer probe and a field probe). Delete needs Hector's OK.

---

## Shape

```
lock screen  ->  hub (4 cards)  ->  console            + guide
                                    sources / stage / controls / session
                 +-> gallery  (flagged work, and the prompt behind each picture)
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
- **iOS Safari zooms the whole page when a focused field computes under 16px,
  and it does not zoom back out when the field blurs.** The 14px passphrase left
  the hub at 1.139x (= 16/14) panned 42pt right, with the rail off-screen — it
  looked like a layout bug and was a font size. Every text-entry control is on
  16px now, desktop included: an iPad in landscape is `body.wide` AND iOS. Never
  fix this with `maximum-scale` / `user-scalable=no`; `./test/run.sh zoom`
  asserts both.
- **A screen no test visits is a screen with no tests.** The mobile suite logged
  in and clicked straight through the hub to the console, so the hub had never
  been measured on a phone — which is exactly where the zoom landed. It is
  measured now, before the card click.
- **A second `function show()` in the same scope silently replaces the first.**
  The screen switcher is `show(id)`; a result renderer also called `show(item)`
  hoisted over it and every `show('scr-console')` rendered `<img src="undefined">`,
  breaking all navigation. The renderer is `showResult()`. Grep for the name
  before you add a function to this file.
- **fal does not report output dimensions.** Krea sends `width`/`height` as
  explicit nulls and Topaz sends none at all — a real 2904x3872 upscale reported
  nothing (execs 5064/5068/5071). Read `naturalWidth`/`naturalHeight` off the
  loaded media instead; it is the only source that cannot be wrong. Check
  `.complete` as well as the `load` event, or a cached image never reports.
- **A result had no exit.** `stage('idle')` was reachable only by FAILING, so a
  delivered render sat on the stage through Menu, Guide and a cleared source
  tray. Emptying the tray deliberately does NOT clear it — a Krea render has an
  empty tray by definition — so the stage owns a Clear control. Clearing the
  session clears the stage too, because that render can no longer be recalled.
- **A wait loop that exits on its cap looks exactly like one that succeeded.**
  A diagnostic here hit `++n>60`, sampled a half-built page and reported the
  stage as broken when it was fine. Always report "timed out" as its own result.
- **The fal balance is read server-side and only the number reaches the page.**
  `GET https://api.fal.ai/v1/account/billing?expand=credits` needs an **ADMIN**-scope
  key (n8n credential `fal admin (billing)`), which can also deploy and manage apps
  — so it must never be sent to the browser. Fetched on unlock and after a run
  lands, never polled: each check is an n8n execution.
- **A missing balance must never break the app.** The lookup fails open — no
  number, everything else still works. Tested for reject, HTTP 500 and junk.
- **The gallery does not use CSS multicol, on purpose.** `columns` *balances*, and
  Safari balanced differently from Chromium — it left a whole empty column between
  the 2nd and 3rd picture on Hector's screen while Chromium packed six tight. The
  columns are built in JS and items go into the shortest one, so there is no
  balancing algorithm left to disagree about. Never more columns than pictures.
- **Every gallery image carries `width`/`height` and an `aspect-ratio`.** Without
  them the layout is computed against height 0 and leaves holes, and lazy-loaded
  pictures pop the page around as they arrive. Dimensions come from `specs.w/h`;
  `scripts/rescue-rig-history.py` measures and stores them, and the page falls back
  to the file's real ratio on load if a row has none.
- **Every segmented control must go through `seg()`.** Aspect ratio had its own
  handler that set the variable and never touched `aria-pressed`, so the highlight
  did not move until `syncMode()` happened to rebuild the row — it looked like the
  click had not registered at all. `seg()` delegates from the container, so it
  survives `buildAR()` replacing the buttons. `./test/run.sh segs` clicks every
  option in every mode and was proven to fail (13x) against the old handler.
- **The prompt enhancer had TWO recipes for FOUR modes, and Compose got the wrong
  one.** It branched on `hasImage` alone: no image -> the 8-slot "build a picture"
  recipe, any image -> a **single-photo portrait-EDIT** recipe whose mandatory
  closing line is *"leave everything else in the image exactly as it is"*. Compose
  attaches images, so a three-source composition was rewritten as an edit of image
  1 with the framing pinned. Five men do not fit a pinned frame, so the model
  **painted over one of the originals** (exec 5140: Lenin replaced by the man from
  image 3). His caption was fine and was translated faithfully — the damage was
  entirely in the clause the recipe appends afterwards. **Krea + style references
  hit the same branch** and had the same bug latent, never fired.
  Fixed 2026-09-12: four branches, chosen by `image_count` as well as `hasImage` —
  generate / style-reference / single-image edit / compose. **The preserve clause
  is now CONDITIONAL on what he asked for**, not on whether an image exists: a
  caption that changes the setting or adds anyone gets a face-and-identity clause
  instead. The compose recipe forbids the preserve clause outright, names every
  source by its number, says the shot **may be widened or re-framed**, and closes
  with a **roll call** of who is in the finished picture — an enumeration is what
  stops the model quietly leaving someone out. Verified through the DEPLOYED
  expression on six cases via `[TEMP] Enhancer Recipe Probe` (`rTuM3awsZe8Drka9`,
  now deactivated). Rollback:
  `../../workflows/kling-3-video-generator-PRE-COMPOSERECIPE-20260912.json`.
- **The sources ARE the identity in a Compose, and we were throwing half of it
  away.** `shrink()` capped every source at a 1536px long edge — a number picked
  to keep six photos small, before Compose existed. Hector's selfie therefore
  reached fal at **839x1536** and Nano Banana Pro had nothing finer to rebuild
  his face from (exec 5145, and he said so unprompted). Cap raised to **2048**
  (1.78x the pixels) at jpeg quality 0.90, with a **`SUBMIT_CAP` of 9MB of
  base64 that REFUSES rather than sends** — a payload too big for the webhook
  dies downstream with nothing useful on screen. Upscale is exempt from both; it
  has always sent the original file. `./test/run.sh sources` drives the real
  file input and was proven to fail on every one of these before it passed.
- **PNG output was considered and REJECTED on a measurement.** `output_format`
  is hard-coded `'jpeg'` while NBP's own default is `png`, which looks like a
  quality bug. It is not: the delivered 2752x1536 jpeg is **0.320 bytes/pixel**
  — a high-quality encode — and the same picture as PNG is **4.4x the bytes**
  (1.35MB -> 5.90MB). That is 4.4x through the download proxy, the phone stage
  and a 21-picture gallery, for a difference that is not visible. **The loss is
  at the 1536px input and the 4.2MP output, not in the encoder.** Do not
  "fix" this without re-measuring.
- **Nano Banana Pro has no quality setting.** Its whole input schema is `prompt`,
  `image_urls`, `resolution`, `aspect_ratio`, `num_images`, `safety_tolerance`,
  `system_prompt`, `enable_web_search`, `output_format`, `limit_generations`.
  No steps, no guidance, no strength. **`resolution` is the only parameter that
  touches detail**, and across all 39 rows of the job table every run that
  recorded one was 2K — **4K has never been tried**.
- **fal posts a charge with a LAG, and the app reads the balance at exactly the
  wrong moment.** It refetches when a render lands: exec 5147 read $4.79 fifty
  seconds after a $0.15 run, and the true $4.64 only appeared minutes later. So
  the credit figure on screen is often one run behind — which matters, because
  it is the number that is supposed to stop an overspend. (The delta itself is
  exact: 4.95 -> 4.79 -> 4.64 for $0.165 and $0.150.)
- **A composite reads as cut-and-paste because every source arrives carrying the
  light of its OWN photo.** The first compose recipe said "keep each person's
  face and identity from their own source image" and then said nothing about
  light, so Kratos landed on a dusk rooftop still lit by his overcast mountain,
  with hard edges and no shadow on the ground. Hector's words: *"it looks like
  kratos and I we were just copy/paste there."* Fixed 2026-09-12 with an
  INTEGRATION beat: the destination scene's light applied to everyone (direction,
  colour, hardness, time of day, faces and clothing **relit**), contact shadows
  under every person falling the way the scene's shadows fall, ONE camera - a
  single eye level, lens and ground plane - and matched focus, grain and colour
  grade with no one sharper than the scene. **Light, shadow, lens, grain and
  focus are explicitly exempted from "never invent a noun he did not use"**, or
  the model treats describing them as forbidden. Same pass taught it REMOVALS:
  say what goes AND what takes its place ("no microphones; their hands are empty
  and relaxed at their sides"), or a hand stays curled around the object that is
  gone. Rollback:
  `../../workflows/kling-3-video-generator-PRE-RELIGHT-20260912.json`.
- **Offered a choice, the model always takes the soft one.** The integration beat
  said relight to match the scene's "hardness or softness" and the enhancer wrote
  *"direction, colour and softness"* every time — flattening a neon rooftop at
  dusk into grey ambient. Hector: *"it softened the picture too much."* Fixed by
  BANNING the vocabulary: soft / softly / softened / diffused / even / gentle /
  muted are forbidden in that beat unless he used them, and the beat now says the
  scene's **contrast and hardness are matched and KEPT**. Matched rendering says
  explicitly that matching is not smoothing. **The enhancer cannot see the
  image**, so it must never assert how soft a scene is — a two-option menu is an
  invitation to guess, and it guesses soft.
- **"Say what takes its place" over-applied and disarmed someone.** The removal
  rule produced *"no microphones; their hands are empty and relaxed at their
  sides"* — and the model took **Kratos's axe** on a request about microphones.
  It now names only the object asked about, says what the freed hands do, and
  states that everything else anyone is holding is unchanged. **Removing one
  named thing must never disarm anyone else.**
- **The practical-lights line cannot fire on its own.** The beat asks for neon,
  signs and lamps to spill onto the people nearest them *if the scene has them* —
  but the enhancer is blind, so it never knows. Naming the light in the caption
  ("keep the neon on their faces") is the only way to reach it, and that is a
  thing to teach rather than a thing to fix: the alternative is letting the
  enhancer guess what is in the picture, which is the bug the whole recipe exists
  to prevent.
- **The roll call REDUCES the dropped person, it does not eliminate it.** Before
  the compose recipe it was structural - the frame was pinned, so someone had to
  go. After it, one run in six still dropped a man (exec 5160) **while its own
  prompt said "all five men together"**. More prompt will not fix that; it is
  generation variance, and the only real control is a seed typed in BEFORE the
  run, because fal does not return the one it used.
- **Aspect ratio does NOT determine whether everyone gets the front row.** That
  was claimed here from a sample of one run each way and the very next pair
  contradicted it: a 4:5 run stacked two men into a back row, the next 4:5 run
  put all five on the front line. It is variance. Do not re-derive this rule.
- **A mode can exist in the UI, in `Detect & Prepare` and in the submit body and
  still not exist in the enhancer.** The four-mode split shipped everywhere except
  the node that writes the actual prompt. When you add a mode, grep for every
  place that branches on `hasImage` — that flag is not the same question as
  "which job is this".
- **`price` is never recorded on a live run.** `Store Job` maps it from
  `Detect & Prepare.quoted_price`, which reads `body.price` — and the browser
  sends no `price` field at all. Every row since the column was added reads null.
  The gallery shows those pictures priceless.
- **Nano Banana Pro returns no seed**, so "lock it to iterate" only works with a
  seed you typed yourself. Its `description` — the model's own account of what it
  made — IS returned and is thrown away in `Parse Result`. Free, and the cheapest
  way to find out why a render came back wrong.
- **`model` is what was PICKED; `engine` is what fal actually RAN, and they
  disagree on real rows.** Two rows say `krea` and went to `nano-banana-pro` (the
  era when all image-to-image did), so labelling by `model` printed "Image $0.06"
  over a $0.15 Nano Banana Pro picture. The gallery labels by `engine`, resolved
  from the endpoint in `response_url` — `scripts/set-rig-engines.py` backfills it
  and re-derives the price from the same fact.
- **Krea 2 Medium is $0.030** ($0.035 with style references). It is a retired
  tier that older Esquiffis runs used, and its price was recorded nowhere here
  until 2026-09-11 — five gallery pictures were priceless because of it.
- **The gallery shows ONLY rows flagged `gallery = true`.** Default off, and no
  script sets it. This is not tidiness: the upscales are family photos, and an
  automatic "recent generations" wall would publish them. Flag from the data
  table; `Build Gallery` also drops anything without a `result_url`.
- **A prompt exists in exactly one place until it is stored: the n8n execution.**
  fal never returns it — a completed request gives you `images` and `seed`, full
  stop — and n8n Cloud prunes executions on a rolling window of about a week.
  Eight of the first twenty-three generations lost their prompts before anyone
  thought to save them. `Store Job` now writes the prompt at submit time.
- **The price in the table is the BROWSER's quote.** Fine for a gallery, which
  only displays it. Not fine for a budget, where the person spending controls the
  input — that needs the price computed in `Detect & Prepare`.
- **Hector uses Safari, on the phone and the desktop — and since 2026-09-11 it
  can actually be tested.** `../webkit-check/` (`node check.js <url|file>`) runs
  Playwright **WebKit 18.4** headless; his Safari is **18.6**, a one-minor-version
  match rather than a different engine. Run it alongside `test/run.sh` (Chromium)
  on any layout change — `--chromium` renders both and diffs the findings, which
  is how you catch an engine divergence instead of discovering it on his phone.
  **The install is version-locked:** this Mac is Intel Ventura, and Playwright
  stopped shipping macOS-13 WebKit builds after rev 2140 = `playwright@1.51.0`.
  `npx playwright install webkit` on a newer Playwright 400s. See
  `../webkit-check/README.md`.
- **WebKit is still not Mobile Safari.** iOS *chrome* behaviour — the <16px input
  zoom firing, `env(safe-area-inset-*)`, the address bar changing `dvh` — needs a
  real iPhone or an iOS Simulator (Xcode, not installed). For those, still remove
  the mechanism rather than tune it — no z-index or paint-order fixes.
- **The first WebKit run flagged a leak at landscape 852x393. IT WAS A FALSE
  POSITIVE — the page is fine.** The check said "page scrolls 836px" and `.rail`
  measured 1189px tall with `offsetParent` non-null, which looked like a fourth
  `display`-beats-hiding leak. It is not: that rail IS the intended running tape,
  and a pixel diff of top-of-scroll vs bottom-of-scroll shows **max channel
  difference 17/255, zero pixels over 32** — scrolling reveals nothing.
  **`scrollHeight > clientHeight` is not "the page scrolls."** The tape is
  `position:absolute` and 2293px tall inside a masked rail, so it inflates
  `scrollHeight` by 836px and moves nothing. `webkit-check` now scrolls to the
  bottom and asserts whether real content elements move, reporting phantom
  overflow as a note rather than a failure. Hector caught this by looking at the
  screen while I was reading a number.

- **A field can reach the UI, `Detect & Prepare` and the API and never reach the
  writer.** Fourth costume (2026-09-14): the sources themselves. The writer was blind
  and guessed who was in which image. `Write Image Brief` attaches them now.
- **A recipe rule that fails three times is not a rule, it is a wish.** Quoted words
  were "guaranteed" by the recipe three times and dropped on a live run each time.
  They are appended by code now, like the Design words. Put it in the tool.
- **The seed only fixes the shuffle; the words decide the picture.** A locked seed
  with a rewritten prompt is a new picture. The revision path keeps the prompt.
- **`price` in the table is now the server's number**, not the browser's quote.

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
./test/run.sh            everything (~8 min)
./test/run.sh mobile     6 phone/landscape viewports x 4 modes
./test/run.sh desktop    5 wide viewports: console, hub, guide
./test/run.sh price      every figure the guide quotes vs what the meter computes
./test/run.sh stage      a render lands, shows its seed, and can be cleared
./test/run.sh credit     credit left on screen, and every way the lookup fails
./test/run.sh gallery    the gallery: flagged work, prompts, empty and failed states
./test/run.sh revise     a locked seed revises the last render; every image run has a real seed
./test/run.sh segs       every segmented control reacts to the click that made it
./test/run.sh zoom       no field under 16px (iOS zooms the page and stays there)
./test/run.sh sources    the 2048 source cap and the payload guard that refuses
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
