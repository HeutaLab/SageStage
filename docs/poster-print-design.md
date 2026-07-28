# Poster Print — build spec (SagePrint, the §4.5 output seam)

**Status:** Approved design 2026-07-25 (compressed brainstorm with Glenn under a
tight window; output route, paper and size-picker decisions pinned by Glenn).
**Amended 2026-07-26** — shipped, then corrected twice on Glenn's evidence.
First: a lapping sheet's own white margin hides 10mm of its neighbour's writing
at every seam. Then: the assembly guides were being drawn *inside* the
printable box, so they printed onto the finished wall and sat where the
scissors go. Cut marks, a second assembly model and the margin rule landed as
`print.js` v5. Then Glenn asked for one honest end-to-end test — print it and
save a PDF — and it turned out **every poster had been printing about two pages
whatever the sheet count**, because the app's kiosk `overflow:hidden` clips the
print flow (§9). Fixed in `style.css` v61 with `print.js` v6; §1, §4, §5, §7,
§9, §11 and §12 are amended accordingly. This doc is
the build contract for `print.js`. It implements the
output half of [english-widgets-design.md](english-widgets-design.md) §4.5; read
that first for why the wall is the output (§3.3). This doc pins only the
implementation decisions.
**Companion documents:** [English & literacy widgets](english-widgets-design.md) ·
[Iteration log](iteration-log.md)
**Date:** 2026-07-25

## 1. Scope

SagePrint turns one widget's `toPrintable()` SVG into a wall-sized poster on a
school laser printer: a print dialog, tiling maths, assembly guides, and a
`window.print()` route. Vector end to end — the same SVG prints a table card or
a two-metre frieze with no special cases.

In scope: `print.js` (the `SagePrint` module), the print dialog, the tiling
model, assembly guides, print CSS, a standalone dev harness
(`print-check.html`), and the conformance contract widget authors build to.

Out of scope: any widget change. Nothing in the app implements `toPrintable()`
yet (checked 2026-07-25), and SagePrint does not wait for that — the harness
fixture SVGs make it fully buildable and verifiable on its own. Adoption order
for real widgets is §10. The writing surface, letterforms and pack system are
untouched.

Three decisions were pinned with Glenn up front:

1. **Output route: the browser print dialog.** SagePrint builds a print-only
   region, one sheet per page, and calls `window.print()`. Zero dependencies,
   vector all the way to the printer driver, and the OS dialog gives Save-as-PDF
   for free. Works unchanged in the Tauri webview later.
2. **Paper: A4 default, A3 option.** A4 is the school-laser reality; the A3
   option halves sheet counts for schools with an office copier. Same maths,
   two paper boxes.
3. **Size picker: named poster sizes with sheet counts.** Teachers pick the
   finished thing ("4 sheets · about A2"), not a scale factor.

A fourth was pinned on 2026-07-26, after Glenn found the seam defect (§7):

4. **Assembly: the teacher's choice of two models, defaulting to
   `Trim & tape`** (the blockposters.com model Glenn was working from);
   `Overlap & glue` remains for schools that want the tolerance. Both require
   trimming — that turned out not to be optional — and every mark that tells a
   teacher where to cut now lives in the margin (§7).

## 2. The seam, restated as a contract

§4.5 fixes one method and one direction of dependency:

> Every printable widget implements `toPrintable() → standalone SVG`.
> `SagePrint` consumes that SVG and owns everything after.

**Amended 2026-07-26 (§4.6).** A widget that holds *several* pages may also
implement `toPrintablePages() → [{ svg, label }]`, plus an optional
`printCurrent() → index` naming the page the teacher is on. The singular method
is untouched and remains the whole contract for one-output widgets; the plural
one is additive, and the method's existence is still the capability test. Every
`svg` in the list is held to the identical checklist below.

For SagePrint to be safe against every future adopter, "standalone SVG" is
pinned here as a checklist. A widget's `toPrintable()` output MUST:

- [ ] be a single `<svg>` element with its own `viewBox`, whose aspect ratio is
      the true print aspect (units are arbitrary; only the ratio matters);
