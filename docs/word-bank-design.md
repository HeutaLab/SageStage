# Word Bank — build spec (English slice 3)

**Status:** Implemented 2026-07-23 (same-day build; see iteration log).
Approved 2026-07-23 (design dialogue with Glenn); implements
[english-widgets-design.md](english-widgets-design.md) §6.2 — read that first
for the pedagogy (tiered vocabulary, deep-teach routine, EAL rationale). This
doc pins only the implementation decisions for the v1 slice.
**Companion documents:** [English & literacy widgets](english-widgets-design.md) ·
[Iteration log](iteration-log.md)

## 1. Scope

**Lands:** the `wordbank` widget — corkboard capture (type during discussion,
drag to group, pin, bin), three-tier lane view with per-widget editable labels,
and the teach card big view (image slot, syllable dots, first-sound chip,
definition / example sentence / action note, EAL home-language line). Plus the
`wordbank` icon, `wb-` styles, `pickImage` joining the `SageEnglishWord.init`
deps, and cache-bust bumps.

**Deferred:** Frayer view; shades meter; prints (`toPrintable()` seam);
the `tiers` pack kind (labels are a per-widget setting in v1 — a later pack
can pre-fill the same fields); docking consumers (sentence builder and
modelled writing read `p.words` when they exist — the data model is the
seam, nothing more ships now).

**Slice decisions 2026-07-23:** capture + lanes + teach card (option A over
full-§6.2 or capture-only); tier labels per-widget (option A over building
the pack rail now). The sorter's close-for-teacher-feedback pause was
explicitly lifted by Glenn starting this build.

## 2. Widget

Type `wordbank`, file `english-word.js` (slice 3 in the existing
`SageEnglishWord` IIFE). Title "Word bank", accent `#fde68a` (corkboard
warmth beside the cyan tiles and lime sorter), default 720×520.

**Props:** `{ words: [], tiers: ['Everyday words', 'Power words',
'Subject words'], view: 'board', impReplace: true }`.

**Word:** `{ id, w, x, y, tier, pin, img, def, eg, act, home, syl }` —
`w` the word (sorter rules: ≤ 24 chars, charset `[A-Za-z' -]`, case kept);
`x/y` board fractions (phoneme-tile pattern); `tier` `null|1|2|3`;
`pin` boolean; `img` data-URL or null; `def`/`eg`/`act`/`home` strings
(≤ 140 chars each); `syl` 0–6 (0 = unset). Cap 60 words; mount-time
sanitiser filters malformed entries and clamps every field, the
phonemetiles/wordsort precedent. `img` is **both** format-checked
(`data:image/`) **and** length-bounded to `WB_IMG_MAX` — a restored backup or
imported deck can carry an image the picker never sized, and one 4 MB card
would exhaust the storage the whole app shares; the picture is dropped and
the word plus its teaching notes survive. Ids are healed via `uid()` when
missing or duplicated (two cards sharing an id drag as a pair). A word must
contain a letter: the charset keeps hyphens, apostrophes and spaces for
*well-known*, *o'clock*, *ice cream*, which on their own would turn the rule
lines and separators of a pasted handout into cards.

**Layout (top → bottom):** board (grows) · quick bar. The quick bar holds the
capture input (grow) · Add · the Board/Lanes toggle — capture is always one
tap away with no settings panel open, Enter and the button both add. Repaint on real size changes only
(ResizeObserver guarded like both siblings).

## 3. Board & capture

- **Capture:** type in the quick-bar input, Enter (or Add) makes a card. New
  cards land on a deterministic free-slot walk over a 5×5 virtual grid, rows
  rising from the bottom, taking the first cell where **this word's card box
  clears every card already down**. The test is real box separation, not
  centre distance: card width is estimated from the word's length as a
  fraction of the board (`(0.46·len + 1.4)/68` per half-width, calibrated
  against a measured card), because *extraordinary* is twice the width of
  *sleet* and a cell-pitch rule sits them on top of each other. The
  bottom-right cell is never used — the bin lives there, and a card parked
  under it reads as already thrown away. **Height is per-card too**: a
  picture card is two and a half times the height of a plain one (measured
  94px against 39px), and treating every card as text-height sat imported
  picture cards straight on top of each other. A board of this size holds
  about **14 picture cards** before overlap becomes physical rather than
  algorithmic — 419px of height cannot stack more 94px cards, and that is
  what Lanes is for. When every cell is crowded the grid
  repeats, nudged diagonally per pass, so **no two cards ever share a
  coordinate**: a card exactly under another is a word the class cannot see,
  tap, or drag back out. Existing cards NEVER move: the board is
  teacher-arranged only (spatial stability rule — children navigate by
  memory).
