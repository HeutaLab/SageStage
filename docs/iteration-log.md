# Sage Stage — iteration log

A running, chronological record of work on the app — **oldest first (line 0) at
the top, newest at the bottom**. Companion to the two forward-looking docs:
[`app-review-checklist.md`](app-review-checklist.md) (what to fix) and
[`storage-abstraction-plan.md`](storage-abstraction-plan.md) §9 (the phased
desktop migration).

> **On the backfill.** This project has no git history, so entries before
> **2026-07-21** are reconstructed from file last-modified timestamps, the
> cache-bust version numbers in `index.html`, the design docs, and recorded
> decisions — they capture *when a file was last touched and the shape of the
> work*, not every individual change. Entries from 2026-07-21 onward are logged
> as they happen and are precise. **Append new entries at the bottom** using the
> template at the end.

## State at time of writing (2026-07-21)

Cache-bust versions are the app's own per-file iteration counters:

| File | Version | File | Version |
|---|---|---|---|
| `app.js` | v36 | `icons.js` | v15 |
| `style.css` | v31 | `icons-scarlab.js` | v5 |
| `qr.js` | v5 | `export.js` | v1 |
| `templates.js` | v5 | `pptx-import.js` | v1 |
| `vendor/fonts/fonts.css` | v1 | | |

Single-file static app (`index.html` + the scripts above), localStorage
persistence, no build step. Desktop (Tauri) migration planned but not yet
started.

---

## 2026-07-17 — earliest known artifacts

- `qr.js` (08:21) — self-contained QR encoder (byte mode, ECC-L, versions 1–6),
  no external service.
- `icons-scarlab.js` (08:39) — vendored Scarlab duotone tool-icon set, recolored
  to tint per-tool via `--acc`.

