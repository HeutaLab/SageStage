# Sage Stage — full-app review checklist

_Reviewed 2026-07-21. Companion to the phased plan in
[`storage-abstraction-plan.md`](storage-abstraction-plan.md) §9 — this is the
**"what to fix" list**; that doc is the **"how we ship desktop" list**. The
final section maps every finding onto those phases so the two can be worked in
one queue._

## Method

Eight parallel read-only reviewers over the whole codebase (`app.js` split into
six ranges, plus `export.js` / `pptx-import.js` / `qr.js` / `templates.js` /
icons / `community/`, plus `style.css` + `index.html` + accessibility), followed
by a hands-on browser pass of the core flows (dashboard → deck open → Base 10
exchange/break/build → clear → reload). The highest-severity findings were then
re-verified by hand against the source; those are marked **✓ verified** below.

Severity key: 🔴 critical · 🟠 major · 🟡 minor · ⚪ polish.
Each box is one fix. `file:line` points at the anchor site.

## Triage summary

| Area | 🔴 | 🟠 | 🟡 | ⚪ |
|---|---|---|---|---|
| P0 Security & privacy | 2 | 5 | 2 | 2 |
| P1 Data integrity & loss | 1 | 4 | 4 | 1 |
| P2 Maths correctness (shown to children) | 1 | 4 | 6 | 3 |
| P3 Touch / multi-touch | – | 5 | 1 | – |
| P4 Accessibility | – | 6 | 3 | 1 |
| P5 Rendering & performance | – | 1 | 4 | – |
| P6 Robustness & housekeeping | – | 1 | 7 | 3 |

The counts above are the review as taken on 2026-07-21 and are left alone; the
tick boxes below are the live record of what has been closed since.

**Every 🔴 is now closed** (2026-07-30) — fonts, the template XSS, the erase that
a second tab undid, and the number-line fraction labels — plus one more that the
erase work turned up: the button had never cleared IndexedDB. Fixing them took
four ride-alongs that shared the same code (`pvFmt` negatives, two `javascript:`
URL entry points, and the `.pptx` href scheme).

**The app is fundamentally sound** — core teaching flows work, state round-trips
through reload cleanly, currency is integer minor-units (no float bugs), the QR
encoder is spec-correct, the 42 built-in templates validate clean, and widget
lifecycle/cleanup is honoured. The list below is where it isn't.

---

## P0 — Security & privacy