- [ ] carry all styling as inline attributes; a `<style>` block is allowed
      **only for `@font-face` embedding** — selector styles are refused at the
      seam, because pages import into the live document where SVG `<style>` is
      global and would restyle the app (amended 2026-07-26, review finding);
- [ ] render text as outlined paths, or embed the font as a `data:` URI
      `@font-face` inside its `<style>` (self-hosted OFL faces only — never a
      paid school font);
- [ ] contain no `<script>`, no `<foreignObject>`, and no external reference of
      any kind (`href`/`src` to http(s), files, or fragments outside itself);
- [ ] contain raster (`<image>`) content only when the user imported that image
      into the widget;
- [ ] prefix its internal `id`s with its widget type (`pt-`, `wb-`, …) so
      defs never collide with SagePrint's own furniture;
- [ ] survive the §15 sharpness bar: open at 400% — everything crisp except
      user-imported images.

**Enforcement lives at the seam.** SagePrint lints the SVG on receipt: a
`<script>`, `<foreignObject>`, external reference, or missing `viewBox`
disables printing and names the offender in the dialog (red line). A raster
`<image>` only warns (amber line, §8) — user images are legitimate content.
This is the hostile-pack-import posture of §15 applied to our own widgets:
adopters stay honest because the seam refuses quietly broken input.

**Known v1 deviation (tracked):** the phoneme-tiles sound mat renders text
with `font-family="system-ui"` rather than outlined or embedded faces — the
print is right on the machine that makes it, and only that machine is in the
per-teacher unit of adoption. Carried consciously until the chrome-font
embedding work lands; recorded in the iteration log 2026-07-26.

## 3. Module shape and wiring

`print.js` mirrors `export.js` exactly — same boot pattern, same dependency
injection, no imports of app internals:

```js
window.SagePrint = {
  init(deps),                 // { el, openModal, toast } handed over at boot
  openDialog(job, opts),      // job: an SVG (element or string), or a list of
};                            //      { svg, label } from toPrintablePages()
                              // opts: { title, current } — header, job name,
                              //      and which page starts ticked
```

Two touch points in `app.js`:

1. **Boot:** `SagePrint.init(...)` beside the existing `SageExport.init(...)`.
2. **Menu:** the widget context menu gains `Print…` after `Duplicate`
   (amended 2026-07-26: the generic widget menu has no `Export as PNG…` — PNG
   export is the draw pad's own item, so it cannot anchor this one), shown
   only when the widget type's def exposes **either** printable seam —
   `toPrintable || toPrintablePages` (`app.js:9146`). No registry, no
   flags — the method's existence is the capability.

Widgets never see `print.js`. `print.js` never reaches into a widget. One
method, one direction.

## 3.1 Where the control lives, and what it is called

Added 2026-07-28, on Glenn's observation that "the English widgets don't have
consistent print language — one has a green print button, the other has to go
into the ellipsis." He was right twice: the placement differed, and one action
had four names (`Print poster…` in the menu, `Print…` on a bar, `Print poster —`
in the dialog header, `sage-stage-poster.pdf` in the downloads folder). The root
cause was in this engine: the size control was labelled *Poster size* and its
first option is one sheet of A4. **A poster was always a size, never the
action** — naming the feature after the big end of one control is what let three
entry points drift into three labels.

**The word.** The action is **`Print…`** everywhere: widget menu, widget bar,
dialog header, PDF filename. Inside the flow, **page** is one artefact the
teacher ticks, **sheet** is one piece of paper, and **poster** is a size only —
what you get when you spend more than one sheet. The word stays in the assembly
hints and the multi-sheet options, where it is honest, and nowhere else.

**Where it lives — the same-sheet test.** For each sheet a widget can print,
ask: *if I printed this sheet before the lesson and again after it, would the
two differ because of what the class did?* Yes for **at least one** sheet, and
the widget carries `Print…` on its own bar; no for **every** sheet, and the
widget menu carries it alone. In practice you answer it by reading your own
widget — is the printed content mutated by a class-facing bar control, or is it
settled by a pack and the ⚙ panel?

**The threshold.** One qualifying sheet earns the control; a non-qualifying
sheet never takes it away. Do not split the control per face — that grows a bar
item that appears and disappears mid-lesson, which `modelwrite.js:1893` already
forbids by name ("tier 1 must not grow a control that only sometimes applies —
that is the reflow defect this widget already fixed once"). Nothing is lost:
`printCurrent` is face-aware, so the dialog opens on the sheet showing.

**The shape.** Always present, always **last** on the bar, always the bar's own
scale. **Weight is per bar: `Print…` takes the solid accent only where printing
is the widget's whole purpose, and is ghost everywhere else** (Glenn's call,
2026-07-28 — modelled writing's green pill is the affordance he pointed at as
the *good* one, and demoting it to buy symmetry would have taken away the thing
that prompted the fix). Solid still means one per bar: modelled writing's lead
verb is printing, the genre toolkit's is Reveal.

**The menu item never disappears** when a bar control is added — both doors,
always.

**Preset jobs are not print controls.** A dialog opened pre-configured —
modelled writing's *Compare Cold & Hot* (`modelwrite.js:1932`, `{ only,
contact }`) — is named for the teaching, never "Print", and sits beside the
thing it prints.

Applied at the time of writing:

| Widget | Control | Why |
|---|---|---|
| `modelwrite` | bar, **solid** | Every stroke changes the sheet; printing is the widget's purpose. |
| `genretoolkit` | bar, ghost | The criteria print in the order the class met them and the model text carries their marks. Its lead verb is Reveal. |
| `phonemetiles` | menu only | `ptSoundMatSvg` is built from the phonics pack and the deck's year group (`english-word.js:87`) — every Year 1 teacher gets the identical mat. Nothing of the class is in it. |

Pre-answered, so nobody re-litigates it a fourth time: **bar** when built — word
bank, sentence builder, word class sorter, story map. **Menu only** — letter
formation, and every non-English candidate (QR, prompt cards, symbols, agenda,
text signs, price labels, number line): all typed in setup, none changed by the
class.

## 4. The print dialog

Opened via the existing modal machinery (`openModal`, like the export dialog).

- **Left: live preview.** The whole poster, scaled to fit, drawn as *sheets of
  paper* — margins, cut lines and seam shapes included — because the preview
  and the printer run the same `buildPages` → `wrapSheets` path (§6). Showing
  only the printable box, as v1–v4 did, is what let the seam defect hide.
- **Right: three controls and a button.**
  - **Poster size** — `1 sheet (A4)` · `2 sheets (about A3)` ·
    `4 sheets (about A2)` · `8 sheets (about A1)`. A sheet *budget*, not an
    exact ISO promise; §5 explains why and the readout tells the truth.
  - **Paper** — A4 (default) / A3. On A3 paper the same budgets read
    `about A2 / A1 / A0`.
  - **Assembly** — `Trim & tape` (default) / `Overlap & glue` (§7), with a
    hint line under it spelling out the cut-and-join for the chosen model.
    Changing it re-plans: the finished size in the readout moves, because
    butting spends no paper on seams.
  - **Assembly guides** — one checkbox, on by default. It governs the glue
    strip only. **Margin furniture is never under this tick** — cut marks are
    correctness, and a poster assembled without them is wrong.
  - **Print** — builds the print root and calls `window.print()`.
- **Readout line** under the controls — the honest summary:
  `4 sheets of A4 (landscape) · finished size 49 × 37 cm`.
- Amber/red lint lines (§2, §8) appear above the button; red disables it.

No orientation knob and no scale slider: SagePrint picks sheet orientation and
grid to make the poster as large as the budget allows (§5). Fewer knobs, no
awkward part-sheets.

## 4.6 Multi-page jobs (added 2026-07-26)

Glenn's ask: *"the print preview needs to see the split of all the pages not
just page 1 … teachers need the option to select the pages they need, because a
vertical split page may only be ideation and not modelling a 'Big Write' ready
for the wall. This also eliminates paper wastage."*

A modelled-writing unit is a stack of pages built over weeks, and most of them
are working-out. Printing the lot is the waste; printing the right three is the
feature.

- **Pages are ticked, not printed by default.** The page the teacher was on
  starts ticked and nothing else does — paper waste is the point, so the safe
  default prints least. `All` and `None` buttons sit under the row.
- **Each page is a chip carrying its own thumbnail with its sheet split drawn
  over it**, so how a page divides is visible without rendering it full size.
  A 16-page unit at an 8-sheet budget stays a readable dialog instead of 128
  sheet thumbnails.
- **The big preview shows the ticked pages in full**, each under its own
  `describe()` line, through the same `wrapSheets` the printer gets.
- **One poster size for the whole job.** Budget, paper and assembly apply to
  every ticked page: the two real flows are "this page, wall-sized" and "these
  six pages, A4 for the tables", and both are one setting.
- **One orientation for the whole job.** Every page prints into a single
  `@page` box, so page 1 plans freely and the rest are forced to agree
  (`plan(svg, {orientation})`). Named `@page` rules per orientation would be
  the pure fix; one constraint is simpler, and every real adopter's pages share
  an aspect anyway.
- **The page leads the sheet line** whenever a job has more than one:
  `PAGE 3 · SHEET 2 of 4 · row 1 · trim & tape`. Three pages at four sheets
  puts twelve sheets on a table at once and without the page on each the pile
  cannot be sorted. The line auto-shrinks (floor 2.8mm) to keep clear of the
  seam marks rather than growing into them.
- **Lint is per page.** A page carrying a raster warns without blocking the
  others; a page that fails outright is marked, greyed and untickable, and the
  rest of the job still prints. One bad page never kills a job.
- **The readout totals what will actually print** —
  `3 pages · 12 sheets of A4 (portrait) · each page 38 × 54 cm`. A single
  ticked page reads as a plain poster, exactly as before.

## 5. The tiling model

All maths in millimetres. Constants: **margin 10mm** on every sheet edge
(every printer can do 10mm; content never enters it), and an **overlap set by
the assembly model** (§7) — 12mm lapped, 0 butted. Written `ov` below.

- Printable box per sheet = paper minus 20mm each axis:
  A4 → 190×277 (portrait) / 277×190 (landscape); A3 → 277×400 / 400×277.
- Coverage of an `r×c` grid of sheets with printable box `pw×ph`:
  `W = c·pw − (c−1)·ov`, `H = r·ph − (r−1)·ov`.

**Why budgets, not exact ISO sizes:** "A1 = 8×A4" is only true edge-to-edge
with no overlap. With real margins and glue strips, an *exact* A1 needs ~15
sheets. Teachers care that it's display-board big and the sheet count is
predictable, so the picker sells the budget and the readout states the exact
finished size.

**Grid choice — one rule:** enumerate every candidate
`(sheet orientation) × (r×c grid with r·c ≤ budget)`; for each, the content
scale is `min(W/svgW, H/svgH)`; **pick the candidate with the largest scale**
(the biggest poster the budget can make). Ties: fewer sheets, then portrait.
Then recompute the rows and columns actually touched by the rendered extent
and drop empty ones — **the no-blank-sheets rule**: a teacher who picks
4 sheets for a long thin title strip gets 2 sheets and a note in the readout,
never two blank pages.

Two worked examples (A4 paper) that double as harness fixtures:

- **4:3 sound mat, 4-sheet budget.** Landscape 2×2 covers 542×368 → scale
  122.7/unit, rendered 491×368, all four sheets inked → **49 × 37 cm**.
  (Portrait 2×2 manages only scale 92 and collapses to 2 sheets — the rule
  rejects it.)
- **10:1 alphabet frieze, 8-sheet budget.** Landscape 1×8 covers 2132×190 →
  rendered **1.9 m × 19 cm** across 8 sheets. The frieze case is why grids are
  chosen by aspect, not hard-coded 2×2 / 2×4.

## 6. Page generation and the print route

One source of truth, windowed per page — never rasterised, never duplicated:

- The widget SVG is normalised into a `<symbol id="sp-master">` (ids already
  collision-safe per §2) inside the print root.
- Each sheet is `<svg width="{pw}mm" height="{ph}mm" viewBox="{its crop of the
  poster}">` containing `<use href="#sp-master">` scaled once from SVG user
  units to poster millimetres. Guides (§7) are siblings of the `<use>`, drawn
  by SagePrint in poster coordinates.