_(These are the oldest files on disk; the core app predates them but its earlier
history isn't recoverable without version control.)_

## 2026-07-18 — template banks, desktop direction, design docs

- **Community template bank** (10:12–10:13) — `community/index.json` +
  `maths-mental-starter` / `phonics-warmup` sample sources + `community/README.md`.
  Establishes "a template source is just a static folder with an `index.json`."
- **Shipping direction decided** — Sage Stage will ship as a **Tauri v2 desktop
  app** storing data in `Documents/Sage Stage/`, with localStorage as the
  plain-browser fallback and JSON export/import as the transfer format.
- **Design docs written (evening):**
  - [`storage-abstraction-plan.md`](storage-abstraction-plan.md) (21:32) — the
    5-phase storage-seam → Tauri → file backend → multi-window → packaging plan.
  - [`collaboration-design.md`](collaboration-design.md) (21:51) — "Class Link":
    students join a projected session by QR/code to vote/quiz/co-edit; a
    desktop-build feature (embedded axum server, teacher-authoritative
    JSON-over-WebSocket, CRDT later).
  - [`class-link-external-relay.md`](class-link-external-relay.md) (22:40) —
    reference for running Class Link over a public web link instead of a local
    server; realtime-service options + privacy model. No implementation scheduled.

## 2026-07-19 — export & import pipeline

- `export.js` (20:20) — export pipeline over vendored jsPDF / PptxGenJS /
  html2canvas (JSON backup, PDF, PPTX, PNG); read-only and crash-isolated per
  screen/widget.
- `pptx-import.js` (21:24) — PowerPoint import via vendored JSZip, parsed entirely
  in-browser (one screen per slide); fails atomically with friendly messages.
- `templates.js` (23:09) — built-in template bank expanded (42 built-ins:
  routines + game library with illustrated covers).

## 2026-07-21 (daytime) — maths manipulatives push

- [`docs/maths-manipulatives-top10.md`](maths-manipulatives-top10.md) (14:33) —
  roadmap ranking the top-10 White Rose manipulatives against what's built.
- Widget + styling refresh landing `app.js` at **v36**, `style.css` at v30,
  `icons.js` at v15, and a README rewrite (14:32–14:59) — the manipulatives work
  (Base 10 TTh/Millions charts, PV counters, rekenrek, number line, frame tiles,
  etc.) reflected in the README's widget table.

## 2026-07-21 (evening) — full app review

Session goal: a full review of the app + a companion checklist.

- **8-agent parallel code review** across all of `app.js`, the aux files
  (`export`/`pptx-import`/`qr`/`templates`/icons/`community`), and
  `style.css` + `index.html` + accessibility; plus a hands-on browser pass of the
  core flows (dashboard → deck → Base 10 exchange/break/build → reload). Top
  findings re-verified by hand against source.
- **[`app-review-checklist.md`](app-review-checklist.md)** created — 73
  prioritized fixes (P0 security → P6 housekeeping), each with `file:line`, mapped
  onto the phased plan; plus a "verified-solid — don't touch" list.
- **Headline blockers identified:** stored XSS via shared templates → Text-widget
  `innerHTML`; "Erase all local data" undone by a second tab; wrong number-line
  fraction labels (¼ → "+1/2") and related maths-display bugs; Google Fonts CDN
  breaking "100% local". (Recorded in memory: `sage-stage-app-review`.)

## 2026-07-21 (evening) — fonts self-hosted (P0 item closed)

Decision — fonts split into two roles (recorded in memory:
`sage-stage-font-strategy`): **chrome fonts** self-hosted; **content fonts** to
become a machine-installed-font picker (rides the Tauri build) so schools use
their own licensed cursive/dyslexia fonts, which are never bundled.

- Added [`vendor/fonts/`](../vendor/fonts/): 33 `woff2` files (8 OFL UI families ×
  used weights, `latin` + `latin-ext` subsets) **+ OpenDyslexic 400/700** bundled
  as a built-in dyslexia option; ~924 KB total.
- Added `vendor/fonts/fetch-fonts.py` (reproducible vendoring) + `README.md`
  (provenance, OFL licensing) and generated `vendor/fonts/fonts.css` (v1).
- `index.html`: removed the three `fonts.googleapis.com` links, linked the local
  stylesheet; `style.css` bumped to v31.
- **Verified in-browser:** zero requests to `googleapis.com`/`gstatic.com`;
  Quicksand renders (not a fallback); all 9 families register; OpenDyslexic loads
  on demand and renders distinctly; no console errors; UI pixel-identical.
- Checklist P0 fonts item marked done (chrome half); the installed-font dropdown
  remains, tracked in the checklist's phase-mapping row.

## 2026-07-21 (night) — camera hub & camera widgets design consolidated

- Added [`camera-hub-design.md`](camera-hub-design.md) — canonical no-code design
  for a shared **Sage Camera Hub** plus five camera learning widgets (Motion Trail
  Lab, Human Graphs, Symmetry Mirror, Freeze-Frame Investigator, Story Portal),
  connection paths for webcam/iPhone/iPad/Android cameras, and a future Sage
  Remote Camera companion app.
- Merges the drafted design with the review pass: hub gains the screen curtain,
  interruption handling, first-run capability check and exclusive-stream
  rationale; Human Graphs gains the clustering/lane-length strategy and
  cone-guided calibration; Freeze-Frame folds in the visualiser-replacement
  argument, still-resolution reality (§4.6) and fixed-mount scope trim; Story
  Portal gains spill suppression and a gated scene-still save; **Class Vote cards
  recorded as roadmap widget six** (deferred, not dropped); shared modules
  (homography, segmentation, annotation, marker detection) named; build order and
  the Tauri WKWebView camera spike listed first.
- Why: locks the camera-input direction alongside the Class Link pair
  ([`collaboration-design.md`](collaboration-design.md),
  [`class-link-external-relay.md`](class-link-external-relay.md)) before any
  implementation; records the secure-context finding that rules out a plain
  LAN-HTTP phone scanner page.
- Verified how: design doc only — no code touched; platform claims (Continuity
  Camera, Link to Windows, secure contexts) carry citations and a
  re-verify-before-implementation note.

## 2026-07-21 (night, later) — Class Vote cards promoted to first widget

- [`camera-hub-design.md`](camera-hub-design.md) §10/§14/§15 updated: open question
  1 resolved — Class Vote cards (Plickers-style marker voting) move to the front of
  the widget build order, directly after the Camera Hub core; Motion Trail Lab now
  inherits the marker detector rather than shipping it. §10 also records the
  trademark boundary (mechanic open, "Plickers" name/artwork not) and the economics
  rationale.
- Why: owner decision — it is the flagship differentiator (per-child, device-free
  voting with no account, no subscription, no cloud) and demonstrates the
  local-first economics the app exists to prove.
- Verified how: design docs only; no code touched.

## 2026-07-21 (night, later still) — Camera category + future-widget notes

- [`camera-hub-design.md`](camera-hub-design.md) gained **§3.3 "Where camera widgets
  live in the UI"** and **§16 "Notes for future camera widgets"**.
- §3.3: camera activities get their own dock category tab beside Maths and Games,
  reusing the existing `TOOLS` `cat` / `PANEL_TITLES` / `catTab()` pattern
  (`app.js:10261`, `:10320`, `:10385`). Records that **the existing `webcam` widget
  (`app.js:6682`) must migrate onto the hub** — it currently calls `getUserMedia`
  directly, the per-widget pattern that breaks exclusive-access cameras — plus two
  migration hazards: its persisted `auto: true` restarts the camera unprompted on
  deck load, and its `webcam` type id must be preserved for saved decks.
- §16: the hub contract for any future camera widget (subscribe to the hub, honour
  the curtain/indicator/performance mode, reuse the four shared modules), and parked
  ideas — the EYFS/KS1 movement tier split into Tier 0 (frame differencing:
  wiggle-o-meter, statue game, zone voting) and Tier 1 (bundled models: gesture
  voting, face-landmark and pose games), with the honest 4–6 person tracking limit;
  plus panel-grouping guidance once the category outgrows a flat grid.
- Why: captures the sub-menu decision and keeps the EYFS/movement ideas from the
  original camera discussion on record — they are not among the six widgets.
- Verified how: design docs only; no code touched. Code references checked against
  `app.js` at time of writing.

---

## 2026-07-22 — Tangible Cubes design captured

- New `docs/tangible-cubes-design.md` — the printed-marker cube kit as a Sage Stage
  *input mode* rather than a separate AR app, written up from the existing working
  prototype in `sage-cubes-widget/` (js-aruco, real detection, print sheets, simulator
  fallback). Cross-referenced from `camera-hub-design.md`: header companion list, §11
  shared-modules marker-detection row, and §16.3, where the parked "card-based ordering
  and sequencing" idea is marked as developed into this doc.
- Why: two teacher constraints reshaped the concept and needed recording before they
  were lost. (1) **The small-world-toy gate** — any cube activity a box of small-world
  toys would do better is a downgrade, so activities must earn their place on
  reconfigurable identity, legibility to the room, or answering back. (2) **The tempo
  rule** — children cannot find and present faces at speed, so no countdowns, no timers,
  no whole-class simultaneity; this is the *opposite* tempo to Class Vote despite
  sharing its detector. Together these move the target from EYFS whole-class to **KS1
  primary, EYFS continuous provision only**. Also records the rotation decision (cubes
  ignore in-plane rotation; Class Vote uses it as its answer channel) and **cube packs**
  — lifting meaning out of code into authored/generated data, which is the change that
  separates this from reviving a gimmick.
- Also logged seven gaps between prototype and design, including two real defects found
  while reading it: `Sort & Count` can generate duplicate values across cubes with a
  `<=` ordering check that lets ties pass (`index.html:1244`, `:1421`), and
  `Sentence Lab` accepts exactly one role order so valid alternative sentences are
  marked wrong (`index.html:1438`). Print sheets currently emit marker + admin label
  only (`index.html:1322`) — unusable by a child, and the reason §8 requires meaning and
  marker to share a face.
- Build order puts Class Vote first (it hardens the shared detector), then two **kill
  gates** before any code: a paper sleeve-print spike and a performance-area spike.
- Verified how: design docs only; no app code touched. All prototype line references
  read and checked against `sage-cubes-widget/index.html` at time of writing; widget
  confirmed running and detecting at `http://localhost:8765/`.

---

## 2026-07-22 — English & literacy widget set designed

- New `docs/english-widgets-design.md` — the English counterpart to the maths
  manipulatives roadmap: **ten widgets on four shared engines** (vector writing
  surface, letterform alphabet, deck year-group setting, school-editable pack
  system), organised on a Sound → Word → Sentence → Text grain spine. Poster print
  is deliberately **not** in this doc — only its seam is fixed
  (`toPrintable() → standalone SVG`); it gets its own spec next.
- Why: Glenn asked for an English set with a full writing + modelling complement
  (Big Write, book pages, poster printing to the wall). Brainstormed to a roster,
  then re-grounded against a batch of UK literacy research Glenn supplied. Three
  decisions the research forced, worth recording: (1) **packs are
  adoption-critical, not a courtesy** — schools run SSP programmes with strict
  fidelity, so GPC order, formation patter, sentence-shape names, lenses and tier
  labels are all school-editable data with neutral defaults (Letters and Sounds
  2007 under OGL where possible); (2) **the working wall is the set's real
  output** — nearly every widget prints a wall artefact, which is why surfaces are
  vector end-to-end; (3) **marking polarity is a school setting** — pink/green
  conventions genuinely reverse between schools, so highlighter meanings are
  labels, not constants. Also records the one-alphabet/three-renderings letterform
  decision (~62 glyphs + ~8 cursive overrides, own drawings — school fonts can't
  be bundled per `vendor/fonts/README.md`) and the IP pattern table for branded
  schemes (JP, RWI, Considine, Peat, Word Aware).
- Architecture follows the `export.js` sibling-IIFE pattern: `letterforms.js`,
  `writing-surface.js`, `english-packs.js`, `english-word.js`, `english-text.js`,
  plus a future `print.js`. Existing `wordbuilder` upgrades in place to a morpheme
  workbench; new `english` toolbar tab beside maths/games. Build order P0–P3 with
  a five-glyph authoring gate before committing to the full alphabet.
- Verified how: design doc only; no app code touched. All cited line references
  checked against `app.js` at time of writing (`WIDGETS` registry :270,
  `templateSources` :182, `sanitizeTemplate` :9953, sketch writing paper :7631,
  `wordbuilder` :7115, document widget :6869, deck list precedent :252,
  `PANEL_TITLES` :10385, `SageExport.init` :11898).

---

## 2026-07-22 — licensing, bundles & release process designed

- Added [`licensing-design.md`](licensing-design.md) — how the app goes from free
  static folder to a paid downloadable desktop app. No app code touched.
- Model: one paid bundle, **Maths Toolkit** (the 11 widgets already tagged
  `cat: 'maths'` at `widgetTool` :10260 — `teachclock`, `moneytray`, `shop`,
  `frametiles`, `counters`, `dienes`, `pvcounters`, `rekenrek`, `numberline`,
  `barmodel`, `partwhole`). The other 32 widgets stay free, as does saving,
  decks, export/import and multi-window. Licence codes are ECDSA P-256 signed
  payloads verified offline — no account, no server, no telemetry.
- Rejected Key Stage bundles (the manipulatives are deliberately built to span
  EYFS→KS2, so a Key Stage split would cripple `dienes`/`frametiles`/`numberline`
  — Sage Stage splits by subject, not Key Stage) and per-widget purchase. An
  English bundle is deferred until [`english-widgets-design.md`](english-widgets-design.md)
  ships — there is not enough built to sell one today.
- Two findings that constrain the implementation: gating must be consulted **at
  render, never at registry load**, because `sanitizeTemplate` :9961
  (`if (!w || !WIDGETS[w.type]) continue;`) silently drops unknown types on
  import and `mountWidget` :8903 (`if (!def) return;`) renders nothing — either
  would destroy a teacher's saved work on a lapsed licence. And the free run
  must come *after* the gate ships (offline apps cannot count downloads or
  retract what an installed copy already has), so v1.0 ships gated and the first
  75 teachers get free permanent `founder` codes.
- Also captured for the shipping budget: three unrelated signing artefacts are
  needed — licence keypair (free), Tauri updater keypair (free), and **OS
  code-signing certs (Apple ~£79/yr, Windows ~£200–400/yr, not optional** — an
  un-notarized `.dmg` reads as "damaged" on modern macOS).
- Why: makes the desktop migration in
  [`storage-abstraction-plan.md`](storage-abstraction-plan.md) §9 a prerequisite
  with a commercial payoff attached, and fixes the build order (P0 Tauri → P1
  certs → P2 updater → P3 gate → P4 store → P5 ship).
- Verified how: design doc only; no app code touched. All cited line references
  checked against `app.js` at time of writing (`WIDGETS` registry :270,
  `addWidget` :8739, `mountWidget` :8903, `sanitizeTemplate` :9961, template
  import summary :10068, `widgetTool` :10260). Widget inventory (43 tools: 11
  `maths`, 5 `games`, 27 untagged) enumerated from the `widgetTool` call sites.

---

## 2026-07-22 (later) — code-signing researched; three corrections to the plan

- Revised [`licensing-design.md`](licensing-design.md) §9.4–9.6, §10 (P0/P1) and
  §11 after checking current terms. No app code touched.
- **Buy OV, not EV.** Microsoft's March 2024 Trusted Root Program update removed
  EV's distinct SmartScreen status — EV and OV now build reputation identically
  by download volume, so the EV premium buys nothing here (it remains needed only
  for kernel-mode/WHQL driver signing). Corrects the earlier assumption that EV
  grants instant SmartScreen trust.
- **Early downloads will trip SmartScreen regardless of certificate**, because
  reputation is earned by install volume and the first 75 teachers *are* that
  volume. Ship an install guide with the "More info → Run anyway" path — an
  unexplained warning reads as malware and stops a teacher dead.
- **Azure Trusted Signing (~$10/mo) is unavailable** — US/Canada organisations
  with 3+ years trading history only, individual onboarding paused since April
  2025. The cheap Windows route is closed; budget ~£150–250/yr for an OV cert
  plus its mandatory FIPS 140-2 hardware token (signing happens on the machine
  with the token plugged in, not on cloud CI). Cert lifetimes cap at 459 days
  from February 2026, so renewal is roughly annual.
- **New long pole: publisher identity.** Apple as an individual clears in 24–48h
  but shows Glenn's personal legal name as the developer; as an organisation it
  shows the company name but needs a legal entity + D-U-N-S and takes 2–4 weeks.
  This blocks both certificates, so §10 now starts the paperwork in **P0, in
  parallel with the Tauri migration** — it is calendar time, not work time.
- Why: makes P1 achievable on schedule rather than discovering a month of waiting
  after the build is finished; also sets a ~£230/yr fixed cost floor that the
  pricing decision in §11 has to clear.
- Verified how: design doc only. Terms checked against Microsoft Learn (Trusted
  Signing eligibility; SmartScreen reputation), Apple Developer enrolment/D-U-N-S
  help, and current CA reseller pricing — all subject to change, re-check at
  purchase.

---

## Entry template (append below)

```
## YYYY-MM-DD — short title

- What changed (files touched, versions bumped).
- Why (link the checklist item / plan phase / decision it advances).
- Verified how (tests, browser check, etc.).
```

## 2026-07-22 — Phoneme tiles lands (first English widget)

- What changed: new `english-packs.js` (Letters and Sounds 2007 phonics pack,
  OGL) and `english-word.js` (`SageEnglishWord`, `phonemetiles` widget); app.js
  gains the English toolbar tab + panel, deck `yearGroup` (both factories, deck
  menu "Set year group…", boot init + TOOLS push); `english`/`phonemetiles`
  glyphs in icons.js; `pt-*` styles in style.css; index.html script tags
  (english-packs v1, english-word v2) and bumps (style v32, icons v16, app v37).
  Build spec: docs/phoneme-tiles-design.md (slice of english-widgets-design.md
  §5.1 — P0 starts).
- Why: first widget of the English set; phoneme tiles chosen as the slice that
  needs no letterform engine and forces the pack system to exist early.
- Verified how: browser pass — drag/snap/bin, split digraph (two-cell claim,
  vault arc, loose form, end-of-frame refusal), dot/bar/arc derivation, Say-it
  pulse+sweep timing at steady and brisk, Flash/Cover, tricky cards float-only,
  cumulative tray + Phase 4 empty sets, year group → auto phase (Y1→4) via real
  dashboard UI, per-widget override + Auto reset, resize rescale, reload
  persistence, hostile-pack harness (XSS inert, caps enforced; harness deleted).
  One bug found and fixed post-test: `placeTile` ignored `cell` so preset-built
  tiles rendered at mat centre — cell now wins over x/y.

## 2026-07-22 — "Say it" → "Sound talk" (deliberate-silence clarity)

- What changed: english-word.js v3 — button renamed to "Sound talk", tooltip
  now says "no audio" outright, and a once-per-session toast on first press
  ("You're the voice — say each pure sound as its button pulses…"); settings
  hint reworded; spec quick-bar section updated.
- Why: Glenn read the silent Say it button as a bug in Firefox/Chrome. The
  silence is design principle 6 (teacher voices the pure sounds; no recorded
  or synthesized audio) — but a control that looks broken to the designer will
  look broken to every teacher. The widget now explains the contract itself.
- Verified how: browser — first press shows the toast, pulses 0→1→2 and sweep
  still run, second press stays quiet (flag is once-per-session).

## 2026-07-22 — Sound talk retuned for a 5-year-old following along

- What changed: english-word.js v4 + style.css v33. Paces slowed to
  2200/1300/750 ms per sound (slow = model-and-echo beat). The beat now lights
  the whole grapheme: active tile scales 1.16 with a 5px dark-teal ring and
  glow, its sound button scales 1.65 and holds for 72% of the beat, all other
  tiles dim to 0.32 (mat gets .pt-talking). Split digraphs light both halves
  as one. The blend sweep gained a follow-along ball on its leading edge and
  relights each grapheme as it passes (splits stay lit across their span);
  sweep sized to the frame, sound buttons ~20% larger at rest.
- Why: Glenn's field note — the old 0.55s glyph blip was a UI affordance, not
  a teaching cue; a Reception child (possibly trilingual) following along needs
  the visual alone to carry which sound / when / for how long, in colour,
  contrast, size and speed. One signal, one meaning: the lit grapheme is the
  sound being voiced now.
- Verified how: browser timing trace (beats, 72% holds, gaps, sweep start,
  per-box relights incl. split span overlap, full cleanup — all to schedule at
  brisk); mid-beat screenshot at slow pace showing k lit + ringed with m/a/e
  dimmed; node --check.

## 2026-07-22 — Sound talk proficiency buttons (New / Practising / Fluent)

- What changed: english-word.js v5, style.css v34. The single Sound talk button
  became a labelled segment — Sound talk: New (2.2s) / Practising (1.3s) /
  Fluent (0.75s). One tap sets the pace, persists it (active state shows the
  last-used level) and runs the routine. Pace row removed from settings — one
  control, one place. Stored keys stay slow/steady/brisk so existing widgets
  keep their pace; labels are generic proficiency words (nothing scheme-owned).
- Why: Glenn — children follow at different speeds; the speed choice should
  reference proficiency and live at the point of use so a teacher can match
  the run to the group mid-lesson.
- Verified how: browser — segment renders with stored pace active ("New" from
  a widget saved as slow), Fluent beats measured ~750ms, New beats ~2160ms,
  active state follows taps, settings shows Phase/Frame/Word only.

## 2026-07-22 — Tray never clips: every grapheme visible at every size

- What changed: english-word.js v6, style.css v35. Removed the tray's
  max-height + scrollbar. Tray tile size is now computed per paint — the
  largest of 12–26px whose projected wrapped rows fit ~40% of the widget
  height at the current width (count-aware: Phase 2's ~25 tiles render large,
  Phase 5's ~70 smaller); tray typography moved to em units driven by a
  --pt-tray variable, so chips and dividers scale together. Mat keeps the
  remaining height and its frame re-derives from it (one ResizeObserver
  corrective pass, verified non-oscillating).
- Why: Glenn — Phase 3/4/5 trays were cut off behind a 104px scroll cap;
  children and teachers must see every letter to choose from, and widgets
  shrink as slides fill up.
- Verified how: browser — Phases 2/3/5 all report zero clipped tiles and no
  scroll (tray/mat split 108/222, 173/157, 198/132 at ~860px); worst case
  467px-wide widget with 67 tiles: all visible at the 12px floor; stability
  sampled over 1s (no repaint oscillation); screenshots.

## 2026-07-22 — ResizeObserver was silently cancelling fresh sound-talk runs

- What changed: english-word.js v7. The mat's ResizeObserver now repaints only
  when the mat's size actually changed (≥1px either axis, tracked across
  paints); it previously fired on observe and sub-pixel settles, and paint()
  calls stopSay() — so a Sound talk started within a frame of any tray/layout
  reflow (e.g. right after a phase switch) was killed before its first beat.
- Why: found while verifying the sock builds for Glenn ("I think this needs a
  check") — the run started (hint toast fired) but zero beats played. Also
  retro-explains an earlier "empty pulses" result that was misread as a test
  harness race.
- Verified how: browser — s|o|c|k gives four dot-beats at 750ms then a sweep
  relighting all four; s|o|ck gives three beats (dot dot bar) with the ck bar
  pulsing once; both runs now start reliably immediately after build/phase
  clicks. Sweep width measured equal to frame width (266px), confirming the
  ball crosses trailing empty boxes — pending Glenn's call on sweeping to the
  last filled box instead.

## 2026-07-23 — Blend sweep stops at the last filled box

- What changed: english-word.js v8. The sound-talk sweep (track, ball and
  relight timings) now spans only to the end of the last claimed frame box —
  trailing empty boxes take no beat. New sweepSpan() feeds drawFrame (track
  width) and sayIt (duration + per-grapheme relight fractions), so the resting
  track also previews where the blend will run. Full frames behave exactly as
  before (span = box count).
- Why: Glenn's call on the open question from 2026-07-22 — the ball crossing
  empty boxes stretched the blend past the word and muddied the finger-sweep
  it reproduces.
- Verified how: browser — s|o|ck in a CVCC frame: track 199px vs frame 266px
  (exactly 3 of 4 boxes, left-aligned), --sweep-ms 1200ms (span-derived; the
  old frame-derived value would be 1350ms), run starts, relights and cleans up.

## 2026-07-23 — Word class sorter ships (first Word-grain widget, P1 starts)

- What changed: english-word.js v8, app.js v38, icons.js v17, style.css v36.
  New wordsort widget (design §6.3): word cards sorted into labelled class
  columns. NC terminology windows — Y2 noun/verb/adjective/adverb, Y3 adds
  preposition/conjunction, Y4+ all eight — following the deck year group with
  a Y2/Y3/Y4+ override seg. Own word bank (~62 single-class words + 10 traps);
  deal is 3 per class (2 when six-plus columns) + 2 traps. Open sort until
  Check marks placed cards; a trap correct in any of its classes gets a gold
  ring + ★ and a "can be: …" tooltip — discussion gold. Settings: three
  presets, column toggles, and a per-word editor (class-tick chips, add ×
  delete); teacher words survive New words re-deals. Counters grammar: drag,
  bin (rect-tested — .ct-bin is pointer-events:none, learned the hard way),
  off-widget removes. No subject/object columns, per the doc's role boundary.
  Deferred as agreed: packs, prints.
- Why: Glenn picked it as the minimal next English build — no engine
  dependencies, no timing code, checkable OGL content.
- Verified how: browser — dealt Y2 and Y4+ hands match spec counts; synthetic
  and real pointer drags land in columns/pool/bin; Check: ✓/✗/gold verified
  ("6 ✓ · 1 ✗ · 1 discussion gold" toast, light ringed gold in Noun); marks
  clear on move; year switch re-deals keeping the custom word; column toggle
  drops orphaned cards to the pool; "Zebra!!" normalises to zebra, ticked
  noun, checks ✓; zero console errors; screenshots.

## 2026-07-23 — Sorter takes school word lists: paste/upload import + CSV template

- What changed: english-word.js v9, style.css v37. The sorter's settings gain
  a bulk import block for school lists (Rudston-style): paste into a textarea
  or upload a .csv/.txt, one word per line — word first, then any classes
  (full names, chip abbreviations, plus "connective"→conjunction and
  "article"→determiner aliases; plurals and Excel tabs tolerated) — and the
  class ticks fill themselves en masse. Plain word lists import as open words
  (no ticks, Check leaves them alone). Download saves the current round as
  the word,classes CSV — the template and the backup are the same file, so
  the round trips through Excel. Replace-vs-add is a saved widget setting
  (impReplace); duplicates update in place; case preserved (Christmas, Mr);
  wrapping quotes stripped but interior apostrophes kept (don't, o'clock).
  Single-word Add stays for harvest moments and no longer lowercases.
- Why: Glenn — schools have their own lists and ticking eight checkboxes per
  word in Y4+ doesn't scale; import/paste + downloadable template instead.
- Verified how: browser — 13-line hostile paste (header row, plain words,
  classed rows, curly quotes, tabs, plural/slash classes, aliases, junk line,
  duplicate) → "10 added · 1 lines skipped", ticks exactly right, Christmas
  capitalised; don't/o'clock keep apostrophes after the wrapping-quote fix;
  upload via real File → auto-import; Download blob re-read: valid
  word,classes CSV including multi-class rows; imported answers drive Check
  (because→conjunction ✓ under Y4+); merge mode appends; replace choice
  survives panel close/reopen (a fresh-panel closure reset silently ate a
  26-card round during testing — hence the saved setting); zero console
  errors; screenshots.

## 2026-07-23 — Sorter CSV writes a header for every column it uses

- What changed: english-word.js v10. wsListCsv now emits `word, class 1,
  class 2, …` with as many class columns as the teacher's own columns on
  screen (Y2 → 4, Y4+ → 8), never fewer than the longest answer in the round,
  and pads every row to that width so the file opens as a complete rectangular
  grid. Previously the header was the single pair `word,classes`, so a word
  with five classes (round, back) spilled data into four unheaded columns.
  Settings hint now states the layout: word in the first column, one class per
  column after it.
- Why: Glenn, with a screenshot of the download open in Numbers — a teacher
  who did not write the file sees data under blank headers, concludes the app
  cannot read those columns, and emails rather than edits. "These people are
  not me who'd automatically add headers."
- Verified how: browser — Y4+ download header is word + class 1..8 (9 columns),
  Y2 is word + class 1..4 (5 columns), every row equal width in both; full
  round trip (download a round containing 5-class round and 4-class back,
  re-import that exact text) restores all classes intact, water stays open
  with no ticks, and the header row is still skipped rather than becoming a
  card; zero console errors.

## 2026-07-23 — Sorter CSV is now a grid of the sorter itself; redeal stops doubling words

- What changed: english-word.js v11. (1) The download's headers are the class
  NAMES — word, Noun, Verb, … — covering the columns on screen plus any class
  a word in the round carries, and each word's classes sit in their own
  columns (fast → blanks under Noun/Verb, Adjective and Adverb in theirs).
  The "class 1..class 8" positional headers from v10 lasted one review:
  labels that name nothing read as broken to anyone who didn't write the
  file. (2) The parser understands the grid: a header row maps each column
  to its class, a cell ticks by naming a class or by any mark (x, ✓, yes) in
  a headed column, and a misspelt class name in its own column still ticks
  that column. Free-form lines (word, classes after a comma) and plain word
  lists parse exactly as before. (3) wsRedeal no longer deals a bank word
  the teacher already has (Glenn's screenshot caught "round" twice — bank
  round beside imported round), and mount now heals rounds saved with such
  duplicates.
- Why: Glenn, with the v10 file open in Numbers — "fix this so the headers
  match the word groups and columns."
- Verified how: browser — Y4+ header is word + all eight class names, Y2 is
  word + four (plus any class a word carries beyond the window); fast's row
  puts Adjective/Adverb in their own columns; three consecutive
  import→wait→read cycles agree between DOM and localStorage; x/✓ marks and
  a deliberate "nuon" under Adjective all tick correctly; fresh Y2 deal with
  imported customs has zero duplicate words (bank slippery correctly skipped
  beside imported slippery); zero console errors.
- Testing note for future sessions: save() is debounced 250ms (app.js:201) —
  read state ≥300ms after an action or read the DOM; racing it produces
  phantom "stale imports". A file:// copy of the app in another pane tab has
  its own separate localStorage and never cross-talks with localhost.

## 2026-07-23 — Word class sorter closed for real-teacher feedback

- What changed: no code — a closing checkpoint. Verified index.html's cache-bust
  versions are internally consistent with every file touched this session
  (english-word.js v11, style.css v37, icons.js v17, app.js v38); grepped all
  edited files for stray console/debugger statements (none); cold-reloaded the
  app fresh with console open (zero errors, dashboard renders, deck thumbnail
  shows both widget icons). Cleared three custom words left on the sorter from
  CSV-import testing (fair, softly, slippery — identified precisely via
  props.custom, removed by name through the panel's own × button, not a raw
  storage edit) and re-dealt via "New words" so the widget Glenn hands to a
  teacher shows an ordinary Y2 round: 14 words, nothing custom, nothing
  sorted, nothing marked, zero duplicates. Left the phoneme tiles widget's
  "make" build as-is — a coherent demo, not test debris.
- Why: Glenn — "let's close this for actual teacher usage and feedback."
  Sound-talk sweep fix and the word class sorter (build, bin-hit-test fix,
  bulk CSV import/export, header-grid fix, redeal-dedup fix) are feature-
  complete for a v1 and verified; pausing new English-set work here rather
  than starting word bank, so real usage can surface what actually needs
  fixing before more gets built on top.
- Known deferred, not forgotten: the settings panel's bulk-import block still
  sits below a scrolling per-word editor (raised 2026-07-23, Glenn didn't
  take it up) — worth revisiting only if real in-situ use shows it's actually
  slow to reach, rather than fixing blind.
- Note for next session: a fresh install (empty localStorage) never sees any
  of this session's test content — blankDeck() ships zero widgets. Today's
  cleanup only matters if this same dev deck (this browser profile's
  localhost:8642 origin) is what gets demoed or handed over directly.

## 2026-07-23 — Word bank shipped (English slice 3, P1)

- What changed: the `wordbank` widget — corkboard capture, three tier lanes,
  and the teach card. Files: `english-word.js` v12 (slice 3: WB_* helpers +
  `WIDGETS.wordbank`), `style.css` v38 (`wb-` block), `icons.js` v18
  (`wordbank` glyph), `app.js` v39 (`pickImage` joins the
  `SageEnglishWord.init` deps; `TOOLS.push(widgetTool('wordbank', …))`).
  Build spec written first and reviewed: `docs/word-bank-design.md`.
  - **Board**: type in the quick bar, Enter, the card lands on a free-slot
    walk that clears every card already down — existing cards never move.
  - **Lanes**: three tier columns (labels editable per widget, defaults
    Everyday / Power / Subject words) reusing the sorter's ghost-drag; lanes
    scroll rather than clip, deliberately unlike the sorter, because a bank
    runs to 60 picture cards and a clipped card is invisible data.
  - **Teach card**: big word + first-sound chip derived from the phonics pack
    (chip→ch, shark→sh, queen→qu), syllable dots you tap to clap, picture
    slot, and four lines — meaning, sentence, action, and the EAL home-
    language line.
- Why this widget now: it was the natural next P1 pick — zero shipped content
  and it unblocks sentence-builder docking (both consumers read `p.words`).
  Slice chosen with Glenn: capture + lanes + teach card; Frayer view, shades
  meter, prints, the `tiers` pack kind and CSV export all stay deferred.
- Design review before building caught five things worth fixing in the spec
  rather than the code: the landing rule, the import pipeline's order and
  destructiveness, lane/overlay overflow, an encoded image cap, and the
  sanitiser's field list. **Replace-on-import is membership, not
  wipe-and-rebuild** — a word on the new list keeps its picture, its meaning
  lines, its tier and its place on the board. Wiping is fine in the sorter
  (tick arrays only); here it would destroy teach cards a teacher spent a
  lesson filling in.
- Three defects found and fixed during verification:
  1. The bottom-right landing cell put a card under the bin (measured: card
     right edge 0.904 vs bin left 0.895) — that corner is now reserved.
  2. Landing used centre distance in grid cells, so *extraordinary* landed on
     top of *sleet*; replaced with a real box-separation test sized from the
     word's own length. The cell-pitch version also sat exactly on a floating-
     point boundary, so rounding error decided which neighbours counted.
  3. Past ~24 cards every further card landed on **one identical point** —
     reproduced at 17 stacked cards in a 40-word import, which is an ordinary
     school-list import. Overflow now tiles with a per-pass diagonal nudge; no
     two cards share a coordinate at any bank size up to the 60 cap.
- Verified in the browser (no test suite): 14-word capture with zero overlaps
  and nothing off-board or on the bin; lane drag, un-tier, and bin-from-lane;
  **two full Board⇄Lanes round-trips moved zero cards** (the spatial-stability
  guarantee); teach card end to end including Cancel-preserves / blank-clears
  on every line, syllable clamping 0–6, Escape to close, and Polish diacritics
  surviving the EAL line; first sounds for chip/shark/queen/thin/apple/night/
  Christmas; import of a sorter CSV (header row skipped, quotes stripped)
  where replace mode kept a filled-in card byte-for-byte and dropped the rest;
  a junk-only import mutating nothing; a hostile saved state (200 KB image,
  `javascript:` URL, nulls, duplicate ids and words, out-of-range coords,
  104 words) sanitised to a clean 60; pool and teach panel both scrolling to
  reachable content at 360×300. Zero console errors throughout.
- On the review workflow: a multi-agent adversarial review ran alongside and
  **hit the monthly spend limit — 66 of its 86 agents died**, so it is a
  partial pass, not a clean bill of health. Its three surviving findings are
  the three fixed above (each re-verified by hand first, and one of its
  claims — that `save()` fails silently on a full quota — was wrong;
  `app.js:201` already toasts). Worth re-running when budget allows.
- Left on the dev deck: an ordinary winter-vocabulary bank — 8 words, 4 of
  them tiered, `shiver` with a filled teach card — as a coherent demo rather
  than test debris. As last session: a fresh install sees none of it.

## 2026-07-23 — Word bank: open-in-place, and sets that arrive complete

- Why: Glenn, on using the v1 — the paste-in list and the reference
  information are both good, but two things were wrong for real teaching.
  Showing a word meant the full teach card replacing the whole widget, which
  throws away the wall the class is reading from; and filling four lines for
  every word "is such a time deep exercise" that no teacher would do it. His
  conclusion, and the brief: **an uploadable format for word bank sets with
  all the extra information already in it, not added piecemeal.**
- **Open in place** — a third card state between popped and the full card.
  Tap pops; tap again opens the card *where it stands*, showing whichever of
  meaning / sentence / action / home language have been written; tap again,
  tap the bare board, or Escape closes it; 📖 still opens the full teach card
  for the picture, beats and editing. The opened card is anchored by the
  corner its collapsed self occupied so the word does not jump, grows down
  and across its neighbours on z-index, and is nudged inside the board only
  if it would otherwise be cut off. Dragging an open card closes it first.
  One open at a time; the open state is deliberately never persisted.
- **Word bank sets** — `word, tier, meaning, sentence, action, home language,
  beats`. Download writes the bank out as that sheet and doubles as the
  template (an empty bank emits three worked rows, so the file teaches its own
  format). Because every column is named, the blank sheet is also what a
  teacher hands an AI to fill for their topic and pastes back — that workflow
  falls out of named columns and needs no AI in the app. Tier accepts 1/2/3,
  the lane's name, or a renamed lane's name; header names match forgivingly
  (definition/"what it means", example/sentence, "show me"/action,
  EAL/translation/home language, syllables/beats).
- This forced a **real CSV reader** (`wbCsvRows`): the sorter's `split(',')`
  would shred `"to shake because you are cold, or frightened"`. Quoted fields,
  embedded commas and newlines, `""` escapes, and tabs as separators — a
  spreadsheet puts tabs on the clipboard, which is how most teachers will
  actually paste. Used in both directions, so the file round-trips.
- **Merge rule (Glenn chose it): a filled cell updates, a blank cell leaves
  well alone**; pictures, pins and board positions are never the file's
  business. A teacher who downloads, fixes one column and re-imports keeps
  everything they typed on the board in between. Cost, accepted: you cannot
  clear a line from the spreadsheet, only in the teach card.
- Verified: an embedded-comma meaning survives import intact; tier by name
  and by number; Polish diacritics intact; **download → wipe → re-import
  reproduces every field byte-for-byte**; blank cells preserved and a filled
  cell updated on re-import while picture, pin and position stayed untouched;
  empty-bank download emits the three-row template; plain word list and a
  pasted sorter CSV still import exactly as before; tab-separated Excel paste
  parses; reveal shows only the filled lines, gives a nudge when none are
  written, holds its corner exactly when there is room and clamps only when
  the panel would run off the board (measured: card at y=341 on a 419-tall
  board, lifted to 211); drag closes it; Escape closes it. Zero console errors.
- Versions: `english-word.js` v13, `style.css` v39.
- Worth a look when Glenn next uses it: board card text is capped at 24px
  (`boardFont`), so on a large interactive whiteboard the opened card's lines
  may read small from the back of the room. Left alone rather than guessed at
  — it is a v1 choice, not a regression, and the full teach card is still the
  whole-class view.

## 2026-07-23 — Word bank set files: the whole bank, pictures included

- Why: Glenn — "the image importer is a priority… other applications that are
  for learning in this style have online banks of this data to download
  elsewhere and then upload to use. The file type needs to be tight to the
  widget here." A spreadsheet cannot carry a picture, so the CSV added earlier
  today could never be the answer for a prepared set.
- **The format decision, and why it is not a custom extension.** Glenn asked
  the right question — "what universal file types can do this" — so the
  options were laid out honestly: JSON, zip, HTML and xlsx can all carry text
  plus embedded images; CSV cannot. A `.wordbank` extension would have been a
  rename, not a file type: the OS would not know it, double-clicking would do
  nothing, and some mail servers strip unknown attachments. Settled on
  **`<set>.wordbank.json`** — a real universal type, with the widget's name in
  the filename. **Tightness comes from the envelope, not the extension**:
  `sage-pack@1` + `kind: "wordbank"`, and anything failing that check is
  refused. An extension can be renamed by anyone; the envelope cannot.
- Rides the pack envelope from the English set design §9 on purpose, so the
  same file can later be published to a school's hosted bank and listed
  beside templates with no format change. Carries tier labels and per word
  `w, tier, def, eg, act, home, syl, img`. Deliberately does **not** carry pin
  or board position — where a card sits is the teacher's work, not the set
  author's, and it survives every import untouched.
- **Storage is the real constraint, so every imported picture is re-fitted
  against a set-wide budget** (~1.5MB across the set, floor ~14KB each). A
  deck shares one localStorage with every other widget; a set built on a
  roomier machine must not be able to fill this one. Verified: a 4.64MB set of
  30 photos at 157KB each landed as 0.64MB with **all 30 pictures kept**,
  largest 22KB, deck healthy.
- Export prompts for a set name and puts the share nudge in that prompt — the
  moment a file with pictures inside it leaves the machine is the moment to
  say it. Two save buttons now: set (with pictures) and sheet (without).
- **Bug found and fixed during verification: picture cards overlapped.** The
  landing model sized every card as text-height (~46px) when a picture card
  measures 94px, so a 12-picture import produced **7 overlapping pairs**.
  Height is now per-card like width. Re-measured after the fix: clean to 14
  all-picture cards and ~15 mixed; beyond that overlap is physical, not
  algorithmic — 419px of board cannot stack more 94px cards, which is what
  Lanes is for. No two cards share a coordinate at any count, as before.
- Security, verified against a deliberately hostile set: no script executed;
  **SVG images refused** (they can carry script), as are `javascript:` and
  `data:text/html`; HTML in a meaning stored and rendered as literal text;
  100 words capped to 60; a 4000-character meaning cut to 140; out-of-range
  tier and beats dropped. Angle brackets are now stripped from tier labels —
  harmless via textContent, but a heading the class reads should not look
  like markup. Four bad-file cases (wrong pack kind, plain JSON, broken JSON,
  a set with no usable words) each give a plain-English toast and **leave the
  bank untouched**.
- Also verified: export → wipe → re-import through the real file picker
  restores every word, meaning, tier and picture, with pin and position
  correctly absent from the file; a set's lane names only adopt over a bank
  still using the standard ones, so a renamed school keeps its wording.
  Zero console errors.
- Versions: `english-word.js` v14.
- Left on the dev deck: the Rainforest (Y4) set — 6 words across three tiers,
  two with pictures — as a demo of a set arriving whole. 13KB of storage.

## 2026-07-23 — Word bank sets become archives (the base64 correction)

- Why: Glenn opened a saved set in an editor and found the picture as a wall
  of base64 — "this looks odd to a teacher. The image should be attached, in
  line, readable to a human. I thought the JSON file would do this." He was
  right, and the earlier recommendation was wrong on the point that mattered:
  it weighed file size and code cost and under-weighted whether a teacher can
  open the file and understand it. **JSON holds text only, so an image inside
  one must be encoded as that wall — no arrangement of JSON fixes it.**
- **The set file is now an archive**: `<set>.wordbank` containing a short,
  readable `set.json` (a picture is `"img": "images/canopy.jpg"`, not a blob)
  beside an `images/` folder of real photographs a teacher can double-click.
  Pictures are named after their words, so the folder reads like the bank.
- **`.wordbank` rather than `.zip`** — the .docx/.epub/.sb3 approach, chosen
  by Glenn over plain `.zip` because Safari auto-expands zip downloads and
  would leave a teacher with a folder and no file to open. Rename it to .zip
  to look inside; intact by default, which is the path that has to work.
  Import sniffs the file's own bytes rather than the extension, so a renamed
  set still opens, and **the older single-file `.wordbank.json` still imports**.
- New file `zip.js` (`window.SageZip`) — no libraries, no build step. Writes
  store-only: a set's pictures are already-compressed JPEG/PNG so deflating
  them buys nothing, and store keeps the writer synchronous. Reads store
  *and* deflate via the browser's own `DecompressionStream`, because a
  teacher who unpacks a set, swaps a picture and re-zips it with Finder hands
  back a deflated archive with a folder entry in it.
- Verified beyond self-consistency, which is the point that matters for a
  binary format: the archive passes the **system `unzip -t`** (every CRC OK)
  and lists correctly; and an archive **re-made by the system `zip`** (deflate,
  with a folder entry) reads back through zip.js with set.json intact and the
  JPEG byte-identical at 5013 bytes.
- Full journey through the real file picker: seed a bank → save set → empty
  the bank to zero → open the archive → all words, meanings, tiers, beats and
  **both pictures** restored identically. Rejections all clean and
  non-destructive: a zip with no set.json, a zip whose set.json is a phonics
  pack, and a set naming a picture that is not in the archive (word kept,
  picture dropped, toast says so).
- Security: a picture is judged **by its own first bytes**, never its
  extension — which is how **SVG stays out without a rule of its own**, being
  text. A set referencing `images/evil.svg` containing a script tag imported
  the word with no picture and ran nothing.
- Versions: `english-word.js` v15, new `zip.js` v1.
- Left on the dev deck: the Rainforest (Y4) set, 6 words across three tiers,
  two with pictures. 13KB.

## 2026-07-24 — Sets are plain .zip, and every set carries its own preview

- Why: Glenn double-clicked a saved `.wordbank` file and macOS answered
  *"There is no application set to open the document"* — a dead end, every
  time, for anyone who tries to look at their own file. He predicted this
  when he first asked "what universal file types can do this", and again
  when he said the file needs to be universal; the recommendation to use a
  bespoke extension was wrong both times. It traded a certain, every-time
  failure for an occasional Safari download quirk.
- **Sets now save as `<name>.wordbank.zip`.** A real zip that every operating
  system opens, with "wordbank" in the name so the file still says which
  widget it belongs to — the same universal-type-plus-descriptive-name shape
  Glenn picked for the earlier JSON. **Standing rule, written into the spec:
  do not offer a custom extension for this file again.**
- **Every set now carries `preview.html`.** Unpack the zip, double-click it,
  and the whole bank is laid out with its photographs — tier colours,
  meanings, sentences, actions, beats — in any browser, offline, with no Sage
  Stage installed. This is the other half of what Glenn asked for: not just a
  file the OS can open, but one a teacher can read and check before they
  trust it. Generated with every string HTML-escaped; no scripts, no external
  references, light and dark.
- Verified with system tools rather than only our own reader: `unzip -t`
  passes all four entries; the extracted folder is preview.html + set.json +
  images/, and `file` reports both pictures as genuine 320x240 JPEGs. The
  preview page was rendered from the real generator and checked in a browser
  — both images load, the page is self-contained, and a word deliberately
  named `<script>alert(1)</script>` displays as literal text with zero script
  tags in the body.
- Round-trip through the widget's own picker: save set → empty the bank to
  zero → reopen the archive → all six words, meanings, tiers and both
  pictures restored identically. `preview.html` is ignored by the importer,
  which looks only for set.json.
- Versions: `english-word.js` v16.
- Note on process: this is the second u-turn on this file format in two days,
  both times because a technically-reasonable recommendation lost sight of
  what a teacher actually meets when they touch the file. Weight that first.

## 2026-07-24 — Authoring a set: forgiving filenames, folders, and the sheet in the package

- Why: Glenn walked the real workflow — a set is often built by a teaching
  assistant (or the teacher; frequently both on the same set), with an LLM
  filling the text and an image model drawing the pictures. He showed the
  actual output: Gemini read the exported CSV with pandas, reverse-engineered
  the schema unprompted and wrote a TA guide; the pictures came out as one
  contact sheet, split by a second tool into `01-look.png` … `20-chip.png`.
- **That killed the convention proposed an hour earlier.** The design said
  match `canopy.jpg` to *canopy*; real output is numbered, so it would have
  matched **none of the twenty**. Matching is now forgiving instead: lowercase,
  drop the extension, hyphens and underscores become spaces, leading digits
  and their separator stripped. `01-look.png` → *look*, `18-food-chain.png`
  and `food_chain.PNG` → *food chain*. Stripping leading digits is safe rather
  than a guess — the word charset has never allowed digits. Verified against
  all twenty of the real filenames: every one matches.
- **Position is a last resort and only for pure numbers** (`07.png` = row 7).
  Alphabetical is never a fallback — that is how a shark lands on *chip*.
  An explicit `picture` column beats both.
- **Reporting both directions, every import**, because at twenty words the
  person needs a checklist rather than a mystery: *"No picture yet for:
  emergent, humid, adapt"* and *"Matched no word: 02-small.png, IMG_4021.png"*.
- **Upload now takes a folder, or the sheet and its pictures selected
  together**, not just a zip. Zipping is the right shape for sending a set; it
  should not be a tax on building one. One assemble path underneath serves
  zip, folder, loose files and pasted text alike.
- **The sheet travels inside the package** — `preview.html`, `set.csv`,
  `set.json`, `images/` — and **set.csv wins on import**, with the toast
  saying so ("Used set.csv — that is the file to edit"). Glenn chose both
  files with the divergence risk stated; that risk is defused by the preview
  naming the sheet and the import announcing which it used. Verified: a sheet
  edited inside a re-zipped folder beat a stale set.json, picture intact.
- **preview.html now says it is a snapshot from its save date.** It cannot
  refresh itself — browsers block a `file://` page reading the sheet beside
  it — so without that line someone edits set.csv, opens the preview to check
  their work and sees the old set with no error and no clue.
- **Excel was eating the home-language column.** The exported sheet now
  carries a UTF-8 byte order mark. Verified at the byte level (EF BB BF, since
  TextDecoder silently swallows it) and end to end: `wilgotny · رطب · drżeć`
  survives app → sheet → package → re-import unchanged.
- Also: a `picture` column that doubles as the naming checklist, and a **Copy
  the AI prompt** button carrying a ready-made prompt — including "NO TEXT OR
  LETTERING IN THE IMAGE", because the card already prints the word underneath
  and Gemini's cards had it baked in, showing it twice.
- **Contact-sheet slicing was considered and rejected** (Glenn's call): it
  cannot ship without a confirm-and-drag screen, since a silent mis-slice puts
  a shark on *chip*, which is worse than no picture. Revisit only if the
  splitting step proves painful in real use.
- Verified end to end in the browser: a 22-file selection (sheet + 20 numbered
  pictures + a stray) imported 17 unique words with all 17 pictured, and named
  the four files that matched nothing; the reverse case named the three words
  still without pictures; save → empty → reopen restored everything
  identically. Zero console errors.
- Versions: `english-word.js` v17.
- Note: all of this belongs on the help page when it exists, with a video
  walkthrough. `docs/word-bank-design.md` §"Building a set outside the app" is
  written as the source that page draws from, not as teacher-facing copy.

## 2026-07-24 — Contact-sheet slicer (reversing the "no slicing" decision)

- Why: Glenn proved the image model will only produce text-free pictures as a
  single grid — "Gemini can. It has to be bludgeoned… the fastest way is: make
  a contact sheet, screenshot the tiles, name them, upload. Less faff." His
  manual method already worked with the forgiving matcher, but the twenty
  screenshots and renames were the remaining faff. He chose to have the widget
  absorb the sheet — reversing the same-day decision to keep slicing out, now
  that the contact sheet is demonstrably *the* output rather than a nuisance.
  Owned the reversal in the design doc.
- New: `wbGridFromImage` / `wbCropTile` / `wbOpenSlicer` in english-word.js,
  a `.wb-slicer` confirm modal, and a "Cut up a picture sheet…" button (words
  first, then it fills their pictures).
- **The cut is gutter-detected, not count-divided**, because an AI grid is not
  even: read the paper colour from the border, project "is this background?"
  onto each axis, take the not-background strips as tile rows/cols. Verified on
  a deliberately UNEVEN 5×4 synthetic sheet with a blank cell — found the grid
  exactly and dropped the blank.
- **Design bug caught in testing and fixed: mapping must be positional, not
  shift-on-skip.** The first cut auto-skipped a blank tile and shuffled every
  later word up a slot — a gap in the middle would slide the whole rest of the
  set onto the wrong pictures. Rewritten so tile position i always belongs to
  word i; a blank/dud just leaves that one word unpictured, everyone else put.
- Order is fixed by **tap-to-swap** (tap one tile, tap another — better than
  drag on a whiteboard) and a corner **✕** drops a picture a word should not
  get. **Across/Down steppers** override detection with an even N×M — verified
  by feeding a gutterless sheet (detected as 1 tile) and rescuing it to 4×4.
- Verified end to end in the browser: uneven-grid detection; positional
  pairing of 20 tiles to 20 words ("one each"); tap-swap of two tiles persists
  through import (egg/frog traded, both kept, differ); ✕ drop leaves that word
  with no picture and the note reads "19 · 20 — 1 with no picture yet"; Use
  merges 19 pictures onto the right words as data URLs through the set budget;
  Escape cancels the modal without touching the bank and leaves the settings
  panel open. Zero console errors.
- Also fixed while here: the AI-prompt textarea shared class `.wb-imp` with
  the import box (harmless — nothing selects it internally — but fragile);
  gave it `wb-promptbox` and started it hidden until the Copy button reveals it.
- Test-debris note: scripted resets this session left three word bank widgets
  on the dev deck at one point — briefly looked like a mount leak, but state
  genuinely held three (the code renders exactly what state contains). Reset to
  one clean widget. A fresh install still ships zero widgets.
- Versions: `english-word.js` v20, `style.css` v41.

## 2026-07-24 — Slicer proved on a real sheet; three tweaks from first use

- Glenn ran the whole workflow for real: Gemini contact sheet → "Cut up a
  picture sheet…" → a Y2 life-cycle bank with lifecycle, stage, egg, hatch,
  larva, pupa, metamorphosis and the rest, all text-free, correctly paired.
  **The pipeline works end to end on genuine AI output**, not just synthetic
  test grids. Three tweaks came out of using it:
- **Settings actions are now coloured by what they do**, and all bolder — a
  column of identical pale pills made a teacher read every label to find the
  one they wanted. Teal = bringing something in (open set/folder/pasted
  sheet), solid teal = the headline action (cut up a picture sheet), amber =
  sending something out (save set/sheet), violet = the helper (copy the AI
  prompt). Class `wb-act` with `in` / `out` / `help` / `lead`.
- **The pin on the teach card reads as a state across the room**: bolder, and
  when pinned it goes amber-on-gold with a ring and changes label to
  "📌 Pinned" rather than relying on a faint tint.
- **Pictures on/off in the quick bar** — Glenn's ask, and it is a teaching
  move, not a display setting: show the picture as the way in, then hide it
  and let the word carry itself. Works in both board and lanes, persists as
  `p.pics`, greys out when no card has a picture, and reads clearly off
  ("🖼 Pictures off", struck through). **Verified no card moves when it is
  toggled** — positions byte-identical before and after, the card just
  shrinks around its own centre — so the layout children navigate by holds.
- Verified in the browser: 16/16 thumbnails hidden and restored across both
  views, state persisted, pin toggles both ways, all seven action pills carry
  their colour and weight 800. Zero console errors.
- Versions: `english-word.js` v21, `style.css` v42.

## 2026-07-24 — Per-word pictures, drag keeps the meanings open, bolder tiers

- **Pictures moved from a board switch to a per-word one.** Glenn, on using
  yesterday's global toggle: "I actually wanted a teacher-led situation of
  toggling per item… not all words will need an image nor will they ever not
  need images." Each card now carries `pic`, and the switch lives *inside the
  opened card* — reveal the meaning, then reinforce it with the picture at
  the moment of asking. The quick-bar button became a bulk shortcut over the
  same flag and reports a mixed state ("Pictures 15/16"). `p.pics` removed;
  one concept instead of two.
- **An opened card no longer closes when nudged.** The first version shut it
  on drag because the meanings panel *grew* the card, so the card had to be
  re-anchored while moving. Glenn: "It's ok for one or two times, but over
  weeks of lesson use, these tiny movements build up as annoyances." Fixed at
  the root rather than special-cased: on the board the panel now **hangs off**
  the card (absolutely positioned, flipping above/left only when it would run
  off the edge), so the card keeps one size for its whole life and drags like
  any other. In a lane the panel stays in the column flow, as before.
- **Tier colours rebuilt for real whiteboards** — "notorious for poor colour
  calibration". The tasteful slate/amber/teal became three widely separated,
  fully saturated hues: blue #1d4ed8, orange #ea580c, green #047857. Card
  spines widened to 11px, lane top borders to 9px, and the lane heading now
  carries its own colour as a second cue. Settings chips go solid with white
  text when active.
- Verified: dragged an open card and it stayed open with its panel intact and
  actually moved (0.500,0.700 → 0.601,0.592); per-word toggle hid exactly one
  picture with the other 15 untouched, persisted across board and lanes, and
  the card stayed open through the toggle; lane panels confirmed still inline
  while board panels are absolute; lane headings and card spines report the
  new colours. Zero console errors.
- Versions: `english-word.js` v22, `style.css` v43.

## 2026-07-24 — Several words open at once; the tile stops jumping

- Both from Glenn teaching with it. Two separate problems, one of them costly.
- **Several cards open at once.** "The germinate and metamorphosis tiles are,
  as with many subject tiles, very closely linked… both tiles need to stay
  open to allow the children to see similarities and differences." `openId`
  became `openIds`, a Set: opening one never closes another, tapping an open
  card closes just that one, tapping the bare board clears them all, and
  insertion order gives the stacking order.
- **The tile jumped when a picture was switched on**, throwing the panel off
  the top of the widget and stranding the teacher's annotations. Glenn: "in
  front of 5 year olds… 60 seconds redrawing in front of them is a 'lifetime'
  when they are unfocused." Three root causes, all fixed rather than patched:
  1. **Cards were anchored by their box, not their word.** Adding a picture
     grew the card and so moved the word. Now `x,y` is where the *word* sits;
     the card grows upward around it and the word never moves.
  2. **The panel could be placed above the card** — anchored to the card's
     top, the one edge a picture moves. It now goes **below** (the card's
     bottom never moves) or, when there is no room, **to the side level with
     the word** — which cannot move at all, and does not cover the picture
     the teacher has just revealed. Never above.
  3. **The panel's width was a share of the card's**, so widening the card
     re-wrapped its text, changed its height, and bounced it to the other
     side. Width is now fixed.
- Also: dragging now keeps the grab point instead of snapping the word under
  the pointer.
- Measured after the fix, on a card low enough to have no room below:
  revealing a picture moves the word **0px** and the panel **0px vertically**
  (15px sideways, being half the card's width increase — it sits beside the
  card), the panel stays fully on the board, and it does not overlap the
  picture. Hiding again returns everything to 0,0. Three cards confirmed open
  together; closing one leaves the others. Zero console errors.
- Note: because `x,y` now means the word's position, any card that already had
  a picture shifts by about half a thumbnail once, on first load after this
  change. Only affects decks made during today's testing.
- Versions: `english-word.js` v25, `style.css` v45.

## 2026-07-24 — Word bank closed as working and shippable

- Glenn: "working and shippable." A closing checkpoint, no new code.
- Ship checks, all passing: cache-bust versions internally consistent with
  every file actually touched (`english-word.js` v25 and `style.css` v45 both
  edited today; `icons.js` v18, `app.js` v39, `zip.js` v1 unchanged since
  yesterday and already bumped); every edited file parses; no stray
  `console.`/`debugger` anywhere in english-word.js, zip.js or icons.js.
- Cold boot from empty storage with the console open: **zero errors**. A fresh
  install still ships **no word bank** — only the default clock — so nothing
  from this build's testing reaches a new teacher. English panel lists all
  three widgets; the word bank mounts with its empty state; harvesting a word
  works; the Pictures control correctly disables itself when no card has a
  picture; the settings panel carries all seven actions in their colours.
- Dev deck reset to a fresh install, so this origin holds no test debris.
- **What shipped over the two days**: the word bank itself (corkboard capture,
  three tier lanes, teach card), open-in-place meanings, per-word pictures,
  set files as `.wordbank.zip` archives with a readable sheet and a preview
  page, forgiving filename matching, folder and multi-file import, and the
  contact-sheet slicer with its confirm screen.
- **Known and deliberately deferred**: Frayer view; shades meter; prints and
  the `toPrintable()` seam; the `tiers` pack kind; docking consumers (sentence
  builder / modelled writing read `p.words` when they exist). Boundaries that
  report rather than fail silently: 60 words a bank, ~14 picture cards before
  a board is physically full (Lanes beyond that), and a set-wide picture
  budget of ~1.5MB.
- **Outstanding, not code**: the teacher guide artifact predates the
  contact-sheet slicer, so its picture step still describes naming files by
  hand. It needs the slicer route added before it becomes the help page.

## 2026-07-24 — Teacher guide brought up to date with the slicer

- No app code. Closing the one item left open when the word bank shipped: the
  guide artifact predated the contact-sheet slicer and still told teachers to
  name every picture file by hand.
- **The sheet is now the recommended route, not an alternative.** The reason is
  the one in the code comment at `english-word.js:582` — an image model holds
  the "no text" line across a whole sheet but bakes the word into every tile
  the moment you ask for one on its own. So the guide stops presenting naming
  files as the normal path and presents it as the fallback for when your tool
  hands you separate images.
- Step 3 became "Make the pictures", with two routes side by side: one sheet
  (marked *do this one*) and one file per word. Step 4 became "Bring it into
  the widget" and now leads with **words first** — the slicer refuses without
  them (`wbOpenSlicer` toasts "Add your words first…"), which the old guide had
  no reason to mention.
- The confirm screen is documented as the safeguard it is: tap-two-tiles-to-
  swap, ✕ to drop (↺ to undo), a `—` tile meaning that word goes unpictured
  with nothing shuffling up, Across/Down to re-cut by hand, and the footer
  count reading "one each". The callout says plainly that the widget matches
  **by position, not by what the picture is of** — which is why a person reads
  the words under the tiles.
- **The printed prompt was left byte-identical to the one the app copies** —
  verified by evaluating the `promptText` concatenation out of english-word.js
  and diffing (1009 chars, exact match). The guide's extra ask for a grid sheet
  sits *outside* the prompt block on purpose: putting it inside would start the
  same drift that made this fix necessary.
- Checklist updated to branch on which picture route was used.
- Verified rendered before publishing: no horizontal overflow at 666px, both
  route cards level, 5 steps, 6 checklist items, copy button intact, dark mode
  correct.
- Guide lives at the same artifact URL as before (updated in place, not
  re-minted). Favicon set to 📚 — the original was unreadable from the API, so
  if the tab icon has changed, that is why.

## 2026-07-24 — Sentence builder: research grounding reverses the design

- No app code. Glenn: "this also needs to be steeped in research… apply
  adroitly, correctly and with pedagogical guile." Deep research run
  commissioned to **test** the planned §7.1 design rather than justify it.
- **The run did not finish.** It hit a spend limit: 46 of 110 agents failed,
  synthesis never ran, 25 of 129 claims reached verification. Rebuilt the
  findings by reading the primary sources directly from the run's cached full
  texts in the scratchpad, rather than trusting the harness summary.
- **The harness listed its most important finding under "refuted".** Reading
  the verifiers' actual reasoning showed every one of them wrote a version of
  "every number verified correct against the primary source; refuted on
  inference, not on data". The Englicious trial figures were checked verbatim
  against the 38-page PDF by three independent verifiers. What was rejected
  was an overreaching claim built on top of a real finding. Lesson: in this
  harness "refuted" can mean "the inference overreached", not "the fact is
  false" — never take the bucket at face value.
- **The finding that reverses the design:** Wyse et al. (2026), JoWR 18(1)
  119–159. Cluster-RCT of Englicious, an intervention built on NC Year 2
  grammar terminology, delivered teacher-led whole-class on an interactive
  whiteboard with drag-and-drop word categorisation — almost exactly this
  widget's modality. N = 1,246, 70 classes. Narrative writing quality:
  **d = 0.026, p = .77**. Complier-only analysis did not rescue it. The
  authors hypothesise the drivers of what little moved were manipulation of
  words/phrases/sentences and grammar connected to writing practice — **not
  terminology** — and call for the NC grammar programmes to be reviewed.
- **Corrections to what UK practice believes.** The Myhill result normally
  cited as "contextualised grammar works" (e = 0.21) is a **Year 8 secondary**
  study (744 pupils, 31 secondary schools) and cannot carry a primary
  decision; it also benefited able writers more than weaker ones. The EEF
  replication found the effect fell to 0.06 SD and that **small-group
  delivery, not grammar content**, produced the significant literacy effect.
- **What the EEF actually recommends at sentence level** is sentence
  **combining** and sentence **expanding**, teacher-modelled then
  collaborative then independent. Expanding was missing from our design
  entirely.
- **Design reversed:** combining + expanding become the spine; NC terminology
  becomes a filter/label so teachers still find "fronted adverbials" and the
  widget stays adoptable. Colourful Semantics demoted from default face to a
  mode — its entire evidence base is one child (Bryan 1997) plus six children
  (Bolderson 2011), clinical SLT, twice weekly for 8 weeks; whole-class use is
  an extrapolation. PenCRU's note that **the specific colours carry no
  evidential weight, only their consistency** frees the palette for
  projector-safe hues, which the conventional brown/black do not survive.
- **Fix-it mode survives with a constraint**: Booth et al. (2013) found
  incorrect examples beneficial for conceptual understanding, but the tested
  manipulation was incorrect examples **with prompts for self-explanation**.
  The interaction must ask *why* before *what*.
- **The hardest constraint of all**: the one consistent behavioural difference
  in the Englicious classrooms was that lessons always ended with 20 minutes
  of children independently writing. The widget is the front half of a lesson
  and must hand off. A widget that fills the hour is the documented failure
  mode. Teachers in that trial also criticised slides for carrying too much
  text and lessons for feeling "relatively passive".
- Written to `docs/sentence-builder-design.md` with confidence markers ([A]
  read directly / [B] verifier-checked against full text / [C] strong source
  but verification agents died). §7.1 of the set design carries a superseded
  banner rather than being deleted.
- **Not built.** Design only, brought back for a decision before any code.

## 2026-07-25 — Sentence builder: the full research run lands

- Glenn: "let's go back and fill up the 64 other agents and get a fuller
  picture. Do this properly." The re-run completed: 392 agents, 25 sources,
  **120 claims extracted and all 120 verified** — 116 confirmed, 4 killed on
  merit, 0 unverified, 17 synthesized findings.
- **The harness was repaired before re-running, and that was most of the
  work.** Two flaws found in the deep-research script: (1) a silent cap
  (`MAX_VERIFY_CLAIMS = 25`) had dropped 104 of 129 claims unverified while
  the output read as if everything was checked — caps now log what they
  drop; (2) the verifier prompt collapsed "the facts are wrong" and "the
  inference overreaches" into one boolean with "default to refuted".
  Verification now runs three distinct lenses (source fidelity / external
  contradiction / applicability-to-target) and verdicts must tag
  FACT-FAIL / OVERREACH / SCOPE / SOUND — **only FACT-FAIL kills**; scope
  and overreach narrow the claim and travel to synthesis as qualifiers.
- Sharpening the research question invalidated the workflow cache, so this
  was a full fresh run (~21M subagent tokens), not a resume. Known cost,
  taken deliberately.
- **The lens system caught an error in a published paper's own citation**:
  Walter et al. (2021) carry "written sentence combining does not emerge
  until seven to eight (Berninger et al., 2011)". A verifier read Berninger
  2011 directly: Grade 1 children (6;11) did the WIAT-II combining task with
  predicted, non-floor performance (R²=0.53); no such threshold exists in
  the paper. So the KS1 face has **no demonstrated developmental bar** —
  untested, not premature.
- **What the fuller picture added** beyond the interim salvage:
  - The grammar null now **brackets the primary phase**: Y2 (Wyse 2026,
    d=0.026) plus TWO Y6 EEF trials — Tracey 2019 (155 schools, 5,182
    pupils, writing ES −0.02, small significant negative on the GPS test
    itself) and Torgerson 2014 (+0.10 falling to +0.06 without the
    small-group arm; the significant gain was small-group delivery per se).
    Y3–Y5 inferred, not tested.
  - **Walter, Dockrell & Connelly 2021** — the UK primary sentence-combining
    trial: near transfer g=0.76–0.84 held at 3 months, but **no significant
    writing-quality gain**, gated by baseline spelling. The widget's cards +
    teacher transcription sidestep exactly that gate (rationale, not proof).
    Their session shape is the lesson template.
  - **Kim et al. 2021 (K–G3 meta)**: no sentence-level intervention exists
    at all in 24 studies — ages 4–8 are an evidence *absence*, not a null.
  - **SRSD** is the corpus's best-evidenced structure (g=1.04; whole-class
    Catalan RCT persists at 18 months): its gradual-release architecture
    (model → collaborative → independent, terminating in independent
    writing) becomes a first-class widget state, "Over-to-you".
  - **Fix-it is riskier than the interim read**: Jacoby & Hollingshead —
    one exposure to a misspelling depresses later spelling below never-seen
    baseline (implicit priming); novices disengage from errors (~40% less
    time) and can't find them unaided. Zero literacy/primary trials. Kept
    under five hard constraints: correct first, error location flagged,
    active whole-class correction, corrected sentence always the closing
    image, structural errors preferred over misspellings.
  - **Differential attainment is live but unsettled** (Y8: able writers
    only; Y6: non-sig −0.11 for lower attainers; K–G3: non-sig the other
    way) → every mode gets a low-metalanguage floor.
  - **No length affordances** (SRSD meta: instruction moves quality and
    elements, not length; role-slot completeness is the one countable
    thing worth showing).
  - Shape Coding's colour axis **collides** with CS (yellow=verb vs
    "Doing what?"; blue=preposition vs "Where?") — palette presets per
    scheme, deck-locked, never hard-coded.
- `docs/sentence-builder-design.md` rewritten against the completed run:
  provenance section documents both runs and the harness repair; [C]
  markers replaced by [V]/[M]/[L]; build section now carries the SRSD
  wrapper, the NC filter-not-ladder, the hand-off state, and what the
  widget may honestly claim about itself (manipulation, rehearsal, staging
  — never writing-quality gains; R–Y3 labelled a reasoned extrapolation).
- Still not built. Design returns to Glenn for the build decision.

## 2026-07-25 — Sentence builder: typing rhythm fix (first live feedback)

- Glenn, using v26 in anger within the hour: typing a word and hitting Enter
  dropped focus, so every word cost a mouse click to get back into the box —
  "enough to turn the user off." Root cause: commit() → paint() rebuilds the
  tray, destroying the input that held focus; the replacement was never
  focused. Fix: addCard() refocuses the rebuilt input after the repaint
  (english-word.js, one comment-documented line pair). Verified on a clean
  http origin: three words typed Enter-Enter-Enter with no clicks, the Add
  button path returns focus too, and the roles-mode path (adds to tray)
  likewise. **english-word.js → v27.**
- Then replaced with the better fix already in the house: the word bank's
  harvest bar is **built once, outside the repaint zone**, precisely so the
  input keeps focus AND caret through every repaint (english-word.js:2108's
  own comment). Refocus-after-rebuild only covered the Enter path — a repaint
  from any other source (say, a resize mid-word) would still have eaten the
  caret. The add bar is now a persistent sibling of the tray, hidden in
  Over-to-you. Verified: mid-word resize repaint keeps the same input node,
  focus and text; Enter keeps focus; hand-off hides the bar.
- Rule worth keeping: any handler that repaints a container holding a text
  input the teacher types into repeatedly must hand focus back to the rebuilt
  input. The word bank's harvest bar should be checked for the same flaw.
- Testing infrastructure note: the Browser pane serves file:// pages as
  static snapshots — location.reload() there neither refetches HTML nor
  really reboots the app, which manufactured a phantom "erase-resurrect" and
  masked the fix under stale JS. Dev-server testing (launch.json
  "sage-stage", http://localhost:8642) is now the only trustworthy route;
  the http origin also keeps test state away from Glenn's own.

## 2026-07-25 — Sentence builder ships: build, review, and the review's harvest

- **The build.** `sentencebuilder` landed across four files: the widget in
  english-word.js (five modes on one track engine: Combine, Expand, Build,
  Roles, Fix it; gradual-release stages Model/Together/Over-to-you; say-it
  sweep on the phoneme-tiles pacing; NC year as a filter, never a ladder; no
  length affordances anywhere), sb- styles in style.css, the icon in
  icons.js, one TOOLS.push in app.js. Word-bank dock works with no app API:
  the widget finds its own screen by its id and reads a sibling word bank's
  words read-only. First live verification: cold boot clean, taps, drags,
  capitals, Keep, sweep, roles palette, fix-it ceremony, persistence, XSS
  probe (markup dies in sbClean), dev deck reset after.
- **The adversarial review** (5 lenses → per-finding refutation, 47 agents)
  confirmed 42 findings collapsing to ~24 roots. All applied same day except
  two recorded deferrals. The blockers:
  1. **Fix-it srcs compaction** — mount's `filter(Boolean)` collapsed the
     positional pair, so filling "The broken one" first promoted the BROKEN
     sentence into the "Done right" slot on the very next remount: the error
     presented as the model, the exact inversion §4 exists to prevent. srcs
     are now never compacted in fixit (trailing empties pop; combine skips
     empty chips). Verified: broken-first entry leaves Done right empty.
  2. **Palette was per-widget** — design says deck-locked, and within-child
     consistency is the one property the colours carry. Now `deck.sbPalette`,
     set from any sentence builder's settings, repainting every sentence
     builder on the screen (api.refreshAllOf). Verified across two widgets.
  3. **touch-action:none on the one mat in the app that scrolls** — finger
     panning was dead. Now pan-y; cards keep their own touch-action.
- The rest of the harvest, all applied: `if (dragging) return` reentrancy
  guard (two-finger tap duplicated a card); drop index read BEFORE the caret
  leaves (row-edge off-by-one); cap-aware drops that bounce back to their
  ORIGIN (never silently over a cap a remount would truncate — that deleted
  teacher-placed cards); expand's deal flag split from fix-it's (`p.grown`
  vs `p.dealt` — shared state let expand skip read-it-right-first);
  **entering fix-it from any mode now always restarts its ceremony** (the
  ceremony IS correct-first; reload-resume still works because mount never
  resets); Show-it-fixed clears the gold flags and hides the broken line
  (closing-image rule, fully enforced now); per-SOURCE deal tracking in
  combine (the old word-dedupe meant 'The dog barked' + 'The cat hissed'
  yielded ONE 'the' — the class literally could not build the combined
  sentence); roles cards whose slot left the year window drop back to the
  tray instead of invisibly holding the cap; flagged pruned to live cards at
  mount; card ids healed like wbSanitize; scroll position survives every
  repaint; Escape guarded during drag; bin moved off the scrolling mat onto
  the widget body (it had become an invisible drop zone that deleted over
  ordinary content when scrolled); sb-mini buttons got 28px finger floors;
  slot headers read in ink with a colour dot (the raw palette text failed
  4.5:1); terms overlay legible + mntray scaled; quick actions mntray
  scaled; structural-errors-over-misspellings hint added to fix-it; the
  below-Y4 "reasoned extrapolation, not proven effect" honesty line added to
  settings; sbClean now strips controls/zero-widths/bidi overrides.
- **Recorded deferrals** (design doc §7 carries the dated note): named
  sentence-shape frames (pack rail doesn't exist) and the Shape-Coding
  palette preset (couldn't verify SC's real colour mapping against a primary
  source — a wrong mapping labelled "friendly" is worse than none).
- Known warts, on record: srcs are shared across modes, so combine's chips
  show fix-it's sentences until replaced; the settings panel shows the OLD
  mode's fields if the mode is switched from the quick bar while the panel
  is open (app-level panel lifecycle, same for all widgets).
- Verified end-state on the dev server: broken-first fix-it safe, ceremony
  restart, no expand double-deal, two 'the's in combine, re-tap no-op with
  "✓ out" chips, deck palette shared, mat pan-y, single bin, zero console
  errors, test origin wiped.
- **Versions: english-word.js v28, style.css v47, icons.js v19, app.js v40.**
  (v26 was the build, v27 the same-day focus fix from Glenn's first live use,
  v28 the review harvest.)

## 2026-07-25 — Two regressions from Glenn's second live run

- **Settings panel flashed on every control** (checkbox, select, the Clear
  pills — anything wired to `api.refresh()`). Root cause in the app shell,
  not the widget: a refresh from inside the panel tore the whole `.spanel`
  down and rebuilt it, which replays the 0.18s `spanel-in` entrance
  animation — the "flash" — and throws away the panel's scroll position.
  Now `openSettingsPanel(w, true)` swaps the `.spanel-body` in place when
  that same widget's panel is already open: conditional fields still
  re-evaluate (mode switch shows the right rows), the widget still
  remounts, but the panel element and its scroll survive. A genuine open
  (gear, keyboard S, switching widgets) still animates once. Verified live:
  panel node identity stable across toggles, zero running animations on
  toggle, scroll 150→150 and 90→90, terms overlay repainting 0↔4,
  mode→combine restructuring the panel in place with no teardown.
- **Popped tray-card buttons sliced at the "cards wait here" line.** The
  tray's card row (`.sb-cards`) is a scroll cap (`max-height` +
  `overflow-y:auto`), and a scroll container clips at its padding box on
  BOTH axes (`overflow-y:auto` forces `overflow-x` to computed `auto`).
  The aA/×/⚑ minis overhang a popped card by ~0.7em top and sides, so a
  first-row card's minis clipped exactly under the tray's dashed border
  (7.1px measured), and a first-column card's aA clipped on the left the
  same way. Same disease .sb-line already inoculated against with its 20px
  top padding — the tray now carries `padding: 12px 12px 0` as mini
  headroom inside the clip, with `max-height` grown 5.6→6.4em so the
  visible card area stays put. Verified live at several widget widths:
  cap/x/flag chips fully inside the clip box (0px clipped all axes), tray
  still scroll-capped.
- Dev-loop wart worth remembering: `python -m http.server` sends no
  Cache-Control, so a plain reload can run a heuristically-cached app.js
  while serving fresh CSS — the first fix "didn't work" until a
  `fetch(..., {cache:'reload'})` bust. Not an app change; Tauri kills it.
- The stranded off-screen clock seen during testing (deck's default clock
  at x:-320, invisible at 1280px) is the checklist's known P1
  widget-geometry item — already scheduled alongside Phase 3, nothing new.
- Test origin wiped after; server stopped.
- **Versions: app.js v41, style.css v48.** (english-word.js untouched —
  both fixes landed in the shell and the stylesheet.)

## 2026-07-25 — Stage pills say whose turn it is

- Glenn's question from live use: Model vs Together — "not obvious, no
  visual clue." Correct diagnosis: they are behaviourally identical on
  purpose (the pill declares the lesson stance; only Over-to-you changes
  the widget), and the only explanation lived in hover tooltips, which a
  touch board never shows.
- Chosen over a cue line under the bar (mockup comparison): the turn is
  now written into the pills — Model/my turn, Together/our turn, Over to
  you/your turn. All three meanings legible BEFORE a tap, no extra row,
  child-facing turn language on the class screen while the teacher
  sentence ("We do — the class calls, you place") stays in the tooltip.
  Rationale + rejected alternative recorded as a dated note in
  docs/sentence-builder-design.md §Structure across every mode.
- Mechanics: sb-local `seg()` takes an optional 4th pair element (sub);
  only the stage seg passes subs, so the mode seg and other widgets'
  tq-btns are untouched. `.sb-turn` styled quiet (12px in mntray), teal
  when active.
- Verified live on a fresh origin: subs on stage pills only, active sub
  follows the selection in accent teal, tooltips intact, mode seg
  single-line, zero console errors. Test origin wiped, server stopped.
- **Versions: english-word.js v29, style.css v49.**

## 2026-07-25 — The stages become physical: traffic light, Deal it back, the ritual

- Glenn's design call after live use: stance-only stages read as "the same
  thing" in a classroom, and "teachers love a traffic light. Remember how
  conditioned we are as a collective!" Design agreed in-session (loose
  tiles over role-slots for the rebuild; traffic light over teal-handover),
  recorded as the dated "stages become physical" note in
  docs/sentence-builder-design.md.
- **Together's move — ↩ Deal it back** (ceremony-button pattern from
  fix-it): remembers the modelled sentence (`p.modelSnap`, healed at mount
  like everything else) and returns the line's tiles to the tray cap-aware
  (overflow stays on the line, never silently deleted). Model becomes the
  reference view — "What we modelled:" strip — so peeking is free; pill
  taps never create or destroy state. Snap clears on mode change and Clear
  the line. Fix-it exempt everywhere: its ceremony is its structure.