- **Cards:** absolutely-positioned DOM, normalized x/y. A card with `img`
  renders as a picture card — thumbnail above the word, the working-wall
  look. A tiered card wears a thin coloured left edge (three fixed hues:
  tier 1 slate, tier 2 amber, tier 3 teal). A pinned card wears a small gold
  pin badge, top-right.
- **Drag (counters grammar):** drag to move; drop on the bin or off the
  widget removes — pinned cards too (pin marks favourites, it is not a
  lock). Dragging an open card closes it first, so it travels its own size.
- **Three tap states** (added 2026-07-23 — the teaching moment happens *on*
  the board): tap pops the card; **tap again opens it where it stands**,
  showing whichever of meaning / sentence / action / home language have been
  written (or a nudge to fill it in if none have); tap again, tap the bare
  board, or press Escape to close. The 📖 chip still opens the full teach
  card for the picture, the beats and editing. Replacing the whole widget to
  show one word throws away the wall the class is reading from.
  **On the board the panel hangs off the card rather than growing it**
  (revised 2026-07-24), flipping above or to the left only when it would
  otherwise fall off the edge. That means the card keeps one size for its
  whole life, so **an opened card can be nudged without snapping shut** —
  the first version closed it on drag, and over weeks of lessons those little
  closes add up to a real irritation. In a lane the panel stays in the column
  flow. The open state is never persisted.
- **Several cards can be open at once** (revised 2026-07-24). Closely-linked
  subject words — *germinate* and *metamorphosis*, *caterpillar* and
  *chrysalis* — have to sit open side by side for the class to see what they
  share and where they differ. Opening one never closes another; tapping an
  open card closes just that one, and tapping the bare board clears them all.
- **Cards are anchored by their WORD, not their box.** This is what lets a
  picture be switched on mid-lesson without the tile moving: the card grows
  upward around the word, and the word — with whatever the teacher has drawn
  around it — stays exactly put. Anchoring on the box moved the word every
  time the card changed size.
- **The panel goes below, or to the side — never above.** Above is anchored
  to the card's top, which is the one edge a picture moves, so revealing a
  picture threw the panel up the screen and off it. Below is safe because the
  card's bottom never moves; when there is no room below it goes to the side,
  level with the word, which cannot move at all and does not cover the
  picture. Its width is fixed rather than a share of the card's, so it never
  re-wraps and changes height. **Measured: revealing a picture moves the word
  0px and the panel 0px vertically.** In a lesson this matters more than it
  sounds — a tile that jumps costs a minute of redrawing annotations in front
  of a class that has already stopped listening.
- **Empty state:** "Type a word below to harvest it — cards pin to this
  board like a working wall." No presets, no starter deal: a bank starts
  empty because harvesting mid-discussion is the widget's whole point.
- **Pictures are per word, not per board** (added 2026-07-24, revised the
  same day). The first cut was one global switch; the real need is per item,
  because "not all words will need an image nor will they ever not need
  images" (Glenn). Each card carries `pic`, and the switch to flip it lives
  **inside the opened card** — the teacher reveals the meaning and can then
  reinforce it with the picture, at the moment of asking. The quick-bar
  button is a bulk shortcut over the same flag (all on / all off) and reports
  a mixed state as "Pictures 15/16". **No card moves when it is used.**

## 4. Lanes

- Quick-bar toggle Board ⇄ Lanes; `p.view` persists.
- Three columns headed by `p.tiers` labels; untiered cards sit in a pool row
  below — the sorter's column/pool/ghost-drag/`elementFromPoint` grammar
  reused wholesale, including bin rect-testing before hit-testing and the
  drag-threshold tap detection. Card font fitted per the sorter's `fontFor`
  with n = 3.
- Columns scroll vertically when full — a deliberate deviation from the
  sorter's `overflow: hidden`: a sorter round is ~14 words, a bank is up to
  60 picture cards, and a clipped card is invisible data.