- Print root: `#sage-print-root` appended to `<body>`, hidden on screen.
  Print CSS:
  - `@page { size: 210mm 297mm; margin: 0 }` (dimensions swapped per job
    orientation; A3 likewise). `margin: 0` is deliberate twice over — it makes
    our 10mm inset the *only* margin system, and it suppresses the browser's
    own URL/date header-footer, which lives in margin space.
  - `@media print` hides `body > *:not(#sage-print-root)`, shows the pages,
    one `page-break-after: always` sheet each; guides get
    `print-color-adjust: exact` so the grey strips survive driver "ink saving".
- `window.print()`, then teardown on `afterprint` (fires on cancel too).
- Save-as-PDF needs no code: it is a destination in the OS dialog.
- **Tauri note:** the route is plain CSS + `window.print()` and should carry
  straight into the Tauri webview; re-run the §9 physical check there when the
  Tauri era lands (macOS WKWebView is the likely divergence point).

## 7. Assembly guides

§4.5 names the furniture; this pins it. All guides are drawn by SagePrint in
the margins, glue strips and edge zones — never over content — in a soft grey
(≈ 45% neutral, hairline weights), so on the wall they read as quiet paper
furniture, and most are covered anyway. Assembly order is **row-major:
left → right, top → bottom, sheet 1 top-left**; later sheets lap *over* earlier
glue strips.

