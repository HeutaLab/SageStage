# Phoneme Tiles — build spec (English slice 1)

**Status:** Implemented 2026-07-22 (same-day build; see iteration log). Approved
2026-07-22 (design dialogue with Glenn); implements
[english-widgets-design.md](english-widgets-design.md) §5.1 — read that first for
the pedagogy and pack rationale. This doc pins only the implementation decisions
for the first slice.
**Companion documents:** [English & literacy widgets](english-widgets-design.md) ·
[Iteration log](iteration-log.md)

## 1. Scope

**Lands:** the `phonemetiles` widget (tray, blank mat + VC/CVC/CCVC/CVCC/CCVCC
frames, sound buttons, sound-talk + sweep, target word strip, Flash/Cover,
tricky word cards, phase picker); `english-packs.js` with the Letters and Sounds
(2007) default phonics pack; deck **year group** setting; **English** toolbar
tab; `english` + `phonemetiles` icons.

**Deferred:** `toPrintable()` poster seam (lands later in P0 with letter
formation — decision 2026-07-22); pack import/editing (P1–P2 per §14); every
other English widget.

## 2. Rendering approach

DOM tiles + one SVG strip for sound support (**approach A**). Tiles and frame
boxes are absolutely-positioned DOM elements following the counters widget's
grammar (`app.js:2329`) — same drag/snap/bin shape. The sound buttons (dot /
bar / arc) and the blend sweep draw into a thin SVG strip under the frame — the
part–whole-lines precedent. No all-SVG mat, no slot-only grid.

## 3. Data — `english-packs.js`

`window.SAGE_ENGLISH_PACKS`, pure data like `templates.js`. One pack in the
`sage-pack@1` phonics envelope (§9 of the set design): Phases 2–5 in L&S 2007
teaching order, weekly sets preserved, tricky words per phase, split digraphs
as `a_e e_e i_e o_e u_e`. Phase 4 ships an empty `sets` array (adjacent
consonants — no new GPCs). Crown copyright content under OGL v3, attributed in
a `note` field.

The widget normalises the pack on read (caps from §9: phases ≤ 8, sets ≤ 60
GPCs, tricky ≤ 40, strings ≤ 12 chars for graphemes / 30 for tricky words,
grapheme charset `[a-z_]`, unknown keys dropped) and always renders pack text
via `textContent`. Same normaliser will take imported packs in P2.

## 4. Widget

Type `phonemetiles`, file `english-word.js` (`window.SageEnglishWord` IIFE,
`init(deps)` like `SageExport.init`). Title "Phoneme tiles", accent `#a5f3fc`,
default 640×520.

**Props:** `{ items: [], frame: 'cvc', phase: null, tricky: false, target: '',
covered: false, pace: 'steady' }`. Item: `{ id, g, k, x, y, cell }` — `g`
grapheme or tricky word text, `k` `'g'|'t'`, `x/y` mat fractions, `cell` frame
box index or null. `phase: null` = auto from deck year group.

**Layout (top → bottom):** mat (target chip · frame boxes · SVG sound strip ·
sweep bar · loose tiles · bin bottom-right) · tray row · quick bar. All
geometry flows from mat size via ResizeObserver; box size
`s = clamp(min(W·0.9/boxes, H·0.42), 34, 110)`, tile `d = s·0.86`.

**Interactions (counters grammar):**
- Pointerdown a tray tile → new item begins dragging immediately; a plain tap
  drops it loose below the frame. Drag to move; drop on bin or off the mat
  removes; drop near a free box snaps (`cell`), else loose.
- Sound buttons derive from tiles in cells: 1 letter → dot, 2–3 → bar, split
  (`_` in `g`) → arc. **Split tiles occupy cells `i` and `i+2`** ("a" and "e"
  halves render in their boxes, arc vaults `i+1`); both cells must be free to
  snap and `i+2 < boxes`; dragging either half moves the item; loose split
  tiles render as one tile with an inner arc.
- **Sound talk** (quick bar): one sustained beat per sound, in cell order — the
  active grapheme's tile enlarges (scale 1.16) with a thick dark-teal ring and
  its sound button grows (scale 1.65), while every other tile dims to ~0.32;
  the highlight holds for 72% of the beat, then a quiet gap. A split digraph
  lights both halves together (two letters, one sound). Then the blend: a
  follow-along ball rides the sweep bar and each grapheme relights as the ball
  passes its box (a split stays lit across its whole span). Timers cleaned up
  on unmount/repaint; re-tap restarts. Tuned 2026-07-22 for EYFS/EAL following
  along: the visual alone must say *which sound, when, for how long* — no
  reading required. **Deliberately silent** (set design principle 6 — the
  teacher voices the pure sounds); a once-per-session toast on first press says
  so, because "no sound" otherwise reads as a bug (field-tested 2026-07-22: it
  did).