- Dropping into a lane sets `tier` only; dropping into the pool clears it.
  Board `x/y` survives untouched in both directions — flipping views never
  rearranges anyone's board.
- Tap in lanes pops the card with the same open-book chip → teach card.
- Picture cards render their thumbnail in lanes too; one card component
  serves both views.

## 5. Teach card

An overlay filling the widget body (not an app-level modal), opened from
either view; × closes back to where you were, scrolling vertically when the
widget is sized too small to fit it. Top → bottom:

- **The word, huge**, first-sound chip beside it styled like a phoneme tray
  tile. Derivation: longest-match of the word's start against the phonics
  pack's graphemes via the existing `phonicsPack()` (so *chip* shows **ch**,
  *shark* shows **sh**), falling back to the first letter; lowercased for
  matching, displayed as typed; split digraphs (`a_e` shapes) excluded from
  matching — they are medial patterns and can never start a word. Derived,
  never stored.
- **Syllable dots:** a dot row with +/− steppers, count saved as `syl`;
  tapping any dot pulses it (CSS pop, no audio — the class claps; sound-talk
  silence rule).
- **Image slot:** tap → `pickImage(cb, 480)` (new dep from app.js); tap the
  image again to replace; a small × clears it. The **encoded** size is
  capped, not just the pixel width: a data-URL over ~64 KB is re-encoded at
  descending quality/width, and rejected with a toast if it still won't fit
  — bounding the bank's worst case (~1.3 MB at the ~20-image soft toast)
  instead of leaving it open-ended. Storage failure itself is already loud —
  app `save()` toasts "storage is full" on a failed flush — the cap just
  keeps the bank from routinely putting the app there.
- **Four tap-to-edit lines:** definition · example sentence · action note ·
  home language (the EAL line, labelled "In our home language"). Empty lines
  render as quiet placeholders ("tap to add…"). Editing via `prompt()` — the
  `editTarget` precedent — each capped 140 chars.
- **Pin toggle** lives here (gold pin), plus Delete (with the bin as the
  board-side route).

All teach-card text renders via `textContent`; the image is a data-URL in an
`<img>` element, never CSS-injected HTML.

## 6. Settings & import

- **Tier labels:** three text inputs (≤ 24 chars each), defaults restored on
  blank. A Word Aware school types Anchor / Goldilocks / Step-on once.
- **Word list:** sorter-style rows — word · three tier chips (radio-ish: tap
  active tier, tap again to untier) · pin dot · × remove.
- **Add row:** input + Add button (Enter works), same charset/caps as capture.
### Set files — a whole bank, pictures and all