- **Numbers along the bottom** — `3 of 8 · row 2`, bottom-centre of every
  sheet, just inside the printable box.
- **Turn arrows on the sides** — at each edge that has a neighbour, a small
  arrow with the neighbour's number (`▸ 4`) at mid-edge, pointing off-sheet.
- **Glue / tape marks** — the 12mm strip on the right and bottom edges of
  every non-final column/row: 5% grey fill, dashed inner boundary, a small
  rotated caption `glue — next sheet laps over this strip`.
**Superseded 2026-07-26 — see "The margin rule" below.** Numbers along the
bottom, turn arrows on the sides and the map on sheet 1 were all drawn *inside*
the printable box, which is exactly where they must not be. What survives from
the original list is the **glue strip**: the 12mm shaded band on the trailing
edges of a lapped job, dashed inner boundary, captioned
`glue — next sheet laps over this strip`. That one is genuinely covered by the
sheet lapping over it, so it may stay inside the box.

### The margin rule (added 2026-07-26)

> **Nothing a teacher is told to cut towards may sit inside the printable box.
> Every assembly mark lives in the margin.**

The original "self-erasing by design" claim only ever held for the glue strips.
Everything else printed onto the finished wall:

- Sheet 4's number sat 3mm above its own bottom edge, in the last row, with
  nothing lapping over it.
- Sheet 4's `◂ 3` arrow sat 2mm inside its left edge — the edge that lies *on
  top* of its neighbour, so nothing covered it either.

Both landed on the poster, and both sat exactly where the scissors go. An edge
that has a neighbour, though, **always** has a disposable margin: cut away
(butt: every interior edge; lap: the leading edges) or covered by the sheet
lapping over it (lap: trailing edges). So the margin is the safe place, and
`buildFurniture` puts everything there — one `<svg class="sp-furniture">` laid
over the whole sheet, drawing in the band the page svg cannot reach.

**The edge language**, meant to be read at arm's length by someone who has
never assembled a poster and has no time to work it out:

- **A shape per seam, the same on both sheets that meet on it** — find a ●,
  look for the other ●. Eight solid shapes, allocated so no sheet ever shows
  the same one twice. This is the IKEA move: matching, not reading.
- **Direction, stated from each edge's own point of view** (corrected
  2026-07-26 — see below). The edge you cut says where it *goes*
  (`CUT → 2`); the edge something lands on says what *arrives*
  (`2 ON TOP`). Solid shapes mark edges you cut, faint ones mark edges that
  receive.
- **The method is named on every sheet** — `SHEET 1 of 4 · row 1 · overlap &
  glue`. In lap mode a single sheet legitimately carries both `CUT` and
  `ON TOP` marks, which reads as two methods bleeding together unless the
  sheet says which one it is printed for. Glenn read exactly that from a real
  PDF, and a teacher would too.
- **Marks run *along* the edge, not across it.** The band is only 10mm wide but
  200–300mm long, so that is where the room is; stacking across capped the
  shape at ~2mm, invisible at arm's length.
- **Two marks per edge**, at 26% and 74%, so grabbing either end of a sheet
  shows you what that edge is for.
- **A solid cut line exactly on the content boundary** — cutting along it
  removes white only, never writing.
- **`SHEET 3 of 4 · row 2`** in the first disposable margin the sheet has.
- **An unmarked edge is an outside edge.** Leave that paper alone.

**The direction defect (2026-07-26).** The receiving edge first read
`GLUE → 2`, which means "sheet 2 gets glued on here" but *parses* as "glue
this onto sheet 2" — the opposite. A teacher following it literally would lap
sheet 1 over sheet 2 and invert the whole assembly order. Silent, plausible,
and only visible in a printed PDF where the two halves of a seam sit side by
side. The harness now asserts both halves' wording and that no mark anywhere
reads as glue-this-onto-that.

### The seam rule (amended 2026-07-26)

The original §7 claimed *nothing needs scissors to look finished*. **That was
never true, and the poster was wrong without the cut.** Glenn found it on a
real 4-sheet modelled-writing poster; the arithmetic:

- Sheet 1 carries poster x `0–190`, sheet 2 carries `178–368` — a correct
  12mm duplicated strip. The tiling maths was never the problem.
- But every sheet prints inside `padding: 10mm` on **all four** sides. Laying
  sheet 2 over sheet 1 so the duplicated strip registers puts sheet 2's paper
  edge at sheet-1 paper x `178mm`, so its opaque white left margin covers
  sheet 1's content from poster x `168–178` — content that exists on no other
  sheet. **MARGIN mm of writing is lost at every seam, in both axes.**
- It happens whether the teacher aligns by the glue strip or by eye, and
  **widening `OVERLAP` cannot help**: the margin always sits outside the
  content it belongs to, so the loss only moves.

