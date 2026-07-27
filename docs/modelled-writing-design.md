# Modelled Writing — build spec (English slice 5, v1 "the writing page")

**Status:** v1 approved and shipped 2026-07-26. **v2 — the paper slice — built
2026-07-26** (design dialogue with Glenn; ruling geometry, image model, picker
shape and line-height labelling pinned by him). Sections 3–6 and 8 describe v2
as built; §2 records what is still deferred.
Implements the v1 slice of [english-widgets-design.md](english-widgets-design.md)
§8.1 — read that for the full modelled-writing vision (marking palette, lenses,
Big Write). This doc pins only the v1 implementation decisions.
**Companion documents:** [English & literacy widgets](english-widgets-design.md) ·
[Poster print](poster-print-design.md) · [Iteration log](iteration-log.md)
**Date:** 2026-07-26

## 1. What this is, in Glenn's terms

The flip-chart easel replaced. The teacher writes *with the class*, by hand,
modelling how a genre is written over a series of lessons and weeks. The print
option removes the analogue loop — write on paper, tear it off, pin it up —
because Sage Stage already holds the page: it's **saved**, it's **reprintable
wall-sized** (tiled sheets via SagePrint), and it prints **A4 for children to
see 1:1**. Handwriting needs its own writing space in the app, with printing
as its purpose — this widget.

The draw pad is deliberately not this: no ruling, raster export, sketch idiom.

## 2. Scope

**Landed (v1):** the `modelwrite` widget — one widget holds a writing *unit*:
a stack of A4-proportioned handwritten pages built up across lessons, with a
washing-line thumbnail strip (Glenn's pick over one-page-per-widget), a pen
bar, teacher-set ruling, and `toPrintable()` (the third print adopter; the
first with zero contract deviations — ink has no fonts).

**Landed (v2, the paper slice):** paper moves off the widget and onto each
**page** — five rulings including two alternating papers, a five-step line-height
ladder, a vertical rule and a picture band as two independent divider
positions, and imported pictures placed freely under the ink. Plus
`toPrintablePages()` so the teacher prints only the pages worth the paper, and
the widget moves to its own `modelwrite.js`.

**Landed (v3, the ink tools and the chrome):** three pen thicknesses stored
per stroke; a rubbing eraser that splits a stroke and a separate Lift that
takes one whole; a lasso that moves, copies and pastes writing across pages; a
toolbar that goes to any edge; a page strip that skims like a book; and
page-turn buttons on the page's own borders.

**Landed (v4, the armour and the nib, 2026-07-26):** rolling snapshots in
IndexedDB (daily, plus one taken the instant before Clear page, delete page,
delete screen or delete deck); undo that survives a reload; a measured storage
headroom warning; pages as a document (duplicate, reorder, lock, name) with the
cap raised to 40; **pressure- and speed-varying stroke width**, drawn as a
filled outline; zoom and pan; an adaptive icon toolbar; school colours; ruled
line and box helpers; picture rotate and crop; and in print — corner crop marks,
a contact sheet, a wide-lap option and direct PDF export.

**Landed (v5, the teaching payload, 2026-07-26):** §8.1's marking palette (two
school-set highlighter meanings, purple editing pen, VF stamp), focus lenses,
the gradual-release badge, Cold/Hot bookends with a compare-and-print, and Big
Write focus mode.

**Deferred:** from the §8.1 vision — typed text, and the double-page
inspiration spread.

## 3. Data model (v2)

```js
props: {
  pages: [{
    id,
    strokes: [ { c, pts: [x0,y0, x1,y1, …] } ],
    imgs:    [ { id, src, x, y, w, h } ],
    paper:   { ruling, size, vAt, hAt },
  }],
  cur: pageId,          // never an index — positional arrays are landmines
  newPaper: { … },      // what "+" gives a fresh page
}
```

- **Page space is fixed**: integer units, `0 0 1000 1414` (A4 portrait, 1000
  wide). 1 unit ≈ 0.21mm on an A4 print. All geometry, hit-testing and print
  output live in page units; the widget letterboxes the page and scales.