Other apps of this kind have online banks you download from and upload into,
and **a spreadsheet cannot carry a picture** (Glenn, 2026-07-23: "the image
importer is a priority… the file type needs to be tight to the widget").

- **One file: `<set>.wordbank.zip` — an archive, not a JSON document.**

  ```
  rainforest-y4.wordbank.zip    an ordinary zip: double-click it
    preview.html                the whole set laid out, pictures and all
    set.csv                     the spreadsheet — this is the one you edit
    set.json                    the app's own copy; editing it does nothing
    images/
      canopy.jpg                a real photograph. Double-click it.
      emergent.jpg
  ```

  **Corrected 2026-07-23 after Glenn opened one:** the first cut embedded
  pictures as base64 inside the JSON, which is the only thing JSON can do
  with binary — and it read as a wall of gibberish. "This looks odd to a
  teacher. The image should be attached, in line, readable to a human." No
  arrangement of JSON fixes that; it holds text only. An archive does: the
  JSON goes back to being legible, and the pictures are files.
- **`.zip`, not a bespoke extension. Corrected again 2026-07-24, and this
  one is a standing rule.** A `.wordbank` file produced *"There is no
  application set to open the document"* — a dead end every single time
  anyone double-clicks, which is a far worse failure than the Safari
  auto-expand quirk it was traded for. Glenn called this in advance, twice.
  **The operating system has to know what the file is**; "wordbank" lives in
  the *name* (`rainforest-y4.wordbank.zip`), which is the same
  universal-type-plus-descriptive-name pattern he chose for the earlier JSON.
  Do not offer a custom extension for this file again.
- **`preview.html` travels inside every set** — unpack, double-click, and the
  whole bank is laid out with its photographs in any browser, offline, with
  no Sage Stage. A file a teacher cannot look inside is a file they cannot
  trust. It is generated with all text HTML-escaped and carries no scripts
  and no external references.
- **What makes it tight to the widget is the envelope, not the name** —
  `sage-pack@1` with `kind: "wordbank"`, and a file failing that check cannot
  load. Extensions can be renamed by anyone; the envelope cannot. Import
  sniffs content rather than trusting the name, so a renamed set still opens.
- **`zip.js`** carries the archive format — no libraries, no build step.
  Writes store-only (the pictures are already-compressed JPEG/PNG, so
  deflating them buys nothing and store keeps the writer synchronous); reads
  both store and deflate, because a teacher who unpacks a set, swaps a
  picture and re-zips it with Finder hands back a deflated archive. The
  browser's own `DecompressionStream` does that. Verified against the system
  `unzip -t`: every CRC passes.
- **The single-file `.wordbank.json` still imports**, so anything saved
  before this change still opens.
- It rides the pack envelope from the English set design §9 deliberately, so
  the same file can later be published on a school's own hosted bank and
  listed beside templates with **no format change**.
- **Carries:** tier labels and, per word, `w, tier, def, eg, act, home, syl,
  img` (a data-URL). **Does not carry:** pin, or board position — where a
  card sits is this teacher's work, not the set author's.
- **Import re-fits every picture against a set-wide budget** (~1.5 MB across
  the set, floor ~14 KB each). A set built on a roomier machine must not be
  able to fill this one: a deck shares one localStorage with every other
  widget. Measured: a 4.6 MB set of 30 photos at 157 KB each landed as
  0.64 MB with all 30 pictures kept, largest 22 KB.
- **Untrusted input.** The file came off the internet. A picture out of the
  archive is judged **by its own first bytes** — JPEG/PNG/GIF/WebP
  signatures — never by its file extension, which is also how **SVG stays
  out without needing a rule of its own**: it is text, so it can never match
  an image signature. An `images/evil.svg` referenced by a set imports as a
  word with no picture. Inline pictures in an older single-file set must
  still match `data:image/(png|jpeg|jpg|gif|webp);base64,…`, so
  `javascript:` and `data:text/html` are refused there too. All text goes
  through the same caps as everything else and reaches the DOM only via
  `textContent`. Angle brackets are stripped from tier labels: no lane is
  called `a<b`, and a heading the class reads should not look like markup.
- A picture named in `set.json` but absent from the archive drops that
  picture, keeps the word, and says so in the toast — a set is never
  half-refused over a missing file.
- **Export names the set with a prompt.** Sharing sets between teachers is
  the point of the format, not a risk to be managed (Glenn, 2026-07-23: "Im
  not bothered about this. This creates community"), so the prompt does not
  nag about picture rights. The one guard it keeps is the set design's §9
  nudge, narrowed to what that nudge was actually written to catch: a
  school's phonics scheme wording travelling further than its licence does.

### Building a set outside the app (2026-07-24)

**The eventual home for this is the help page**, with a video walkthrough —
this section is the source that page draws from, not the thing a teacher
reads.

**Who builds one.** Whoever is making the bank: often a teaching assistant,
often the teacher, frequently both on the same set. The design assumes no
technical knowledge beyond a spreadsheet and a folder of files, and it must
survive an assistant working alone with an AI and no Sage Stage open.

**Why the folder is the format.** No document a layperson can edit holds
pictures *and* text that an LLM can also fill in. Word holds both but no
model emits one; CSV, JSON and markdown are text-only. So the picture is not
referenced from inside the document at all — **it is matched by filename**,
and the folder becomes the document:

```
rainforest-y4/
  set.csv              the LLM fills this; opens in Excel or Sheets
  images/
    01-look.png        the image model's output, renamed
    18-food-chain.png
```

**The real workflow**, as proven on 2026-07-24 with Gemini and a Y4 list:

1. Save a sheet from the widget (or copy the master prompt out of the panel).
2. An LLM fills the columns. Gemini read the exported CSV with pandas and
   reverse-engineered the whole schema unprompted — the named columns *are*
   the interface, and that is why the sheet is the authoring format.
3. An image model draws the pictures. Ask for **no text or labels in the
   image**: the card already prints the word underneath, so a labelled
   picture shows it twice.
4. Name each file after its word and drop it in `images/`.
5. Select the sheet and the pictures together, or zip the folder, and open it
   from the widget's settings.

**Filename matching is forgiving, because the tools are not tidy.** Real
output from that session was `01-look.png` … `20-chip.png`: the image model
numbers its files, which is sensible — it keeps them in the sheet's order in
Finder. An exact `look.png` convention would have matched **none** of the
twenty. So both sides are normalised until they meet: lowercase, drop the
extension, hyphens and underscores become spaces, leading digits and their
separator are stripped. `01-look.png` → *look*; `18-food-chain.png` and
`food_chain.PNG` → *food chain*.

Stripping leading digits is safe rather than a guess: the word charset has
never allowed digits, so a number at the front of a filename definitionally
is not part of the word.

**Position is a last resort, and only for pure numbers.** A file called
`01.png` is row 1 of the sheet. Alphabetical order is *never* a fallback —
`adaptation.png` sorting before `look.png` has nothing to do with the sheet,
and guessing there is how a shark lands on *chip*. An explicit `picture`
column, if the sheet has one, wins over both.

**Report both directions, every import.** At twenty words the builder needs
a checklist, not a mystery: *"4 words have no picture: canopy, emergent…"*
and *"2 pictures matched nothing: IMG_4021.png…"*. Silence is the failure
mode this widget keeps almost shipping.

**Cutting up a contact sheet (added 2026-07-24, reversing the same day).** The
natural AI output is one grid image — and image models will hold "no text"
across a whole sheet while baking the word into every tile asked for singly
(Glenn: "Gemini can. It has to be bludgeoned"). So the grid is the reliable
form, and the widget cuts it up rather than making a person screenshot and
rename twenty tiles. This was rejected earlier the same day and un-rejected
once the contact sheet proved to be *the* output, not a nuisance.

- **The cut is found from the gutters, not by dividing by a count.** An AI
  grid is not even — cells drift — so `wbGridFromImage` reads the paper colour
  from the border, projects "is this background?" onto each axis, and takes
  the not-background strips as the tile rows and columns. Verified on a
  deliberately uneven 5×4 synthetic sheet: found the grid exactly.
- **Mapping is positional, never shift-on-skip.** Tile position *i* belongs to
  word *i*, always. A blank or dud tile leaves that one word without a picture
  and every other word stays put — a gap in the middle must not slide the rest
  of the set onto the wrong pictures. This was the first design's bug, caught
  in testing and rewritten.
- **Order is fixed by tap-to-swap, not drag** (better on a whiteboard): tap
  one tile, tap another, they trade places. A corner ✕ drops a picture a word
  should not get. The **Across / Down steppers** override detection with an
  even N×M when a gutterless sheet defeats it — so the one panel is both the
  smart cut and the manual one. Verified: a gutterless sheet detected as one
  tile, rescued to 4×4 by the steppers.
- The confirm screen is not optional — a silent mis-slice puts a shark on
  *chip*, worse than no picture — which is why every tile shows the word it
  will go to before anything lands. `set.csv` words come in first; the sheet
  fills their pictures. Pictures run through the same set-wide budget on the
  way in.

**Excel eats the home-language column.** Several versions save CSV as
Windows-1252, which mangles *drżeć*, *café*, Arabic and Urdu — precisely the
column where non-English text lives. The exported sheet carries a UTF-8 byte
order mark so Excel opens *and* re-saves it correctly. Sheets and LibreOffice
were always fine.

**`set.csv` wins over `set.json` on import**, and the import says which it
used. Two files describing one set is a real risk — a builder can edit the
wrong one and see nothing change — so `preview.html` names the sheet as the
file that counts, and the page states it is a **snapshot from its save
date**, because a local page cannot read the sheet beside it to refresh
itself (browsers block that for `file://`).

**Known boundaries, reported not silent:** a bank caps at 60 words and says
so on import, so a longer list needs splitting into two banks; and the board
physically fits about 14 picture cards before they collide, which is what
Lanes is for.

### Sheets — the same words, editable

- **Sets — the whole bank in one file** (added 2026-07-23). Filling four
  lines for twenty words by hand is an evening's work and no teacher does it
  twice, so a prepared set has to arrive complete. Columns:
  `word, tier, meaning, sentence, action, home language, beats`. **Download
  writes the current bank out as that sheet** and doubles as the template —
  an empty bank emits three worked rows so the file teaches its own format.
  Because every column is named, the blank sheet is also what a teacher hands
  an AI ("fill this for Y4 rainforest") and pastes straight back; no AI is
  needed *in* the app. Tier accepts `1/2/3`, the lane's own name, or a
  renamed lane's name. Header names are matched forgivingly (meaning /
  definition / "what it means"; sentence / example; action / "show me";
  home language / EAL / translation; beats / syllables). Pictures stay
  hand-added: base64 in a spreadsheet is unusable and a remote URL would
  break the offline promise.
- **This needs a real CSV reader**, not the sorter's `split(',')` — a meaning
  line contains commas (*"to shake because you are cold, or frightened"*)
  and a plain split shreds it. `wbCsvRows` handles quoted fields, embedded
  commas and newlines, and `""` escapes, and treats tabs as separators too
  because that is what a spreadsheet puts on the clipboard.
- **A plain word list still imports exactly as before** — no header row means
  first-cell-per-line, so live harvesting and a pasted sorter CSV both keep
  working untouched.
- **Pipeline**, in order: parse → normalise (charset, caps, trim) → drop
  empties → dedupe within the list → **zero words = toast and stop, nothing
  mutated** → apply.
- **Merge rule — a filled cell updates, a blank cell leaves well alone.** A
  teacher who downloads the set, fixes one column and imports it back must
  not lose the lines they typed on the board in between; equally, re-importing
  a corrected sheet has to actually land. Pictures, pins and board positions
  are never the file's business at all. The cost is that you cannot clear a
  line from the spreadsheet — you clear it in the teach card.
- **Replace mode is membership, not wipe-and-rebuild:** a listed word keeps
  its card; unlisted words are removed; new words land in the capture
  free-slot walk. Add mode only adds and updates. Wiping on replace is the
  sorter's behaviour, but its cards carry only tick-arrays — here it would
  destroy teach cards. Replace-vs-add is a saved widget prop (`impReplace`,
  sorter precedent — a fresh panel must not silently reset it).
- **Hints** in the house voice: what the tiers mean (teach the middle lane
  explicitly; Subject words is where science and history vocabulary lands),
  and that the teach card opens from a tapped card's book chip.

## 7. Integration

- app.js, the `SageEnglishWord.init({...})` deps call — add `pickImage`.
- app.js, the `TOOLS.push(widgetTool('wordsort'…))` block —
  `TOOLS.push(widgetTool('wordbank', 'Word bank', 'english'))`.
- `icons.js` — `wordbank` glyph (card + pin motif, sibling style to
  `wordsort`).
- `style.css` — `wb-` block; reuse `ct-bin`, `bm-pop`, `ws-ghost` patterns
  where classes are shared, new classes otherwise.
- `index.html` — bump english-word.js, style.css, icons.js, app.js versions.
- `docs/iteration-log.md` — dated entry when it lands.

## 8. Verification (manual, browser pane)

1. Fresh widget: empty-state hint; capture ten words mid-"discussion" — no
   two cards land overlapping, and nothing already placed moves.
2. Drag to group; pin one; bin one from the board and one from a lane.
3. Lanes: tier three cards, pool one back out; flip Board ⇄ Lanes twice and
   confirm no board position changed; shrink the widget until a full lane
   scrolls.
4. Teach card: image (confirm downscale), an oversize photo rejected with
   the toast, syllables to 3 and pulse, check *chip*/*shark* first-sound
   derivation, fill all four lines including EAL, pin from the card, close,
   reopen — all held.
5. Reload (mind the 250ms save debounce — wait ≥ 300ms after the last edit);
   everything persists; deck thumbnail shows the icon; zero console errors.
6. Import: paste a sorter-download CSV — header row skipped, no "word" card;
   re-import a list in replace mode over a bank with filled teach cards —
   listed words keep image/notes/tier/position, unlisted go; empty paste
   toasts and changes nothing; 60-word cap toasts.