Removing the leading margin is the only fix that doesn't depend on borderless
printing (which school lasers can't be trusted to do — most clip ~4–5mm).
So the teacher trims, exactly as every poster tiler does, and the trim line
tells them where.

**Trim lines ignore the "Assembly guides" tick.** Numbers, arrows, glue strips
and the map are decoration a teacher may switch off; the cut line is a
correctness instruction, and a poster printed without it is defective.

`wrapSheets(frag, plan, {mm})` owns the paper around the printable box and is
called by **both** the print route and the dialog preview — §4's "same code
path" promise made literal. The preview previously rendered the printable box
alone, with no paper edge and no margins, which is exactly what let this hide.

### Two assembly models (added 2026-07-26)

Glenn named [blockposters.com](https://www.blockposters.com/) as the origin of
the idea, and its FAQ pins a *different* model from the one v1 shipped: trim
the borders (a trimmer is best, kitchen scissors are fine), then assemble face
down and tape the pages together. No overlap, no glue on the front. Both
models are legitimate and schools differ, so the teacher picks — `plan()` takes
`assembly`, and `OVERLAPS` maps it to the step used by the tiling maths.

| | `lap` (default) | `butt` |
|---|---|---|
| Overlap | 12mm of **duplicated** content | none; crops are contiguous |
| Cut | leading edges only (`col>0`, `row>0`) | every **interior** edge; outer margins stay as a mount |
| Join | glue the cut edge over the shaded strip | butt the cut edges, masking tape on the **back** |
| Margin marks | shape + `GLUE → n` on lapped edges, `CUT → n` on cut ones | shape + `CUT → n` on every interior edge |
| Inside the box | the shaded glue strip only | nothing at all |
| 4-sheet A4 mat | 491 × 368 mm | **507 × 380 mm** |
| Forgives | a wobbly cut, printer drift | nothing — every interior cut must be straight |

**`butt` is the default** (Glenn, 2026-07-26). An overlap repeats the writing
at the seam, and modelled writing that ghosts or doubles by a millimetre is far
more visible than a photo doing the same — and this is a class's own writing,
which does not get redone if the poster comes out wrong. `lap` remains for
schools that would rather have the tolerance than the tidier seam.

This supersedes the parked "overlap sizing" idea in §11 — the useful end of
that knob was always *whether* there is an overlap, not how wide.

## 8. Failure modes

| Condition | Behaviour |
|---|---|
| Widget has neither `toPrintable` nor `toPrintablePages` | No menu item (wiring level; nothing to fail) |
| Plural seam returns an empty list | `Nothing to print yet` toast; the dialog never opens (`app.js:9162`) |
| `toPrintable()` throws / returns non-SVG | Toast `Couldn't prepare the poster — <message>`; no dialog |
| SVG contains user `<image>` raster | Amber line: `Contains an imported picture — pictures may soften at poster size.` Printing allowed |
| `<script>` / `<foreignObject>` / external ref / no `viewBox` | Red line naming the offender; Print disabled (§2 enforcement) |
| Rendered extent needs fewer sheets than the budget | Prints the smaller true count; readout says so (no-blank-sheets rule) |
| User cancels the OS print dialog | `afterprint` teardown runs regardless; app state untouched |

## 9. Verification

No automated suite exists in this repo; like letterforms, this engine gets a
standalone red/green harness plus a browser pass — and uniquely, a physical
one.

- **`print-check.html`** (no build step, pattern of `letterforms-check.html`):
  - *Grid chooser table:* fixtures (square, 4:3, 3:4, 10:1 frieze) × budgets
    × papers → asserted grid, orientation, sheet count and finished size,
    including both §5 worked examples verbatim.
  - *Coverage:* page crop rects union ⊇ rendered extent; adjacent crops step
    by exactly the plan's own overlap (12mm lapped, 0 butted — the same checks
    police both models); no sheet blank.
  - *Assembly models:* `butt` plans with zero overlap and contiguous crops,
    makes a strictly bigger poster from the same sheet count, and draws no
    glue strips while keeping numbers and arrows.
  - *Sheet paper:* `wrapSheets` produces one sheet per page with the master
    shared, sized exactly to the paper in `mm` mode and proportionally in
    preview mode. The page svg's intrinsic `mm` size is neutralised inline —
    left alone it sets the sheet's min-content height, blows the paper aspect
    open (330×1119 instead of 330×467) and shears the seam shapes into
    ellipses.
  - *The margin rule:* **no `.sp-num`, `.sp-arrow` or `.sp-map` anywhere inside
    `svg.sp-page`** — the regression test for the 2026-07-26 defect. Every seam
    shape and sheet number resolves to a coordinate inside a margin band, in
    both assembly models.
  - *Edge roles:* lapped — leading edges `cut`, trailing edges `glue`, outer
    edges unmarked. Butted — every interior edge `cut`, outer edges unmarked.
    Cut lines land exactly on the content boundary on all four edges.
  - *The matching language:* the two sheets meeting on a seam carry the same
    shape; no sheet ever shows the same shape on two different seams.
  - *Contract linter:* deliberately bad fixtures (raster, foreignObject,
    external href, missing viewBox) classify amber/red as specified.
  - *Guides:* every page numbered; arrows exactly on neighbour edges; glue
    strips only on non-final right/bottom edges; map present on sheet 1 only.
  - *Visual grid* of every generated sheet for two jobs (4-sheet mat, 8-sheet
    frieze), plus a `Print the 4-sheet fixture` button for the physical test.
- **Browser pass:** dialog preview matches printed output; print preview at
  400% stays crisp; zero console errors (house bar).
- **`print-pdf.html` — the PDF pass, and it is not optional.** Renders the real
  `buildPrintRoot` for a job given by query (`?budget=8&paper=A3&assembly=lap`)
  so headless Chrome can `--print-to-pdf` it. **Assert the page count equals
  the sheet count** and each `MediaBox` equals the chosen paper.

  This exists because of the trap it caught: the app is a kiosk screen, so
  `html, body` carry `height:100%; overflow:hidden`, which in print clips the
  flow to a single viewport. **Every poster printed about two pages whatever
  the sheet count** — an 8-sheet A1 came out as 2 sheets and the rest was
  simply gone. Neither the DOM harness, nor the dialog preview, nor the tiling
  maths can see this: they all inspect a layout that is never paginated. Only a
  real PDF does. `@media print` now resets `html, body` to
  `height:auto; overflow:visible; margin:0`.

  Generalise the lesson: **`print-check.html` tests the geometry, `print-pdf.html`
  tests the print.** A change to the print CSS or the route needs both.
- **Physical assembly test — STILL OPEN, and it is the one that matters.**
  Print the 4-sheet fixture on real A4, trim, assemble both ways (glue stick
  lapped; masking tape butted), measure against the readout (±3mm), photograph
  for the iteration log. A poster engine that has never been glued together is
  not verified — and this is not hypothetical: the seam defect above shipped
  and survived 48 green harness checks precisely because nobody had cut paper.
  Arithmetic about paper is not the same as paper.

## 10. Adoption

SagePrint ships alone; widgets adopt by adding `toPrintable()` and ticking the
§2 checklist — zero expected changes inside `print.js` per adopter. Order:

1. **Phoneme tiles — the sound mat** (§5.1, the flagship print): the wall
   artefact the whole English set was aimed at.
2. **Word bank — word cards and tier posters** (§6.2).
3. **Sentence builder — the keep-line strip** (§7.1): kept sentences as a
   printable washing-line strip.
4. **Modelled writing — the page** (§8.1) becomes the true flagship when the
   writing surface lands; nothing here blocks on it.

## 11. Out of scope (parked, with reasons)

- **Ink-saver / outline mode** — needs widget cooperation, i.e. a
  `toPrintable(opts)` v2; revisit only if schools ask. The seam stays
  one-method until then.
- **US Letter** — no users; the §5 maths already takes any paper box, so this
  is a constants change later, not a design change.
- **Trim/crop marks** for guillotine-and-laminate schools — ask the first
  teacher who laminates; likely a guides variant, not a new engine.
- **Overlap *width* sizing (S/M/L)** — superseded 2026-07-26 by the two
  assembly models (§7). The useful end of that knob was whether there is an
  overlap at all, not how wide; revisit only if a school reports 12mm is too
  little to glue.
- **Scale slider / per-sheet mixed orientation / whole-screen posters** —
  knobs and cases v1 deliberately refuses; the budget picker covers the need.
- **A PDF library** — Save-as-PDF via the OS dialog already covers it.

## 12. File layout

| File | Change |
|---|---|
| `print.js` | New — `SagePrint`; expected in the neighbourhood of `export.js`'s size |
| `print-check.html` | New — standalone geometry harness (§9) |
| `print-pdf.html` | New — PDF harness (§9); renders the real print root for headless Chrome |
| `style.css` | Dialog styles + the `@media print` / `@page` block |
| `app.js` | Boot `SagePrint.init(...)`; `Print…` in the widget menu after `Duplicate` |
| `index.html` | One `<script src="print.js">` tag |

Build note: SagePrint is independent of the §14 phase ladder — it can land
before or after the writing surface without blocking either, and the harness
means it needs no adopted widget to be finished and verified.