- **Target word**: chip above the frame; tap chip (or settings field) →
  `prompt()` to edit. Covered with the mat.
- **Flash** = reveal 2 s then cover (counters timing); **Cover** = `?` blind
  toggle (reuses `ct-blind`).
- **Tricky ★** (tray right): swaps tray to the current phase's tricky word
  cards — wider, pink, starred; on the mat they float free (`cell` stays null),
  no sound buttons.
- Grow-a-word is just manipulation — no mode; mentioned in the settings hint.

**Quick bar:** frame segment (Blank/VC/CVC/CCVC/CVCC/CCVCC) · phase segment
(2/3/4/5; tapping sets the per-widget override) · Sound talk proficiency
segment (**New ≈2.2s / Practising ≈1.3s / Fluent ≈0.75s** per sound — one tap
sets the pace, remembers it, and runs; labels are generic proficiency words,
never a scheme's) · Flash · Cover · Word · Clear.

**Tray:** cumulative GPCs of all phases up to the resolved phase, in teaching
order, phase-divider chips between groups, wrapping rows. **Never clips or
scrolls** — every grapheme stays visible to choose from: tile size is computed
per paint (largest of 12–26px whose projected rows fit ~40% of the widget
height at the current width), so few tiles render large and Phase 5's ~70
render smaller, with the mat keeping the rest. Phase 4 adds only tricky words.

**Settings:** presets ("CVC — cat", "Split digraph — make" [4-box frame, m +
a_e + k, Phase 5], "Tricky flash" [tricky tray, covered]) · Phase
(Auto/2/3/4/5 — Auto returns to following the deck) · Frame · Target word ·
long hint line. (Pace moved to the quick bar's proficiency segment — the choice
belongs at the moment of running; stored keys stay slow/steady/brisk so older
widgets migrate untouched.)

## 5. Year group (deck)

`deck.yearGroup`: `'R' | '1'…'6' | null`, added to both deck factories.
Dashboard deck menu gains **"Set year group…"** after "Set class list…", same
modal pattern as class list. Phase auto-derivation at paint time: R → 2, Y1 →
4, Y2–Y6 → 5, unset → 2. Per-widget quick-bar phase override wins; settings
Auto restores deck-following.

## 6. Wiring

| Change | Where |
|---|---|
| `SageEnglishWord.init({ WIDGETS, el, iconEl, save, toast, uid, clamp, settingRow, checkRow, selectInput, deck: viewDeck })` | app.js boot block beside `SageExport.init` (app.js:11897) |
| `TOOLS.push(widgetTool('phonemetiles', 'Phoneme tiles', 'english'))` | same guard block (TOOLS is built earlier, so the push happens at init) |
| `catTab('english', 'english', '#bbf7d0', 'English')` between Maths and Games, only if `window.SageEnglishWord` | `renderToolbar` |
| `PANEL_TITLES.english = 'English'` | app.js:10385 |
| `english` (open book) + `phonemetiles` (three tiles, dot·bar·dot) glyphs | icons.js |
| `pt-*` styles; reuse `ct-bin`, `ct-blind`, `tclock-quick`, `tq-btn` | style.css |
| `<script src="english-packs.js?v=1">` + `<script src="english-word.js?v=1">` before app.js; bump app.js/icons.js versions | index.html |

Everything guards on `window.SageEnglishWord` so the app boots unchanged if the
files are absent.

## 7. Verification (browser, no test suite)

Add/drag/snap/bin loose and framed tiles · split digraph snapping (occupied
middle box, refusal at frame edge, loose rendering) · all frames + blank ·
phase switching + cumulative tray + Phase 4 empty sets · Say it at all three
paces (pulse order includes split arcs correctly) · Flash/Cover with and
without target word · tricky cards (float only, no sound buttons) · year-group
auto phase across two decks + per-widget override + Auto reset · widget resize
rescaling · hostile pack (HTML in strings, oversize arrays) renders inert ·
screenshots as proof, iteration-log entry when it lands.