- **Paper is per page.** `ruling` is `plain | 4line | altdot | altsolid | none`;
  `size` indexes the ladder; `vAt` and `hAt` are **nullable divider positions**,
  not a split enum — the vertical rule's x and the picture band's y. Two
  nullable numbers give all four layouts with one lined-zone rect to compute,
  which is less code than a three-way enum and yields the picture + lined|plain
  combination for free.
- **Stroke:** `c` = palette index (0 black, 1 blue, 2 red, 3 green,
  4 highlighter), width implied by tool (pen 6 units, highlighter 30 at 0.4
  opacity), `pts` = flat integer pairs, thinned at capture (a point must move
  ≥ 4 units to be kept).
- **Picture:** `src` is a data URI today and becomes a file path in the Tauri
  era with no data-model change. Rect is clamped inside the page at load and
  on every move or resize.
- **Caps, refused politely (never silently):** 16 pages/unit, 600 strokes/page,
  6 pictures/page, ~180KB per picture and ~1.2MB of pictures per unit.
  Refusal toasts; nothing is dropped or truncated.
- **Mount hardening** (phonemetiles pattern): coerce arrays, drop malformed
  strokes and pictures, clamp ints, guarantee ≥1 page and a valid `cur`.
- **v1 migration:** a widget carrying the old top-level `ruling`/`lineSize`
  stamps that paper onto every page, seeds `newPaper` from it and drops the old
  keys. Verified: no saved page changes appearance.

## 4. The paper

**One geometry function, `mwZone(paper)`, returns the lined rect** — the page
inset by its margins, minus everything right of `vAt` and above `hAt` — and it
feeds the live render, the thumbnails, the picker swatches and `toPrintable()`
alike. The v1 rule that the lines a class watches being written on are the
lines that print now holds across splits too.

- **`plain`** — lines every `P` from the zone top inset.
- **`altdot` / `altsolid`** — lines every `P/2`, alternating: solid writing
  line, faint annotation line at 50% opacity, dotted or solid. Writing on the
  solid, next day's coloured verb/noun/adjective swap on the faint line
  directly above. **Line height always means the gap between *writing* lines**,
  so the annotation space is spent out of the page, not out of the letter size
  — "18mm lines" mean the same thing on every paper. Geometry chosen by Glenn
  over a shorter annotation band and over plain extra spacing: it matches the
  "miss a line" rule children already follow in their workbooks.
- **`4line`** — UK handwriting ruling, unchanged from v1.
- **`none`** — nothing.

**The ladder** is `[48, 64, 88, 120, 160]` page units — **10 · 13 · 18 · 25 ·
34 mm** as printed at A4 — with 4-line groups on a parallel
`[72, 96, 128, 176, 235]`. Steps 1–3 of both are v1's `s`/`m`/`l` to the unit,
so migrating shifts nothing; verified against v1's formulas rather than
assumed. Labelled by the printed millimetre: a neutral fact a teacher can
measure against their own exercise books, claiming no year group — Glenn's
call, because mixed-age and SEN classes make year labels a liability.