- **Traffic-light pills**: dedicated stageSeg builder (seg() reverted to
  its simple 3-tuple form); red/amber/green underline always on, soft fill
  + dark ramp text when active; turns (my/our/your) kept. Position and
  label still carry the meaning — colour is never the only channel.
- **Say it × paces on the bar** (phoneme-tiles pattern): 🗣 Say it ·
  New/Practising/Fluent — tap sets the beat and plays; sb-specific
  tooltips; the settings Pace row removed (one control, one place).
- **Over to you** ends on the ritual: 1 Say yours out loud · 2 Write it ·
  3 Check with your talk partner (.sb-steps). Handoff fallback order now
  line → last kept → remembered model, so handing over after a deal-back
  never scolds.
- **Teacher guide written**: docs/sentence-builder-teacher-guide.md —
  layperson walk-through (traffic light table, the three beats, a first
  lesson in eight taps, one-liners for the other faces).
- Verified live end-to-end on a fresh origin: build in Model → amber →
  Deal it back (tiles to tray, strip set) → peek red (nothing wiped) →
  rebuild a tile → flips preserve the partial line → Practising tap plays
  (sb-talking) → green shows ritual + closing sentence from the snap →
  fix-it shows neither button nor strip → settings Pace row gone → state
  survives reload → zero console errors. Test origin wiped, server
  stopped.
- **Versions: english-word.js v30, style.css v50.**

## 2026-07-25 — Sentence builder V0.1 teaching-face redesign agreed (mock)

Glenn: "I can't put my finger on what is bugging me with the layout as a
teacher" → a playable mock, revved through nine rounds against live use,
now signed off as **V0.1 to build**. Mock (throwaway, not in the repo):
claude.ai/code/artifact/f34fe54d-5730-417b-8fb9-acf3b670b1b1

**The diagnosis** (what was actually wrong): no visual ranking. Dashes
meant four different things; line and tray cards looked identical, so from
the carpet you couldn't tell the sentence from the spares; fourteen
same-weight pills made every control equally likely; five stacked sections
top-to-bottom.

**The V0.1 spec, decision by decision:**
1. **Four zones, not five** — reference rail (only when it has something to
   show) · the sentence slab · ONE waiting band (cards row + tiles row) ·
   the bar. Dashes now mean "drop here" and NOTHING else.
2. **Board-scale cards** on a handwriting baseline; the 30px font cap rises
   for large widgets (a 75" board needs 72–96px targets, not WCAG's 44px
   phone floor).
3. **Per-stage lines in the line faces** — `lines.model` / `lines.together`,
   not one shared track. Together opens holding a COPY of the modelled
   sentence; Deal it back empties only Together's line; Model is never
   touched. "Going back a step must never cost the step." Re-seed only when
   a NEW sentence has been modelled. Roles/Fix-it keep one shared board.
   (This retires `p.modelSnap` and the "What we modelled" text strip.)
4. **Deal it back is watchable** — words peel off in reading order ~320ms
   apart and fly to the tray, shrinking as they land; punctuation fades.
   Bar locked during the ceremony; reduced-motion falls back to instant.
5. **Beats ARM, Say it FIRES** — New/Practising/Fluent are toggles; only
   the teal 🗣 Say it plays. Glenn: "'Are you ready for fluent now?' — the
   wait is the cue." Changing beat mid-chant stops it. (Reverses the
   v30 tap-to-play; phoneme tiles keep their own tap-is-the-sound-talk.)
6. **Drag like magnets everywhere** — dimmed shadow at the origin, ghost on
   the finger, teal caret bar for the landing slot, lit role slots. Silly
   orders are a FEATURE: shuffle it wrong, Say it, let the class hear it.
7. **Two docks, revealed only while a card is in the air**, at the right of
   the waiting band: **+1** duplicates (a copy to the tray, original snaps
   home — "the"/"had" recur in one sentence; mirrors the money widget's
   magic tray) and **🗑** bins for good. Hit-test the drop BEFORE un-hiding
   chrome or the drop passes through a now-hidden dock.
8. **Colour grammar, four levels** — INK = which face of the scheme (active
   mode pill solid), TRAFFIC = whose turn, GREY = tools, solid TEAL = press
   to act (Say it, the one lead button). Panel pills obey it too: ink =
   selected topic, teal = act, rose = removes.
9. **Modes stay on the surface** — all five pills with plain-word subtitles
   (two into one / grow it / free build / question slots / mend it). Folding
   them behind a chip was tried and REJECTED: the five modes are the scheme
   of learning; hiding them hides the lesson from teacher and class.
10. **No cue line, no scripts on the class surface** — a stage-coloured
    "what to do now" line was tried and REJECTED (Glenn: teachers hate being
    told what to say, and it clouded the child zone). Hints are quiet ghosts
    INSIDE empty spaces only, gone when tiles arrive.
11. **Empty role slots scaffold** — "like… the dog · a girl · my nan" in
    ghost grey per question, vanishing per-slot on fill. Must be
    teacher-editable in ⚙ (topic words, not ours).
12. **Sticky add input** — built once OUTSIDE the repaint zone, Enter adds
    and keeps the caret, closes only on click-away. (The mock regressed the
    v27 house rule; structure it right, don't patch it.)
13. **The ⚙ panel graduates** — sectioned with rules, strong headings + a
    plain sub-caption each ("Set it up", "The two sentences", "Sentence
    banks", "Add your own — a term at a time", "Tidy up"), fields at full
    width. Bug to carry over: `flex:1` on a textarea in a flex column gives
    it a ZERO height basis — that is what squashed the boxes. This
    formatting is wanted app-wide, not just here.
14. **Sentence banks** (biggest new item) — year-filtered topic sets holding
    pairs/bases/mends, two taps to load into the current face, plus paste-a-
    term import (" / " makes a Combine pair) filed under "My import". Needs
    storage, the word bank's CSV discipline, and authored neutral content.
15. **Both doors work** — quick moves from the bar, considered setup from ⚙.
16. **Reach/geography** — tray, tiles and bar stay in the lower half; the
    slab is the upper. The guide should say: size the widget large and place
    it low when children come to the board.

**Not doing** (recorded so it reads as a decision): a child-practice face.
Glenn: "not really. The teacher does this in situ." No Check-my-sentence,
no praise banners, no completion counters, no TTS — an open combining task
has several right answers and machine verdicts become the model. The
external critique that prompted this round was for a different product.

Build follows in stages against this spec; the teacher guide and
sentence-builder design doc get updated in the same pass.

## 2026-07-25 — Sentence builder V0.1 BUILT: the mock becomes the widget

The sixteen-decision spec from the previous entry is now the shipping
widget. Applied from the playable mock into english-word.js + style.css,
then adversarially reviewed (31-agent workflow: five lenses × verify), 25
confirmed findings all fixed in the same pass, re-verified live.

**The build, decision by decision** (numbers from the V0.1 entry):
- (1, 16) Four zones as DOM: reference rail (`.sb-rail`, only when it has
  content) · white sentence slab (`.sb-slab`) with a handwriting-baseline
  line · ONE waiting band (cards row + docks + tiles) · the bar. The
  line's dashed border is gone — dashes now mean "drop here" only (slots,
  docks). Default widget 860×620.
- (2) Board-scale type: the `--sb-fs` cap now grows with the widget —
  `clamp(round(width/20), 30, 64)` — so a board-sized widget gets
  board-sized cards while small widgets keep today's 30px ceiling.
- (3) **Per-stage lines**: `p.track` = Model's line (and the one shared
  board for Roles/Fix-it), `p.trackT` = Together's copy, `p.togSrc` =
  which modelled sentence seeded it. Entering Together copies the model
  (fresh card ids) ONLY when a new sentence was modelled; peeking and
  half-rebuilt lines survive every flip. `p.modelSnap` retired (deleted at
  mount); the "What we modelled" strip went with it — Model IS the
  reference view.
- (4) **Deal it back is a watchable ceremony**: data commits FIRST (save,
  no paint — a remount can never lose a card), then words peel off in
  reading order ~320ms apart and fly to landing pads in the tray,
  shrinking; punctuation fades (tiles are already out); `dealing` locks
  every control until the last card lands; reduced-motion is instant.
  Cap-aware: overflow words stay on the line, same as drops.
- (5) **Beats arm, Say it fires**: New/Practising/Fluent only set the
  beat (and stop a running chant); solid-teal 🗣 Say it plays.
- (6) Magnet drags kept and extended: slot + tray light up under the
  ghost (`.hot`), caret unchanged.
- (7) **Two docks** at the right of the cards row, outside its scroll
  clip, visible only while `.ct-dragging`: **+1** duplicates (fresh id,
  original snaps home), **🗑** bins. Rect-hit-tested before chrome
  un-hides; ambiguous drops resolve to the dup (copy beats delete). A
  missed drop now snaps home — the old delete-on-outside-drop is gone;
  only the bin deletes. The body-corner `.ct-bin` is retired here.
- (8, 13) Colour grammar on bar AND panel: active mode pill solid ink,
  traffic stages, grey tools, solid teal only on press-to-act (Say it,
  leads, bank Use, Add to my bank); rose for removes (Tidy up pills,
  Clear my imports). Keep goes ghost-teal when there's nothing to keep.
- (9) Mode pills wear plain-word subtitles (two into one · grow it · free
  build · question slots · mend it).
- (11) **Empty role slots scaffold**: ghost "like… the dog · a girl · my
  nan" per question, teacher-editable per slot in ⚙ (`p.roleEg`, ' · '
  separated), gone the moment a card lands.