The whole app runs from one origin with full `localStorage` access (every deck
and **every class list of children's names**). Anything that runs script in that
origin, or leaks data off-device, breaks the product's headline promise.

- [x] 🔴 **Stored XSS through shared templates / backups → text widget.** ✓ verified ·
  **fixed 2026-07-30** — one shared sanitizer in `sanitize.js`
  (`SageSanitize.html/text/url`), applied at every `props.html` sink: the text
  widget's mount, the dashboard thumbnail (now `text()`, which never builds a
  DOM), and PPTX speaker notes in `export.js`. Also cleaned on the way in, in
  `sanitizeTemplate` and on backup import (`scrubImportedHTML`), so a payload
  never reaches storage. Browser-verified: `<img onerror>`, `<svg onload>`,
  `<script>`, `on*` attributes and `javascript:` hrefs all inert from both the
  stage and the dashboard, with `<b>`/`<div style>`/`<span style>` template and
  PPTX markup intact. Boot deliberately does **not** rewrite the teacher's own
  saved decks — the sinks make stored payloads harmless without mutating them.
  `sanitizeTemplate` deep-copies widget `props` verbatim and only *collects* URLs
  for the vetting dialog — it never cleans the Text widget's `html` prop
  ([`app.js:9962`](../app.js#L9962)), which is written straight to the DOM via
  `ed.innerHTML = w.props.html` ([`app.js:5711`](../app.js#L5711)). A community
  source (a documented feature) serving `html:"<img src=x onerror=…>"` runs
  arbitrary JS in-origin on deck open — and **fires just from the dashboard**,
  because `deckThumb` parses the same html on a probe div
  ([`app.js:9170`](../app.js#L9170)). No `<script>`/`javascript:` needed;
  `onerror`/`onload` survive `innerHTML`. The "Check this template first" dialog
  lists URLs only, so it gives false assurance.
  **Fix:** one shared sanitizer (allow-list tags/attrs, strip event-handler
  attributes and non-`http(s)` hrefs) applied at **every** `props.html` sink and
  at import/load — not just the template path. This is the single most important
  item in this document.
- [x] 🔴 **Google Fonts CDN contradicts "100% local".** ✓ verified · **chrome fonts self-hosted + OpenDyslexic bundled 2026-07-21** (`vendor/fonts/`, CDN links removed; browser-verified zero Google requests). Remaining: the content-font *dropdown* (see mapping row).
  `index.html:7-9` preconnects + loads 8 families from `fonts.googleapis.com` /
  `gstatic.com` on every online boot, while `index.html:20` shows a "100% local"
  badge and the README promises "no server, no tracking … works offline". Every
  launch sends pupil-machine IPs to Google (the exact pattern ruled unlawful for
  EU schools in Germany); offline, all display fonts silently fall back.
  `grep @font-face style.css` → 0, so nothing is self-hosted. The repo already
  vendors JS in `vendor/`.
  **Fix (two font roles — decided 2026-07-21):**
  - _Chrome / app identity_ — all 8 families (Quicksand, Poppins, Lexend, Atkinson
    Hyperlegible, Graduate, Lilita One, Mali, Pacifico) are OFL and in use:
    self-host their `woff2` in `vendor/fonts/` as `@font-face` (with
    `font-display: swap`) and delete the three `<head>` links. This is what
    actually restores offline + privacy, and lets the Phase 2 Tauri CSP be strict
    (`script-src 'self'`, no font CDN).
  - _Teaching content_ (text / draw-pad / agenda…) — add an **installed-font
    dropdown** so schools use fonts they've licensed (UK cursive/handwriting
    schemes, dyslexia fonts). Enumerate with `queryLocalFonts()` on
    Chromium/WebView2 (Windows desktop) and the Tauri Rust backend on macOS;
    graceful font-name entry + availability detection elsewhere, with a "font not
    installed — install it" prompt. Bundle **OpenDyslexic** (free/OFL) as a
    built-in dyslexia toggle. **Never bundle paid school fonts** — reference them
    from the machine's install. The complete dropdown needs Rust enumeration, so
    it rides the Tauri phases (see mapping).
- [ ] 🟠 **`sanitizeTemplate` never rejects dangerous URL schemes.**
  [`app.js:9964`](../app.js#L9964) — the `/^(https?:|data:)/i` test only *collects*
  for display; nothing is stripped, and `javascript:` isn't even collected (so
  it's hidden from vetting). This is the enabler that lets `data:`/`javascript:`
  reach embed/video/link/document `props.url` on the template path, bypassing the
  settings-UI `https://` guard.
- [ ] 🟠 **Document widget renders remote URLs in an *unsandboxed* iframe.** ✓ verified.
  [`app.js:6898`](../app.js#L6898) `el('iframe',{src:record.url})` — no `sandbox`.
  A template-supplied `data:text/html,<script>…` falls to this branch and runs
  script (opaque origin: can't read `localStorage`, but can exfiltrate over the
  network and paint fullscreen to the class).
- [ ] 🟠 **Webcam auto-activates from a shared deck.** ✓ verified.
  First enable persists `w.props.auto=true`; every later mount runs
  `if (w.props.auto) start()` → `getUserMedia` with no gesture
  ([`app.js:6703`](../app.js#L6703)). `sanitizeTemplate` copies `auto` verbatim,
  so opening a shared screen turns on the **recipient's** camera the moment it
  renders (silent if permission was ever granted).
  **Fix:** strip `auto` on import; require a gesture to start the camera.
- [ ] 🟠 **Embed iframe uses the `allow-scripts allow-same-origin` sandbox-escape combo** on an arbitrary URL ([`app.js:6378`](../app.js#L6378)) — standard for YouTube, a footgun for stranger-supplied template URLs (see scheme item above).
- [ ] 🟠 **Template vetting is bypassable and incomplete.**
  `firstTime` is keyed by attacker-controlled `tpl.id` and content is never
  hashed ([`app.js:10057`](../app.js#L10057)), so a source can ship a benign
  template under an id, get it trusted, then serve a malicious payload under the
  same id with no re-disclosure. The URL disclosure also scans only top-level
  `['url','src','text','value']` — never `props.html`, nested `items[]`/`options[]`,
  or `javascript:` URLs.
- [x] 🟡 **`.pptx` slide hyperlinks aren't scheme-validated** — `javascript:`/`data:`
  href from an External relationship survives into a text widget rendered via
  `innerHTML` ([`pptx-import.js:314`](../pptx-import.js#L314)). (Slide *text* is
  escaped, so only the href scheme is at risk.) **Fixed 2026-07-30** —
  `parasToHtml` runs the link through `SageSanitize.url`; a rejected scheme
  keeps the words and drops the anchor.
- [x] 🟡 **Text-widget "Link" button and Link widget accept `javascript:` URLs** — [`app.js:5865`](../app.js#L5865), [`app.js:6932`](../app.js#L6932); no scheme check before `createLink` / `window.open`. **Fixed 2026-07-30** — both go through `SageSanitize.url`. The sanitizer covers the stored render, but `createLink` makes a live tappable anchor and `window.open('javascript:…')` inherits this origin, so the entry points needed their own guard.
- [ ] ⚪ **Background `url()` value isn't escaped** ([`app.js:9056`](../app.js#L9056)). ✓ verified — narrower than it looks: `element.style.background =` can't escape into new CSS rules, so the real risk is a hotlinked tracking image via a template's image background, not script injection.
- [ ] ⚪ **No CSP meta in `index.html`.** A `default-src 'self'` policy (with the font/photo hosts allow-listed) would harden every item above. Coordinate with the Phase 2 Tauri CSP so the two don't diverge.

## P1 — Data integrity & loss

- [x] 🔴 **"Erase all local data" is silently undone by any second tab.** ✓ verified ·
  **fixed 2026-07-30.**
  The storage handler bails on `!e.newValue`
  ([`app.js:11871`](../app.js#L11871)), and erase fires `removeItem` (newValue =
  null). A forgotten `#s=` projector tab (a documented workflow) keeps its
  in-memory state and rewrites the whole store on its next `save()` — so "erase
  ALL … on this device" resurrects class lists. Privacy + integrity failure.
  **Fix:** treat a `null` newValue on `LS_KEY` as an erase signal — quiesce and
  clear in-memory state instead of ignoring it. (The Tauri plan handles this for
  desktop windows in Phase 4 but not for the browser backend.)
  Shipped as one shared `dropLocalState()` used by both the erasing tab and every
  tab that hears the event; it also **cancels the pending debounced save**, which
  could otherwise land after the erase. The hearing tab says so in a toast — a
  display tab that empties itself mid-lesson without explanation reads as data
  loss. Two-tab browser test: register in both tabs' memory → erase in one →
  the other clears, and the save it makes next writes only the fresh default
  state, with no register and no widget html.
- [x] 🔴 **"Erase all local data" left every deck and register in IndexedDB.**
  Found while fixing the item above, and not in the original review — snapshots
  post-date it. The button emptied `localStorage` only, so the daily snapshot
  trail and the modelled-writing undo histories kept the same decks and the same
  children's names. **Fixed 2026-07-30** — `clearStoredHistory()` clears both
  stores (`SageSnapshots.clearAll` + a new `clearAux`, kept separate so a future
  "delete my snapshots" cannot throw away undo). If the IndexedDB clear fails
  the teacher is told, rather than the toast claiming everything went.
- [x] 🟠 **No unload flush; "Backup restored" can be a lie.** ✓ verified · **fixed 2026-08-02** — `pagehide` + `visibilitychange:hidden` both call `SageStorage.flush()` at the foot of `storage.js`. The flush already existed and was wired to nothing in the browser build, which is the build the 13 Aug testers run.
  `save()` is a bare 250 ms debounce with no `pagehide`/`visibilitychange`
  listener ([`app.js:200`](../app.js#L200)). Close within the window and the last
  change is lost; import even toasts success *before* persisting
  ([`app.js:10649`](../app.js#L10649)).
  **Fix (cheap, pre-migration):** a `pagehide`/`visibilitychange:hidden` handler
  that flushes synchronously — ~2 lines, and it de-risks the whole Phase 1 refactor.
- [x] 🟠 **Cross-tab adopt clobbers concurrent edits and tears down the UI on every tap.**
  [`app.js:11876`](../app.js#L11876) `state = incoming; renderScreen()` discards
  any change still inside the local 250 ms debounce (the pending timer isn't even
  cancelled). Because every widget `pointerdown` bumps `z` and calls `save()`, a
  tap on the touch-board tab forces a full remount in the teacher's tab — losing
  caret, focus, and in-flight typing.
  **Fixed 2026-08-02**, both halves. The adopt now declines while this tab holds
  an unwritten edit (`SageStorage.hasPending()`), so the teacher's in-flight
  typing wins and lands rather than being replaced mid-keystroke — last-writer-
  wins is what localStorage gives us anyway, and the tab being typed into is the
  better last writer. And it only calls `renderScreen()` when the *visible*
  screen actually changed, compared against the last adopted payload rather than
  against the live state (the live state carries runtime mutations that were
  never written — `fitToWindow` adjusts geometry at mount, widgets normalise
  their own props — so comparing to it never matches and rebuilt every time; the
  first attempt at this fix did exactly that and was caught in the two-tab test).
  Still open: focus is not preserved across a rebuild that genuinely is needed.
- [x] 🟠 **Corrupt / unrecognized stored JSON is discarded, then overwritten.**
  `load()` returns null on any parse/normalize failure and the next `save()`
  clobbers the only copy. A one-line backup to `sage-stage-v1-corrupt` before
  overwriting makes it recoverable. (Phase 3 adds this for the file backend; the
  browser backend still needs it.)
  **Fixed 2026-08-02** — `SageStorage.quarantine(raw)`, a backend method so
  `app.js` never asks which backend it got; the file backend no-ops because its
  timestamped backups already mean the main file is never the only copy. One
  correction to the original finding: `normalize()` returns `null` on several
  paths *without* throwing (empty deck list being the easy one), so a
  try/catch-only guard would have missed the commoner case — both paths are
  handled. The teacher is told via the existing `persisted.notice` channel.
- [x] 🟠 **Absolute-pixel widget geometry strands widgets off-screen on a smaller display.**
  Widgets store/apply raw px and only *live* drag/resize clamps to the window;
  nothing re-clamps on mount or window resize
  ([`app.js:8907`](../app.js#L8907)). Build at 1920, open on a 1366 projector →
  a widget renders fully off-screen with no way to grab it. (The "positions are
  fractions, scales laptop→projector" promise applies to *template instantiation*
  only, not the live shell.)
  **Fixed 2026-08-02** — `fitToWindow(w)` at mount plus a debounced `resize`
  handler, both applying the *same* rule the drag already enforced (≥60px stays
  grabbable), so only geometry that was already unreachable ever moves and a
  layout opened on the display it was built for never shuffles. Widget elements
  carry `data-wid` so the resize path can find the model without a full remount.
  Left open by design: mount fits in memory without forcing a save, so viewing a
  deck on a small laptop doesn't overwrite its big-board geometry, but any
  interaction persists the clamp. A proportional re-fit (as `demo.js` does for
  the taster) or per-display geometry is a design decision, not a bug fix.
- [ ] 🟡 **`normalize()` only shallow-validates** — `{decks:[{screens:[null]}]}`
  passes, is persisted by the already-queued `save()`, then crashes every boot
  ([`app.js:143`](../app.js#L143)). Validate screen/widget shape; floor `d.current`.
- [x] 🟡 **`uid()` is weak and can emit < 8 chars** —
  `Math.random().toString(36).slice(2,10)`. Screen ids are global routing keys
  (`#s=`) and `removeWidget` deletes the id from **every** deck, so a collision
  removes an unrelated widget.
  **Fixed 2026-08-02** — nine CSPRNG bytes, fixed at 18 chars.
  `crypto.getRandomValues` rather than the suggested `crypto.randomUUID`, which
  requires a secure context this app doesn't always have (`file://`, custom
  schemes). Existing ids are untouched and nothing parses id length.
- [x] 🟡 **`save()` runs on every widget `pointerdown`** (z-bump), doing a full
  `JSON.stringify` of possibly-megabytes of base64 imagery on the main thread per
  tap ([`app.js:8956`](../app.js#L8956)) — and thrashing other tabs via the adopt
  path. Only bump/persist `z` when it actually changes; debounce the write.
  **Fixed 2026-08-02** — the pointerdown handler returns early when the widget is
  already topmost, which is the commonest tap in the app. That also shrinks the
  adopt problem above, since each skipped write is one the other tab never has to
  react to.
- [ ] 🟡 **localStorage ~5 MB budget has no accounting or eviction.** Money/image
  data-URLs, annotation ink (stored uncapped and at *full float precision* after
  any move/resize), pad strokes and pad-templates all share one key with only the
  quota-exceeded toast as a backstop. Round persisted stroke coords; add a size
  readout / eviction path.
- [ ] ⚪ **Annotation eraser grows storage instead of shrinking it** — eraser strokes
  are stored and composited `destination-out`; the underlying pen strokes are
  never removed ([`app.js:11356`](../app.js#L11356)), so draw-then-erase only ever
  adds data.

## P2 — Maths correctness (wrong answers shown to children)

Highest pedagogical priority: these render **incorrect maths on a classroom
screen**, which is worse than a crash.

- [x] 🔴 **Number-line fraction labels are wrong when minor ticks subdivide a fraction line.** ✓ verified ·
  **fixed 2026-07-30.**
  `nlTxt` rounds a fractional remainder to a whole numerator
  ([`app.js:4354`](../app.js#L4354)): on a Halves line with Halves minor-ticks, a
  true ¼ jump auto-labels **"+1/2"** and a ¾ jump labels **"2/2"**; Thirds shows a
  ⅙ jump as "+1/3". "Facts" sentences inherit it. (The decimal branch is correct —
  only fractions are wrong.)
  **Fix:** a label's denominator is not `den`, it is the smallest unit the line
  actually shows — `nlUnit()` = `den · minor / gcd(major, den · minor)`, so a
  Halves line ticked into halves is a line of quarters. `nlParts()` now feeds
  both `nlTxt` and `nlHTML`, so tick labels, jump arcs and Facts agree. Verified
  in the browser: the ¼ jump reads **+¼**, the ¾ jump **+¾**, Facts
  "0 + 1/4 + 3/4 = 1". Not reduced, deliberately — a plain Quarters line has
  always labelled 6 as "1 2/4", and the denominator is the line's unit.
- [x] 🟠 **`pvFmt` garbles negative values → "−3.−5".** ✓ verified ·
  **fixed 2026-07-30** (same render path as the item above).
  `t % 1000` keeps the sign, so the trailing-zero strip leaves a truthy "-5"
  fraction part ([`app.js:3388`](../app.js#L3388); `pvFmt(-2500) === "-3.-5"`).
  Reached on the −10–10 number line with half minor-ticks → Facts like
  "−3.−5 + 1 = …". **Fix:** take the remainder from `Math.abs`, put the sign back
  on the front. Browser-verified: Facts now reads "−3.5 + 1 = −2.5".
- [x] 🟠 **Base 10 "10 ⇄ 1" exchange is dead for thousands and above.** ✓ verified ·
  **ALREADY FIXED — this finding is stale.** The `d >= 3` early return is gone; the
  guard is now `d >= 6` (an index bound, nothing above millions) with the column
  checks doing the real gating, and `app.js` carries a comment saying exactly
  that. Confirmed by reading the source 2026-08-02; nothing changed.
  The chip is offered whenever a column has ≥10 and a place exists above
  (`c.d < 6`, [`app.js:3081`](../app.js#L3081)), but `exchange()` returns
  immediately when `d >= 3` ([`app.js:2899`](../app.js#L2899)). On the TTh and
  Millions charts the chip **glows and does nothing** while the Facts line still
  says "12 thousands = 1 ten thousand and 2 thousands". (The ones→tens exchange I
  tested by hand works fine — this is specifically the ≥ thousands case; the PV
  counters twin has no such block.)
- [x] 🟠 **20-frame → ten-frame switch leaves phantom cells that corrupt the number sentence** — counters in cells 10–19 render loose but are still pooled as in-frame, so a frame visibly holding 4 reads "4 + 4 = 8" ([`app.js:2645`](../app.js#L2645)).
- [x] 🟠 **Exchange animation timeout mutates state with no re-validation** (Dienes
  [`app.js:2923`](../app.js#L2923), PV `:3528`). Tapping Clear / Random / switch-mat
  during the 360 ms flight leaves a phantom next-place block — worst case an
  invisible-but-counted block after a mid-flight chart switch.
- [x] 🟠 **Frame-tiles "make it *without* a ten" accepts builds that use a ten** —
  `checkBuild` has no forbid-denomination constraint, so 15 = 10 + 5 is marked
  "✓ Correct!" ([`app.js:1832`](../app.js#L1832)).
- [x] 🟡 **Class shop "ring up" clears the customer's own money, not just the payment** ([`app.js:1666`](../app.js#L1666)) — filter to the counter side.
- [x] 🟡 **Teaching clock: "one minutes to twelve"** — singular guard is missing in the to-branch (English and German) ([`app.js:393`](../app.js#L393)).
- [x] 🟡 **Number line: dragging a landing dot onto an occupied tick stacks duplicates** — one-per-number is enforced only at creation ([`app.js:4498`](../app.js#L4498)).
- [x] 🟡 **Frame-tiles resize de-snaps completed frames** — snap fractions are recomputed against new geometry, so tiles drift off-grid and lose their "done" state ([`app.js:2013`](../app.js#L2013)).
- [x] 🟡 **A saved completed ten-frame re-beeps on every mount / screen switch** — `framesDone` is per-mount but completion is persisted ([`app.js:2007`](../app.js#L2007)).
- [x] 🟡 **Switching currency leaves a live challenge in the old currency** — `w.props.game` isn't reset ([`app.js:1567`](../app.js#L1567)).
- [x] ⚪ **Impossible-exchange "hot" glow** — a place at its cap (e.g. 10+ millions, or ten-thousands on the TTh chart) glows as if exchangeable with no chip possible ([`app.js:3714`](../app.js#L3714)).
- [x] ⚪ **Mixed minus glyphs on negative lines** — integer labels use the locale hyphen, fraction/decimal labels use "−" ([`app.js:4351`](../app.js#L4351)).
- [x] ⚪ **Word builder `cleanWord` strips accents ("CAFÉ"→"CAF"); an all-punctuation line auto-wins** ([`app.js:7122`](../app.js#L7122)).

## P3 — Touch & multi-touch (the target platform)

Touch boards with several children at once are a stated audience; several drag
paths assume one pointer.

- [ ] 🟠 **Money-mat pinch-zoom hijacks simultaneous coin drags** — two fingers each
  dragging a coin also register as a pinch → `relayout()` detaches the in-flight
  nodes mid-drag ([`app.js:1300`](../app.js#L1300)). This breaks the advertised
  "several fingers drag several pieces" feature.
- [ ] 🟠 **Teaching-clock hand drag has no `pointerId` discrimination** — a second
  touch corrupts `drag.lastA`, spinning the hands and flipping AM/PM
  ([`app.js:911`](../app.js#L911)).
- [ ] 🟠 **Draw pad is single-pointer; a second touch corrupts the stroke** — one
  `live` slot, both pointers append to it ([`app.js:8370`](../app.js#L8370)). A
  regression versus the full-screen annotate layer, which supports four
  simultaneous strokes.
- [ ] 🟠 **Piece drags and widget drag/resize never handle `pointercancel`** —
  [`app.js:1249`](../app.js#L1249), `:2082`, `:8976`. On a palm-reject or
  edge-swipe the window listeners stay installed and a reused touch id resumes a
  ghost drag (can bin the piece on release). The teaching clock *does* handle
  cancel — copy that.
- [ ] 🟠 **Widget drag surfaces lack `touch-action` and `setPointerCapture`** —
  `.widget-header` / `.resize-handle` ([`style.css:198`](../style.css#L198)) have
  no `touch-action`, so the browser can claim header/resize gestures for
  pinch-zoom or pull-to-refresh mid-drag → `pointercancel` → stuck widget.
- [ ] 🟡 **A single shared `dragging` boolean breaks under multi-touch** — the first
  `pointerup` clears it, letting a ResizeObserver repaint and detach a still-active
  drag (counters [`app.js:2674`](../app.js#L2674); same in Dienes/PV/rekenrek).
- [ ] 🟠 **Memory-pairs can get two cards permanently stuck open** — the "two open"
  state is persisted and relies on an in-memory timer to reset; a settings change
  or reload mid-mismatch leaves `open.length === 2` forever, after which no match
  is ever detected ([`app.js:7215`](../app.js#L7215)).

## P4 — Accessibility

- [x] 🟠 **The "More" panel widget cells are keyboard-dead** — `div role="button"
  tabindex="0"` but `el()` wires only `click`, so Enter/Space do nothing
  ([`app.js:10397`](../app.js#L10397)). This is the only route to most of the ~40
  widgets. Add an Enter/Space handler in `el()` (fixes the game cells too).
- [x] 🟠 **Modals have no dialog semantics** — no `role="dialog"`/`aria-modal`, focus
  isn't moved in or trapped, Escape doesn't close ([`app.js:10504`](../app.js#L10504)).
- [x] 🟠 **No `prefers-reduced-motion` anywhere** — infinite `pulse`/`dn-glow`/`game-pop`
  plus JS spinners run regardless (`style.css`, 0 matches).
- [x] 🟠 **Invisible focus indicators on the dashboard/deck text controls** —
  `.dash-search:focus` ring is ~1.1:1; `.deck-title`/`.name-add` set
  `outline:none` ([`style.css:2160`](../style.css#L2160)). These are the fields
  teachers tab through to rename decks and lists.
- [x] 🟠 **Toasts are screen-reader-silent** — `#toast` has no `role="status"`/
  `aria-live`, so "⚠️ Could not save — storage is full" is never announced
  ([`index.html:42`](../index.html#L42)). Only 4 `aria-` attributes exist in all
  of `app.js`; the shell has no landmarks.
- [ ] 🟠 **Child-facing hit targets far below 44px** — `.wbtn` 24×24, resize handle
  20×20 at 40% opacity, poll vote ≈28px, name-chip-× 18×18
  ([`style.css:224`](../style.css#L224)). Close and resize are core child actions.
  **Fixed 2026-08-02.** The resize grip is 44×44 at 0.65 opacity (its glyph is
  unchanged; only the hit area grew, outwards into the widget's own corner where
  nothing can collide). `.wbtn` was held back the same day for a design call,
  because expanding three adjacent 24px buttons into 44px hit areas would have
  overlapped their targets and put Close under a finger aiming at Settings —
  trading an accessibility miss for a destructive mis-hit. Glenn's answer was
  that they were too small anyway, so they became **real** 44px buttons: the
  header is flex with no fixed height and simply grew 34→54px, resting opacity
  went 0.55→0.75 (small *and* faint was the complaint), the glyph went
  13.5→24px, and the header's 6px gap is cancelled between buttons so the three
  sit edge to edge — 44px pitch, 20px between glyphs, adjacent but never
  overlapping. On the narrowest widget (150px traffic light) the title collapses
  first and the buttons shrink together to ~35px rather than overflowing; full
  size from 280px up, which is every other widget.
  Still open, same question, not yet asked: poll vote (≈28px) and name-chip-×
  (18×18).
- [x] 🟡 **Hover-only affordances invisible on touch** — agenda delete, deck kebab,
  clear-theme widget headers are `opacity:0` until `:hover` ([`style.css:738`](../style.css#L738)).
- [x] 🟡 **`color-mix()` used with no fallback in 5 places** — pre-2023 Chromium (common
  on locked-down school machines) drops the declaration, making connect-four slots
  and symbol-picker buttons vanish ([`style.css:1092`](../style.css#L1092)).
- [x] 🟡 **Emoji-only topbar buttons named by `title` only; ⛶ (U+26F6) has spotty Windows coverage; no landmarks** ([`index.html:23`](../index.html#L23)).
- [x] ⚪ **`.deck-menu` (z 6500) paints above `#toast` (z 6000)** so an open kebab can cover a toast ([`style.css:1917`](../style.css#L1917)).

## P5 — Rendering & performance (weak school GPUs)

- [ ] 🟠 **`backdrop-filter: blur(12px)` on 14 surfaces + 30px shadows, with drags
  updating `left/top` per frame and no `will-change`/transform path**
  ([`style.css:176`](../style.css#L176)). Dragging a widget over an image
  wallpaper forces continuous re-blurring — the primary jank source on target
  hardware.
- [ ] 🟡 **Teaching-clock canvas backing store is reallocated every `paintAll`** (i.e.
  every drag `pointermove`) ([`app.js:772`](../app.js#L772)).
- [ ] 🟡 **Money-tray / frame-tiles rebuild the entire tray + all pieces on every
  ResizeObserver tick** ([`app.js:1545`](../app.js#L1545), `:2294`) — worst on the
  larger mats.
- [ ] 🟡 **Dashboard wallpaper uses `background-attachment: fixed` on a scrolling
  container** ([`app.js:9697`](../app.js#L9697)) — disables composited scrolling.
- [ ] 🟡 **`beep()` constructs a fresh `AudioContext` per call and never pools it**
  ([`app.js:46`](../app.js#L46)). Browsers cap concurrent contexts (~6), so timer
  and game chimes can silently die over a full teaching day. Use one shared context.

## P6 — Robustness & housekeeping

- [ ] 🟠 **Export retains every screen's full-res canvas simultaneously** — `shots[]`
  holds all canvases before any writer runs ([`export.js:616`](../export.js#L616));
  at 2× a ~30-screen deck retains ~1 GB → OOM risk on teacher hardware. Release
  per-screen or cap concurrent canvases.
- [ ] 🟡 **`.pptx` import has no slide-count cap** ([`pptx-import.js:523`](../pptx-import.js#L523)) — unlike `sanitizeTemplate`'s 12/24 slices; a hostile deck produces unbounded screens.
- [ ] 🟡 **`pickImage` has no `onerror`, caps only width, and ignores EXIF orientation** ([`app.js:8593`](../app.js#L8593)) — a HEIC/broken file silently does nothing; a tall image can still overflow quota; portrait phone photos render sideways.
- [ ] 🟡 **Repeating timer bursts a volley of chimes after tab-suspend** — it advances one cycle per paint tick and beeps each ([`app.js:5543`](../app.js#L5543)).
- [ ] 🟡 **Clipboard PNG copy is dead on WebKit (the Tauri v2 target)** — `clipboard.write` inside the async `toBlob` callback loses user activation ([`app.js:8104`](../app.js#L8104)). Pass a promise-of-blob to `ClipboardItem` synchronously.
- [ ] 🟡 **Draw-pad PNG export omits the paper background** — grid/number-line/fraction-bar papers are CSS on `wrap` and never drawn, so marks export floating on white ([`app.js:8063`](../app.js#L8063)).
- [ ] 🟡 **Each draw-pad remount leaks the previous canvas + undo history** — a `body` capture listener is added every mount and never removed ([`app.js:8520`](../app.js#L8520)).
- [ ] 🟡 **No `hashchange` handling** — Back in a pinned `#s=` tab desyncs the URL from the view until reload ([`app.js:215`](../app.js#L215)).
- [ ] ⚪ **Widget delete via Backspace has no confirm/undo** (screens do) ([`app.js:8892`](../app.js#L8892)).
- [ ] ⚪ **`deleteList` leaves dangling `w.props.list` references** (unlike `renameList`) ([`app.js:9443`](../app.js#L9443)).
- [ ] ⚪ **qr.js error card says "max ~134 chars" but the limit is 134 *bytes*** (multibyte URLs fail sooner) ([`qr.js:325`](../qr.js#L325)).
- [ ] ⚪ **`sanitizeFilename` doesn't guard Windows reserved names (CON, PRN…)** ([`export.js:68`](../export.js#L68)).
- [ ] ⚪ **`this._rerender = render` is a dead store that aliases the shared registry object** and pins a closed widget's DOM in memory ([`app.js:357`](../app.js#L357)).
- [ ] ⚪ **No `@media print`** — printing an agenda emits the fixed toolbar soup ([`style.css`](../style.css)).
- [ ] ⚪ **Dashboard search isn't diacritic-folded** ("José" ≠ "jose") ([`app.js:9581`](../app.js#L9581)); list add/remove does a full re-render that drops input focus ([`app.js:9639`](../app.js#L9639)).

---

## How this sits alongside the phased storage/Tauri plan

The migration (`storage-abstraction-plan.md` §9) and this review are independent
queues, but they touch in a few load-bearing places. Recommended interleave:

| When | Do these review items | Why here |
|---|---|---|
| **Before Phase 1** | P1 no-unload flush; P1 corrupt-JSON salvage backup | Phase 1 is "a pure refactor of the write path" — fixing the flush and adding the salvage copy *while you're already in `save()`/`load()`* is nearly free and de-risks the whole seam. The plan explicitly *preserves* the 250 ms-close data loss; this is the moment to reconsider that for ~2 lines. |
| **Before Phase 2** | **All of P0** (XSS sanitizer, self-hosted chrome fonts + bundled OpenDyslexic, URL schemes, CSP) | Phase 2 loads the app under a Tauri origin with a real CSP and keeps fetching remote `templateSources`. Land the sanitizer + self-hosted fonts first so the Phase 2 CSP can be strict (`script-src 'self'`, no CDN) instead of being loosened to accommodate today's gaps. The plan's §7 CSP notes assume Google Fonts stays — this removes that constraint. |
| **Rides Phase 2–3 (new feature)** | Installed-font **dropdown** for content fonts — `queryLocalFonts()` + Tauri Rust font enumeration; bundle OpenDyslexic | The privacy fix (self-hosting chrome fonts) ships now. The _pick-your-school's-font_ dropdown needs font enumeration: `queryLocalFonts()` works in a Chromium browser / WebView2 (Windows) as soon as there's a settings UI, but reliable macOS coverage needs the Tauri Rust backend, so the complete version lands with the desktop build. Lets schools use licensed cursive/dyslexia fonts without the app ever redistributing them. |
| **Alongside Phase 3** | P1 erase-resurrection; P1 widget-geometry off-screen clamp | Phase 3 already reworks erase (`sage:erased` quiesce) and boot recovery — fix the **browser** multi-tab erase in the same pass so both backends behave. The off-screen-widget clamp matters more once desktop windows can be resized freely. |
| **Alongside Phase 4** | P3 `pointercancel` + `touch-action` + multi-touch drags | Phase 4 is multi-window; the cross-window `sage:written` re-read and the touch-drag robustness are the same "interrupted interaction" problem class. |
| **Independent of the migration** | **All of P2 (maths), P4 (a11y), P5 (perf)**, remaining P6 | None of these depend on the storage backend. P2 especially should not wait — wrong maths on screen is a shipping blocker regardless of where data lives. |

### Verified-solid — don't "fix" these

Confirmed correct during review; changing them risks regressions:

- All currency arithmetic is integer minor-units end to end — no floating-point exposure in change-giving, totals, or targets.
- PV counters keep everything in integer thousandths; `×10`/`÷10` slides are exact and edge-guarded.
- The QR encoder matches the byte-mode ECC-L spec (capacities 17/32/53/78/106/134, BCH format bits, penalty rules, quiet zone) and fails gracefully over-capacity.
- All 42 built-in templates validate clean (ids, types, themes, in-range fractions, `https://` URLs only).
- JSON backup is complete (decks, screens, widgets, ink, pad strokes, name lists, pins, custom colours, money images, template sources).
- Export is read-only and crash-isolated (deep-cloned widgets, no-op stub API, per-screen/per-widget fallback).
- `.pptx` import fails atomically (magic-byte checks, per-slide try/catch, single commit at the end).
- Widget lifecycle cleanup is honoured everywhere the shell unmounts (intervals, ResizeObservers, media tracks); mic and camera genuinely release on close and screen switch.
- Connect-four and tic-tac-toe win/draw detection are correct; shuffles are unbiased Fisher-Yates.
- The z-index architecture is a coherent documented scale (ink < shades < spotlight < chrome < panels < modal < toast); per-widget z can't overlay app chrome.
- Deck duplicate/import deep-clone with fresh ids at every level — no aliasing or id collisions across decks.
- The v1→v2 (pre-decks) migration imports cleanly as a single deck.
