# Sage Stage poster printing — handoff brief

Paste this document into the chat that needs it, with `print.js` attached alongside (it
is the whole engine, ~1,100 lines, deliberately self-contained). The chat it lands in
has none of the context behind it. It explains how Sage Stage turns one SVG on a
classroom screen into a wall poster printed across several A4 sheets that a teacher
cuts and glues or tapes together — and, more importantly, why it is shaped the way it
is, because most of the shape was learned on real paper.

## What it is

**SagePrint** (`print.js`, `window.SagePrint`) takes one self-contained SVG — or a list
of `{ svg, label }` pages — and produces:

- a **print dialog** with a live preview: size budget (1/2/4/8 sheets), paper (A4/A3),
  assembly method, per-page tick list, contact sheet option;
- **tiled pages**, each a real sheet of paper with a 10mm margin, assembly marks in the
  margin, and the content windowed out of a single shared master — vector end to end;
- a **print route** through the ordinary print dialog (`@page` sized exactly to the
  sheet, margin 0), so "Save as PDF" in the dialog stays vector;
- a **Save PDF** button that writes the file directly (rasterised at 200 DPI via
  jsPDF), because talking a TA through "print, then find Save as PDF in a dialog that
  looks different on every machine" does not work over the phone.

Design spec with all decisions argued: `docs/poster-print-design.md` (§ numbers below
refer to it). A standalone verification harness exists at `print-check.html`.

## The input contract (§2)

One SVG, self-contained, with a `viewBox`. A lint refuses at the seam, loudly, before
anything prints:

- **errors** (printing disabled, offender named): no `viewBox`; any `<script>` or
  `<foreignObject>`; any `on*` attribute (including on the root — `<svg onload=…>` is a
  script vector too); any external reference (`href`/`src` to http/…); a `<style>`
  containing anything but `@font-face` rules — because pages are imported into the live
  document, where selector styles are document-global and would leak into the app;
- **warnings** (prints anyway): `data:` raster images — "pictures may soften at poster
  size".

Everything downstream of the contract works in **millimetres**.

## The tiling model (§5)

Constants: `MARGIN = 10` (every printer can do 10mm), `OVERLAP = 12`, `WIDE_OVERLAP
= 24`, budgets `[1, 2, 4, 8]` sheets. The planner enumerates sheet-orientation × grid
within the budget and keeps the candidate with the **largest content scale** — the
biggest poster the budget can make. Ties: fewer sheets, then portrait. Then it
recomputes the rows and columns actually touched and drops empty ones — the
**no-blank-sheets rule** (a 2×2 budget for a tall thin poster prints 2×1, and the
dialog says so).

The two functions that carry it, verbatim:

```js
function coverage(pw, ph, rows, cols, ov) {
  return {
    W: cols * pw - (cols - 1) * ov,
    H: rows * ph - (rows - 1) * ov,
  };
}
function sheetsFor(extent, box, ov) {
  const along = (len, sheet) =>
    len <= sheet + 1e-6 ? 1 : Math.ceil((len - ov) / (sheet - ov) - 1e-9);
  return { cols: along(extent.w, box.pw), rows: along(extent.h, box.ph) };
}
```