- (12) The add input became the **+ card chip** on the bar: opens on tap,
  built once outside the repaint zone, Enter adds and keeps the caret,
  closes only on genuine focus-out (focusout checks relatedTarget so the
  Add button's click lands).
- (13) The ⚙ panel is sectioned: Set it up · mode section · Sentence
  banks — Year X · Add your own — a term at a time · Tidy up, each with
  a ruled heading + plain sub-caption (`.sb-sph`/`.sb-spsub`); textareas
  carry `flex-shrink:0` (the mock's zero-height-basis lesson).
- (14) **Sentence banks**: twelve neutral topics authored in code
  (`SB_BANKS`), year-banded R–1/2–3/4–5/6, each holding pairs, bases and
  mends (mends break structure — capitals, order, end marks, an
  apostrophe — never spelling). Teacher imports live per-year on the deck
  (`deck.sbBank`, same home as sbPalette), " / " makes a Combine pair,
  filed under "My import", capped 30+30 per year, sanitised on read AND
  write. Two taps loads into the current face; build/roles deal a base's
  words to the tray.
- Extra fix that fell out of testing: the aA mini now **flips** the first
  letter's case instead of only capitalising — a dealt "They" can go
  lowercase when it lands mid-sentence in a combine.

**The adversarial review** (25 confirmed / 1 rejected), all fixed:
- **P1 roles orphan delete**: the year-shrink sweep deleted a slotted
  card outright when the tray was full. Now: moves to tray when there's
  room, otherwise the card STAYS in its hidden slot — invisible but safe
  beats deleted — and the sweep save()s (it mutated in paint without
  saving).
- **P1 roles cap counts the invisible line**: slot drops refused by a
  "full board" that looks empty, because the line faces' sentence shares
  `p.track`. The toast now says where the room went and points at Clear
  the line. (The deep fix — roles getting its own board — is recorded
  below as deferred.)
- **P2 v30 migration**: a deck saved mid-lesson in Together loaded with
  an apparently-wiped line (trackT empty). Mount now seeds Together from
  the shared track exactly once — only a v30 deck can be in that state,
  so the guard (`stage together, line face, trackT empty, togSrc empty,
  track non-empty`) is precise. Verified live with a planted v30 deck.
- **P2 togSrc cap mismatch**: mount sliced togSrc to 200 chars but the
  seed guard stored/compared uncapped — a >200-char sentence would
  re-seed after every remount and wipe the rebuild. Cap raised to 800
  (above sbText's ~700 maximum) so the comparison is stable.
- **P2 stale-rebuild handoff**: Over-to-you fronted Together's rebuild
  even after a NEW sentence was modelled. The rebuild now leads only
  while `togSrc` matches the current model.
- **P2 stale dealtSrcs**: every path that replaces `p.srcs` (expand
  input, both fix-it inputs, expand/fix-it bank Use) now clears it —
  previously never-dealt sentences arrived marked "✓ out" and undealable.
- **P2 partial deal duplicated words**: dealSrc is now all-or-nothing —
  if the whole source won't fit the tray it refuses with a toast, because
  a partial deal re-dealt after making room duplicated the words that fit
  the first time. Same fix in the banks' deal-words path.
- **P2 ceremony lock was one-directional**: dealBack now refuses while a
  card is mid-drag (second finger on a whiteboard), stopSay()s first, and
  the drag's up-handler bails before mutating if a ceremony somehow owns
  the board. Minis are guarded against BOTH locks.
- **P2 flyers missed a scrolled tray**: landing pads are scrollIntoView'd
  before measuring, so cards fly INTO the tray, not past its clip.
- **P2 dead selector**: `.mntray .sbwidget …` (descendant) never matched
  — both classes sit on the same element; the bar's lead buttons were
  12.5px next to 19px pills. Now `.mntray.sbwidget …`, leads at 17px.
  (Pre-existing since v28 — the review caught it, not the build.)
- **P2 contrast**: `.sb-turn` subtitles (11px, meaning-bearing) went
  solid #5b6b7b; amber/green active turns darkened to the shades the
  pill labels already use; mode-pill active sub raised to 0.8 alpha.
- P3s: pointercancel no longer counts as a tap (palm rejection placed
  cards); fly/ghost clones shed their popped mini bubbles; import rebuilds
  its bucket from the SANITISED view and Clear-my-imports shows whenever
  anything is stored (junk could wedge the bank with Clear hidden);
  fix-it's handoff-as-reveal clears the flags (closing-image rule); tray
  scroll survives paints; `.sb-altx` got a 28px hit target; the join tag
  paints over the next row (z-index); card minis carry role=button,
  tabindex and Enter/Space so they're reachable without a pointer.
- Rejected (1): "popped tray minis clipped at board scale" — v41's
  padding headroom holds.

**Recorded deferrals**: Roles sharing `p.track` with the line faces is
the structural cause of the cap confusion — splitting roles onto its own
board is a data-model change deferred with the honest-toast mitigation
shipped. Broader keyboard/drag a11y beyond the minis stays on the
checklist's existing item.

Known warts carried forward, still true: `srcs` are positional and
shared across modes (fix-it's pair lingers into combine's chips until
replaced); the settings panel shows the old mode's fields if the mode is
switched from the quick bar while the panel is open (app-shell panel
lifecycle, all widgets).

Verified live end-to-end on the dev server, fresh origin: combine flow
(bank pair → deal → tap-build → join tile → cap flip), Together seeding
+ watchable deal-back caught mid-flight (screenshot: four landed, one
flying, three waiting) → Model peek intact → partial rebuild survives
flips; beats arm / Say it fires; +1 and bin docks (copy has fresh id,
original home; bin deletes; missed drop snaps home); roles scaffolds +
slot hot + readout; fix-it full ceremony (read-right → broken → ⚑ → aA
mend → Fixed banner, flags cleared); terms overlay join tag (::after
content verified); + card chip keeps focus through Enter; handoff ritual
with rebuilt-first fallback; import files pair+base under My import;
v30-shaped deck migrates seeded, modelSnap removed; zero console errors
throughout; test origin wiped, server stopped.

Docs updated in the same pass: design doc §Structure carries the dated
"V0.1 SHIPPED" note; teacher guide rewritten where behaviour changed
(per-stage lines, arm/fire beats, watchable deal-back, docks, banks,
scaffolds, + card, geography advice). Also fixed: index.html's cache-bust
params had regressed to v28/v47/v40 while the log records v30/v50/v41
shipped — teachers with a cached app.js would never have received the
v29/v30 work. Bumped through in this pass.

- **Versions: english-word.js v31, style.css v51, app.js v41 (untouched,
  index.html catch-up only), index.html updated.**

## 2026-07-25 — Final-design audit: the build checked against the published mock

Glenn wasn't 100% sure the mock the build worked from was the final rev,
so the check was run properly rather than assumed:

- **Provenance settled**: fetched the signed-off artifact
  (claude.ai/code/artifact/f34fe54d-5730-417b-8fb9-acf3b670b1b1 — the link
  the V0.1 entry records) and diffed it against the local mock file the
  build used. **Byte-identical, 821 lines, zero diff** — the build's
  source WAS the final revision.
- Then a line-by-line feature audit of the mock against the shipped
  widget found **five fidelity gaps**, all now fixed:
  1. **The walking lead's first step** — on Combine·Model with an empty
     line and tray and an undealt source, the bar's one solid lead is
     **↓ Deal a sentence** (deals the next source), then Keep, then
     Together's Deal it back. The mock's caption promises "the walking
     lead"; the build had only the last two steps. And while Deal it back
     leads, **Keep goes ghost** — one solid teal at a time (the mock did
     this too; the colour grammar means it).
  2. **The waiting band now hides at Over to you** — it left an empty
     bordered strip under the handoff; the mock removes the whole zone.
  3. **"Show it fixed" fills the slab**: big green centred banner
     (`.sb-fixedbanner`), replacing the quiet rail strip — the corrected
     sentence is the closing image and should look like one.
  4. **× returns a line card to the tray** (words; punctuation just goes,
     its tiles are already out; a tray card's × still deletes). The build
     had kept v30's delete-everywhere ×; in the mock only the bin deletes.
     Cap-guarded: tray full → toast, card stays.
  5. **Roles gets the tiles row** — joining words + punctuation feed the
     TRAY in roles (the mock's behaviour); the build had hidden tiles
     there entirely (v30 rule).
- **Deliberate divergences recorded as decisions, not drift** (mock →
  build): kept-to-compare sits stacked in the rail, not a side column
  (real widgets are narrower than the 1320px mock); the joins/puncts/
  role-slot year tables keep the app's curriculum-graded v28 versions
  (the mock simplified to years 1/3/6); the roles palette keeps the
  deck-locked reviewed 'sage'/'cs' sets (mock used unreviewed hues, and
  its 'like' term "description" stays the app's "adjective"); the drag
  ghost keeps the app-wide `.ws-ghost` idiom; drop-to-tray targets the
  cards row, not the whole band; the tray label is the empty-state hint
  rather than the mock's always-on pill cap; roles tray-taps pop the
  card's options (more useful than the mock's advice toast).
- Verified live: walk (Deal a sentence → Keep), × → tray, roles tiles →
  tray (13 tiles at Y2), Fixed banner in the slab with the rail strip
  gone, band hidden at green and back at red, zero console errors. The
  preview origin keeps a prepared deck (combine pair loaded) for playing.
- **Versions: english-word.js v32, style.css v52.**

## 2026-07-25 — The bottom of the widget learns to breathe

Glenn, from the screenshot: "the buttons here as a whole all look bunched
up." Correct — the build had kept the mock's CONTROLS but dropped the
mock's two zone surfaces, and the app shell's `.tclock-quick` centres its
children, so five clusters floated mid-row at uniform 6px gaps with
nothing telling them apart.

- **The waiting band got its box back**: the mock's soft grey rounded
  surface (`rgba(34,48,60,.045)`, radius 14) instead of a bare rule —
  cards row and tiles read as one held zone. The empty-state hint became
  the mock's quiet pill cap (CARDS WAIT HERE), not a stray sentence.
- **Joins left, punctuation right**: a flex gap between the two tile
  families ends the single mushed row; at Year R ("and" + four marks —
  the screenshot's case) the row now composes instead of huddling.
- **The bar got its strip back**: full-bleed sand (`#f7efe3`) with a
  hairline top, negative margins swallowing the widget body's padding so
  it runs edge to edge and takes the widget's bottom corners — the
  fourth zone is a place again, not loose buttons.
- **Left segs, right actions**: centring overridden; mode/stage/beat
  clusters anchor left, and a flex gap pushes the walking lead and
  + card to a fixed right-hand corner — the act buttons always live in
  the same place. + card wears the mock's grey chip look.
- **Pill air**: two-line pills got 7/16 padding + line-height 1.2 and a
  1px sub offset; say pills padded taller so row heights rhyme; leads
  and chip share the 12px radius; band/bar rows carry 8-10px gaps.
- Verified live at Y2 and the Year-R sparse extreme; zero console
  errors. All CSS + three one-line JS touches (flex spacer on the bar,
  spacer between tile families, chip class).
- **Versions: english-word.js v33, style.css v53.**

## 2026-07-25 — Type scale learns manners; the bar learns rows

Glenn, comparing the empty faces: hint text at a different height in
every mode, Roles suddenly scrolling, and "beat" looking lost as an
outboard label. One root cause and two structural fixes:

- **The empty board no longer shouts.** `--sb-fs` fell back to a 12-char
  count when the line was empty, so the EMPTY state hit the type cap —
  giant hints at mode-dependent heights, and in Roles the em-sized slot
  furniture (headers, ghost scaffolds, readout) inflated past the mat
  into a scroll. Now: an empty board holds a moderate 34px base (content
  still scales to the board cap the moment words land), the empty hint
  is a fixed 19px whisper in every face, the readout is 0.62× and slots
  0.6× (the mock's proportions), and headers/scaffolds are CLAMPED so
  the sentence may grow board-sized but the furniture never follows it
  into a scroll. Roles: scrollHeight == clientHeight, verified.
- **The bar is two deliberate rows, not one accidental wrap** (flex
  order + a full-width break): row one = the five faces … ✓ Keep and
  + card in a fixed right corner; row two = the traffic light … the
  voice. No more Keep stranded bottom-left by whatever wrapped before
  it.
- **The beats joined the bar's two-line language**: New/slow beat ·
  Practising/steady beat · Fluent/like talking — the orphan "beat"
  label is gone; every pill on the bar now explains itself the same
  way.
- **Punctuation wraps as a family**: the tile group is atomic and
  right-aligns as a unit — never again a lone full stop stranded on the
  joins' row.
- Verified live across all five faces at 1150px and the Year-R sparse
  case; zero console errors.
- **Versions: english-word.js v34, style.css v54.**

## 2026-07-25 — The writing sits on the lines

Glenn, three screenshots of the empty slab: "what is wrong in all these
windows?" The answer: the handwriting rules were scenery, not paper. The
rule grid tiled UP from the box bottom while the content centred in the
leftover space — two systems with no shared reference — so whether a
word sat on a line was a coincidence of widget height, and every face
landed differently: hint hanging mid-gap in Build, riding a rule in
Expand, struck through its descenders in Combine.

- paint() now **phases the rule grid from the content itself**: it
  measures the first card (or the hint), lays one rule exactly under its
  feet (+5px for cards, +7px under the hint), and derives the rhythm
  from the REAL row height (card height + row gap) instead of a
  font-size guess. Rules above and below repeat at the same phase, so
  multi-row sentences land every row on a line, at every widget size,
  in every face. Verified: content-to-rule gap is 5–7px across
  Combine/Expand/Build, cards and hints both; the CSS static gradient is
  gone.
- The rule of it, for every future ruled-paper or grid motif: **a
  decorative grid that content can miss is worse than no grid — phase
  the grid from the content, or don't draw one.**
- Zero console errors; preview reset to a clean Combine start.
- **Versions: english-word.js v35, style.css v55.**

## 2026-07-25 — Poster print gets its spec

Thirty minutes on the clock before the usage window closed; Glenn asked
what fits. The answer: the one §4.5 promise still outstanding — the
poster print spec — docs-only, so nothing is left half-built if the
clock wins.

- **docs/poster-print-design.md written and approved** (compressed
  brainstorm; Glenn pinned all three forks): browser print dialog as
  the output route (vector to the driver, Save-as-PDF free from the OS
  dialog), A4 default + A3 option, and a sheet-BUDGET picker — "4
  sheets (about A2)" — because exact ISO sizes are a lie once 10mm
  margins and 12mm glue strips exist (a true A1 needs ~15 overlapped
  A4s, not 8).
- One grid rule replaces an orientation knob and a scale slider:
  enumerate sheet-orientation × grid within the budget, keep the
  candidate with the largest content scale, then drop blank sheets.
  The same rule turns a 10:1 alphabet frieze into a 1.9m 1×8 run —
  the frieze case is why grids follow aspect instead of hard-coding
  2×2.
- The seam holds: `toPrintable() → standalone SVG` stays the whole
  contract, now with a lint at the receiving end (script /
  foreignObject / external refs refuse to print and name the offender;
  user-imported rasters only warn). Nothing implements `toPrintable()`
  yet — checked — so the spec plans a `print-check.html` harness
  (letterforms-check pattern) making SagePrint buildable and
  verifiable with zero widget changes. First adopter when it comes:
  the phoneme-tiles sound mat.
- §4.5 and the set doc's status line now link to the spec instead of
  calling it unwritten.
- Docs only; no code, no version bumps.

## 2026-07-26 — SagePrint v0.001: the maths prints before the paper does

Glenn: "let's get build v0.001 built." The smallest honest slice of the
poster print spec: print.js (SagePrint v1 — contract lint, tiling
maths, page generation, assembly guides) plus print-check.html, the
repo's first red/green harness of the pattern §15 promised for
letterforms. Zero app files touched — no dialog, no @media print, no
menu item yet; nothing implements toPrintable() so there is nothing to
wire, and the harness's fixture SVGs stand in.

- **43/43 harness checks green** on the dev server, zero console
  errors, first run. Both spec §5 worked examples land exactly: the
  4:3 mat at a 4-sheet budget → landscape 2×2, 49×37cm; the 10:1
  frieze at 8 sheets → a 1×8, 1.9-metre run.
- Budget honesty verified beyond the spec's examples: a square at an
  8-sheet budget correctly takes a 2×3 portrait grid (6 sheets,
  54×54cm) and the readout admits "fewer than the 8-sheet budget;
  nothing blank prints".
- Contract lint holds the seam: script / foreignObject / external
  refs / missing viewBox refuse with the offender named; a data: user
  raster only warns. Six hostile fixtures classify correctly.
- **Pixel proof for the <use> windowing**: the Browser pane went
  hidden mid-verify and screenshots returned blank frames, so page 1
  was rasterised to a canvas in-page instead — 100% of its pixels
  carry the fixture's ink. The cross-svg reference paints, not just
  parses. (DOM asserts alone can't tell those apart; keep the canvas
  trick for future engines.)
- Guides verified in DOM: numbers on every sheet, arrows only toward
  real neighbours, glue strips only on non-final right/bottom edges,
  the TA assembly map on sheet 1 alone.
- Still open from spec §9: the physical assembly test (real A4, glue
  stick, ruler) — needs a printer, so it rides with the dialog/print
  route build.
- **Versions: print.js v1 (new), print-check.html (new). No existing
  file touched.**

## 2026-07-26 — SagePrint grows its dialog; the sound mat is the first poster

Glenn: "let's get a widget up and running to test." The other half of
the print engine plus the first real adopter, one push:

- **print.js v2** — the §4 dialog (live tiled preview through the same
  plan/buildPages path that prints, sheet-budget picker whose names
  shift with the paper, guides toggle, describe() readout, amber/red
  lint lines) and the §6 route (hidden print root, injected @page,
  window.print(), afterprint teardown — fires on cancel too).
- **Phoneme tiles prints its sound mat** — def-level toPrintable()
  renders the cumulative GPC chart from the same pack + phase logic the
  tray uses: phase-grouped tiles, dot/bar/arc sound buttons, the
  resolved phase's tricky words as pink cards. "Print poster…" sits in
  the widget menu after Duplicate; a `print` glyph joined icons.js.
- Live end-to-end: Phase-2 mat → 4 sheets of A4 landscape, 47×37cm;
  8-sheet and A3 re-tiles live (A3×8 → a 1m poster); windowing proven
  by in-page canvas rasterisation, not just DOM asserts.
- **Adversarial review (6 lenses × 3 refuters, 57 agents): 17 findings,
  9 confirmed, all fixed.** The real ones: the boot line had landed
  INSIDE the SageExport guard (brace slip); a widget `<style>` could
  leak global CSS into the live app through the preview import (lint
  now allows @font-face-only styles and refuses on* attributes too);
  non-SVG toPrintable output now toasts with no dialog; document.title
  swaps around print() so Save-as-PDF names the file; sheets became
  exact paper-sized `.sp-sheet` boxes with padding insets (the margin
  approach depended on fragmentation rules at zero tolerance); spec
  §2/§3 amended where it disagreed with reality (there is no
  Export-as-PNG menu anchor; the `<style>` contract line tightened).
- **Tracked deviation:** the sound mat's text rides `system-ui` — the
  print is right on the machine that makes it, and that machine is the
  per-teacher unit of adoption. Font embedding waits for the
  chrome-font work; the spec §2 now carries this note.
- Physical assembly test (spec §9) still pending a real printer.
- **Versions: print.js v2, english-word.js v36, app.js v42, icons.js
  v20, style.css v56 (harness untouched, 43/43 throughout).**

## 2026-07-26 — Modelled writing: the flip-chart easel, replaced

Glenn's brief, near verbatim: teachers handwrite and model a genre over
a series of lessons and weeks; the print replaces writing on easel
paper, tearing it off and walling it; Sage Stage's promise is "it's
saved, it's reprintable in wall-sized format, and in A4 for children to
see 1:1"; the handwriting needs its own writing space with a widget for
printing purposes.

- **docs/modelled-writing-design.md** approved — Glenn chose
  pages-INSIDE-the-widget (the §8.1 washing line proper) over
  one-page-per-widget, and teacher-set ruling with a plain default. v1
  is pen-only by design: strokes are pure vector, so the two hardest
  §8.1 items (typed text, letterforms) stay deferred with nothing
  blocked behind them.
- **`modelwrite` shipped** — fixed A4-portrait page in integer page
  units (0 0 1000 1414; 1 unit ≈ 0.21mm printed), plain / 4-line /
  unlined ruling × three sizes, four pens + wide translucent
  highlighter + stroke eraser, per-page undo of BOTH adds and erases
  (an erased stroke reinserts at its old index — a transient gesture
  must never destroy state irrecoverably), washing-line thumbnail strip
  (taps are navigation only; + caps at 16 with a toast; ✕ confirms; the
  widget never holds zero pages), single-pointer lock for IWB palms,
  and Print… on the bar because printing is the widget's purpose.
- **First contract-clean adopter**: no text, no fonts, no ids, no
  rasters — zero lint warnings in the dialog. A blank ruled page prints
  on purpose: it is handwriting paper. 4-sheet budget → 37×52cm wall
  page; 1-sheet → the child's 1:1 A4.
- Battery all green: draw, second-pointer lock, undo both ways, stroke
  erase, page add/switch/cap/delete, persistence across reload, print
  dialog, zero console errors. Heavy page (300 strokes × 30 points)
  serialises at **76KB** against the spec's 80KB bar.
- Two lessons worth the log: **(1) register()'s destructure is the only
  window into D** — paintBar called `iconEl` bare, the app's mount
  guard swallowed the ReferenceError, and the symptom (empty bar, no
  ruling, ink still working) pointed everywhere except the missing
  name; check the destructure before using any dep in this file.
  **(2) The Browser pane can serve a STALE index.html on a
  navigate-reload** — script `?v=` bumps only bite after
  `fetch(url, {cache:'reload'})` + `location.reload()`; when behaviour
  looks impossible, read the LOADED script versions before touching
  code.
- Second adversarial review (5 lenses × 3 refuters) in flight as this
  entry lands; its findings get their own dated entry.
- **Versions: english-word.js v38, app.js v43, icons.js v21, style.css
  v57.**

## 2026-07-26 — Review round two: the pen learns where it is

The modelwrite review came back (68 agents, 22 minutes, zero stalls —
the leaner harness beat the first run's 141): 21 findings, 17 confirmed
after refutation, collapsing to ten distinct fixes (four lenses found
the same clamp bug independently — convergence is its own confirmation).
All fixed and re-verified same session:

- **P1 — the pen skewed away from its tip in narrow widgets.** toUnits
  mapped the element box linearly, but CSS can distort the box below
  A4 aspect, and preserveAspectRatio letterboxes the CONTENT — input
  and render disagreed. toUnits now computes the meet-transform itself
  (scale = min, centred pads). Proved exactly: in a forced 400×300 box,
  a tap at the letterboxed page centre commits at (500, 707). The page
  white/shadow also moved off the element (transparent svg +
  drop-shadow) so a distorted box shows no phantom white.
- **The single-pointer lock now covers everything that mutates**: Undo,
  Clear, page ✕, Print — a second IWB finger mid-stroke previously
  could throw on the next pointermove (liveEl nulled) or, worse, delete
  the page and commit the live ink onto its neighbour. Strokes also
  carry their HOME page now: finish() commits to the page the stroke
  started on or drops the ink — never onto a different page.
- **Native confirm() → the app's confirmDialog** (deps + both
  ceremonies): confirm() silently no-ops in kiosk contexts and kicks
  Chrome out of fullscreen mid-lesson; the app already had the overlay
  for exactly this reason.
- **Undo stacks survive settings changes** (module WeakMap keyed by the
  widget — api.refresh remounts used to wipe the only route back to
  erased ink).
- **Hardening got honest**: per-axis clamps (x was clamped to the page
  HEIGHT — found independently by four lenses), a per-stroke point
  bound, duplicate page-id dedupe.
- **The seam got two more teeth**: lint scans the root element's on*
  attributes too, and openDialog can't crash on truthy non-SVG input.
- **The harness now measures what it claims**: print-check.html was
  still pinning print.js?v=1 and had zero coverage of the fix-batch
  lint rules; now v3 + five new fixtures (@font-face escape hatch
  allowed, selector styles refused, external fonts refused, on* and
  root-onload refused) — **48/48 green**.
- Rejected findings worth keeping: the erase-drag and long-stroke
  perf claims died on measurement (rebuilds are self-consuming; a
  minute-long stroke is ~50KB of path string V8 barely notices), and
  "page switch rebuilds all thumbnails" is what the spec says should
  happen. The quota-wedge P2 is real but app-wide — toast text
  broadened now, persistent not-saving indicator chipped for its own
  session.
- Zero console errors throughout; save-debounce lesson re-learned the
  embarrassing way (a "failed" skew test was reading a 250ms-stale
  stroke — read state ≥300ms after acting, or read the DOM).
- **Versions: english-word.js v39, app.js v44, print.js v3,
  style.css v58, print-check.html (48 checks).**

## 2026-07-26 — The seam: a poster engine that had never been glued

Glenn opened a 4-sheet modelled-writing poster, looked at the preview and
said the writing was inside the borders and would concatenate incorrectly on
the wall. He was right, and the cause was not where the preview pointed.

- **The tiling maths was never wrong.** Sheet 1 carries poster x `0–190`,
  sheet 2 carries `178–368`: a correct 12mm duplicated strip, exactly as
  §5 specifies. Four fixtures of crop arithmetic had been asserting this
  happily since the engine shipped.
- **The margin was wrong.** Every sheet printed inside `padding:10mm` on all
  four sides. Lay sheet 2 over sheet 1 so the duplicated strip registers and
  sheet 2's own opaque white left margin lands on sheet 1's content from
  poster x `168–178` — content on no other sheet. **10mm of writing lost at
  every seam, both axes.** It happens whether you align by the glue strip or
  by eye, and widening OVERLAP cannot help: the margin always sits outside
  the content it belongs to, so the loss only moves. The fix is the cut every
  poster tiler makes, and §7's "nothing needs scissors to look finished" was
  never true.
- **The preview was telling a different story from the printer.** `.sp-prev`
  rendered the printable box alone — no paper edge, no margins — while the
  print route wrapped each page in `.sp-sheet`. Two code paths, one of them
  flattering. Now `wrapSheets(frag, plan, {mm})` builds the paper for both, so
  the dialog shows the true sheet, and §4's "same code path" promise is
  literal rather than aspirational.
- **Glenn then named the source of the idea — blockposters.com** — whose FAQ
  assembles face down with masking tape after trimming, i.e. butt-and-tape,
  no overlap at all. So `assembly` became a teacher choice: `lap` (12mm
  duplicated strip, glue the cut edge over it, forgives a wobbly cut) or
  `butt` (zero overlap, cut every interior edge, tape the back, **507×380mm
  from the same four A4 sheets against lapped 491×368**). `lap` stays the
  default as the forgiving one. This supersedes the parked overlap-S/M/L
  idea: the useful end of that knob was always *whether*, not *how wide*.
- **Trim lines ignore the "Assembly guides" tick** — numbers, arrows and glue
  strips are decoration a teacher may switch off; a cut line is correctness.
- Harness **48 → 76 checks, all green**: coverage checks now read the step
  from the plan's own overlap so they police both models, plus butt-mode
  planning, per-edge trim geometry in both models, sheet sizing in mm and
  preview modes, and the `top` offset resolving against height not width.
  Four of my first new assertions failed on landscape fixture A because I had
  hard-coded portrait — the code was right and the test was wrong.
- **The lesson worth keeping: 48 green checks of paper arithmetic are not a
  test of paper.** §9's physical assembly test had been logged as open twice
  and never run; it is the single check that would have caught this in a
  minute. It is still open, now marked as the one that matters, and wants
  both models assembled and measured.
- Zero console errors; preview verified for both models in the real dialog.
- **Versions: print.js v4, style.css v59, print-check.html (76 checks).**

## 2026-07-26 — The margin rule: the guides were printing onto the wall

Glenn looked at the fixed preview and pushed back, hard and correctly:
*"Remember who we are dealing with: time poor teachers with little to zero
technical nous… there is still imagery in the margins for the overlaps. This
will cut off text. This absolutely cannot happen."*

He was right, and it was worse than the assembly model. Measured on the
shipped code:

- **Sheet 4's number sat at y=365 in a content box spanning 178–368** — 3mm
  above its own bottom edge, last row, nothing lapping over it.
- **Sheet 4's `◂ 3` arrow sat 2mm inside its left edge** — the edge that lies
  *on top* of its neighbour, so nothing covered that either.

Both printed onto the finished poster, and both sat exactly where the scissors
go. §7's "self-erasing by design" only ever held for the glue strips; every
other guide was inside the printable box. So the doc now carries a rule with
no exceptions:

> **Nothing a teacher is told to cut towards may sit inside the printable box.
> Every assembly mark lives in the margin.**

That is always possible, because an edge with a neighbour always has a
disposable margin — cut away, or covered by the sheet lapping over it.
`buildFurniture` lays one svg over the whole sheet and draws in the band the
page svg cannot reach.

- **The edge language is now matching, not reading** (Glenn's IKEA framing):
  a solid shape per seam, identical on both sheets that meet on it, eight of
  them allocated so no sheet shows the same shape twice. Beside it,
  `CUT → 2` / `GLUE → 2` at 3.6mm — what to do and who with. Two marks per
  edge at 26% and 74%, so either end of a sheet tells you what that edge is
  for. A solid cut line exactly on the content boundary. `SHEET 3 of 4 · row 2`
  in the first disposable margin. **An unmarked edge is an outside edge.**
- **Marks run ALONG the edge, not across it.** First attempt stacked them
  across a 10mm band and capped the shape at ~2mm — invisible at arm's length,
  and exactly the "little to zero technical nous" failure Glenn named. The
  edge is 200–300mm long; that is where the room is.
- **Trim & tape is now the default.** An overlap repeats the writing at the
  seam, and modelled writing that ghosts by a millimetre is far more visible
  than a photo doing the same — and this is a class's own writing, which does
  not get redone if the poster comes out wrong.
- **A sizing fragility found by building a scratch view:** `wrapSheets` relied
  on `.sp-prev` CSS to neutralise the page svg's intrinsic mm size. Outside
  that container the sheet grew to 330×1119 instead of 330×467, which sheared
  every seam circle into an ellipse. Now set inline, so a sheet is correct
  wherever it is mounted. Worth remembering: **rendering the thing large enough
  to actually look at is a test.** Both defects this session were invisible at
  preview scale and obvious at reading size.
- Harness **76 → 74 checks** (the superseded trim-line block replaced by the
  margin-rule block), all green. The load-bearing new one asserts zero
  `.sp-num`/`.sp-arrow`/`.sp-map` inside any `svg.sp-page` — the exact
  regression — plus per-edge roles in both models, cut lines on the content
  boundary, every mark inside a margin band, and shapes matching across each
  seam.
- Zero console errors; both models exercised in the real dialog and at
  reading size.
- **Still open, and still the one that matters: the §9 physical test.** Print,
  cut, tape, measure — both models.
- **Versions: print.js v5, style.css v60, print-check.html (74 checks).**

## 2026-07-26 — One honest test: the poster had never printed past page two

Glenn: *"one single test of this printing fix. Go to print and save to PDF.
How does this PDF look and feel?"* The right instinct, and it found the worst
defect of the three.

Built `print-pdf.html` — a harness that renders the **real** print root
(`buildPrintRoot`, extracted from `printRoute` so the test exercises the route
rather than a copy that drifts) for a job given by query string, so headless
Chrome can `--print-to-pdf` it. First run:

| job | pages produced | pages expected |
|---|---|---|
| 1 sheet A4 | 2 | 1 |
| 4 sheets A4 | 2 | 4 |
| 8 sheets A3 | 2 | 8 |

**Every poster printed about two pages whatever the sheet count.** The cause is
one line of screen CSS: the app is a kiosk classroom screen, so
`html, body { height: 100%; overflow: hidden }` — correct on the stage, fatal
in print, where it clips the flow to a single viewport and simply discards
sheets 3..n. An 8-sheet A1 came out as two sheets and the teacher would never
have known which bits were missing. `@media print` now resets `html, body` to
`height:auto; overflow:visible; margin:0`; the on-screen kiosk behaviour is
untouched (verified: body still `overflow:hidden`, no scrollbars).

After the fix, measured with pypdf: **1 → 1 page, 4 → 4, 8 → 8**, every
MediaBox exactly the chosen paper (210×297 / 420×297mm), and every seam naming
the right partner (sheet 3 of the 2×4 A3 job carries `CUT → 1` up, `CUT → 4`
right, `CUT → 5` down). Rendered pages to PNG and looked at them: writing fills
the box, marks sit in the margin outside the cut line, outer edges are
completely unmarked, and the 1-sheet A4 is a clean child's copy with no
furniture at all.

**The lesson, and it is the same one twice in one day:** neither the DOM
harness, nor the dialog preview, nor the tiling maths could see this — they all
inspect a layout that is never paginated. 74 green checks and a correct preview
sat on top of a print route that lost three quarters of the poster. Geometry
tests are not print tests. `print-check.html` now tests the geometry;
`print-pdf.html` tests the print, and §9 requires both. Both of today's other
defects were also invisible at preview scale and obvious at reading size.

- Also extracted `buildPrintRoot(p, guides)` and exported it; caught and fixed
  a scope bug I introduced doing it (`cleanup` still referenced the old local
  `root`).
- Harness 74/74 green on v6; zero console errors; app screen behaviour
  unchanged.
- **Still open: the §9 physical test.** Print, cut, tape, measure — both
  models. Everything up to the paper is now verified; the paper is not.
- **Versions: print.js v6, style.css v61, print-pdf.html (new).**

## 2026-07-26 — "A duplication of trim and tape with overlap and glue"

Glenn printed a real 4-sheet A3 poster, saved the PDF and asked whether the two
assembly methods were bleeding into each other. Checked his file: they were
not. It was a clean `overlap & glue` job, and the marks were exactly right —
sheet 1 `GLUE → 2` right and `GLUE → 3` bottom, sheet 4 `CUT → 2` top and
`CUT → 3` left. In lap mode each seam has two *different* jobs, so a sheet
legitimately carries both words.

But the misreading was the finding. If the person who designed the system reads
it as two methods mixed, a teacher certainly will — and looking again with that
lens, a worse defect was hiding underneath:

- **`GLUE → 2` pointed the wrong way.** On sheet 1's right edge it meant "sheet
  2 gets glued on here"; it *parses* as "glue this onto sheet 2". A teacher
  following it literally laps sheet 1 over sheet 2 and inverts the assembly
  order. Silent, plausible, and invisible until the two halves of a seam sit
  side by side in a printed PDF.

Fixed by stating direction from each edge's own point of view: the edge you cut
says where it **goes** (`CUT → 2`); the edge something lands on says what
**arrives** (`2 ON TOP`). Solid shapes mark edges you cut, faint ones mark
edges that receive. The glue-strip caption likewise became
`sheet 3 goes on top of this strip`.

And **every sheet now names its method** — `SHEET 1 of 4 · row 1 · overlap &
glue`. That alone answers the question Glenn asked: a sheet carrying both CUT
and ON TOP is not a mixed print, it says which method it is for.

- Harness **74 → 79 checks**, all green, including both halves of a lap seam's
  wording, that no mark anywhere reads as glue-this-onto-that, and that every
  sheet carries its method name.
- Verified in real PDFs for both models, read at page size.
- **Versions: print.js v7, print-check.html (79 checks).**
- Worth noting what caught this: not a test, not a preview — a teacher-brain
  reading a printed page and saying "this looks wrong". Three defects in one
  day, all found that way, none catchable by the geometry harness.

## 2026-07-26 — Item 11: the teacher ticks the pages worth the paper

Back to Glenn's original list. Of fourteen items, one had shipped (the margin
assembly language) and one had been reshaped (overlap sizing became the two
assembly models). Glenn picked item 11 next — multi-page print preview and page
selection — over the paper slice, on the grounds that the print engine was hot
and freshly understood. Correct call: it is a seam change, and seam changes are
cheapest while the module is still in hand.

**The seam stayed additive.** `toPrintablePages() → [{svg, label}]` sits beside
`toPrintable()` rather than replacing it, with an optional `printCurrent()`
naming the page the teacher is on. One-output widgets — phoneme tiles, word
bank — are untouched and verified unchanged: no page chips, no page label, same
readout, same four sheets. "One method, one direction" survives; there are now
two methods, still one direction.

- **Ticked, not printed by default.** The current page starts ticked and
  nothing else does. Paper waste is the whole point of the feature, so the safe
  default is the one that prints least. `All` / `None` under the row.
- **Each page is a chip with its own thumbnail and its sheet split drawn over
  it** — how a page divides is visible without rendering it full size. Glenn's
  ask was to see the split of all the pages, not just page 1; a 16-page unit at
  8 sheets would be 128 sheet thumbnails if taken literally, so the chips carry
  the split and the big preview carries the ticked pages.
- **One orientation per job**, because every page prints into a single `@page`
  box: page 1 plans freely, the rest are forced to agree via a new
  `plan(svg, {orientation})`. Named `@page` rules would be purer; one
  constraint is simpler and every real adopter's pages share an aspect.
- **The page leads the sheet line** — `PAGE 3 · SHEET 2 of 4 · row 1 · trim &
  tape`. Three pages at four sheets lands twelve sheets on a table at once and
  the pile is unsortable without it. The line auto-shrinks (floor 2.8mm) to
  stay clear of the seam marks rather than growing into them — asserted, since
  a longer label was exactly the kind of thing that would silently collide.
- **Lint is per page**: a page that fails is marked, greyed and untickable
  while the rest of the job still prints. One bad page never kills a job.

Verified: harness **79 → 91 checks**, all green. Real PDF of a 3-page × 4-sheet
job → **12 pages**, grouped by page, every sheet carrying its page. Dialog
exercised in the app with a 5-page unit (chips, multi-select, totals
`3 pages · 12 sheets of A4 · each page 38 × 54 cm`), single-SVG path
re-verified unchanged, zero console errors.

- **Versions: print.js v8, style.css v62, english-word.js v40, app.js v45,
  print-check.html (91 checks), print-pdf.html (?pages=N).**
- Remaining from Glenn's list: the paper slice (items 1–6, designed, unbuilt),
  the ink tools (7–8), the chrome (9, 10, 14). And the physical test.

## 2026-07-26 — The paper slice: paper becomes a property of the page

Glenn: *"go ahead and build the paper slice"* — items 1–6 of his list, the
foundation everything else sits on.

**The move that made it small:** paper is `{ ruling, size, vAt, hAt }` on each
page, where `vAt` and `hAt` are **nullable divider positions rather than a
split enum**. Two nullable numbers give all four layouts with a single
lined-zone rect to compute — less code than a three-way enum, and the
picture + lined|plain combination falls out for free. `mwZone(paper)` returns
that rect and feeds the live page, the thumbnails, the picker swatches and
`toPrintable()` alike, so v1's rule — the lines a class watches being written
on are the lines that print — now holds across splits too.

- **Alternating paper** (Glenn's geometry A): lines every `P/2`, solid writing
  line, faint annotation line at 50% directly above it, dotted or solid. Line
  height always means the gap between *writing* lines, so the annotation space
  is spent out of the page, not out of the letter size — "18mm lines" mean the
  same thing on every paper. Matches the "miss a line" rule children already
  follow in workbooks.
- **The ladder is `[48, 64, 88, 120, 160]`** = 10/13/18/25/34mm at A4, 4-line
  groups on a parallel ladder. Steps 1–3 of both are v1's `s`/`m`/`l` to the
  unit, so nothing a teacher already wrote shifts off its lines. **Asserted
  against v1's own formulas recomputed inline rather than trusted** — plain and
  4-line both match line-for-line.
- **Labelled in millimetres, not year groups** (Glenn's call): a neutral fact a
  teacher can measure against their exercise books, and mixed-age and SEN
  classes make year labels a liability.
- **Pictures are placed, not slotted.** The band reserves space and stops the
  ruling; it is not a container. Three-part story lineage is three pictures in
  the band, so two- and four-part come free and nothing auto-arranges. Always
  under the ink — teachers write *on* the printouts — and selectable only while
  the Picture tool is active, so nothing can be dragged out of place with a pen
  in hand. Budgeted like the word bank's: quality-stepped to ~180KB, ~1.2MB per
  unit, refused politely at the floor.
- **Dividers drag only while the paper panel is open.** A divider you can only
  nudge deliberately cannot be nudged by a stroke that starts near it
  mid-lesson.
- **The widget moved to `modelwrite.js`** — the paper slice roughly tripled it
  and english-word.js was already 254KB (now 237KB holding four widgets, with
  38KB of its own for modelled writing). Verified genuinely decoupled by
  re-initialising the module against a throwaway registry in the console: it
  mounts a working widget, which it could not do if it reached into anything
  the app did not hand it. That trick also made the whole geometry pass
  testable without touching the app's state.

**Found by looking, again.** The picker swatches first rendered at 42px with
real page-scale rules — a 2.2-unit line at a tenth of a pixel — so every paper
looked identically blank. Swatches are now 56px with line *weight* scaled up
while spacing and layout stay exactly true, so a swatch still cannot
misrepresent the paper. Third time in two days that something was invisible at
preview scale and obvious at reading size.

Verified: v1 migration (paper stamped onto every page, legacy keys dropped, ink
intact); two pages in one unit holding genuinely different papers; ruling
stopping at x=482 for a divider at 500 and starting at y=540 below a band at
480; the screen-only placeholder never reaching print; an oversized off-page
picture clamped inside the page and rendering under the ink; the SagePrint seam
lints a picture page amber and a picture-free page **completely clean**. Zero
console errors throughout.

- **Versions: modelwrite.js v2 (new), english-word.js v41, app.js v46,
  style.css v64.**
- Remaining from Glenn's list: items 7–8 (pen thicknesses, part-stroke eraser,
  lasso) and 9, 10, 14 (toolbar placement, carousel strip, edge page-turns).
  And the physical print test.

## 2026-07-26 — The hand and the room: ink tools and chrome

Glenn: *"print later when attached to one. Let's do the others."* — the
physical test parked until he's at a printer, and slices B and C built
together: items 7, 8, 9, 10 and 14. That closes his original list except the
print test.

**Two erasers, not one sized tool** (Glenn's call). They are genuinely two
jobs:

- **Eraser rubs.** It removes only the points it touches and the stroke lives
  on as the runs either side of the hole. This is the case he described
  precisely: in a joined `ie` the `e` must go and the `i` must stay, because
  losing the `i` can turn what's left into a different word and cost most of a
  modelled sentence. Verified: a 400-unit stroke rubbed at its midpoint splits
  into 100–280 and 320–500, widths preserved, hole matching the rubber.
- **Lift** keeps v1's behaviour on its own button — tap, whole stroke gone.
  Still the fastest way to undo a whole modelled word.

**One Undo puts a rubbed letter back whole.** The op carries the original
stroke and how many runs replaced it, so undo is never a per-fragment crawl —
the thing that would have made the rubber infuriating in a live lesson.

**The lasso selects fully-inside, not merely-touching.** A teacher lassoing a
sentence must not drag half the line below it along too. Copy writes to a
module-level clipboard that survives page switches, because lifting an
exemplar sentence off one page and pasting it onto another is the *point* of
the feature rather than a side effect — verified end to end: copy on page 1,
add page 2, paste, lands at +40 with page 1 untouched.

**Chrome:**

- **Bar to any edge**, set in the ⋯ panel: handedness and which side of the
  board you stand are per-teacher constants, not mid-lesson changes. Left and
  right become a vertical column through a grid swap.
- **Page-turn buttons on the page's own borders**, draggable up and down and
  remembered, because they must never sit on the writing. A drag never also
  turns the page.
- **The washing line skims like a book.** Press a thumbnail, a big preview
  follows your finger across the pages, release lands on it. A plain tap is
  just the shortest possible scrub, so one gesture covers both — no separate
  tap and drag modes to explain.

**A bug caught by building it:** the scrub preview first lived inside the
strip, where it would scroll away with the thumbnails and be wiped by every
`paintStrip`. It floats over the widget now. Also worth noting the test that
found nothing: dispatching the scrub on the strip rather than on a thumbnail
silently did nothing, which was my test being wrong — the handler quite
correctly requires the press to start on a page.

Verified in isolation (the throwaway-registry trick again, which made every
pointer gesture scriptable) and then in the live app: three nib weights render
per-stroke widths, all eleven bar controls present, selection box drawn,
turn button on the border, two pages on the line. Zero console errors.

- **Versions: modelwrite.js v3, style.css v65.**
- **Glenn's original fourteen items are now all built except the physical
  print test**, which needs him, a printer, a guillotine or scissors, and a
  roll of masking tape.

## 2026-07-26 — Five bits of teacher feedback, four of them real bugs

Glenn drove the built widget and came back with a list. Four were genuine
defects; one was a layout rule doing the opposite of what it looked like.

**The eraser was erratic — "sometimes a little sometimes double the pen's
width".** Real, and the cause was upstream of the eraser: capture thins points
hard (a point must move 4 units to be kept), so on a fast stroke they land 40+
units apart. Dropping whole points therefore cut a hole the size of the *point
spacing*, not of the rubber. Measured on identical lines sampled 5 units and 50
units apart, a 48-unit rubber cut 50 and **100**. Fixed by densifying only the
segments the rubber actually touches, so the hole is always the rubber's own
diameter: now 50 and 48. The rest of the stroke keeps its sparse points, so the
storage discipline holds.

**The lasso refused writing that ran to the page edge, and could not cut a
word.** Both came from the same rule — "select only strokes wholly inside the
loop" — which I had chosen for predictability. It was wrong for this widget.
Glenn: *"cursive writing needs to be able to cut suffixes and prefixes off the
words easily much like a teacher would on a paper flipchart with post-it notes
and the like."* **The lasso now cuts.** Whatever falls inside the loop comes
away: a stroke wholly inside is simply selected, a stroke partly inside is
split at the loop edge (densified there so the cut lands where the teacher
drew, not at the nearest captured point), the inside part selected and the rest
left behind. Verified on a stroke spanning 40–960: a loop over the tail cut it
into 40–699 and 701–960, the suffix moved away on its own, one Undo restored
the move and one more put the word back together whole. Edge-touching writing
works because the loop no longer has to enclose anything.

**Left and right toolbars wasted the page.** One line: `align-items: start` on
the grid stopped the stage stretching into its row, so the page rendered small
with a band of dead space beneath it. Removed — and left/right now give a
*bigger* page than top/bottom (532 vs 471 units tall), because a side bar costs
no vertical space. The opposite of the complaint, which is the right place to
end up.

**The scrub preview went off-screen on a side bar.** It was anchored to the
strip and auto-placed into a grid cell. It is now absolutely positioned and
centred over the whole widget, out of flow entirely — verified inside the
widget bounds in all four bar positions.

**The widget ran under the stage's dock.** Default size 520×760 → 560×620.

Verified: eraser hole matches the rubber at both sampling densities; lasso cut,
move and two-step undo; page fills the stage in all four bar positions; peek
on-screen in all four; zero console errors.

- **Versions: modelwrite.js v4, style.css v66.**
- **Still open:** the bar carries eleven controls and wraps to two rows at the
  default width. Moving it to a side turns it into one vertical column and
  sidesteps it, but the top-edge layout wants a rethink rather than another
  button. And the physical print test.

## 2026-07-26 — Closing must not be able to cost three days

Two problems from Glenn driving it.

**Left/right toolbars, measured.** The bar sat in a grid area spanning BOTH
rows (`'bar stage' / 'bar strip'`), so it ran 708px tall — 72px past the stage
and into the thumbnail strip's row. The `.grow` spacer, correct behaviour in a
horizontal bar (Print in the fixed right corner), then threw Print 685px down
that column and on top of the thumbnails. Fixed: the bar occupies the stage row
only and the strip spans the full width; in a vertical bar the spacer is a
fixed 10px so the buttons stay together. Added `min-width:0; min-height:0` to
the grid children, which is the usual source of a Chrome/Firefox difference in
grid track sizing. Left and right now give the LARGEST page of the four
positions (434×636 against 406×575 on top), which is the right way round.
Also tightened the vertical bar and gave it a hairline scrollbar — the OS one
was sitting over the ink dots.

**Closing a widget could destroy days of handwriting in one click.**
`removeWidget` filtered the widget out of every screen and saved. No confirm,
no undo, no trash — and `Delete`/`Backspace` on a focused widget hit the same
path, which on a touch board is an even easier accident.

Glenn first said the answer must NOT be an "are you sure" — *"this is the paper
version's armour… it needs to be bullet proof"* — then proposed one with a way
out: *"perhaps an 'Are you sure you want to exit?' alert, with a 'Duplicate
instead to keep a copy'"*. Both are right about different halves, so it got two
layers:

1. **The question — and then, on Glenn's second thought, no decision in it at
   all.** `confirmDialog` first gained `altLabel`/`onAlt` for a *Duplicate
   first* button. Glenn: *"perhaps make an auto duplicate. We are dealing with
   teachers with a mindful of lesson plans and verbal assessments here!"* —
   right, and the better answer. The copy is now automatic and the question
   just says so: **Keep it open · Close it**, with the message naming exactly
   where the copy went. A teacher mid-lesson should not have to spot a button
   and decide. (`altLabel` stays in `confirmDialog` as a general capability;
   nothing uses it yet.)
2. **The bin underneath, which needs no awareness at all.** Closing snapshots
   the widget into `state.bin` (12 entries, 30 days); the toast offers *Put it
   back* for nine seconds, and **Your data** grows a *Recently closed* list for
   the mis-click noticed on Thursday. Verified surviving a full reload.

**The question is opt-in per widget type; the bin is not.** A first pass made
every widget ask, including a clock — and a question that fires every time
teaches a teacher to click straight through it, costing exactly the work it
means to save. So the confirm needs `def.hasWork(w)` (modelled writing
implements it: any stroke or picture on any page) while the bin keeps anything
with real content whether or not its type opted in.

**The bin must never cost more than it saves.** A writing unit can carry ~1.2MB
of pictures, and this app keeps every deck in one localStorage key. `save()`
now sheds bin entries oldest-first on a quota failure, then drops the bin
entirely, and only then reports failure: work on the screen always beats work
in the bin.

Verified: clock closes silently and is not binned; modelled writing asks with
all three buttons; *Duplicate first* leaves the copy carrying the writing;
*Close it* bins with strokes intact, persisted to storage, restorable after a
reload, and removed from the bin once restored. Zero console errors.

- **Versions: app.js v48, modelwrite.js v5, style.css v70.**
- A workflow was launched to explore persistence designs adversarially and was
  stopped once Glenn pinned the direction and the build was verified — the
  answer arrived from him faster than from the fan-out.

## 2026-07-26 — Auto-duplicate, and the ink dot that was never fully there

Two small ones, both from Glenn watching it work.

**The selected ink dot was clipped.** `.mw-tool.active` draws its ring as a 3px
outline at 2px offset — 5px of room needed — and `.mw-bar` had no padding at
all, so the ring was shaved on every side. Worse in a vertical bar, where
`overflow-y: auto` hard-clips rather than merely overlapping. Measured before
touching it (`roomAboveDot: 0` against `ringNeeds: 5`) and after
(`roomAboveDot: 5`, ring fits in all four bar positions). Black is the first
dot and usually the active one, which is why it was the one that looked wrong.

**The copy became automatic.** The close dialog briefly asked the teacher to
choose *Duplicate first*; it now just keeps the copy and tells them where it
is. Two buttons, no decision: **Keep it open · Close it**. Verified the copy
still lands in the bin with its strokes.

- **Versions: app.js v49, style.css v71.**
- Worth remembering: both of today's UI defects were sub-pixel or off-screen
  geometry that measured wrong long before they looked wrong. Measuring the
  element against what it needs beats squinting at a screenshot.

## 2026-07-26 — Pointing at a button that isn't there

Glenn, with a screenshot of the actual button: *"this is where 'your data' is
not 💾"*. The close dialog told teachers to look under "💾 Your data". That
emoji only exists as fallback text in `index.html` — `app.js` replaces it with
`iconEl('save')` at boot, which draws a download arrow. So the message sent a
teacher hunting for a floppy disk that is nowhere on the screen.

Now named by position instead of by icon: *"it's in 'Your data', the download
button at the top right, under 'Recently closed'"* — verified against the live
DOM that the button is in fact right-of-centre and near the top, rather than
trusting the description. The button's own tooltip also stopped saying only
"export / import" and now mentions recently closed widgets, since that is what
a teacher will be going there for.

Small, but it is the exact failure mode this whole safety net exists to avoid:
armour a teacher cannot find is not armour. Worth a standing check — **UI copy
that names a control must be checked against what that control actually
renders**, not against what the markup says.

- **Versions: app.js v50.**

## 2026-07-26 — Two tiers: tools that hold still

Glenn, on 6% battery and asking for thinking before building: *"this menu is in
need of rethinking… specifically the eraser button, when clicked, produces the
sizes off to the right. What are the standards for this type of menu in UI
design?"*

The honest answer was that it is a defect, not untidiness. Options were being
inserted just before the `.grow` spacer, so they landed next to Print — eight
controls from the eraser that spawned them — **and pushed Lift, Lasso, Paper,
Picture, Undo and Clear along as they appeared.** A teacher reaching for Clear
finds it has moved because they picked up the eraser. That is the
spatial-stability rule this app is built on, broken by its own toolbar.

The conventions, all of which put options adjacent to their tool or in one
fixed place: the **options bar** (Photoshop, Illustrator, Affinity), the
**anchored flyout** (Figma, Procreate), **inline expansion** (iPadOS Markup),
and **long-press for options** on mobile. Took the options bar: a flyout costs
a tap to open and a tap to dismiss every single time, and floats over a page a
class is watching being written on.

- **Tier 1 never reflows** — asserted directly: cycle every tool and the row's
  contents are byte-identical (`tier1NeverChanges: true`).
- **Tier 2 always exists**, so nothing appears or disappears; only its contents
  change.
- **Tool identity split from tool settings**: `tool` is now a name, with `ink`,
  `penW`, `hlW`, `eraseR` beside it. The highlighter stopped masquerading as a
  fifth pen colour and became its own tool with its own widths. Verified: red
  thick pen renders #dc2626 at 12; broad highlighter #fde047 at 44, opacity
  0.4; and returning to the pen restores red and thick exactly.
- Stored strokes were untouched (`{c, w, pts}`), so nothing needed migrating.

**Sized by measuring, not squinting.** Tier 1 needed 640px for one row; at 600
it still wrapped and cost 25px of page. Default widget width is now 640, and
chrome dropped from 94px to 69px. Below that width the row wraps — stably,
which is a cosmetic cost rather than the original defect.

**Deferred deliberately:** icons for the six tools, which is the real answer to
tier-1 density and would let it fit any width. Choosing an icon a teacher reads
correctly for "Lift" is a design decision, not a swap, and the icon set did not
have obvious candidates for Lift or Lasso. Not worth guessing at on a failing
battery.

- **Versions: modelwrite.js v8, style.css v74.**

## 2026-07-26 — Four highlighters, and colour you can find without reading

**Three more highlighter colours** — pink, sky, orange beside the yellow.
Appended at indices 5–7 rather than inserted, so a stroke saved as `c:4` is
still the same yellow; verified against v1-format strokes (old pen renders
6/opacity 1, old highlighter 30/0.4, a v3 stroke keeps its stored width). The
"is this a highlighter" test was `c === 4` in three places — rendering, eraser
hit-testing, and the pen swatch row — and all three became a range check, so
the eraser still treats highlighter strokes as fat and easy to catch and the
pen row still shows only the four writing colours.

**Colour cues on the tool pills.** Glenn: *"ease if seeing and tapping than
finding a word in the grey"*. Ten identical grey pills means finding a tool by
reading. Each now carries a pale tint of its family hue with a matching border:
amber takes marks away, indigo moves them, cyan adds, green is the page, grey
is history, red is the one that destroys. Pen and Highlighter wear the ink they
are set to, so the pill answers "what am I holding" too.

The tint is the cue rather than a leading dot — nine dots would have cost ~90px
and undone the one-row tier 1.

**Three defects caught in the doing, all by measuring rather than looking:**
- Every pill rendered the same colour: `.btn.ghost` sets its own background and
  outranked `.mw-pill` on specificity. Needed `.mw-bar .btn.mw-pill`.
- The Pen pill did not follow the ink, because changing ink repainted tier 2
  only. Ink changes now repaint both tiers — the cue lives in tier 1.
- Adding a 1px border put 2px x nine buttons back into the row; padding came
  down from 8px to 7px to pay for it.

**And one false alarm worth recording:** I read "tier 1 wraps to two rows" three
times off a row-counter that grouped buttons by distinct `top` value. Print is
22px tall against the others' 24px, so it centres 1px higher and counted as a
second row. The bar was 34px tall throughout — one row. **Measure the thing you
actually care about (the container's height), not a proxy for it.**

- **Versions: modelwrite.js v11, style.css v77.**

## 2026-07-26 — The armour, the nib, and the teaching payload

Glenn, to the whole review list: *"these are great ideas. Let's get them in."*
All twelve went in. The order was the one argued for — protect the work first,
then the document, then the ink.

### Measured before anything was built

The snapshot design turned on one number, so it was taken rather than assumed:

| | |
|---|---|
| heavy unit (16 pages × 300 strokes) | **2.24 MB** of strokes alone |
| the same unit with pictures | **3.47 MB** |
| `JSON.stringify` + `setItem` on it | 8 ms + 5.7 ms |
| localStorage ceiling, this machine | **50 M characters** |
| localStorage ceiling, school Chrome | ~5–10 MB |
| IndexedDB quota | **5,831 MB** |

Two conclusions fell straight out. **Snapshots cannot live in localStorage** —
one heavy unit nearly fills the whole app's budget — so they went to IndexedDB,
which also makes them asynchronous and therefore incapable of stalling a
stroke. And **the storage warning cannot quote a fixed number**, because the
ceiling ranges over an order of magnitude between browsers.

### Protecting the work

**`snapshots.js` is new** — an IndexedDB store with two triggers, because they
catch different disasters. A **daily** copy of every widget holding work, taken
at boot, so a unit worked on across a week leaves a trail of days rather than
one overwritten "latest". And a **before** copy taken at the instant of Clear
page, delete page, delete screen and delete deck — the four acts that destroyed
days of writing silently, none of which the recently-closed bin ever saw.
Restores land *beside* the live copy, never over it: a teacher restoring
Tuesday almost never wants Thursday thrown away to get it.

**The headroom warning asks instead of guessing.** It tries to park a scratch
string a quarter the size of the data beside it; if that won't fit, the data is
inside the last quarter of whatever this browser allows. Two levels, each said
once, and the level resets if room comes back.

**Undo now survives a reload.** The ops held live stroke *objects* and found
them again with `indexOf`, which works beautifully in memory and cannot be
written to disk. They are now positional — an index, plus the value where one
is needed — which is sound because undo is strictly LIFO: when an op is popped,
the array is exactly as that op left it. The history goes to IndexedDB, not
localStorage, because a single lasso op carries a whole page of strokes.
Verified: two strokes, reload, undo → 2 → 1 → 0, then "nothing to undo".

**Delete/Backspace needs a modifier now**, and a bare press says why.

### The unit became a document

Duplicate (the modelled-writing move that was previously impossible without
rewriting the sentence by hand), reorder, lock, and name. Reorder is split by
**time, not by target**: move straight away and it is the scrub that was always
there; hold still for 400 ms and the page lifts off the line. A hidden handle on
a 44px thumbnail is not findable on a wall-mounted board, so the ⋯ menu carries
the same move as two plain buttons. The 16-page cap became 40 with a nudge at
24 — the real limit is storage, which the app now measures directly.

The lock resists **everything**: ink, eraser, lasso, paper changes, paste,
Clear, undo and delete. Half a lock is worse than none.

### Pressure and speed

Every mark was a constant-width marker line. A stroke can now carry a width
**per point**, from stylus pressure where the board reports it and from hand
speed where it doesn't — and speed is a good signal, because you slow down on
the part of a letter you are being careful about.

A varying stroke cannot be drawn with `stroke-width`, so it is drawn as its own
**outline and filled**. One path element either way, so the DOM cost, the
thumbnails and the print are unchanged, and a stroke with no `pw` still takes
the old branch byte for byte. **Verified by measurement, not by eye:** a known
ramp of 4→20 units probed with `isPointInFill` read 5.5/9.5/13.5/17.5 against
an expected 5.6/9.6/13.6/17.6. The eraser splits a tapered stroke into runs
whose widths continue the ramp correctly (4→11 and 13→20 either side of the
hole), and one undo puts it back whole.

Highlighters and ruled shapes stay even — a tapering box reads as a wobble.

### The bar fits any width now

Icons for all ten tools, **words while there is room for them**, and icon-only
at exactly the point they would cost a second row. Lift and Lasso were deferred
once for want of an icon a teacher would read correctly; both are now drawn for
the job rather than borrowed (`pointer` would have said "select", which is the
one thing Lift does not do).

**Two defects found in the doing.** Deciding the fit from the bar's own *height*
meant toggling a class inside the observer watching the bar — it re-enters and
can stick. Width is the honest input: dropping the words changes the row's
height, never its width, so it converges on the first pass. And
`ResizeObserver` never fires at all in the preview pane, which is why widgets
now get an **`api.onResize` hook** from app.js instead — simpler than an
observer, and it works wherever this runs.

### The rest of the surface

Zoom (1×–4×) and pan, as a **view** — the viewBox moves, the page never does.
The input mapping reads the viewBox, verified exactly: at 200 % a tap at the
centre of the box landed at page (500, 707) against an expected (500, 707.5).
School colours, appended at index 8+ so no saved stroke shifts. Straight-line
and box helpers as a modifier on the pen, rendered as polylines because
midpoint smoothing rounds a box's corners. Rotate and crop for imported
printouts, with the crop dragged on the picture's own edges.

### Print

**Corner crop marks as well as the trim line** — scissors do not follow a
hairline across 300 mm, you line the blade up on two marks and cut between
them. 1.6 mm against the line's 0.7, at both ends, inside the margin that gets
cut away. A **contact sheet** of the whole unit on one page. A **wide lap**
(24 mm against 12) for when a glue stick needs something to hold onto. And
**direct PDF export**.

The PDF took two attempts. Rasterising the live DOM with html2canvas **hung**:
the page svg is a `<use>` pointing at a master that lives outside the
`.sp-sheet` being captured, which is that library's worst case. Serialising the
sheet as one standalone SVG and rasterising it ourselves is faster, has no
second rendering engine to disagree with the printer, and is the same geometry
the print route already uses. A 4-sheet poster produced a 4-page PDF.

### The teaching payload, off paper at last

All of §8.1 except the double-page spread. The **marking palette** — two
highlighters carrying the school's own meanings *and the words for them*, since
a marking code only works if the room can read it off the board — the purple
editing pen, and a **VF stamp** that is deliberately not a stroke, so the
eraser can never half-rub one out. **Focus lenses**, the neutral trio by
default and typed in by schools with their own. The **gradual-release badge**
and **Cold/Hot bookends**, as page tags that print, because a Cold page and a
Hot page pinned side by side *is* the evidence. **Compare Cold & Hot** opens the
contact sheet with exactly those two ticked — side by side and one sheet, which
is what §8.1 asked for, without a second view to keep in step. And **Big Write
focus mode**: a mode of this widget rather than a second one, so the page being
written on is the same page. Tools and washing line go; the lens, a clock and
the paper stay.

Marking inks are reserved at 14+, *above* the school range, because
`MW_SCHOOL_AT` is baked into every saved stroke that uses a school colour.

- **Versions: snapshots.js v1 (new), modelwrite.js v23, app.js v52, print.js
  v13, icons.js v23, style.css v84.**
- Worth remembering: **three of the four real defects this session were found by
  measuring, and the fourth by a hang.** The taper, the bar fit and the zoom
  mapping were all verified against a computed expectation rather than a
  screenshot — and the one place I checked too early (snapshots, read 700 ms
  after an idle-deferred IndexedDB write) looked like a missing feature and was
  simply a slow one.

## 2026-07-26 — The eraser was reshaping what it touched

Glenn, with four screenshots of a box being rubbed: *"the rectangle is the most
obvious behaviour than a line. But the large and medium sized nibs changes the
shape of the lines as they touch."* Correct on both counts, and it was two
faults wearing one coat.

**The `sh` flag was being dropped.** Five separate places built a derived
stroke — eraser runs, lasso cuts, copy, paste, page duplicate — each as its own
hand-written object literal, and not one of them carried `sh`. So the moment a
ruled box was touched it stopped being ruled, and its survivors came back
through `mwStrokePath`'s quadratic-through-midpoints smoothing. A box exists
precisely for not having rounded corners. All five now go through one
`mwDerive(s, pts, pw)`, which is the only way this stops drifting again.

**That also explains why the effect looked random.** The rounding is worst
where points are far apart, and `mwDensify` only subdivides segments near the
rubber — so corners *close* to the rub came back sharp-ish and corners *far*
from it came back as huge curves. A bigger nib densifies more, which is why
Glenn saw it worst on large and medium.

**And the survivors kept the densification.** The rubber has to subdivide to 3
units to cut a clean hole, but the runs either side kept those points: a stroke
got roughly ten times heavier every time it was rubbed near, and its smoothing
tightened wherever it had been touched while staying loose everywhere else.
That is the other half of "changes the shape of the lines".

`mwThin` now runs on every derived stroke — a distance pass back to the 4-unit
capture threshold, then a **collinear pass** that drops any point lying within
0.6 units of the line between its neighbours. Distance alone was not enough: a
rubbed box edge came back as 28 points sitting on a dead-straight line, which no
distance test can see. First and last points are always kept, so the cut still
lands exactly where the rubber left it.

**Measured, all three nibs, one rub through the top edge of a box:**

| nib | radius | gap cut | expected |
|---|---|---|---|
| small | 12 | 488→512 = **24** | 24 |
| medium | 24 | 476→524 = **48** | 48 |
| large | 42 | 458→542 = **84** | 84 |

Every hole is exactly the rubber's own diameter. Zero curve commands in any of
the six resulting paths, and the corners survive at their original coordinates
(`M542 400 L697 400 L700 700 L300 700 L300 400`). The 400-unit edge that used
to come back as 134 points now comes back as 2.

**Handwriting is untouched, which was the thing to be careful about.** A
120-point freehand curve rubbed in the middle drifts by at most **1 unit** at
probe points away from the rub — a tenth of the pen's own width — keeps its
quadratic smoothing, and its per-point widths stay aligned (30/30 and 16/16).

- **Versions: modelwrite.js v25.**
- Worth remembering: **a derived-object literal repeated five times is a latent
  bug waiting for its sixth field.** `pw` had already been added to all five by
  hand one session earlier; `sh` arrived the same day and reached none of them.

## 2026-07-27 — The eraser, third attempt: solve it, don't approximate it

Glenn, with three more screenshots: *"new behaviours"* — boxes whose top edge he
had rubbed were closing themselves with a long diagonal across the shape, the
top-right corner simply gone.

**My fault, and specifically the fix from the entry above.** That fix added a
simplification pass to undo the rubber's own densification. Simplification is
lossy, and `rubAt` runs on every `pointermove` — so a rubber DRAG put the same
stroke through it dozens of times and the error compounded. Reproduced by
dragging along a box's top edge: the right-hand edge came back as

    (725,400) → (739,458) → (741,463) → (752,510) → … → (800,700)

a wandering staircase that reads as a diagonal. **A transform that is harmless
once is destructive when it is applied in a loop.** That is the lesson; the
first version had the same shape of flaw and I did not recognise it.

**The real fix is to stop approximating.** The rubber now solves the
line/circle intersection and cuts each segment exactly where the circle
crosses it, keeping every original point either side untouched. No densify, no
thinning, at most two points added per cut. The lasso does the same thing by
bisecting to the loop edge — one point per crossing.

The property that actually matters is that it is **idempotent**: rubbing near
a stroke without touching it changes nothing at all, so a drag cannot
accumulate. Asserted directly — 60 rub events in empty space near the ink left
the state byte-identical, and 120 rub events held on one spot produced exactly
what the first one did, twice over.

**One genuine bug found in the new code before it shipped.** The first cut of
it tracked "are we inside the rubber" as a latched flag inferred from the
intersection. A run whose first point sits exactly on the circle's edge makes
the next segment merely GRAZE it — no proper crossing — so the flag never
cleared and the entire rest of the stroke was discarded. Every point is now
classified directly against the circle, and the intersection is used only to
place the cut.

**Measured, drag along the top edge, all three nibs:**

| nib | radius | gap left | expected |
|---|---|---|---|
| small | 12 | 389 → 658 | 388 → 660 |
| medium | 24 | 376 → 671 | 376 → 672 |
| large | 42 | 358 → 689 | 358 → 690 |

Zero curve commands. All four corners intact on all three boxes. **21 points
for three rubbed boxes** — seven each, which is what a box with one hole in it
should cost. A single tap on a lone horizontal line cuts a hole of exactly 48
units for a 24-unit rubber, with both original endpoints preserved.

- **Versions: modelwrite.js v27.**
- Worth remembering: the sequence here was approximate → approximate harder →
  solve. The two approximations each looked right in a single-tap test and
  failed under a drag. **Test the gesture, not the tap** — this widget is used
  with a hand moving across a board, and every eraser defect so far has only
  been visible in motion.

## 2026-07-27 — Genre toolkit: criteria and the evidence for them, on one sheet

The last of P2. Design dialogue with Glenn pinned four things before any code:
the widget is **faces, not panels** (a checklist face and a model-text face
switched like the sentence builder's modes, because the lesson uses them at
different moments and two text-heavy panels cramp a laptop); highlighting works
on **whole words with punctuation as its own token** (a finger on a board and
native text selection is the least reliable pairing available — and punctuation
tokens are what make "comma after the fronted adverbial" and "apostrophe for
possession" things a teacher can point at); criteria carry a **year band**, three
not seven, because a criterion does not change between Year 3 and Year 4; and the
pass ships **four** default packs, not twelve, because the packs are authored
pedagogy and that is the slowest thing to review.

**Then Glenn moved the scope, and was right to.** I had deferred the genre's
language lists — openers, connectives, vocabulary — arguing the poster is
criteria plus evidence and word lists make it two posters. His answer: *"Word
banks help tremendously for any teacher less than 5 years into the game. More
experienced teachers have them on tap. But any updated lists supersede older
ones. Genre banks are always gold if offered."* So a third face went in, with the
middle sentence as its governing rule: **supersede, never accumulate.** A
textarea *is* the list; saving replaces it; importing replaces it; nothing merges
and nothing appends. That is what keeps a bank on the wall trustworthy — a word
on it is a word somebody chose today. Emptying all three lists hides the face
entirely, which is how a teacher who has the openers in their head makes it go
away.

**Two real defects, both found by looking at the actual output rather than the
code.** The print preview showed `afox`. SVG strips leading and trailing
whitespace from a `<text>` element — at render *and* at measurement — so a run
ending in a space was both measured and drawn without it, and the next run
started flush against it. `xml:space="preserve"` on every snippet run and on the
measuring node. The same preview showed the second one: three near-identical
copies of one sentence stacked under a criterion, because I rendered **one
snippet per mark**. Snippets are now grouped **per sentence**, one line carrying
every one of that criterion's highlights. Clipping went with it — from a
160-character budget to a **measured-width** one, because a character count
cannot know the column: 160 characters at 22px is nearly twice it.

**Worth remembering: the measuring host earns its keep.** The poster places a
highlight rect behind a run of text, which needs that run's exact width. The
cheap way is characters × em, and the cheap way puts the highlight one word to
the left of the word it highlights. An off-screen SVG `<text>` and
`getComputedTextLength()` makes it exact, with the estimate kept only as a
fallback for a detached document.

**A near-miss caught before it shipped.** The first cut of the mount-time
coercion ran the pack through the normaliser and then restored item ids *by
position*. The normaliser drops empty lines — so one blank line in a saved pack
would have shifted every id by one and silently re-pointed every highlight and
reveal at the criterion below it. The normaliser now takes a `keepIds` flag:
false from a file or a default (mint fresh), true from the widget's own props
(keep what is there). Ids are the only thing marks and reveals reference, and
they are the one thing that must never be inferred.

**Verified.** A headless harness evaluates the shipped file body — no test hook
in production — and asserts 139 things: the tokeniser against §5's table
(`fox's`, `don't`, `"Help!"`, `well-known`, curly apostrophes, ellipses,
em dashes), the mark algebra including **idempotence over 120 passes** (the
eraser's lesson, applied before it could bite), hostile normalisation, the
snippet grouping, the pack round-trip through the file format. Then in the
browser: the band filter (a Year 4 deck opens the queue at the first Years 3–4
criterion, not the KS1 one), a real pointer drag painting `Yesterday evening,`
including the comma with one bridged gap, merge-on-bridge and split-on-erase and
carve-on-repaint observed live, `<img src=x onerror=…>` rendering as visible text
with no element injected, six openers superseded by two, the word bank face
vanishing when all three lists empty, four print pages in the right order with
only page 0 ticked, and the Cold/Hot pages joining from a sibling modelled-writing
widget — and correctly *not* joining when only one bookend exists.

Two false alarms during that pass, both mine: `elementFromPoint` reporting
`.dash-page` (the dashboard had reopened over the widget after a reload) and a
`Cold task` label that turned out to be modelled writing's own washing-line chip
behind the dialog. **Scope the query to the thing under test** — an unscoped DOM
read in an app this dense will find someone else's string every time.

- **Versions: english-text.js v2 (new), english-packs.js v2, icons.js v24,
  style.css v85, app.js v53.**
- Spec: [`genre-toolkit-design.md`](genre-toolkit-design.md), written and
  reviewed before the build and corrected twice during it (the snippet clause and
  the print-page defaults, both where the code taught the spec something).
- Deferred on purpose: the other eight genre packs (data only), `structure`
  editing (nothing displays it until the Story Map), and feeding the `wordbank`
  widget (a third docking consumer, and §16.4 parks that question).

## 2026-07-27 (later) — The genre toolkit under adversarial review

Six independent reviewers over the new widget — hardening, state logic, spec
conformance, the print path, app integration, and the pedagogy of the four packs —
each finding then handed to a skeptic told to refute it. Eight survived to
verification; four were refuted, all four being the snippet-overflow complaint,
correctly, because the finders read the file before that fix and the verifiers read
it after. Four were confirmed, and three of those were things **no amount of
reading my own code would have found**. All are fixed.

**The touch bugs — both invisible to a mouse.**

`pointercancel` was wired to the same handler as `pointerup`, and that handler
committed unconditionally. The model text is a real scroller with
`touch-action: pan-y`, so on a board a finger-swipe to scroll hands the gesture to
the scroller and fires `pointercancel` — which painted a highlight **every single
time a teacher scrolled the WAGOLL**. Worse, the stray mark auto-ticked its
criterion, and the checklist refuses to un-tick while marks exist, so the false
tick could not be cleared from the board at all: the teacher had to go and find the
accidental highlight. A cancel is not a stroke. `english-word.js:2015` already
guarded this way and I did not follow it.

And tapping a criterion chip rebuilt the whole token DOM — because `commit()` was
`save()` + `paintAll()`, and `paintAll()` on the text face calls
`face.replaceChildren()`. The token container is the scroller, so **every chip tap,
every Reveal and every Hide last threw the class back to line one of the text**.
That is the core loop of a WAGOLL session. The chip strip is now filled separately
from the tokens, `commit()` repaints only the face that changed, and the Size
button swaps a class instead of rebuilding. Measured: scrollTop 900 → 900 across a
chip tap and a Reveal, same DOM node.

**The data-loss bug.** `settings()` captured `const g = p.genre`, and mount
*replaced* that object on every remount. `api.refresh()` from the widget side is
`save()` + `remount()` and does not rebuild the settings panel — so an open panel
was left holding a dead object. Edits went into the orphan and vanished, **and the
same code still pruned the live reveals, ticks and marks against the orphan's new
ids** — so a re-worded criterion kept its old wording *and* lost every highlight.
Fixed at the root: the genre is now normalised **in place** (`Object.assign`), so
identity survives a remount and the panel stays live; every path that swaps genre
goes through `gtSetGenre`, which mutates rather than replaces. A staleness guard in
`applyEdits` is the second line of defence, and it rebuilds the panel rather than
failing silently. Verified: panel open, widget remounted, edit still lands.

**And my own `xml:space` fix was wrong.** I had "verified" the `afox` fix by
reading the SVG's `textContent` and seeing the spaces present — which proves
nothing about whether they *render or measure*. A reviewer said so and was right.
Measured properly in Chrome: `xml:space="preserve"` works on a **parsed** node
(199.47 vs 194.41) but is **ignored** on one built with `setAttribute` +
`textContent` — which is exactly what the measuring host is. So render and
measurement disagreed by one space at every run boundary. The real fix is a
**non-breaking space**, which is not XML whitespace at all and therefore survives
both paths with no attribute involved. Confirmed by character code in the live
poster: `charCodeAt(0) === 160`, and no plain space at any boundary.

**Worth remembering: `textContent` is not evidence.** Twice in this session I
checked a rendering question by reading strings — once declaring the spacing fixed,
once reporting a Cold/Hot label that was actually the modelled-writing widget's own
chip behind the dialog. Both times the geometry was the thing to measure and the
DOM query needed scoping to the element under test. An unscoped read in an app this
dense finds someone else's string every time.

**Also fixed, from the unverified tail of the review** (each checked against the
code before acting): Cover was one shared flag, so covering the criteria blanked
the word bank too — now one per face, with a migration for widgets saved before the
split. The checklist face never showed the genre name, which §6's first line asks
for — three weeks on a wall and untitled. The poster listed criteria in pack order
while the board listed them in reveal order; proven fixed by revealing the pack's
last item first and its first item second and watching both agree. C0 control
characters survived the normaliser and would have made the poster un-parseable, so
the criteria sheet would vanish from the print dialog with no error — stripped at
the door now. A pack carrying its own model text silently overwrote a pasted
WAGOLL when there were no marks yet — now part of the confirm. The poster title
shrinks to fit rather than running off the sheet. And Cold/Hot never joined when
the modelled-writing unit was the pinned "show on all screens" one, because a
pinned widget lives on its home screen and only *displays* everywhere
(`app.js:9327`) — the search now follows the same rule.

**Content, on a teacher's judgement rather than mine.** Three criteria were
reworded: "Third person — no I or we" contradicted the witness-quote criterion in
the same band (a quote necessarily contains "I"), so it is now "the reporter never
says I or we"; "which means" was listed as a causal *conjunction* when it is a
relative clause, so the criterion reads "because, so, so that" and "which means"
stays in the word bank where it is fine; and two criteria opened with a bare
lowercase "because", which reads as a typo on a KS1 wall — now *Using "because" to
give a reason*. **Left alone and flagged for Glenn:** the reviewer also objected
that the Connectives lists hold adverbials rather than conjunctions. True to the
National Curriculum, but "connectives" is the classroom vernacular and the lists
match what goes on a real working wall — that is Glenn's call to make, not mine.

- **Versions: english-text.js v3, english-packs.js v3, style.css v86.**
- Harness now at **147 assertions**, including the nbsp boundary rule and the
  control-character stripping. Two of its own expectations were wrong and were
  corrected against the code, not the reverse: adjacent same-item marks *should*
  render as one run, and a reused variable in the test clobbered a later case.

## 2026-07-27 (later) — Soft Daylight, track 1: the CSS the redesign actually was

A design handoff arrived proposing a full "Soft Daylight" restyle of the class
home and stage. Reviewed against the code, its "CSS-layer only" contract turned
out to cover a feature project (mascot, tool tiles, rewards strip, a class data
model that doesn't exist) — so the work was split into tracks, and only track 1
landed today: tokens, elevation, radius, type scale, dashboard tab-body fixes and
motion. `style.css` only; `app.js` untouched.

**Method.** Five parallel auditors over distinct dimensions (tokens / elevation /
type / layout / motion), each adversarially verified by a second agent before
anything was applied. The verifiers earned their keep: they killed six proposed
`color: var(--ink)` swaps that would have broken dark-themed widgets — `applyTheme`
re-declares `--ink` per widget, so popovers parented inside a dark widget would
have gone near-white on white. Those six literals stay `#22303c` on purpose; a
comment-free grep will re-propose them, and they must keep being refused.

**Tokens.** The handoff's palette went in with two corrections it needed:
`--ink-faint` (spec `#8b9ba5`) measured **2.87:1** on white — below even the
non-text floor — and is darkened to `#657178` (5.0:1); `--tint-pink` was nudged
`#ffe1e6` → `#ffe4e9` so `--ink-soft` clears 4.5:1 on it. Everything else passed
measurement. `--panel` stays translucent (the frosted chrome depends on it);
opaque surfaces get a new `--panel-solid` instead of the handoff's plan to flip
`--panel` itself.

**Surfaces, per Glenn's hybrid call.** Cards and the hero are now opaque
(`--panel-solid`, `--shadow-3`, blur removed); the topbar, tab pill and section
pills stay frosted, so the teacher's wallpaper still reads through the chrome.
The pale stage gradient the handoff wanted was rejected outright — the dark
stage is what survives a projector.

**Type.** `--font-ui` / `--font-display` split; Lexend (already vendored) on
greetings, section/panel/modal titles, the wordmark, deck titles and the big
numeric readouts (clock, timer, score). Measured first: Lexend is only 2.8–5%
wider than Quicksand at matched size with identical line boxes, so no clipping —
this is why the display face was safe to land while the OpenDyslexic switch
(track 2) was not. 33 chrome font sizes below 14px raised to the floor; the dock
label (10.5px) deliberately held back — it cannot take 14px without the dock
redesign, and is the one knowingly remaining floor violation.

**Motion.** One consolidated `prefers-reduced-motion` block replaces the old
single-selector one. Property-based, not blanket: movement dies, colour/opacity/
width feedback survives, because a blanket kill would leave the phonics sweep
bars permanently empty (`width: 0` filled by a `forwards` animation) and strip
"correct!" feedback from exactly the children who need it plainest. Three `rm-*`
degrade keyframes carry the functional animations that had no static fallback.

**Verified.** Stylesheet parses at 1,483 rules, zero console errors; all four
dashboard tabs, stage, widgets, settings panel and data modal eyeballed;
SagePrint harness **91/91**; protected literals grep-confirmed. Deferred after a
live A/B: `--shadow-dock` on the toolbar (indistinguishable at 14px from the
bottom edge — dock keeps `var(--shadow)` and stays consistent with the frosted
pills).

- **Versions: style.css v87** (index.html and print-pdf.html both bumped).
- Pre-change snapshot at `docs/backups/style.css.pre-soft-daylight-2026-07-27`.
- Tracks 2–3 (hero rebuild, tool tiles, rewards model, reading-font switch, dock
  sizing, Wallpaper-tab naming) remain unbuilt and need their own decisions.

## 2026-07-27 (evening) — Soft Daylight, track 2: the features the handoff called CSS

The parts of the redesign that needed markup and state, built honestly as
features. Four decisions Glenn made up front: greeting name is a teacher-set
field (editable on the hero, falls back to a plain hello); rewards are
teacher-awarded class stars only — no automation; the reading-font switch is an
"Aa" pill in the dashboard topbar; the tile row ships the handoff's six, with
Maths and Games opening their dock category panels.

**What shipped.** Three new state fields (`className`, `readingFont`,
`rewards {on, stars, streak, weekStart, lastUsed}`) with normalize() coercions
so old backups import cleanly. A CSS-only sprout mascot (bob guarded by reduced
motion). The greeting's gear opens an inline form: class name, "Show class
stars", "Reset stars to 0". A star pill in the stage top bar — one tap, one
star, mid-lesson; the hero strip is display-only. Stars reset each Monday;
the streak counts consecutive school days. The Aa pill cycles Standard →
Atkinson Hyperlegible → OpenDyslexic by rewriting `--font-ui`/`--font-display`
under a `data-reading-font` attribute on `<html>` — chrome only, teachers'
content-font choices inside widgets untouched, print unaffected (its windows
are separate documents). Six tool tiles; "Start teaching →" primary in the
decks head.

**The review earned its tokens.** Four lenses, every finding adversarially
verified: 21 confirmed, 0 refuted, collapsing to 10 root causes — the two that
mattered most: (1) a Saturday boot first *inflated* then *broke* the
school-day streak the comment promised weekends couldn't break — fixed with a
weekend guard plus ordering (not equality) comparisons so clock excursions
can't wipe stars twice; (2) the three whole-state swaps (backup import,
erase-all, cross-tab sync) never re-applied the reading font or star pill, and
import left `weekStart: ''` so the next boot silently zeroed the day's stars —
all three sites now re-apply chrome, and the user-initiated two re-tick the
rewards clock (the sync path deliberately doesn't: the writing tab already
ticked, and a save there would echo between tabs). Also fixed: Escape in the
name input closed the whole dashboard (stopPropagation); "Reset stars" wiped
the form's uncommitted edits (now updates in place); greeting lacked
overflow-wrap against 40-char unbroken names; OpenDyslexic needed line-height
1.18 on wrapped greetings and a 175px tile floor; the gear was 1.76:1 at rest
and invisible-until-hover on touch boards (now 0.75 opacity); rewards ticks on
dashboard-open and star-tap so kiosk tabs that never reload still roll Monday.

**Verified.** Streak semantics replica-tested in node across six scenarios
(Sat prep, Sun-only, holiday gap, clock excursion, import-then-award, plain
Tuesday) — all pass. Live: font matrix at 1400/1024 including a 40-char
unbroken name in OpenDyslexic (wraps, strip stays put); star flow through the
debounced save; Escape containment; in-place reset preserving typed edits;
storage-sync applying font + pill; tiles spawning widgets and category panels;
SagePrint **91/91**; zero console errors.

- **Versions: style.css v88, app.js v54** (print-pdf.html follows style v88).
- Track 3 remains: dock sizing/labels (the 10.5px dock label is still the one
  knowing floor violation), wallpaper-tab naming, and any rewards evolution.

## 2026-07-27 (late) — The mascot can be the teacher

Glenn's ask: the hero face can be an animated memoji or similar of the teacher
smiling — warm, personal, and (since the class home does get projected) facing
the children. One new state field, `mascotImage` (data URL, '' = the sprout),
normalize-guarded to a `data:image/` prefix so a hand-edited backup can't plant
arbitrary text there.

The upload rides the existing `pickImage()` helper — no new machinery. The one
decision that mattered: pass `maxW: 1024`, not the tile's 108. pickImage passes
small-enough files through **untouched**, and untouched is what keeps an
animated memoji animated — its canvas fallback flattens to the first frame, so
a tight limit would have silently killed the exact thing that was asked for.
Typical memoji stickers/GIFs (≤1024px, <400KB) pass through with animation and
transparency intact and sit on the mint tile; oversized photos downscale to
JPEG. checkHeadroom guards the save as it does for money photos.

Face changes and the revert ("Back to the sprout") paint the mascot **in
place** from the edit form — renderDashboard() there would eat the
typed-but-uncommitted class name, the same trap the track-2 review caught in
the reset button. A corrupt data URL falls back to the sprout and cleans state
via the img error handler; verified live along with: the full picker path
(a real File through the real input via DataTransfer), typed-name survival
during upload, reload persistence, storage-sync, and revert. One honest limit,
noted in the CSS: prefers-reduced-motion stops the bob but cannot pause a GIF —
image formats don't obey the media query, and the face is the teacher's own
choice.

- **Versions: style.css v89, app.js v55.**

## 2026-07-27 (night) — Track 3: the dock earns its floor, the stage learns its name

Also today: SageStage became a GitHub repo (HeutaLab/SageStage). The baseline
commit holds everything through the mascot photo; this entry lands as the
first real commit on top. The remote connect + push are Glenn's two commands
(the session's permission mode rightly won't push on its own).

**The dock, measured honestly.** At 1024 the old dock needed 1086px, got 802,
hid four tools behind an invisible scrollbar and slid 131px under the
screen-nav pill. Fix: fitDock() degrades by MEASUREMENT, never viewport
guesswork — stage 1: one centred row, labels finally at the 14px floor;
stage 2 (.compact): labels drop, 34px glyphs in ≥44px targets, all fourteen
tools visible (names in title/aria-label); stage 3 (.dock-left): when
centring can't clear the nav pill, the dock takes the left span. Measured
live: 1024 → compact+left, 0 overflow, 18px nav clearance; 1440 → compact
centred; 1920 → full labels, 130px clearance. A teacher with four pinned
tools keeps labels far narrower than one with fourteen — that is why it
measures instead of media-queries. One harness quirk found on the way: the
browser pane's viewport override doesn't dispatch resize events, so the
listener was proven with a synthetic event; real windows fire it.

**Stage top bar.** The pill now shows the deck name in the display face —
orientation over branding while children watch; "Sage Stage" still owns the
dashboard. paintBrand() runs from renderScreen and both rename paths.

**Widget frames.** Glenn chose the full handoff over my modest option:
radius 26 + the deep window shadow on every widget, frosted --panel kept
(opaque white would flatten the stage). The settings drawer's corner calc
follows (--radius-lg − 2px); header left padding 12→16 keeps titles clear of
the bigger curve.

**Wallpaper tab.** Name stays (it was always accurate); the subtitle gains
the pointer the handoff's own confusion proved necessary: each screen's
teaching backdrop is set on the stage — Background, in the dock.

Checked: three dock stages live-measured; SagePrint 91/91; no console
errors. Versions: style.css v90, app.js v56. Soft Daylight is now fully
landed except rewards evolution, which waits for a real pedagogical want.

## 2026-07-27 (later still) — The colour scheme Glenn remembered

Glenn: "Are these the colours that were in the design? I'm sure the whole
colour scheme was different." He was right, and the tokens were innocent —
a value-by-value diff against TOKENS.md shows every colour shipped verbatim
(bar the two documented contrast fixes). What differed was the GROUND: the
dashboard's default wallpaper was still the pre-redesign pink→periwinkle
gradient, showing through the hybrid chrome and painting the whole first
impression, while the design's page ground is calm mint. The redesign changed
the furniture and forgot to change the floor.

Fix, on Glenn's call: the Soft Daylight mint gradient
(165deg #eaf7f4→#ccfbf1) is the dashboard default, added to the wallpaper
picker, and named as a constant (DASH_BG_DEFAULT) instead of the fragile
gradients[6] index. States still carrying the old pink verbatim never made a
wallpaper choice, so normalize() migrates them; anything else was chosen on
purpose and stays. Verified: pink boots to mint; a chosen purple gradient and
a chosen solid colour both survive; the mint swatch shows active in the tab.
The stage's dark teal is untouched — that difference from the prototype
remains deliberate. app.js v57.

## 2026-07-28 — The cone was a symptom: auditing all 103 icons

Glenn: "the traffic light is a cone, not traffic lights." True — and the cone
turned out to be one of a class. The app runs TWO icon sets: the hand-drawn
originals in icons.js and 30 vendored Scarlab glyphs in icons-scarlab.js, and
the resolver lets the vendored set win wherever names collide — shadowing 27
hand-drawn originals as dead code. Most of the damage is vendored glyphs whose
drawing is fine but whose meaning isn't Sage Stage's: the "traffic" cone, a
"score" WINE GLASS on the children's Scoreboard, a "dice" that is actually a
GAMEPAD, a "text" of unreadable quote blobs shadowing a perfectly good Aa, and
a timer/clock/stopwatch trio of near-identical discs shadowing an hourglass
and a proper stopwatch.

Method: a rendered contact sheet of all 103 runtime glyphs + their shadowed
originals at 64/21/15px (kept as icon-check.html beside print-check.html); a
full usage map (every icon → every UI site and rendered size); each verdict
adversarially verified by agents tracing SVG path geometry; a completeness
sweep over everything rated fine. The process earned its cost in both
directions: verification UPGRADED dice (gamepad, not "noisy die") and REFUTED
two of my calls — the countdown birthday cake is intentional (it's an event
countdown ending in 🎉) and happy/help/quiet aren't dead, they're the Work
mode symbols applied dynamically. The mic on the noise meter survived its own
counter-check: the tool literally asks to enable the microphone.

Result: docs/icon-assessment.md — eight one-line deletions un-shadow every
wrong-object icon; one redraw that matters (gear is geometrically a SUN — disc
plus eight detached rays — fronting every settings affordance); five sweep
minors for the next icon pass. Assessment only; nothing changed yet.

## 2026-07-28 (later) — Eight deletions and one honest cog

The assessment's step 1 and 2, shipped. Deleting eight keys from
icons-scarlab.js un-shadowed the hand-drawn originals: the Traffic light got
its traffic light back, the Scoreboard traded its wine glass for a medal, the
Dice widget stopped wearing a gamepad, Text became Aa across all eight of its
sites, and the timer/clock/stopwatch disc trio broke up — hourglass and
proper stopwatch restored. The scarlab header now documents the deletions so
a future regeneration can't silently resurrect them. And gear is finally a
gear: accent ring, hub, eight teeth ATTACHED to the ring — the sun it used to
be was one detached-ray away from the canonical brightness icon, on every
settings affordance in the app. Verified at 96/21/14px on the contact sheet
and live in dock, tiles and settings sites; SagePrint 91/91; no console
errors. icons.js v25, icons-scarlab.js v6.

## 2026-07-28 (later) — Twelve of twelve: the eight remaining genre packs

The follow-up pass the genre toolkit build promised: recount, diary, letter,
instructions, non-chronological report, playscript, poetry and book review,
pure data in english-packs.js, no code touched. Each follows the house shape
the first four set — a KS1→UKS2 band arc (KS1 gets the whole text down, UKS2
controls how it lands on a reader), 14–15 criteria, a boxing-up structure for
the Story Map to consume later, and an 8 openers · 8 connectives · 10
vocabulary word bank. model stays empty everywhere: a school's WAGOLL is a
school's own.

The packs now sit in §9's canonical order, which repositioned newspaper report
and persuasion in the picker — safe, because everything references packs by
id, and props hold copies. Some deliberate wording calls: diary teaches
"past tense for events, present for feelings" and hindsight; playscript's
connectives are spoken discourse markers (anyway, mind you) because that is
what dialogue actually joins with; poetry's criteria are framed as choices,
not rules ("rhymes — if the poem wants them"); instructions ends on the
stranger test. Letter carries the sincerely/faithfully rule; non-chron report
keeps "facts, not a story about you", the KS1 trap.

Verified headless (a node check of every cap, band, id and duplicate against
gtNormalize's table — PASS) and in the browser: twelve cards in the picker,
Diary's checklist walk and word-bank face, the settings genre row at twelve
chips, the swap confirm wiping reveals on the way to Playscript, its checklist
rendering with colours. No console errors. english-packs.js v4;
genre-toolkit-design.md §2/§13 updated.

## 2026-07-28 (later still) — The genre picker learns to dress for children

Glenn, on the twelve grey-white picker cards: "colour and appeal needs to
sharpen drastically. Sure, it's a classroom tool but it's still student
facing." Fair — the picker read as a settings dialog.

The redesign: every genre now wears a solid Soft Daylight tint with a
deep-ink drawing of its own text-form on it — an envelope on the sky-blue
Letter, a comedy mask on fuchsia Playscript, a quill on periwinkle Poetry,
a dashed trail walking to a flag on amber Recount, a megaphone on red
Persuasion, and Newspaper report deliberately the one newsprint-grey card.
The tints extend GT_COLS's Tailwind-200 register to twelve (GT_LOOK in
english-text.js), laid out so no grid neighbours share a hue family; the
motifs (GT_ART) are drawn in the icons.js idiom — 24×24, stroke 1.7, round
caps. Identity is looked up by pack id and never stored: an imported or
renamed genre falls back to the neutral card, and position still carries no
meaning. The counts line became a soft white pill; hover lifts the card
with the genre's ink as border; focus-visible ring and reduced-motion
respected. Names stay slate — the colour is the welcome, not the message.

One real bug en route, and it was the SagePrint lesson repeated verbatim:
gtArtEl called bare `el` from module top level, outside register()'s
destructure — the mount guard swallowed the ReferenceError and the whole
face painted blank with an empty console. D.el fixed it; the comment now
warns the next helper. Verified live: twelve cards render at native scale,
selection still flows (Poetry → checklist with its reveal chip), no console
errors. Browser-pane note for the log: after resize_window with custom
dimensions the pane's render area desynced from layout and stage clicks
missed silently — preset + reload restored it. style.css v91,
english-text.js v5.

## 2026-07-28 (evening) — The chips read in full, and the WAGOLL reaches the wall

Two Glenn calls on the model text face, from live use with Kipling on the
board. First: the criteria chips — "the surrogate learning intention" — were
ellipsizing at 210px, so the class read "Words that start with the sa…" and
a mouse-only tooltip held the rest. The truncation is simply gone: chips
wrap now (white-space normal, left-aligned, the tooltip deleted as
redundant). If a revealed criterion costs two lines of chip, that is the
cost of the class reading it.

Second: the marked-up model text itself now prints. gtTextSvg lays the
text out against measured widths — source line breaks are hard breaks
(a poem's line breaks ARE the form), a blank source line is a stanza gap,
and a wrap only ever happens where the source had a space, so punctuation
stays glued to its word. Highlights paint behind their runs with the
gap-between-tokens rule the screen and the snippet groups already use
(painted only when one mark covers both sides), and below a divider the
sheet carries its own colour key: swatch + full criterion wording, reveal
order, only for criteria the class actually evidenced — the sheet stands
alone on the wall. It joins toPrintablePages as "Model text" between the
criteria poster and the word bank, so it gets the whole SagePrint dialog
(sheet budgets, assembly guides, A4 1:1) for free. printCurrent became
face-aware while keeping the paper-waste principle: one page ticked, and
it is the sheet of the face the teacher is looking at.

Verified in the browser with Glenn's exact setup — Poetry, The Way through
the Woods, his highlights plus one multi-word run: chips full-width on the
face; print dialog shows three pages with Model text pre-ticked; the
preview renders title, byline, stanza gap, every highlight and the
three-row key at 4-sheets-about-A2. No console errors. Marks were staged
via localStorage for the print check (synthetic taps would not paint — the
marking interaction itself is untouched by this change and shipped
verified in v1). style.css v92, english-text.js v6.

## 2026-07-28 (night) — One print language, and the green button stays

Glenn: "There are some pages that are for printing and many that are not. The
English widgets don't have consistent print language — one has a green print
button, the other has to go into the ellipsis and print from there."

Both halves were real, and the second ran deeper than the button. A survey of
all 49 registered widgets found the scope gap first: exactly three can print,
all three English, while english-widgets-design.md gives TEN widgets a
"Prints:" line. Word bank, word class sorter and sentence builder are shipped
and mute — a coverage debt against the founding principle that the wall is the
output. Left for a separate pass; word bank is the obvious next adopter since
gtBankSvg is already a working template for the card grid it needs.

The language half had a root cause in the engine. One action carried four
names — "Print poster…" in the menu, "Print…" on modelwrite's bar, "Print
poster — " in the dialog header, sage-stage-poster.pdf in downloads — and
print.js labelled its size control "Poster size" while its first option is
"1 sheet · A4". A poster was always a SIZE, never the action; naming the
feature after the big end of one control is what let three entry points drift.
So: Print… everywhere, page = one artefact ticked, sheet = one piece of paper,
poster = a size only (and it stays in the assembly hints and multi-sheet
options, where it is honest). Six strings in print.js, one in app.js. The
engine, tiling, budgets, guides and the one-page-ticked default are untouched.

Placement is now a written rule in poster-print-design.md §3.1 — the same-sheet
test: would this sheet differ if I printed it before the lesson and again
after, because of what the class did? Yes for at least one sheet, the widget
carries Print… on its bar; no for every sheet, the menu carries it alone. One
qualifying sheet earns the control and a non-qualifying sheet never removes it
— never split it per face, because modelwrite.js:1893 already forbids controls
that come and go, and printCurrent opens the dialog on the face showing.
The genre toolkit's written exemption had expired: it was argued on 07-27
against two REFERENCE sheets, and the model text sheet added on 07-28 is not
reference — the class spends a session marking up the WAGOLL and the sheet is
that work. It gains a ghost Print… pill, last on the bar. Phoneme tiles stays
menu-only, now for a stated reason rather than an oversight: its sound mat is
generated from the phonics pack and the deck's year group, so every Year 1
teacher gets the identical sheet. Nothing of the class is in it.

**Glenn's call on the weight.** All three independent proposals wanted to
demote modelled writing's solid green pill to ghost for symmetry, on the
"one solid per bar" grammar. He said keep the green — and he was right that it
was the affordance he'd pointed at as the GOOD one. So the rule reads: Print…
takes the solid accent only where printing is the widget's whole purpose,
ghost everywhere else. Neither bar breaks one-solid-per-bar today anyway
(modelwrite's lead verb is printing, the toolkit's is Reveal). modelwrite.js
is not touched by this change at all.

Verified live: toolkit bar pill is `btn ghost small gt-print`, label "Print…",
last on the bar; its ⋮ still carries "Print…" as the second door (10 items,
while the Clock's menu correctly has 9 and no print); dialog header reads
"Print — Genre toolkit"; the size label reads "Size"; Model text pre-ticked on
the text face. Computed backgrounds confirm the split — modelwrite
rgb(15,118,110) solid, toolkit rgba(15,118,110,.1). No console errors.
app.js v58, print.js v14, english-text.js v7, style.css v93.

## 2026-07-28 (late night) — The two the audit found, fixed at the root

Both items Glenn held over from the print audit.

**The wrong-sheet bug.** printCurrent had been computing its index with its own
arithmetic, restating the presence tests that toPrintablePages' page builders
guard on — and one restatement was looser than the guard it mirrored. It
counted a Model text sheet whenever p.text was truthy; gtTextSvg also requires
the text to tokenise to something. gtCleanText never trimmed on its non-clipped
path, so a pack whose "model" is a blank line or a stray space survived as a
truthy zero-token string, and every page index after position 0 was off by one.
Usually invisible because print.js clamps the index into range and lands right
by accident — but with a modelwrite sibling contributing Cold and Hot, the word
bank face pre-ticked **Cold task**. Silent: no toast, nothing to notice until a
teacher collected the wrong sheet from the printer.

Fixed at both ends. gtCleanText now trims on both branches (ends only — a
poem's interior line breaks are its form; marks are token indices, and trimming
leading whitespace changes only toks[0].pre, never the count or order). And the
page list moved into one place: gtPageKinds decides which sheets exist and in
what order, toPrintablePages builds FROM it, and printCurrent indexes INTO it —
which lands on modelwrite's own shape (find the page, fall back to the first;
modelwrite.js:929), reached from the other direction. There is no arithmetic
left to drift. Proved headless over 768 states (bank × six texts including four
whitespace flavours × four reveal sets × four faces including a bogus one ×
Cold/Hot × pre/post mount coercion): the ticked page is always the current
face's sheet, or page 0 when that face has none. The harness also runs the OLD
arithmetic on the regression case and shows it picking "Cold task" where the
new code picks "Word bank".

**The chip strip.** Once chips stopped ellipsizing they wrapped, and a
flex-shrink:0 strip with no ceiling grows without bound: twenty criteria at the
200-character cap measured 1016px of chips on a 510px face, leaving .gt-text
(flex:1, min-height:0) at its padding — the model text gone, on the face whose
whole point is the model text. "Resize to fit" could not recover it either,
since it sizes to a scrollHeight that already counts the text as collapsed.
The ceiling is now a share of the face (42%) rather than a row count, so a big
widget still shows a whole unit's criteria and a small one still keeps its
text; past it the strip scrolls rather than pushes. A first cut at a fixed 98px
(~3 rows) was rejected on measurement: Poetry with all fifteen revealed needs
238px, so a real end-of-unit board would have scrolled. At 42% that case shows
214px and scrolls by 24px. Also added overflow-wrap:anywhere — a hand-authored
200-character criterion with no spaces in it rendered a chip wider than the
face and scrolled the whole thing sideways; it now wraps inside it (measured:
widest chip 794px against a 794px face, no sideways scroll anywhere).

Verified live across all three: worst case, realistic full unit, and normal use
with the word bank face pre-ticking the word bank sheet. No console errors.
english-text.js v8, style.css v95.

## 2026-07-29 — The Reveal pill reads in full, and Word and PDF come in

Two amendments from Glenn on the Genre Toolkit.

**The Reveal pill was still clipped** at 26 characters with the rest in a
mouse-only tooltip. His reason for caring is the one that decides it: "While
it's primarily a teacher's tool, it's also for children to be able to read it
to know what they're about to reveal. This may be a learning intention." So the
slice is gone and the pill wraps, taking its own row on the bar when it needs
one. Measured at the 200-character cap: full text, fits the bar exactly, no
sideways scroll, face keeps 432px of 541. Same call as the chips two days ago —
these read in full or they are not doing their job.

**Documents.** "Teachers rarely use text files (.txt) unless it's exported
deliberately from another app. .Docx is the most common then PDF… it's a real
option needed for teachers — especially in the moment and uploading live in the
classroom." A teacher asked for a .txt ninety seconds before a lesson is a
teacher who does not bother.

New sibling module `doctext.js` (`window.SageDocText`), in the zip.js/print.js
pattern so bookpage and the Story Map get it free. **.docx needs nothing
vendored** — it is a zip and SageZip.read already opens it. **.pdf is
hand-rolled**: there is no PDF reader in vendor/ and adding one is a dependency
decision that is Glenn's, not mine, so the whole thing — xref tables and xref
streams, object streams, Flate/LZW/ASCII85/RunLength, /Differences encodings,
/ToUnicode CMaps, form XObjects, page geometry — is in the file. DOM-free
throughout, which is what let all of it be regression-tested under plain node.

The build was worth the ceremony. A real corpus first (textutil, cupsfilter,
sips, the repo's own vendored jsPDF), two independent PDF implementations
judged against each other on files neither author made, then three adversarial
passes. The judge picked the xref-first reader and grafted the scan reader's
baseline projection into it; it also found, in neither author's report, that
the gap rule's median was poisoned by exactly the shape of the corpus's own
poem. The adversarial passes then found ten more defects, five of which
**killed the tab**: an O(n²) shift() that hung Chrome for minutes on a 9 KB
docx (JavaScriptCore is fine — a Chrome-only cliff), a RunLength bomb that
SIGABRTed V8 uncatchably from 8 KB, a CMap that froze for 30 s from 1.4 KB, a
per-page content re-walk that took two minutes on a 429 KB file, and inflate
with no output budget reaching 2.1 GB from 499 KB. All fixed and measured: 61
hostile inputs, 0 bad outcomes, worst case 3 s and 284 MB, every failure a
sentence a teacher can act on.

Then the recheck caught two regressions the page-furniture stripper had
introduced, and one of them is the lesson worth keeping. **It was deleting a
ballad's refrain.** A refrain closing each page repeats in the bottom band, and
a stanza gap detaches it, so it satisfied every furniture test and went — with
a note calling it a footer. Fixed by demanding corroboration that a line is
furniture rather than verse: it says which page it is, or carries a number that
changes between pages, or is set smaller than the body. A refrain is
body-sized, digit-free and identical on every page, so it fails all three. The
cost is a numberless letterhead surviving onto the board, which is the right
way round to be wrong — **deleted words are silent and unrecoverable; a leaked
header is visible and one tap to fix.** The same fix corrected a false positive
the build had already recorded as a known limit (a worksheet's "How many did
you get?" line). The second regression: a one-page worksheet titled "Page 3"
lost its title, so the worded page-mark now has to agree with the page it sits
on, exactly as the bare number already did.

zip.js gained OPTIONAL size limits and is otherwise byte-for-byte the old path;
the word bank passes no options. Verified by round-tripping a set through
write/read in the browser, zero-length entry included.

Verified live in the browser, not just in node: a real poem.docx goes in and
lands on the board with its title, stanza gap and lines intact; formatted.docx
does not break "The quick brown fox" across its formatting runs; entities,
tables and multipage PDFs are right; scanned.pdf reaches the teacher as "it's a
picture of the page… select the text and paste it in" and the button recovers.
Known limits are written into genre-toolkit-design.md §8.6 rather than left to
be discovered in a lesson — two-column PDFs come out in an unpredictable order
(detected and reported, not repaired), and PDF prose arrives hard-wrapped at
the measure it was typeset to, because poems forbid unwrapping.

doctext.js new; zip.js v2, english-text.js v10, style.css v96.

## 2026-07-29 (later) — The button that cost an afternoon, and a bar that stays put

Glenn went to put a Word document into the Genre Toolkit, clicked *Open a pack
file…*, and watched every file in his Downloads folder grey out. Five hours and
a wasted day. The document reader worked; it was behind a different button, on
a different face, under a nearly identical name. That is a design failure, not
a user error, and it is the more useful half of the day's lesson: **I tested
that the feature worked and never tested that anyone could find it.**

Three changes, because renaming alone would have left the trap half-set. The
pack buttons are now *Load a genre pack…* — a different verb from *open*, and a
noun that says what the file is. The picker's hint says what a pack contains
AND where the model text goes. And **Model text is the default face**, so the
document opener is the first thing a teacher meets after picking a genre. That
last one also matches the teaching order Glenn asked for on the same message —
faces now read **Model text · Word bank · Checklist**, which is the sequence a
unit actually runs in: pull the WAGOLL apart, gather the words, build the
checklist from what you found.

**The bar.** "Once the text is uploaded, the button height and placement goes
awry." Measured on a 700×520 widget, it did: one centred flex-wrap row whose
membership changes with the face and the state — Cover on two faces, Size and
New text only once a text is in, undo only on first reveal — so every change
re-centred every row and orphaned whatever fell off the end. Loading a text put
"Size 2 · Print…" alone on a centred second line.

This is the sentence builder's V0.1 finding arriving a second time: a wrapping
toolbar is design by accident. Same remedy — explicit rows with anchored ends.
Row 1 is the faces pinned left and Print pinned right with the per-face tools
between them; row 2 is Reveal taking the full width with the chevron and undo
fixed at its end. Undo is now always present and disabled when there is nothing
to take back, rather than appearing on first reveal and shoving its neighbours.
Verified: row tops, bar height and both anchors are byte-identical across all
four states (empty text, text loaded, checklist, word bank) — 364/419, 105px,
left 33, right 623, in every one.

Two things also came off the board. *New text…* moved from a row under the
model text onto the bar, so the reading surface holds the text and nothing
else; and the empty paste box fills its face instead of sitting in the top
third with a dead void beneath it, which was the first thing a teacher saw on
this face.

Finally the genre's own colour follows it in: the tint from the picker card
sets the widget's --acc, so the active face wears the colour the class chose
the unit by, and the coloured picker no longer leads to a grey tool. An
imported genre has no tint and falls back to the widget accent, as --acc
already did.

Spec updated at genre-toolkit-design.md §8.7. english-text.js v11,
style.css v98.

## 2026-07-29 (evening) — The pills, one register up

Glenn: "the colours of the pills need to be slightly more prominent. it's dim
on the board even on dynamic setting."

The criteria palette was the palest usable tint of each hue — Tailwind's 200s —
which is precisely the trap the word bank work recorded back in July: an
interactive whiteboard is badly colour-calibrated, and a tasteful tint
disappears on a projector. That rule was written about grouping colours in a
different widget and never applied here, which is how the toolkit shipped with
eight fills that look right on a laptop and vanish on a wall.

One step up, all eight together, so the hues stay as widely separated as they
were: amber, emerald, blue, pink, violet, orange, lime and sky at their 300
level. Measured rather than eyeballed — 20% denser on average, and against the
slate the chips and rows are set in the worst of the eight is 7.9:1, which is
above AAA. So nothing lost legibility on the board or on the poster, and the
same edit moved all five places these colours appear: the chips, the highlights
in the text, the checklist swatches, and both printed sheets.

The active face pill went up with them, because it had the same problem for the
same reason. It now states itself three ways instead of one — the genre's tint
as the fill, the genre's deep ink as both the ring and the label. A pale fill on
its own reads as "slightly lighter" from the back of a room; the ring is what
actually carries "this is the face you are on" across a projector.

Verified in the browser across the model text face (four chips, four
highlights), the checklist swatches, and the print preview, where the evidence
snippets keep their text legible on the denser fills. english-text.js v12,
style.css v99.

## 2026-07-29 (night) — The reveal menu stops closing on you

Glenn: the option to choose more than one criterion from the chevron menu in
one go, then close it with the arrow or by tapping off.

It closed on the first tap, so four criteria at the start of a lesson meant
opening it four times. Now it stays open: each tap still reveals immediately —
a reveal is a live act, and nothing is held back waiting for an OK that a
stray tap could lose — and the menu repaints its own ticks in place. Three ways
out and no fourth: the chevron toggles it, a tap off it closes it, Escape
closes it, and the chevron stays lit while it is open.

Two things that only show up once the menu outlives a reveal. The chevron is
now found by class rather than held as an element, because every reveal rebuilds
the bar underneath the open menu — holding the anchor would orphan it on the
first tap and kill the toggle. And closing deliberately does NOT call
paintQuick: the close runs from a capture-phase pointerdown, so rebuilding the
bar there would detach whatever the teacher was actually pressing before its
click could fire. Tapping Print… with the menu open would have closed the menu
and done nothing else. The open/shut look is a class swap on the live element
instead, and it is verified: with the menu open, a press on Print closes the
menu AND opens the print dialog.

While in there: the menu now clears the whole bar, measured at open time. The
bar is two rows since this morning and grows again when a long criterion wraps,
and the old fixed 46px offset had quietly started laying the menu over the
model text — the one surface §11 says it must never cover. And the footer hint
("Tap as many as you need — the arrow closes this") is sticky, because a
twenty-criterion menu scrolls and an instruction you only meet at the bottom is
one nobody reads.

The tap-off handler stays local to this widget: the app-wide dismiss work is
happening in another chat, and two handlers for one gesture is how they end up
fighting. english-text.js v13, style.css v101.

## 2026-07-29 (late) — What a tick means, and Reveal arming its own criterion

A five-lens assessment of the toolkit came back with two items Glenn took, and
the first is the one that mattered.

**A tick meant two things at once.** A criterion ticked itself the moment it
had a highlight, then refused to come off while the highlight existed — and
gtPosterSvg printed that tick. So the class hunts the WAGOLL in lesson one,
highlights eight features, and the criteria poster goes up on the wall that
afternoon with all eight boxes already ticked. Three weeks before any of it is
taught. It was the one place the widget made a claim in front of a class that
was not true, and it came from putting "we found this in the model" and "we can
do this" in the same box.

A tick is now a hand action and nothing else sets it. The marks have not gone
anywhere: they show as a count beside the box — evidence that the feature is in
the text, sitting next to the separate question of whether the class can use it
yet. From one upwards, because "found once" is exactly as much evidence as the
old rule needed to tick outright. The count is slate rather than the tick's
green so it reads as a fact, and it is covered along with the criterion text
under Cover, since a count of what is behind the cover is a clue. The poster
follows the same rule. In-flight decks are deliberately not migrated — a
toolkit mid-unit loses ticks it never earned and keeps its counts, which is the
correction arriving rather than a loss; hand ticks were always stored
separately in p.ticked and are untouched.

Worth recording that the old behaviour was itself a considered fix, for a real
problem: a tap that silently set a flag under a mark-driven tick, so the box
appeared not to respond. That reasoning was about the interaction. This change
is about what the box CLAIMS, which is a different question, and the interaction
problem disappears once only one thing can set it.

**Reveal now arms what it reveals.** Pressing Reveal makes that criterion
active, so the next tap on the model text paints with it — the commonest next
move used to cost a hunt for a chip that always lands last in a strip capped at
42% of the face. The armed chip is scrolled into view by moving the strip's own
scrollTop and nothing else: scrollIntoView() walks up and scrolls every
scrollable ancestor, and the ancestors here are the widget and the stage, so a
board that jumps because a chip needed twenty pixels would break the
spatial-stability rule for the sake of keeping it. Deliberately NOT wired to the
chevron menu — that reveals several at once, so arming the last-tapped one would
be arbitrary, and the menu covers the strip anyway.

Verified live: three revealed with marks on two and no hand ticks now shows
counts 2 and 1 against three empty boxes (all three would have been ticked
before); the box toggles freely both ways with marks present and no toast; the
poster prints exactly one tick where one criterion is hand-ticked and two others
carry highlights. Reveal arms the criterion it revealed, the strip auto-scrolls
to it at thirteen chips (scrollTop 105, chip fully visible), and the chevron
menu leaves the arming alone. Specs updated: genre-toolkit-design.md §6 and new
§7.1, english-widgets-design.md §8.4. english-text.js v14, style.css v102.

## 2026-07-29 (later still) — The undo that could never be pressed

Glenn: the "Put it back" pill in the toast does nothing when you click it.

It did nothing because nothing could click it. `#toast` carries
`pointer-events: none`, which is right for a message that floats over the stage
— a toast should never eat a click meant for the widget underneath it. But
pointer-events inherits, and the rule was written when the toast was text only.
The button arrived later, on purpose, as the no-awareness-required path back
from a mis-clicked X: no menu to find, no reading, no knowing where things go
when they are closed. It rendered, it lingered its nine seconds, and every click
aimed at it passed straight through to the dashboard behind.

The tell was the hover. The `:hover` rule that lightens the pill could not fire
either, so the button never lit up under the pointer — a dead hover on a styled
button is pointer-events, not a missing handler, every time.

Nothing was wrong below the CSS. `el()` attaches onclick with addEventListener,
`toast()` wires the button to onAction, and `restoreFromBin` was provably fine:
the *same* function is what the Put it back buttons in Your data → Recently
closed call, and those have always worked, because they sit in an ordinary modal
with nothing blocking them. One function, two callers, one of them unreachable.

The button alone takes clicks back, and only under `.show`. The scoping is the
part worth recording: the toast rests at `opacity: 0`, and a fully transparent
element is still hit-testable, so `#toast .toast-action` unscoped would have
left an invisible dead target parked mid-screen for the other twenty-three hours
— the same class of bug, moved rather than fixed. The container keeps
`pointer-events: none`, so a plain toast still lets a click through to the stage.

Verified by hit test rather than by eye, since the defect was hit-testing: at
the pill's centre, `elementFromPoint` returns the button while the toast is
shown and the dashboard grid once it is hidden, and a real mouse click fires the
handler. Hover lights the pill again.

One thing this does not change: the toast only appears when the widget reached
the bin at all, and `binWidget` bails on anything `widgetWorthKeeping` says is
empty. Closing a blank widget has never toasted and still does not. That is the
intended rule, but it is the other reason a teacher sees no pill, and worth
knowing before reading silence as this bug returning.

style.css v103 — the cache-buster is load-bearing here: a stylesheet held at
v=102 keeps the dead pill.

## 2026-07-29 (last) — The dock panels learn to let go

Open Maths, read the row of widgets, decide against all of them, click the stage
to get on with the lesson — and a 560px slab stays sitting over the screen. The
only way out was to remember which dock tab had lit it up and press that same
tab again. Same for the Background drawer: 400px down the right-hand edge until
you found the ✕ or the tool that opened it.

Nothing was broken, which is why it survived this long. `toggleMorePanel` and
`toggleBackgroundPanel` are honest toggles, and `closePanels()` does exactly what
its name says. It just had eight callers, every one of them a deliberate act —
opening another panel, entering the dashboard, turning on annotation. Not one of
them was a click on the stage, because there was no listener watching for one.

The app already knew how to do this in two other places. The widget ⋮ menu has
had a document-level `pointerdown` since it was written, and the deck card menus
have the same on `click`. The dock's panels were the odd ones out.

Capture phase, not bubble. A widget stops `pointerdown` from bubbling the moment
a drag starts, and a press that begins a drag is precisely the press that should
put the panel away — a bubble-phase listener would sit there and never hear it.
Verified against a real widget, not reasoned about: press the clock while the
Maths panel is open and the panel goes.

The dock is exempt from the handler. Its buttons toggle, so closing on the way
down would let the click that followed reopen what it meant to shut — the panel
would appear to ignore you. Tabs still swap cleanly (Maths → Games), pinning
from inside still rebuilds the panel in place, and pressing the same tab twice
still closes it.

The geometry drawer is deliberately left alone. It opens from the annotate bar,
not the dock, and its "outside" is the canvas it configures — dismissing it on
every stroke would break the adjust-draw-adjust loop it exists for.

Escape now reaches these panels too. It already closed the dashboard, the
settings panel and the widget menu; the dock's panels were simply missing from
the list. It calls the same narrow closer, not `closePanels()`, so an open modal
still leaves through its own path with its `onClose` intact.

## 2026-07-29 (after that) — The front page opens the same list editor the widgets do

Two editors sat over one `state.lists`, and only one of them could take a class.

The widgets were fine. Name picker's "Edit lists" and Group maker's "Lists" both
open `openListManager` — a textarea, one name per line, split on `\n` as you
type. Paste a register into it and thirty children arrive.

The front page had its own thing: name chips, and a single-line `＋ Add name…`
that commits on Enter. Paste a register into a single-line input and the browser
flattens the newlines for you. The teacher gets one name, thirty children long,
and no clue why. That is the bug Glenn found, and it is a bug of the worst kind —
the app looks like it worked.

So the front page stops having an opinion and opens the same modal. A "Paste a
class list" pill in the Name lists header, and "Paste names…" on each card's ⋮.
The card's version passes the list it belongs to, which is the whole of the new
argument: `openListManager(onDone, startList)`. Widgets still call it with one
argument and land where they always did.

The chip input stays. Adding one child who joined in March is a real thing to
want, and it is the faster way to do it.

Two smaller things fell out of pointing the front page at that modal. With no
lists at all, `current` is null and the textarea silently discards every
keystroke — so the header pill asks for the class name first, and `paintArea`
disables the box when there is nothing to commit to. A teacher's first-ever
click on that pill now ends with somewhere to paste.

Verified in the browser: eleven names in, eleven chips out, count 8 → 11, and
"Paste names…" on a second list opens on that list rather than the first. The
empty-lists branch is reasoned, not driven — the sandbox blocked both ways I had
of reaching a store with no lists in it without destroying the local data.

## 2026-07-29 (later again) — One way to name a list, one way to read a register

Two jobs from the assessment: stop the creation paths losing data, and let a
register arrive in the shape it actually has.

### The clash check that wrote to the wrong key

`if (!name || state.lists[name]) return; state.lists[name.trim()] = [];`

Checked raw, wrote trimmed. So " My class" — a leading space off a copy-paste —
found nothing at `state.lists[" My class"]`, passed the gate, and then landed on
`state.lists["My class"]`. Eight children replaced with an empty array, no
confirm, no toast, no undo. Verified before the fix by doing it: 8 → 0. The card
kebab's Rename had the identical mismatch; the modal's two were internally
consistent and so could not overwrite, but never trimmed at all, which is how
you end up with "Year 4R" and "Year 4R " as two classes.

Four call sites, three prompt strings, two trimming rules. Now one
`createList` and one `renameListTo`, both over `normListName` — collapse runs of
whitespace, trim, then check the key you are about to write. The clash is a
toast naming the list rather than a silent return, because a teacher who typed a
name and saw nothing happen has been told nothing.

### The register, in the shape it arrives in

`split('\n')` assumes a clean column. Registers are not that. They are two
columns out of Excel, a row per child out of the MIS, a numbered list out of
Word, "Surname, Forename" in any of them — and `Raman,Priya,4R,Female,EAL`
became a child of that name, which the picker then put on the wall at display
size. A child's EAL status, projected, because a teacher pasted their register.

`parseNames` reads one line at a time: one delimiter chosen for the whole paste
(a tab anywhere means spreadsheet columns, so a comma is then part of a name),
Word's numbering off the front, the first two cells as the name, repeats dropped
case-insensitively, a 200 cap. Flipping reorders cells and never words inside a
cell — "Ahmed, Yusuf" flips, "Mary Jane Smith" is left alone, because guessing
which part is the surname is worse than not guessing.

It runs at the paste boundary and nowhere else. Typing stays literal: reflowing
a line while someone is halfway through it is its own kind of broken.

What comes back is a row under the box — "6 names · 1 repeat dropped · numbering
removed" — with two ways out. Undo restores the text as it was. The flip offer
names its result rather than its rule: "Flip to “Yusuf Ahmed”" is a thing to
recognise, "Surname first" is a thing to work out. Both belong to the box they
were pasted into, so switching class clears them.

Names already in the box count against the paste, so pasting the same register
twice adds nobody and says so.

And the `＋ Add name…` input on the dashboard card — the single-line input that
started all this by flattening a register into one very long name — now sends a
paste with any shape to it through the same reader.

Verified in the browser end to end: the messy nine-line sample in, six names
out, the MIS row down to "Raman Priya", the flip, the undo, the second paste
adding nothing, and the overwrite refused with the list intact at eight.

## 2026-07-30 — The register arrives as a file, because that is what it is

Glenn: hard to see how a teacher makes a list from a pre-made CSV or Excel
sheet. He was right, and in two different ways.

Copying a column out of Excel and pasting it already worked — parseNames was
built for tab-separated cells and CRLF, which is exactly what Excel puts on the
clipboard. Nothing anywhere said so. The pill read "Paste a class list", which a
teacher holding Year4R.xlsx has no reason to think is about them. And there was
no file route at all: the drop handler had answered .pptx and nothing else since
the day it was written.

### Reading a spreadsheet

An .xlsx is a zip and SageZip already opens deflated archives, so the reader
went into doctext.js beside the .docx and .pdf ones — one module that answers
"give me the text out of this teacher's file". It comes back tab-separated, a
row per line, because the name reader on the other side was built for what
Excel puts on the clipboard and that is tab-separated too. A register opened
from a file and a register copied out of a window now arrive in the same shape
and are read by the same code.

Two things a naive walk gets wrong, and both were in the first version of my
test fixture before they were in the reader. Cell text mostly is not in the
sheet — `t="s"` is an index into xl/sharedStrings.xml, and reading the index as
the name gives a register of numbers. And cells are sparse: an empty column is
simply absent from the XML, so a cell has to be placed by the column in its `r`
reference or every row after a gap shifts left.

Which sheet? Following workbook.xml through its relationships is correct and is
a lot of code for a question a register never asks. The sheet with the most text
in it is right whenever only one matters, and beats "sheet1.xml" when a workbook
opens on an empty tab.

doctext used to turn a spreadsheet away with "copy the cells you want and paste
them in" — honest, and the ninety-seconds-before-a-lesson conversion the rest of
that file exists to refuse. Now only .xls gets advice, and it gets its own
sentence about Excel rather than the .doc one about Word: the two share an OLE
signature, so the filename is all there is to tell them apart.

### What a real file does to a parser

Three things bit, each caught by running it rather than by reading it.

Excel writes a byte order mark, so the first child was called ﻿Ada. The word
bank learned this one already; the comment there is what pointed at it.

An export quotes a name that holds a comma — `"Ahmed, Yusuf",4R` — and "first
two cells" then stapled the reg group onto the child. A first cell containing a
comma is a whole name on its own, so it is split on its own comma and the next
column is left alone. Quoted fields also mean the text cannot be cut into lines
before it is cut into cells, since a quoted field may contain a newline.

And a sheet has a header row. "Surname Forename" standing at the front of the
class is a poor first impression. The first rule — every cell must be a known
heading — did not survive one real register: a Notes column, and the header
walked in as a child called "Name Reg". A labelled *name* column is the tell,
so a row opening with Surname or Forename or Pupil is a header. A child whose
surname is "Surname" is not a risk worth the brittle rule.

A row with no letters in it at all is dropped too. That is the column of
admission numbers, and it was never a column we were meant to read.

### The two ways in

"Open a file…" sits above the box, and a file dropped anywhere on the window
lands the same way. The drop has to guess a class, so it guesses out loud: the
editor opens on the deck's list with the names in it, the count above them and
Undo paste beside it. Both routes go through the same reader as a paste, and get
the same count, the same flip and the same undo — a file is just another way for
text to arrive.

Verified end to end against a built .xlsx (shared strings, a split run, an
entity, a gap column, an inline string, a numeric row) and a .csv as Excel saves
one (BOM, CRLF, quoted names, a header, a repeat): four names and three names
respectively, headers ignored, repeats dropped, admission numbers left out.

## 2026-07-30 (later) — The menu in the order a teacher reads it

### A–Z, and the bar left alone

The widget panels listed their contents in the order the TOOLS array happened to
be written in, which is a memory test rather than a scan. They sort by label
now. The sort runs on a filtered copy at open time, not on TOOLS itself, so two
things stay true: the pinned bar keeps its hand-picked order, where frequency
beats alphabet and Draw pad has earned its slot; and the English widgets, which
are pushed into TOOLS after load, fall into place on their own with no second
piece of wiring to forget.

### The word teachers already use

Glenn: "we call them name lists here, but in the real world they are called
class lists or group lists — on something like a name picker and class list, the
frequency of use is usually high." A word met several times a day has to be the
one already in the teacher's mouth, so "Name lists" is "Class lists" everywhere
one is read: the dashboard tab and its heading, the editor's own title, the
deck-close tooltip, the erase-everything confirm, every naming prompt.

state.lists and deck.classList keep their names. The rename is what a teacher
reads, never what a saved register is filed under — no data moves.

Class lists, not group lists, because Group maker is a separate widget reading
the same register, and "group list" beside it would read as that widget's own
thing rather than the class.

The picker could always pull from any list; the select has been there all along.
What was missing was the way to the lists, which lived on a small button inside
a picker or the group maker — so the editor now has its own entry in the menu,
under C. Opened from there it has to remount the widgets that read a list, the
way the in-widget button already did, or you edit a register and watch the
picker on screen ignore every word of it.

Also: "Groups" in the menu is "Group maker", the name its own title bar has
always used. Two words for one widget is exactly the translation this pass is
meant to remove, and "Groups" sitting a few rows from "Class lists" invited the
reading that it was where you kept them.

### One row of actions, and the red that was not red enough

"Open a file…" has moved down out of the row above the box to sit with Rename
and Delete list — superseding "sits above the box" in the entry before this one.
One row now, read left to right: bring names in, retitle the list, throw it
away. Green, amber, red.

Two new .btn tints for the first two. Not the --tint-* swatches — that comment
reserves them for decoration and says the accent and danger colours are what
carry state — so they are inked the way --danger-ink was, and measured: 6.5:1
and 6.4:1.

Which left Delete list, on --danger, the weakest of the three at 4.0:1 — under
the floor, and conspicuous between two that clear it comfortably. It is on
--danger-ink now, 5.3:1, which is what that token was added for: --danger for
fills and icons, --danger-ink for small red words, and every .btn.danger in the
app is small red words. Five buttons move with it — Remove image, Clear all
items, Remove local file, Delete list, and the data panel's — all of them
better for it.

## 2026-07-30 (last) — One name per widget, and the label that was being eaten

### The two remaining mismatches

"PV counters" and "Strategy board" in the menu were "Place value counters" and
"Mini strategy board" on the widget's own title bar. Both now use the full name
in both places, which is what the other forty-three widgets already do. PV is
planning shorthand — the words a teacher says to a class are the whole ones, and
"Mini" is not decoration, it is which board you are getting.

### The clip nobody had noticed

Lengthening them turned up something older. .tool-cell .label was nowrap with
overflow:hidden inside a 92px cell, so a long name lost its tail with no
ellipsis to admit it — "Numbers & letters" has been landing in the Games panel
short of its last word for as long as it has been there. A widget whose name you
cannot read is one you cannot find, which is the same complaint the A–Z sort
was answering.

Labels wrap now, centred, two lines where they need it. Three of the fifty-three
take a second line; nothing is cut.

### Class lists on the bar

Added to DEFAULT_PINNED, which only ever applies to a device with nothing pinned
yet — no existing teacher's bar moves. It sits beside Name picker rather than up
by Background, where its position in TOOLS would otherwise have put it: set the
register, then pick from it. That position is now free to mean only that, since
the menu sorts by label and no longer cares what order TOOLS is written in.

## 2026-07-30 (reds) — Every critical finding in the review, closed

Nine days after the full-app review, one of its 73 boxes was ticked. Three of the
four 🔴s were still live in today's code, checked line by line rather than taken
from the notes. This closes them, and the small items that turned out to be the
same code.

### One sanitizer, and the sink that was never a sink

A Text widget's content is real HTML, which is what makes it worth having and
what makes it dangerous: `innerHTML` runs an `onerror` handler without needing a
`<script>` tag, and this app's single origin holds every deck and every class
list of children's names. `sanitizeTemplate` deep-copied `props` verbatim, so a
community source — a documented feature — could ship `html:"<img src=x
onerror=…>"` and run script in-origin.

`sanitize.js` is now the one answer, and DOMParser is what makes it safe to
write at all: the document it returns is inert, so the `<img>` is examined
without ever being loaded. The allow-lists are drawn from what the app actually
emits — the toolbar's execCommands, the built-in templates, and `parasToHtml`'s
`div`/`span`/`a` with inline styles — so cleaning costs nothing that was ever
displayed. Style attributes are filtered by property, because `url()` is how a
style attribute reaches the network; parentheses stay legal, since `foreColor`
writes `color: rgb(15, 23, 42)`.

Two of the three sinks turned out not to want HTML at all. The dashboard
thumbnail and the PPTX speaker note both wanted the words, and both reached them
through a detached `div`'s `innerHTML` — which fires `onerror` exactly as
readily as a live one does. Verified in the console before trusting it. That is
why the review found the payload "fires just from the dashboard": you never had
to open the deck. Those two now take `SageSanitize.text()`, which builds no DOM.

Cleaning happens on the way **in** at the render sink, and again on import
(`sanitizeTemplate`, and `scrubImportedHTML` on a restored backup) so a payload
never reaches storage. Boot deliberately does not sanitize the teacher's own
saved decks: the sinks make a stored payload inert without touching it, and
silently rewriting somebody's saved work at every launch is the more expensive
mistake. Edit a widget and the cleaned version saves over the old one anyway.

Three URL entry points came along, because they are uses of the same guard: the
text toolbar's Link button, the Link widget's `window.open`, and a .pptx slide's
hyperlink. The stored render was already covered — but `createLink` makes a live
tappable anchor before any remount, and `window.open('javascript:…')` opens a
window that inherits this origin. A scheme can also hide behind whitespace, so
`SageSanitize.url` tests a stripped copy: `java\tscript:` is a scheme the parser
accepts and a plain regex walks straight past.

### The erase that a forgotten tab undid

`removeItem` fires a storage event with a null `newValue`, and the handler's
first line skipped it. So the projector tab still had the whole thing in memory,
and put it back on its next `save()` — and a z-bump on any pointerdown is a
`save()`. "Erase ALL screens, widgets and class lists on this device" gave the
class lists back.

Both the tab that erases and every tab that hears about it now go through one
`dropLocalState()`, which also cancels the pending debounced save — a save queued
before the erase would otherwise land after it. The hearing tab says so out loud:
a display tab that empties itself mid-lesson with no explanation reads as the app
losing the work, which is the opposite of what just happened.

Tested with two real tabs on one origin, a register in both tabs' memory. Erase
in one, and the other clears, then writes only the fresh default state — no
register, no widget html.

Fixing it turned up a bigger version of the same broken promise, and one the
review predates: the button emptied `localStorage` only. The daily snapshot trail
and the modelled-writing undo histories sat in IndexedDB holding the same decks
and the same children's names. `clearStoredHistory()` clears both stores.
`clearAux` is separate from `clearAll` on purpose — a future "delete my
snapshots" must not throw away the routes back that an undo stack is holding —
and if the clear fails the teacher is told, rather than the toast claiming
everything went.

### A quarter is not a half

On a Halves line ticked into halves, a true ¼ jump auto-labelled **+1/2**, and
¾ labelled **2/2**. `nlTxt` rounded a fractional remainder into a whole
numerator, so half a line-unit became one of them. Wrong maths on a classroom
screen, in the widget whose whole job is what a number means.

The denominator a label needs is not the line's `den`, it is the smallest unit
the line actually shows: `den · minor / gcd(major, den · minor)`. Minor ticks
subdivide each step, so a Halves line ticked into halves **is** a line of
quarters, and the label should say so. One `nlParts()` now feeds tick labels,
jump arcs and the Facts sentence, so the three cannot disagree.

Not reduced, deliberately. A plain Quarters line has always read 6 as "1 2/4",
and the denominator is the line's unit — reducing is a different lesson, and the
line in front of the class is marked in quarters.

`pvFmt` came with it, from the same Facts line: `t % 1000` keeps the sign, so
−2.5 printed as "−3.−5" on the negatives line with half ticks. The remainder now
comes off `Math.abs` and the sign goes back on the front.

Browser-verified on both: **+¼** and **+¾** on the arcs, "0 + 1/4 + 3/4 = 1"
under the quarters line, "−3.5 + 1 = −2.5" under the negatives one.

### Also

`index.html`'s home button still said "All decks & name lists" — the one string
the rename two commits ago missed, found by reading the accessibility tree while
testing something else.

## 2026-07-30 (plan) — The money, written in the order it can happen

No code. A go-to-market checklist now sits beside the licensing design:
[go-to-market-checklist.md](go-to-market-checklist.md). It orders the autumn —
the paperwork that costs calendar time first (identity, certificates, the
store), testers in August, Tauri through September, the gate on before v1.0
ever ships, founders before any paid code — and it writes down the line every
future item gets judged against: never sell data, attention, or access to a
teacher's own work; sell capability and convenience.

Two of the licensing doc's open decisions picked up recommendations along the
way: a limited company rather than a personal name on the installer, and the
perpetual-versus-annual question resolved as a split — teachers buy once and
own it, departments rent seats because reassignment is the thing they are
actually buying. Export outlives the licence in both worlds. The decisions
stay formally open in §11; they just have shapes now.

## 2026-07-30 (story map) — What a mock knew that a spec could not tell him

The story map was specified at length before anything was built —
[story-map-design.md](story-map-design.md), 1,833 lines after nine agreed
insertions, every seam cited to a file and a line. Glenn read it and said the
truest thing anyone said all day: *"I still have no idea what this is going to
look like. We've spent hours on what seems like nothing."*

He was right, and this project already knew it. The sentence builder reached
V0.1 by revving a throwaway playable mock nine times against live reactions
rather than by editing the app. That lesson was in the log and got ignored on
the way past. So: a throwaway mock, `.sm-mock.html`, and the design moved at
about ten times the speed for the rest of the day.

Nothing below came out of a review. All of it came out of him using the thing.

### The typed cell was the wrong object

The first mock had boxing-up as two columns of textareas, faithful to the spec.
He rejected it on sight: *"the typed text in the boxing up tab doesn't feel
authentic."* The real act is a teacher **scribing by hand** while the class
ad-libs, which is why modelled writing exists in this app at all — print exists
so no easel paper gets torn off and walled. Boxing up is now a ruled page with
a pen, and the handwriting prints as written.

Then the correction that mattered more. Reading *"the area for students to
extend their learning"*, I built a face children could edit — and he stopped it:
**children do not touch the board.** The board is for modelling; the practice
happens on the children's own drywipe boards, replicating what was modelled,
*when the teacher releases it.* §7.10's refusal of a child-practice face was
right all along. What was missing was not a child surface but the hand-off.

So gradual release became a first-class state, the same three the sentence
builder ships: **Model · Together · Over-to-you**, in a band that physically
recolours the widget.

### The lock is not the stage

The obvious next move was to lock the board at Over-to-you. He stopped that too:
*"in certain instances, yes they can. And should be allowed to… but at a
teacher's discretion."* So the **stage** is the lesson's stance and the **lock**
is whether the board takes a hand at all, and the stage never moves the lock.
A child can be sent up to plot a dot at Over-to-you; a stray hand can be shut
out mid-model. Both directions verified.

### A word has three independent properties, and conflating them was the bug

Words started as bare strings from the genre pack. They ended as objects with a
**source**, a **score** and a **mood**, and the day's sharpest exchanges were
about keeping those three apart.

- **Source** — pack · bank · HFW · **E** · **S**. Board-facing tags for the two
  that name a need are single letters on purpose: *a tag that names a need names
  the child who has it*, on a surface thirty children read. Same mistake as the
  tick that printed a false claim about children on a wall, in a different
  costume.
- **Mood** — which part of the arc a word serves. He caught the need for it by
  eye: he set a beat to +2 and found the bank held nothing but dread words,
  because a narrative pack is stocked for the trough of the story mountain. The
  bank now groups by lifts, level and falls, and **diagnoses its own shortfall
  against the plan** — *"Opening, Resolution and Ending run up and the bank holds
  2 words for that."*
- **Score** — diction, 1–5, and **nothing to do with intensity of feeling.** I
  had composed mood × score into a signed "reach" and he corrected it:
  *"wistful would be a good word for scoring at +2 or +3 because of how seldom
  it's used in primary school writing."* The composition was retired. Score
  measures rarity; mood measures direction; only mood decides counterpoint.

He also pushed back on my refusing to ship default moods at all — *"Burger Boy
and Red Riding Hood are both upbeat at the start, only later are they less so"*
— and he was right. A word's valence is lexical, not a contested judgement, and
refusing to ship it made every teacher hand-tag fourteen words for nothing. The
rule I was over-applying protects against verdicts on **the class's writing**,
not against dictionary facts. Packs now arrive tagged; the override is editorial.

That same observation produced the better feature: because setting and character
mood generally co-move, **a plan carries the mood each part usually runs at**,
and the gear can seed the target line from the plan's own shape. A story mountain
is an emotional shape before it is a list of boxes. Seeded, then argued with.

### Counterpoint, and how to gauge it

Setting the wrong tone deliberately is a device with a name. *"Cormack McCarthy's
The Road isn't all jolly and the characters in the subway free and easy."* So the
words re-order to the beat's tone — **for this tone**, neutral, **against it — on
purpose** — nothing hidden, nothing called wrong, and an attached word that cuts
against says so as a craft note rather than a warning. The rule immediately
caught a counterpoint sitting in the seed data nobody had noticed: the Ending at
+1 with *hesitated* on it, which is exactly right for a character who is safe and
still wary.

Counterpoint is measured against **the story line**, fixed at channel order,
never against whatever is armed — because in The Road the story is bleak and it
is the *characters* who joke.

### Three colours, not three lines

Devil's advocate, Year 6: two hero characters plus a protagonist, and the story
— four lines against a cap of three. The cap was on the wrong noun. Three
**channels** is the real constraint, because three widely-separated saturated
hues is what a badly calibrated board carries; the number of **lines** never
needed a limit. Lines share a channel and take turns, so the board never shows
four and no line changes colour because another was hidden. His own framing:
*"the two main characters are the main orange line."*

### The exceptional word is an event, not a sixth level

The scale tops out at 5. **★ beyond** is separate, and flagging one records a
**moment** carrying its context — which box, which text, which stage, and who,
if the teacher says. His reason is the one that matters: these are *"insertion
points in naturally built reports giving authentic data not just rhetorical
data."* The gear shows what a moment becomes beside the stock sentence it
replaces. Moments print on the wall sheet.

This is the first time the story map holds anything child-level, and it is
deliberate, optional, and defaults to "the class". It wants deciding in the spec
rather than by accident, and the record wants to belong to the assessment
suite's evidence pipeline rather than to `w.props`.

### And two things about who this is for

Print gained **sheet budgets** — one A4 each for the children, or eight sheets
at about A1 for the wall — because a whole-class modelled write belongs on the
working wall, which is the app's existing promise: saved, reprintable
wall-sized, and A4 for children 1:1.

Writing rules are **banded**: EYFS block letters at 52px with a dashed midline
to reach for, down to nine narrow lines at Years 5–6, because the story gets
longer as the letters get smaller. That also retired a review finding — the
printed ruling was measuring itself off the Model column's height, so a two-chip
box got two lines and a six-chip box got many.

And the audience is wider than a class teacher at a board. Teaching assistants,
SEN and EAL specialists work at arm's length with three or four children **whose
hands should be on it**. One `room` setting carries the whole distance problem —
type, targets, card width, density — and choosing the small group unlocks the
board, because there the hands are the point rather than the hazard.

### The warning that belongs in the teacher guide

His, near verbatim, and it should open that document: **this is a teaching tool,
not a painting-by-numbers story maker.** Stacked carelessly — plan seeds boxes,
plan seeds target, graph shows a gap, words sorted by tone — the design becomes a
recipe for thirty identical competent stories with no writer in them. What
resists it is already here: the model text is empty in every pack, nothing is
ever marked done, counterpoint is a named choice, and words are re-ordered but
never filtered. What does not resist it is the diction score, so the gear now
says out loud that **it scores the word and never the writing — a 5 in the wrong
place is worse than a 2 in the right one.**

### Where this leaves the spec

Behind. `story-map-design.md` describes typed cells, no stages, no lock, no
scored words, no channels and no moments. The mock is the design authority for
behaviour now; the spec's remaining value is its seams — the file:line citations,
the caps table, the print contract, the hazards. Folding one into the other is
the next piece of work, and it should keep the spec's constraints and take the
mock's decisions, not the reverse.

## 2026-07-31 · The story map, built

The handoff from the reconciliation pass listed three decisions that blocked the
build. All three were taken as recommended, and the build ran from there.

**Names do not print.** A moment carries a child's name, and the map sheet is the
one that goes home in a book bag. Screen only, in v1: the settings panel shows a
moment with its `who`, and no sheet carries one. §14 rule 5's "no child names" is
about pack text and does not govern this, so the code says so where the sheets
are built.

**Moments live in `w.props`.** Every store the app has ages out at 60 days, which
defeats the whole point of evidence for a report written a term later — but the
question is moot for v1, because a moment is not meant to outlive the class that
produced it. They ride with the map, they snapshot, and reset clears them. The
durable store is the assessment suite's job.

**The pen was promoted, not re-implemented.** `modelwrite.js` now exports
`window.SagePen` — the stroke maths plus an `attach(svg, opts)` factory — and the
story map's per-row pens go through it. The alternative was ~400 lines of second
pen, and `mwErasePart`'s own header records two rubbers that looked right and were
not. Modelwrite's `mount()` does not go through the new surface, so nothing
already written can shift. The split is of the SHARED LAYER, which is the rule the
spec sets for exactly this case.

### What that made possible

The three faces are in. The text map runs the capture loop — `+ beat` opens a beat
with its field focused, Enter commits and starts the next in the same box — and
typing live-patches the card rather than re-rendering it, because the caret has to
survive every keystroke. The emotion graph draws three channels with unlimited
named lines, ghost dots on the armed line only, target lines dashed with hollow
markers, and the gap ribbon between them. Boxing up is a handwritten ruled page:
no typed cells anywhere, a pen strip on every row because a toolbar at the top of a
700px face is a stretch back up the wall for box 4.

Two blockers from the pass were fixed rather than carried. The write surfaces are
built once and re-parented across a render, so a tap on a capture-bar score chip no
longer tears down five SVGs and orphans a stroke in flight — verified: the node
identity survives, and so does the ink. And the printed sheet takes its viewBox
from the same `ruleSet()/lines` pass the face used, so handwriting prints as
written at every band rather than only at the one that was eyeballed.

### The measurement, and what it cost

The board floor was settled by measuring rather than arguing. 72px stands for the
two controls a lesson presses dozens of times — `+ beat` and the panel's close —
and `--sm-tap` is 44 at board and 36 at table everywhere else, where the room
setting makes it defensible.

Measured at the shipped 1180×660: the app's title bar leaves 620px of body, and the
plan header, stage band and bar take 151 of it. A 1000×440 plot wants 499px in a
420px face. A class reads the shape whole or not at all, so the plot now takes the
room that is left — the holder flexes and preserveAspectRatio does the scaling,
with no measurement in JS.

The per-beat text label under the axis was **cut**. Beats sit at a fixed pitch of
`bw/(cap+1)` so a new beat cannot move the ones the class is already reading; at
six boxes that pitch is about 20 units and at three boxes about 40. No wording fits
either, and the mock's 16-character label drew every beat in a box on top of its
neighbour. The dot carries `data-beat` and opens the panel instead; the box name is
the label that has room.

### Two seams widened

`engDeps` gained one accessor, `classNames()` — the resolved class list's names, or
`[]`. A narrow accessor is auditable where handing a widget `state` is not, and the
who-row's promise that a name "stays on this machine" had to be true from the first
commit. And `print.js` gained one line so a caller can open the dialog at the budget
its own entry point means: "Print…" on the bar opens at one sheet, "Print for the
wall…" at eight, and the choice is remembered nowhere.

### The data, in one commit

`mood`, `shape` and a tagged vocabulary landed across all five sites at once —
`english-packs.js`, `gtNormalize`, `gtCopy`, `gtBlank`, `gtPackOf` — because a mood
added to the data alone works until the first time a pack round-trips through a
file, and then it is silently gone. Eight arcs joined as a new `kind: 'arc'` pack,
and all 120 pack vocabulary words carry a diction score and a mood.

`language.vocabulary` still normalises to plain strings, so the genre toolkit's bank
face, its poster and its settings are untouched; the tags ride alongside in `vocab`.
One authored list, two views, and no second list to drift. Verified: the toolkit
still lists twelve genres at 26 words each.

### Later the same day — three silent losses, closed

An audit of the widget it had just shipped found four ways it could destroy a class's work
without refusing, confirming or taking a snapshot. Three were one-liners and went in together;
the fourth needs a ruling and is still open.

**The swap gate was a stale boolean.** `swapShut` was computed once when the settings panel was
built and the plan button tested that captured value — but `bump()` on the board is `save()`
alone and never rebuilds the panel. So the sequence that breaks it is the ordinary one: open the
gear at the side of the board, teach the lesson, tap a plan. `p.strokes = {}` then ran under a
comment promising it destroyed nothing, because the window *had* been open when the panel was
drawn. It is now a function asked at the moment of the tap. The reset control at the foot of the
same panel already did it that way; the guard the panel's own comment calls mandatory had been
applied to `p.arc` and not to the gate above it.

**Backspacing a line's name deleted the line and every feeling plotted on it.** The name field
wrote through on every keystroke with no empty guard, and the mount coercion drops a nameless
track and then prunes every beat value keyed to its id. Silent, on the next reload. Two controls
along, deleting a line is deliberate and says *"Every feeling plotted on it goes too."* — two
routes to one act, only one of which admitted to it. An empty field now commits nothing and the
field snaps back to what is stored, so clearing a box to retype it is no longer the same gesture
as throwing the line away.

**A word tapped on the boxing-up face attached to a beat nobody could see.** Only the map and the
graph draw a beat panel — boxing up is a view of the beats and authors none — but changing face
left `p.open` set, so the bank's tap branch found a live beat that was nowhere on screen and
attached to it instead of climbing the word's score. Changing face now commits the open beat and
shuts it, exactly as engaging the lock already did, because a half-typed beat is the class's words
and switching face is not a reason to take them.

Each was verified at the board rather than by reading: the panel built on an empty map, a stroke
written into it, the plan tap refused with the writing intact; a plotted value surviving an
emptied name across a reload; a bank tap climbing `glanced` from 1 to 2 with no beat touched. And
the swap still *works* on a clean map — the gate is now accurate rather than merely shut.

**Still open, and it needs a number rather than a fix:** `SM_CAP.strokesPerMap` is enforced only
in the load loop, where hitting it breaks out and drops whole later boxes rather than trimming a
tail. The pen only knows `strokesPerBox`, so sixteen boxes at 300 is 4800 against a map cap of
1200 and the two ceilings cannot both hold. Which number moves is a decision, not an edit.

### What is not done

The spec fold itself. `story-map-design.md` still describes typed cells and no
stages, and the handoff's section-by-section plan is the instruction for rewriting
it. The code is ahead of the document again, which is the state this log exists to
stop — so it is the next thing, not a later thing.

Also outstanding: modelwrite still ships `MW_STAGES` at four stages with different
words, so two English widgets side by side show two gradual-release schemes.
Changing it edits a shipped widget's printed page tag, which wants a ruling rather
than a guess. And ⋮ Duplicate deep-copies props, so a duplicated map carries last
term's moments; it is written down here rather than fixed, because the fix is a
hook the app does not have.

## 2026-07-31 · Phase 1 of the storage seam

Going to Tauri to answer the storage question properly, and phase 1 of
`docs/storage-abstraction-plan.md` is the half that needs no toolchain: extract the seam,
prove parity in the browser, and only then put a desktop shell round it.

`storage.js` now owns persistence and `app.js` asks it. Boot has exactly one `await`
— `SageStorage.init()` — and the outer IIFE gained a `.catch`, because an async boot
turns a startup throw into a silent rejection behind a half-drawn page. Every other
touch was mechanical: `load()` reads a preloaded string, `save()` hands over a
serializer thunk, the cross-tab `storage` listener became `onExternalChange`, the
first-run probe became `persisted.existed`, erase and the usage meter went through
the interface.

**Where the plan was out of date, the principle won.** Its §3 sketch of the local
backend was written on 2026-07-18 against a `save()` that has grown since — copying it
literally would have quietly dropped the headroom probe and the whole bin-shedding
ladder. So what moved was today's code, not the sketch: the backend owns the debounce,
the `setItem` and the retry loop, and `app.js` keeps the judgement about what a teacher
can afford to lose. The backend asks for a smaller payload; `app.js` decides that the
bin goes before the lesson does.

**One regression, found by testing rather than reading, and it was the bad kind.**
`dropLocalState()` cleared `saveTimer` so that a save queued just before an erase could
not land after it and undo it. Moving the timer into the backend left that as a dangling
reference in strict mode — which broke **both** erase paths, the button and the
cross-window one, silently. The interface gained `cancel()`: throw away a pending write
rather than perform it. The plan does not have it; §2 should, and the note is in the
code where the next reader will find it.

Verified in the browser rather than by reading, against the plan's own phase-1 list:
existing data restores with no duplicate starter widget; a mutation is absent from the
store at 120ms and present by 420ms, so the 250ms debounce is unchanged; the shedding
ladder retries through successive concessions, fires its notice exactly once, and lands
on the smaller payload; with nothing left to give up it says the same sentence it always
said; a serializer that throws does not wedge the queue; cross-tab writes still arrive
and still re-render; both erase paths clear the store and stay clear through the debounce
window; and an empty store still produces the starter clock and the dashboard.

**Not done, and it needs a person rather than a commit:** Rust is not installed on this
machine, so phase 2 cannot be run — `tauri init`, `tauri dev` and `tauri build` all need
`cargo`. Xcode's command line tools are present, so that half is ready. Until then the
seam runs on localStorage exactly as before, which is what phase 2 asks for anyway.

## 2026-07-31 · Phase 3: the state becomes a file

Sage Stage now keeps its state in `Documents/Sage Stage/sage-stage.json` when it runs as a
desktop app, and in localStorage when it runs in a browser, and `app.js` cannot tell which.

**The write is atomic and durable.** One small Rust command: write a per-window temp file,
`sync_all()`, then `rename`. The fsync is not ceremony — without it a post-rename crash can
leave the main file zero-length once the metadata lands but the data blocks do not, which
turns "lost the last second" into "lost the whole day", because recovery would then fall back
to yesterday's backup. The temp name carries the window label so two windows can only ever
produce whole-file last-write-wins; with a shared temp name, one window's half-written file
could be renamed onto the main file by the other, installing garbage through a perfectly
atomic rename. The label is validated in Rust because it is the one place a string from JS
becomes a path.

**The queue keeps failures dirty.** A failed persist puts the serializer back as pending, so
`dirty` stays true and the close-time flush retries rather than discarding a teacher's last
edit after one transient lock. Debounce is 1s, not the browser's 250ms, because every save
rewrites the whole file and ink calls save() on every stroke-end; a 10s max-dirty guard stops
continuous drawing from resetting the debounce forever.

**Quitting flushes.** `onCloseRequested` covers the red button. Cmd+Q does not go through it
on macOS, so the shell installs a custom Quit menu item that runs a handshake instead: Rust
emits `sage:flush-request`, each window flushes and answers, and the app exits when they have
all replied or after two seconds. The timeout matters more than the count — an app that
refuses to quit is worse than one that loses a gesture the debounce had already bounded.

**The governing rule of the boot path is that a file you could not READ is never harmed.**
An OneDrive online-only placeholder throws on read; treating that as corruption would
quarantine healthy data, boot empty, save the emptiness, and poison the cloud copy when sync
resumed. So a failed read gives a read-only session and touches nothing. Only a file that
read cleanly and then failed the shape check is quarantined — renamed, never deleted — after
which recovery walks the daily backups newest-first, then OneDrive conflict copies, and
writes the winner back through the atomic path *inside init()*, because a teacher who opens
the app and quits without editing must not find a wiped app next time.

Verified against a real build, not by reading. A first run created the file with the right
shape and compact JSON. Renaming a deck in the file on disk and relaunching showed the new
name on the dashboard, so the file really is the source of truth. Corrupting the file with
readable-but-wrong JSON quarantined it as `sage-stage.corrupt-<ms>.json`, restored the seeded
backup, and left the main file already containing the restored deck. Making the file
unreadable left it byte-for-byte identical with no quarantine created, and the app still ran.

**Not yet done:** the data panel's file branch still shows a size rather than the path and a
"Show in Finder" button, and export still goes through the browser's blob-anchor rather than
the native save panel, which does not work in WKWebView — `saveExport()` and `fileInfo()` are
implemented in the backend and simply not wired into the modal yet. The daily backup was not
observed rotating, because that needs a second calendar day.