**Top inset** is 140 units on a full-height zone (v1's exact value), 60 below a
picture band, and 110/40 for 4-line.

**Dividers** are teacher-draggable, live, and only while the paper panel is
open — a divider you can only nudge deliberately cannot be nudged by a stroke
that starts near it mid-lesson. `vAt` clamps to 250–750, `hAt` to 200–1000.
They **print as hairlines**: quiet paper furniture on the wall, and on the A4
child's copy a blank picture-band page is a usable draw-here/write-there
worksheet. The dashed "put a picture here" box is screen-only and shows only
while the band is empty.

**Changing a page's paper never moves the ink.** The paper is under the ink;
switch back and everything is where it was. No ceremony, nothing destructive.

## 4.5 Pictures

Teachers add printouts to write on as visual and EAL support, and clipart to
mark learning modes on the plain side. Both are the same object.

- **Placed freely, not slotted.** The picture band reserves space and stops the
  ruling; it is not a container. Three-part story lineage is three pictures
  placed in the band, so two-part and four-part come free and nothing
  auto-arranges. Glenn's call over paper-carried cells.
- **Always under the ink** — teachers write *on* the printouts.
- **Selectable only while the Picture tool is active.** With a pen or the
  eraser in hand a picture is inert canvas, so nothing can be dragged out of
  place mid-lesson. Selection chrome and resize handles are drawn outside
  `mwPageInner`, so they can never reach paper.
- **Budgeted** like the word bank's: degraded in quality steps until the
  encoded string fits ~180KB, refused politely at the floor, ~1.2MB per unit,
  6 per page. Pictures share the app's one localStorage key, so this is a real
  constraint and not a formality. A page-wide printout prints well at A4 and
  softens on the wall, which SagePrint already warns about in amber — verified
  at the seam: a page with a picture lints amber, a page without lints
  completely clean.

## 5. The bar (live-lesson controls on the widget, house rule)

**Two tiers (v3.1, 2026-07-26).** Options used to be injected into the single
bar, which shoved every button to their right along and stranded the eraser's
sizes eight controls from the eraser. That breaks the spatial-stability rule
this whole app is built on, so tools and settings now live in separate rows:

**Tier 1 — the tools. Identical whatever is selected, so a reach for Clear
lands on Clear even after picking up the eraser.**

> Pen · Highlighter · Eraser · Lift · Lasso · Picture ⏐ Paper ⏐ Undo · Clear ⏐ Print…

**Tier 2 — what the live tool is set to.** Always present, always in the same
place; its contents change, its home never does.

| Tool | Tier 2 holds |
|---|---|
| Pen | four ink colours · three nib widths |
| Highlighter | four ink colours · three widths |
| Eraser | three rubber sizes |
| Lift | a line of guidance — it has no settings |
| Lasso | Copy · Delete · Paste as they apply |
| Picture | Add a picture · Remove |

This follows the **options-bar** convention (Photoshop, Illustrator, Affinity)
rather than an anchored flyout (Figma, Procreate): a popover would cost a tap
to open and a tap to dismiss every time, and would float over the page a class
is watching being written on. Tier 2 is one tap, always.

**Tool identity is separate from tool settings** in the data too: `tool` is
`pen | hl | erase | lift | lasso | pic`, with `ink`, `penW`, `hlW` and `eraseR`
held alongside. Picking up the eraser and putting it down returns the pen
exactly as it was. Stored strokes are unchanged (`{c, w, pts}`), so nothing
saved needed migrating.

**Colour cues on the pills (2026-07-26).** Ten identical grey pills means
finding a tool by reading, which is slow at two metres from an IWB. Each pill
now carries a pale tint of its family's hue and a matching border, with the
active one taking a solid outline in the same colour. Hue encodes **family, not
position**: amber takes marks away (Eraser, Lift), indigo moves them (Lasso),
cyan adds (Picture), green is the page (Paper), grey is history (Undo), red is
the only one that destroys (Clear). **Pen and Highlighter wear whichever ink
they are set to**, so the pill also answers "what am I holding" without being
read — changing ink repaints tier 1 for exactly this reason.

The tint carries the cue rather than a leading dot: nine dots would have cost
about 90px of row and pushed tier 1 back onto two rows, which is the very thing
the restructure fixed.

**Ink palette.** Indices 0–3 write (black, blue, red, green), 4–7 highlight
(yellow, pink, sky, orange). The highlighter colours were **appended, never
inserted**, so a stroke saved as `c:4` is the same yellow it always was —
verified against v1-format strokes, which still render at 6/opacity 1 for pen
and 30/0.4 for highlighter.

**Growing it:** a longer school palette or a new tool's settings go in tier 2,
not by lengthening tier 1. School colour schemes should be a palette the
teacher sets once, rendered into tier 2 — never an ever-growing row.

The default widget is 640 wide because that is where tier 1 fits on one row;
below it the row wraps and costs 25px of page. The proper fix at smaller sizes
is icons for the six tools with tier 2 naming the active one — deferred, since
choosing an icon a teacher reads correctly for "Lift" is a real design
decision, not a swap. Print is on the
bar, not only in the ⋯ menu, because printing is this widget's purpose
(phoneme-tiles precedent: surface the controls the lesson actually uses).
Active tool carries the selected ring; the highlighter's dot shows its
translucency.

**Paper opens a panel on the widget**, not a settings dialog: paper is now a
per-page, mid-lesson decision, and the ⋯ menu is a lesson-flow interruption.
Two orthogonal rows — five **Lines** swatches and four **Layout** swatches —
plus five **Line height** buttons and a *Use this paper for new pages too*
tick. **Every swatch is a real render of the candidate paper** through the same
`mwPageInner` the page and the printer use, so a swatch cannot misrepresent
what you will get. Swatch line *weight* is scaled up (spacing and layout stay
exactly true): at 56px a 2.2-unit rule lands at a tenth of a pixel and every
paper looks identically blank — found by looking at it, not by reasoning
about it.

The bar wraps at narrow widget widths. Making it repositionable to any edge is
Glenn's item 9 and belongs to the chrome slice.

## 5.5 The ink tools (v3)

**Three pen thicknesses**, stored per stroke as `w` (4 / 7 / 12 units). A
stroke saved before v3 has no `w` and falls back to v1's 6, so nothing already
written changes weight. The highlighter keeps its fixed 30. The nib control
sits with the ink dots, because colour and weight are one choice in the hand.

**Two erasers, because they are two different jobs** — Glenn's call over one
sized tool:

- **Eraser rubs.** It removes only the points it touches and the stroke
  survives as the runs either side of the hole. This is the whole point: in a
  joined `ie` the `e` must go and the `i` must stay, because losing the `i`
  can turn what remains into another word and cost most of a modelled
  sentence. Three rubber sizes (12 / 24 / 42 units). **One Undo puts the
  letter back whole** — the op carries the original stroke and how many runs
  replaced it, so undo is never a per-fragment crawl.
- **Lift** is v1's behaviour kept as its own button: tap a stroke, the whole
  thing goes. Still the fastest way to undo a whole modelled word.

**The lasso** moves writing around the page and across pages.

- Freehand loop; a stroke is selected only if **every** point falls inside it.
  Fully-inside rather than merely-touching, so lassoing a sentence cannot drag
  half the line below it along too.
- Drag inside the selection to move it. Copy puts it on a **module-level
  clipboard that survives page switches** — lifting an exemplar sentence off
  one page and pasting it onto another is the point of the feature, not a
  side effect. Paste lands at a +40 offset, clamped onto the page, and arrives
  selected so it can be dragged straight into place.
- Move, delete and paste are all one Undo each.

## 5.6 The chrome (v3)

- **The bar goes to any edge** — top, bottom, left or right — set in the ⋯
  panel because handedness and which side of the board you stand are per-teacher
  constants, not mid-lesson changes. Left and right turn the bar into a vertical
  column via a grid swap; the stage and washing line rearrange around it.
- **Page-turn buttons on the page's own borders**, `‹` and `›`, shown only when
  there is a page that way. **Draggable up and down** and remembered (`turnY`,
  a fraction of the page height) because they must never sit on the writing.
  A drag never also turns the page.
- **The washing line skims like a book.** Press anywhere on a thumbnail and a
  large preview follows your finger across the pages; release lands on the one
  under it. A plain tap is just the shortest possible scrub, so one gesture
  covers both. The strip auto-scrolls to keep the page being written on in
  view once the line runs past the widget's width — Glenn's 8–10 page mark.
  The preview floats over the widget rather than living inside the strip,
  where it would scroll away with the thumbnails and be wiped by every repaint.

## 6. The washing line (Glenn's pick: pages inside the widget)

A thumbnail strip along the bottom of the widget:

- Every page of the unit as a mini render (thumbnails rebuild on structural
  change — page add/remove/switch — not per stroke; the *active* page's thumb
  refreshes on stroke commit).
- Tap a thumbnail → switch `cur`. **Navigation only** — a strip tap never
  creates, deletes, or alters a page (the pill-tap rule).
- **+** appends a page (cap 16 → toast: "That's a full washing line — print
  or clear a page"). New page inherits the widget's ruling; `cur` moves to it.
- **✕ on the active thumbnail only**, `confirm()` first. Deleting the last
  remaining page just clears it — the widget never holds zero pages.

## 7. Printing (the point of it all)

- `toPrintable(w)` → the **current page** as a standalone SVG string:
  white background, ruling (unless `none`), strokes — `viewBox 0 0 1000 1414`.
  Pure geometry: **no text, no fonts, no ids, no rasters** — the first
  adopter with a completely clean §2 checklist.
- **A blank page prints on purpose.** An empty ruled page through the 1-sheet
  budget *is* handwriting paper; teachers print blank ruled sheets all the
  time. Never toast "nothing to print" here.
- The two ends Glenn named, one dialog: `8 sheets · about A1` = the wall
  format; `1 sheet · A4` = the child's 1:1 copy. Both already exist in
  SagePrint — this widget just feeds the seam.
- **`toPrintablePages(w)` (added 2026-07-26)** hands the whole washing line to
  SagePrint as `[{ svg, label }]`, and `printCurrent(w)` names the page being
  written on so it starts ticked. The teacher then ticks the pages worth the
  paper — most of a unit is working-out, and only some pages are a Big Write
  bound for the wall. See [poster-print-design.md](poster-print-design.md)
  §4.6. `toPrintable(w)` is unchanged and still returns the current page.

## 8. Wiring

| Change | Where |
|---|---|
| The whole widget — geometry, paper, pictures, def | **`modelwrite.js`** (new; `SageModelWrite.init(deps)`, the export.js/print.js boot pattern) |
| `SageModelWrite.init(engDeps)` beside `SageEnglishWord.init` | app.js English guard block |
| `TOOLS.push(widgetTool('modelwrite', …))` | app.js English guard block (unchanged) |
| `modelwrite` icon (lined page + pen) | icons.js (unchanged) |
| `mw-*` styles + the paper panel (`mw-pop`, `mw-sw`, `mw-size`) | style.css |
| One `<script src="modelwrite.js">` before app.js | index.html |

**Why its own file:** the paper slice roughly tripled the widget, and
`english-word.js` was already 254KB. It now holds four widgets in 237KB and
modelled writing has 38KB of its own. The module takes the same deps object
and is verified decoupled — re-initialising it against a throwaway registry in
the console mounts a working widget, which it could not do if it reached into
anything the app did not hand it.

## 9. Verification (browser, no test suite)

**v3 pass, all green 2026-07-26:** a 400-unit stroke rubbed at its midpoint
splits into 100–280 and 320–500 with widths preserved and a hole matching the
rubber; one Undo restores it whole; Lift removes a whole stroke and Undo brings
it back; the lasso selects, moves (dy 200, x untouched, undo restores), copies,
and pastes onto a *different* page at +40 with page 1 untouched; page-turn
buttons show only where a page exists and their drag persists (0.5 → 0.8);
scrub-peek shows "Page 1 of 2", follows the finger to "Page 2 of 2" and lands
there on release; all four bar positions place the bar correctly relative to
the stage, vertical on left and right. Zero console errors.

**v2 pass, all green 2026-07-26:** plain and 4-line ruling asserted line-for-line
against v1's own formulas recomputed inline (not trusted); alternating writing
pitch = the ladder value with faint lines exactly at the midpoints, dotted for
`altdot` and solid for `altsolid`; ruling stops at the vertical divider (x=482
for `vAt` 500) and starts below the picture band (y=540 for `hAt` 480); the
screen-only placeholder never appears in `toPrintable()`; v1 migration stamps
paper onto every page and drops the legacy keys with ink intact; two pages in
one unit hold genuinely different papers; an oversized off-page picture is
clamped inside the page, renders under the ink, and lints amber at the SagePrint
seam while a picture-free page lints completely clean. Zero console errors.



- Draw at widget sizes small and full-stage: smoothing visible, no lag from
  full repaints, letterbox centred, resize keeps ink exactly on its lines.
- Ruling: all three modes × three sizes; lines identical on screen and in the
  print preview (same geometry function — verify by overlay, not trust).
- Pages: add to the 16 cap (refusal toasts), switch during a live stroke
  (stroke commits safely), delete middle page, delete last page (clears, not
  removes), reload mid-unit (state intact, `cur` valid).
- Eraser + undo: erase a stroke, undo reinserts it *under* later ink (index
  preserved); undo depth exhausts gracefully.
- IWB reality: second pointer during a stroke is ignored; strokes commit on
  pointercancel.
- Print: 1-sheet A4 and 8-sheet A1 from the same page; blank ruled page
  prints; lint clean (no warnings — no fonts, no rasters).
- Storage: serialise a heavy page (300+ strokes), assert < 80KB and log the
  real number in the iteration log; zero console errors throughout.