Pages are row-major, and each knows its neighbours (`up/down/left/right`, 0 at the
poster's outer edge) — the furniture needs that to know which edges are seams. Budget
labels sell the *finished thing*, not the arithmetic: on A4 paper the budgets read
"A4 · about A3 · about A2 · about A1".

## Two assembly models, both real (§7)

- **butt** — *Trim & tape*, the default. No overlap at all: both meeting edges are
  trimmed and the sheets taped from **behind**, face down (the blockposters.com
  model). Default because an overlap **duplicates content at the seam**, and writing
  that ghosts or doubles by a millimetre is far more visible than a photo doing the
  same — and this is a class's own writing, which is not redone if the poster comes
  out wrong.
- **lap** — *Overlap & glue*. Sheets carry 12mm of duplicated content; the next sheet
  laps over and is glued from the front. Forgives a wobbly cut and printer drift;
  costs 12mm of poster per seam.
- **widelap** — 24mm, because 12 was a guess until someone glued four real sheets:
  enough to hold, not much to hold *onto* with a glue stick and a wobbly scissor line.

## The margin rule — the hard-won part (§7, found on a real 4-sheet poster)

**Nothing a teacher is told to cut towards may sit inside the printable box.** Every
assembly mark lives in the 10mm margin, and an edge that has a neighbour always has a
disposable margin — cut away (butt: every interior edge; lap: leading edges) or covered
by the sheet that laps over it (lap: trailing edges). So the furniture genuinely
self-erases from the finished poster.

Early versions drew sheet numbers, arrows and a little assembly map *inside* the
content box. On paper, sheet 4's number printed 3mm above its own bottom edge with
nothing lapping over it — permanently on the wall — and its "◂ 3" arrow sat exactly
where the scissors go. The physical assembly test had never been run until then.

The second half of the rule is about the **leading-edge trim line, which is
correctness, not decoration**: a sheet that laps on top brings its own 10mm of opaque
white margin with it, and that white lands on the previous sheet's content — content
that exists on no other sheet, so 10mm of writing is lost at every seam in both axes.
Widening the overlap cannot fix it (the margin always sits outside the content it
belongs to; the loss just moves). Cutting the leading margin off before gluing is the
only fix that does not depend on borderless printing.

## The seam language — readable at arm's length by someone who has never done this

- Each seam is assigned one of **eight solid shapes** (circle, triangles, square,
  diamond, pentagon, hexagon, lozenge), and **both sheets meeting on that seam carry
  the same shape**: find a ●, look for the other ●. No counting, no cross-referencing.
- The words under the shape are directional, and the wording survived a real
  inversion: "GLUE → 2" was read as "glue this onto 2" when it meant "2 gets glued on
  here". Now the cut edge says **`CUT → 4`** (where your edge goes) and the receiving
  edge says **`4 ON TOP`** (what arrives on it).
- Cut edges carry the hairline **plus heavy 9mm crop ticks at both ends** — scissors
  do not follow a hairline across 300mm of paper; you line the blade up on two marks
  and cut between them, which is what trade crop marks are for.
- Marks run **along** the edge, not across it: the margin band is only 10mm deep but
  200–300mm long, so that is where the room is. Stacked across, the shapes capped at
  ~2mm and were invisible at arm's length.
- Each sheet names itself once, in its first disposable margin: `LABEL · SHEET 3 of
  8 · row 2 · trim & tape` — the method is named on every sheet because in lap mode a
  sheet legitimately carries both CUT and ON TOP marks, and the page label comes first
  because three pages × four sheets is twelve sheets hitting the table at once.
- Inside the content box, the **only** thing ever drawn is the lap-mode glue strip
  (shaded, dashed edge, captioned "sheet N goes on top of this strip") — because the
  lapping sheet genuinely covers it.

## Page generation (§6) — one master, windowed

No rasterising, no duplicating the artwork per page:

- one hidden `<svg class="sp-defs"><defs><g id="spN-master" transform="scale(S)
  translate(-minX -minY)">…content…</g></defs></svg>` — user units scaled to mm once;
- each page is `<svg width="PWmm" height="PHmm" viewBox="cropX cropY PW PH"><use
  href="#spN-master"/></svg>` — a mm-true window onto the master;
- `wrapSheets()` puts each page in a div that is the *true sheet of paper* with the
  margin as CSS padding. For print it is sized in mm; for the dialog preview it is
  fluid with `aspect-ratio`, and the inset is a percentage — computed separately for
  top vs sides, because percentage padding resolves against **width** on all four
  sides while the top offset needs the height's proportion;
- the margin furniture is a separate absolutely-positioned SVG over the whole sheet
  (the page SVG cannot reach into the margin), `preserveAspectRatio: none`, drawn in
  paper-mm coordinates. Preview and print route share these functions, so the preview
  cannot tell a different story from the printer.

## The print route, and the webview trap

```js
// hidden print-only root
const style = '@page { size: ' + pageW + 'mm ' + pageH + 'mm; margin: 0; }';
```

`@page margin: 0` is deliberate twice over: the 10mm insets become the *only* margin
system, and the browser's own URL/date header-footer — which lives in margin space —
is suppressed. Sheets are sized boxes with the inset as **padding, never margin**
(fragmentation rules can renegotiate margins across page breaks; they leave padding
alone). `document.title` is set to the job title for the duration, because that names
the print job and the Save-as-PDF default filename. Cleanup rides on `afterprint`,
which also fires on cancel.

**The trap for any app in a desktop webview (Tauri/wry, and WKWebView generally):**

- `window.print()` is a **silent no-op** — wry wires no print delegate. Nothing
  happens, no error, and naive cleanup code leaves the app in its print state
  forever. Route through the webview plugin instead:
  `getCurrentWebviewWindow().print()` (capability `core:webview:allow-print`), and
  `@media print` CSS applies as normal. `afterprint` never fires on this path, so
  cleanup runs on a generous timer instead.
- **Blob-anchor downloads are also silent no-ops** in WKWebView, so "Save PDF" must go
  through a native save panel on desktop (a `SagePlatform.saveBlob` seam here) and may
  keep the anchor in a real browser.

## The direct-PDF path

Browser Save-as-PDF stays vector and is the best-quality route; the built-in **Save
PDF** exists for the phone-call case. Each sheet is rebuilt as a **single standalone
SVG** (white ground, the `<defs>` master carried along so the `<use>` still resolves
outside the document, page nested at the margin offset, furniture on top), rasterised
at **200 DPI** through `Blob → objectURL → Image → canvas`, and added to a jsPDF
document as JPEG (quality .94), one page per sheet, canvas freed per iteration.

Two lessons encoded there: html2canvas was tried first and **hung** — a `<use>`
pointing at a master outside the captured subtree is exactly the case it handles
worst; serialising the SVG ourselves has no second rendering engine to disagree with
the printer. And 200 DPI is chosen so a 2.2-unit ruling line is still a line.

## The contact sheet

"The whole unit, small, on one sheet" — every ticked page laid out in a grid on one
A4, each cell keeping its own aspect, labelled. Built as an **ordinary SVG and then
fed through the same `plan()`** as everything else, so it lints, tiles and prints by
exactly the same rules. There is no second print path to keep in step — that is the
rule worth stealing.

## Adoption seam (§10, §11)

- A widget offers either one SVG or `toPrintablePages(w) → [{ svg, label }]`.
- The app calls `SagePrint.openDialog(pagesOrSvg, { title, budget, current })`.
  Entry points preset the budget — a bar's "Print…" means 1 sheet, "Print for the
  wall…" means 8 — and the choice is **never remembered**, so a teacher who printed a
  wall poster once does not print eight sheets by accident next week. The default
  selection is only the page the teacher was looking at: paper waste is the point of
  the feature, so the safe default prints least.
- The module is dependency-injected and portable: `SagePrint.init({ el, toast,
  openModal })` is its entire knowledge of the host app; `window.SagePlatform`
  (optional) carries the desktop seams (`printPage`, `saveBlob`). Lift `print.js`
  whole, replace those five functions with your own, and the engine, dialog and both
  output routes come with it.

## What is deliberately out (§11)

Custom paper sizes (two sizes cover UK schools), remembering print settings (see
above), borderless printing (the margin rule makes it unnecessary), and any
server-side rendering — the whole path runs on the teacher's machine, and the dialog
says so: "Nothing leaves this device."

## The one-line moral

Print was "done" for a month before anyone glued four sheets together, and the two
worst bugs (marks inside the cut zone; the leading margin eating a seam of content)
were both invisible on screen and obvious on a table. **If the output is physical, the
verification is physical.**
