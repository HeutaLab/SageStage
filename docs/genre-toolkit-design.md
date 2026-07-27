# Genre Toolkit — build spec (English slice 6, v1 "criteria and evidence")

**Status:** **v1 built and verified 2026-07-27.** Design agreed with Glenn the
same day (shape, highlight granularity, year banding and pass scope all pinned by
him in dialogue; the word bank face added on his call — see §2). Two clauses were
corrected *during* the build, where the code taught the spec something: §11's
snippet grouping and clipping, and §11's print-page defaults. See the
[iteration log](iteration-log.md) entry for that date.
Implements the v1 slice of [english-widgets-design.md](english-widgets-design.md)
§8.4 — read that for the full genre-toolkit vision. This doc pins the v1
implementation decisions, and it is also the first spec for the **`genre` pack
kind** (§4.4, §9 of that doc), because this widget is the pack's face.
**Companion documents:** [English & literacy widgets](english-widgets-design.md) ·
[Modelled writing](modelled-writing-design.md) ·
[Poster print](poster-print-design.md) · [Iteration log](iteration-log.md)
**Date:** 2026-07-27

---

## 1. What this is, in Glenn's terms

The success criteria that grow on the working wall through a unit, joined to the
model text they came from.

Two things happen in a writing unit and they are usually two separate bits of
paper. First the class hunts through a WAGOLL for the features of the genre —
highlighters out, "there, that's a fronted adverbial". Then those features become
the checklist the class writes against for three weeks, revealed one at a time as
each is taught. The second bit of paper is the one that ends up on the wall, and
by then it has lost all connection to the text it came from.

This widget holds both, and prints them **together**: each criterion with the
snippet of real text that proves it, directly underneath. That adjacency is the
whole argument for building it — it is the thing neither bit of paper can do.

Alongside them sits the genre's word bank — the openers, connectives and
vocabulary that genre runs on — because a teacher three years in does not have
them on tap the way a teacher of twenty does, and a list somebody chose today
beats a list nobody has looked at since September.

What it is not: a document viewer (that is `bookpage`, §8.2), and not a writing
surface (that is `modelwrite`). It never holds the children's writing. It holds
the criteria, the words, and one model text it marks up.

## 2. Scope

**In v1:**

- The `genretoolkit` widget — **three** faces: checklist, model text, word bank.
- The `genre` pack kind: format, normaliser, in-widget editor.
- File export and import (`.genre.json`).
- The genre poster print, with the optional word bank and Cold/Hot sheets.
- **Four** default packs: narrative, newspaper report, explanation, persuasion.

**Glenn, 2026-07-27, on why the word bank face is in and not deferred:** *"Word
banks help tremendously for any teacher less than 5 years into the game. More
experienced teachers have them on tap. But any updated lists supersede older
ones. Genre banks are always gold if offered."* Three things follow, and they
shape §8.5, §9 and §11:

1. **Offered, never imposed.** The face exists and is never the default face. A
   teacher who has the openers in their head simply never opens it, and it costs
   them nothing. A genre whose lists are empty hides the face entirely rather
   than showing three empty boxes.
2. **Supersede, never accumulate.** An updated list *replaces* the old one
   outright — on edit and on import alike. Nothing merges, nothing appends,
   nothing survives an update it wasn't part of. This is the rule that keeps a
   bank trustworthy: a word on the wall is a word somebody chose today.
3. **It reaches the wall.** Prints as its own sheet, not folded into the criteria
   poster.

**Deferred, with reasons:**

- **The other eight default packs** (recount, diary, letter, instructions,
  non-chronological report, playscript, poetry, book review). Pure data, no code
  — a follow-up pass Glenn can review in one sitting. The four chosen here span
  the text types so the machinery is proven against real variety.
- **Feeding the `wordbank` widget.** §8.1 routes genre language lists to the word
  bank and the Big Write prompt chips. That is a third consumer for the docking
  question §16.4 parks, and this widget displaying and printing its own lists
  covers the classroom need without it. Promote to a general dock API if a
  pairing beyond the word bank's two ever appears.
- **`structure` editing.** The boxing-up rows ride in the pack and export
  intact, but nothing in this widget shows them — they feed the Story Map (§8.3,
  P3). Editing data no face displays is how packs get silently corrupted.
- **Reveal-as-taught across widgets.** No syncing a reveal state to anything
  else. One widget, one unit's criteria.
- **The `templateSources` URL rail.** Packs move as files the teacher owns —
  see §10 and the per-teacher direction: a distribution rail only pays off when
  several teachers coordinate, which is not what this product is.

## 3. The `genre` pack

The envelope is `sage-pack@1` as §4.4 fixes it. The payload:

```json
{
  "format": "sage-pack@1",
  "kind": "genre",
  "id": "newspaper-report",
  "name": "Newspaper report",
  "author": "Sage Stage",
  "items": [
    { "t": "A headline that makes you want to read on", "band": "ks1" },
    { "t": "The 5 Ws in the opening paragraph", "band": "lks2" },
    { "t": "A headline using wordplay or alliteration", "band": "uks2" }
  ],
  "structure": [
    { "box": "Headline", "hint": "Short and punchy — present tense" }
  ],
  "language": {
    "openers": ["Yesterday evening"],
    "connectives": ["however"],
    "vocabulary": ["eyewitness"]
  },
  "model": ""
}
```

**`items` differs from §9's shape** — §9 of the English design wrote toolkit
items as bare strings in a `toolkit` array. They are objects in an `items` array
here, because each carries a year band (below). The normaliser accepts a bare
string, or a `toolkit` key in place of `items`, as `band: "lks2"` — so anything
hand-written against §9 still loads.

**`model` ships empty in every default pack, always.** Schools use their own
WAGOLLs, and a published model text is somebody's copyright. The teacher pastes.
A pack that *does* carry a `model` — one a school wrote itself and exported —
loads it into `text` when the genre is picked, tokenised exactly as a paste is.

**Bands** are `ks1`, `lks2`, `uks2`, labelled in the UI as *Reception – Year 2*,
*Years 3–4*, *Years 5–6*. Three, not seven: a criterion does not change between
Year 3 and Year 4, and 12 genres × 7 years is an authoring job nobody would
finish. The data values stay short; the labels are what a teacher reads.

### 3.1 Normaliser

Mirrors `sanitizeTemplate` (`app.js:9953`), which is also where the app review's
template-XSS finding lives — packs are the same class of untrusted input.

| Field | Cap | Bad value becomes |
| --- | --- | --- |
| `name` | 60 chars | `'Genre'` |
| `id` | 60 chars, `[a-z0-9-]` | generated from `name` |
| `author` | 60 chars | dropped |
| `items` | 20 items | truncated |
| `items[].t` | 200 chars | item dropped if empty |
| `items[].band` | enum | `lks2` |
| `structure` | 12 rows | truncated |
| `structure[].box` | 60 chars | row dropped if empty |
| `structure[].hint` | 200 chars | `''` |
| `language.*` | 50 strings, 60 chars each | truncated |
| `model` | 20 000 chars | truncated |
| unknown keys | — | dropped |
| C0 control chars | — | stripped from every string |

**Control characters are stripped, not escaped.** C0 controls other than tab,
newline and return are illegal in XML 1.0, so escaping is not enough: a pack
carrying one produces a poster the print dialog cannot parse, and the criteria
sheet simply disappears from the page list with no error a teacher could act on.

The same 20 000-character cap applies to `text` however it arrives — pasted,
opened from a file, or loaded from a pack's `model`. Over the cap it truncates at
the last whole sentence before the limit and says so in a toast. A WAGOLL is a
page or two; 20 000 characters is roughly ten pages, which is already far past
anything a class reads together, and it keeps the tokeniser off a pasted novel.

Every string reaches the DOM through `textContent`. There is no path in this
widget from pack data to `innerHTML`.

## 4. Data model

Widget props. The pack is **copied in**, not referenced — the phoneme-tiles
precedent (`english-word.js:53`), where `window.SAGE_ENGLISH_PACKS` is a
read-only default library and the widget's props hold the working copy. It means
snapshots, undo and the daily copy capture the toolkit's content with no changes
to any of them, because they all copy widget props already.

```js
defaults: () => ({
  genre: null,        // { id, name, items[], structure[], language{} } once picked
  src: null,          // id of the default it was copied from, or null if imported/blank
  face: 'list',       // 'list' | 'text' | 'bank'
  revealed: [],       // item ids, in reveal order
  ticked: [],         // item ids ticked by hand
  text: '',           // the pasted model text; immutable once set
  marks: [],          // [{ a, b, item }] token index range → item id
  active: null,       // item id whose colour is loaded
  allBands: false,    // bar toggle: ignore the deck's year group
  size: 1,            // model text board size, 0 | 1 | 2
  coverList: false,   // Cover, per face — one flag each, never shared
  coverBank: false,
})
```

`items` entries are `{ id, t, band }`. `id` is a `uid()` minted on copy-in, and
it is the only thing marks and reveals ever reference — so reordering, renaming
or deleting items can never silently re-point a highlight at a different
criterion.

**Colour is not stored.** An item's colour is its index into a fixed palette of
eight, so an edited list never orphans a mark to a dead colour:

```js
const GT_COLS = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fbcfe8',
                 '#ddd6fe', '#fed7aa', '#d9f99d', '#bae6fd'];
```

Eight pale fills drawn from the accents already in use across the English set,
each legible with dark slate text on top and each printing without turning to
mud. Past eight items the palette cycles; identity still lives in `marks[].item`,
and tapping a highlight names its criterion, so a repeated colour is a cosmetic
collision and never a data one.

**Mount-time coercion**, the `phonemetiles`/`wordsort` pattern
(`english-word.js:661`) — props may be years old or hand-edited:

- `revealed` and `ticked` drop ids not present in `genre.items`.
- `marks` drop entries whose `item` is unknown, whose `a`/`b` fall outside the
  token count, or where `a > b`.
- `active` clears if unknown.
- `face` falls back to `'list'` — including when it says `'bank'` on a genre
  whose lists are all empty, since §8.5 hides that face.
- `size` clamps to 0–2.

## 5. Tokens and marks

The one genuinely new engine here. Pasting tokenises **once** and the text is
then immutable, so token indices can never drift under a mark.

**Tokenising.** Split on whitespace; then from each chunk peel **every** leading
punctuation character and **every** trailing punctuation character into a token
of its own, working inwards, and split what remains on internal apostrophes.
`"Help!"` therefore yields four tokens, not two — the leading quote, the word,
then the exclamation mark and the closing quote peeled off the tail in turn:

| Input | Tokens |
| --- | --- |
| `Yesterday` | `Yesterday` |
| `evening,` | `evening` · `,` |
| `fox's` | `fox` · `'s` |
| `"Help!"` | `"` · `Help` · `!` · `"` |
| `well-known` | `well-known` |
| `roof.` | `roof` · `.` |

Hyphens stay inside the word — `well-known` is one adjective and highlighting
half of it means nothing. Apostrophes split because "apostrophe for possession"
and "apostrophe for contraction" are criteria a teacher needs to point at.
Whitespace is preserved for rendering but is not a token and is not tappable.

Stored as `[{ s, w }]` per token, `w` true for word tokens; derived on mount
from `text` rather than persisted, since it is a pure function of the text.

**Marks** are `{ a, b, item }` — an inclusive token index range. Painting rules:

- Tap a token: a one-token mark in the active item's colour.
- Drag across tokens: one mark spanning first to last. Punctuation tokens inside
  the range are included, and the whitespace between tokens renders inside the
  paint so a phrase reads as one continuous highlight rather than striped words.
- Tap a token already marked with the **active** item: unpaint. Splits the mark
  if the tap lands mid-range.
- Tap a token marked with a **different** item, with an item active: repaint.
- Tap a marked token with **nothing** active: a small label names the criterion.
  This is the answer to a repeated palette colour.
- Tap an unmarked token with nothing active: nothing happens. Reading the text
  aloud with a finger on the board must never paint by accident.
- After every change, adjacent or overlapping marks of the same item merge into
  one range, so the printed snippets read as phrases rather than word salad.

Only **revealed** items can be active. You cannot highlight a criterion you have
not yet taught the class — which is also what stops the palette from mattering,
because the working set during any one WAGOLL session is small.

## 6. The checklist face

The default face, and the one that lives on the board for three weeks.

- Genre name as a heading.
- One row per **revealed** item: colour swatch, criterion text, tick box.
- **Unrevealed items are not on the board at all.** The wall genuinely grows;
  §3.3's honesty rule is that anything displayed was made with the class.
- Items whose band does not match the deck's year group are out of the reveal
  queue — not deleted, just not offered. `allBands` puts them back.
- Tapping a row makes that item active (and switches nothing — the face stays).
- **Ticks have two sources.** The box toggles by hand into `ticked`. It *also*
  shows ticked whenever that item has marks, with a small count ("2") so it is
  obvious why. Un-ticking never deletes marks; it clears the manual flag and the
  mark-driven tick stays, which is honest rather than surprising.
- **Cover** blanks every criterion's text and leaves the swatches, for recall.
  No Flash — a criteria list has nothing to flash, and principle 8's grammar is
  a menu to choose from, not a checklist to satisfy.

## 7. The bar

Live-lesson controls sit on the widget's bar, not in the class-facing area —
modelled writing's house rule (`modelled-writing-design.md` §5), and the reason
the reveal queue is not on the board: the class should not see what is coming.

| Control | Does |
| --- | --- |
| Face switch | Checklist · Model text · Word bank — three segments, the third absent when §8.5 hides it |
| Reveal | Reveals the next unrevealed item in band order, named on the button so there is no surprise. A chevron beside it opens the full list to reveal one out of order — a chevron rather than a long-press, because long-press on a board is a coin toss |
| Hide last | Un-reveals the most recent item — a misfire in front of thirty children needs one tap back |
| Cover | Toggles Cover on the face showing — criterion text on the checklist (§6), words on the word bank (§8.5). Absent on the model text face, where covering the WAGOLL is what the mask boxes in `bookpage` are for |
| All bands | Ignores the deck's year group |
| Size | Model text board size, three steps (model text face only) |

**No Print button on the bar.** The widget menu's *Print poster…* is the app-wide
entry point and it already does the right thing (`app.js:9116`) — modelled
writing puts one on its bar because printing is the point of that widget, whereas
these sheets are printed once or twice a unit, not mid-lesson. Six controls is
already a full bar.

## 8. The model text face

- **Empty:** a paste target — "Paste your model text" — plus *open a text file*
  (`.txt`, `.md`; plain text only, no rich text, no PDF; `bookpage` is where
  documents belong).
- **Pasted:** tokens rendered at one of three board sizes, generous line height,
  the widget's own scroll.
- A strip above the text holds the revealed items as coloured chips; tapping one
  makes it active, and the active chip is unmistakable.
- Painting per §5.
- **Re-pasting is a confirm** — "This clears the highlights on the current
  text" — because marks are token-indexed and a new text invalidates every one
  of them. `confirmDialog` is already in `engDeps`.
- Clearing the text is the same confirm.

## 8.5 The word bank face

The genre's language lists, on the board and on the wall. §2 records why it is in
v1 and the three rules it follows.

- Three labelled groups — **Openers**, **Connectives**, **Vocabulary** — each a
  wrap of word cards. Reference, not manipulables: nothing drags, nothing sorts,
  nothing bins. The `wordbank` widget (§6.2) is where words become objects to
  push around; this is the genre's list, sitting there to be read from.
- Cards scale with the widget like everything else in the set, and a group with
  no words is omitted rather than shown empty.
- **The face is hidden entirely when all three lists are empty** — which is every
  default pack out of the box, since §13 gives all four genres their lists but a
  teacher who blanks them gets the face out of the way, and a blank pack never
  shows it at all.
- **Cover applies here too**, hiding the words and leaving the group labels:
  "how many openers can you remember?" is the same recall move Cover exists for
  on the checklist. Cover is per-face, not global.
- Nothing on this face is revealed-as-taught. A word bank is reference the class
  reads from on day one; the reveal discipline belongs to success criteria, which
  are claims about what the class can now do.

## 9. The editor

Duplicate-and-edit, per §4.4: every pack opens in an editor because every school
words its criteria differently. It lives in the widget's settings panel and
edits **only what a face shows** — the genre name, the three item lists, and the
three word bank lists. `structure` and `model` pass through untouched and
re-export intact.

Two sections, six textareas, one entry per line throughout:

- **Criteria** — *Reception – Year 2*, *Years 3–4*, *Years 5–6*.
- **Word bank** — *Openers*, *Connectives*, *Vocabulary*.

One-per-line textareas are the established idiom (modelled writing's focus lenses
at `modelwrite.js:886`, the word bank's tier labels), and for the criteria it
makes the band structural rather than something a teacher has to type.

**Supersede, never accumulate** (§2, rule 2). A textarea *is* the list: saving
replaces that list with exactly what the box holds. Nothing appends, nothing
merges, no word survives an edit it wasn't part of. Emptying a word bank box
empties that group — and emptying all three hides the face, which is the
intended way for a teacher who doesn't want it to make it go away.

Editing is non-destructive to session state where it can be: a line whose text
is unchanged keeps its `id`, so re-wording *one* criterion does not drop the
reveals and marks on the other fifteen. Matching is by exact text within a band,
first unmatched old item wins — so two criteria worded identically in one band
(a mistake, but a survivable one) resolve in order rather than both claiming the
same id. A re-worded line is a new id and loses its own marks, which is correct:
the criterion changed.

**Switching genre** (picking a different default, or importing) clears
`revealed`, `ticked`, `marks` and `active` behind one confirm, and keeps `text`.
Every id is new, so nothing else would survive anyway.

**On insert** the widget shows a picker: the four defaults, *start blank*, or
*open a pack file*. Nothing is chosen for the teacher.

## 10. Files

Packs move as files the teacher owns. Not a URL rail — the per-teacher direction
is that content belongs to one teacher on one machine, and §4.4's "school
publishes a bank on GitHub Pages" story is secondary wherever the two pull apart.

- **Export** writes `<id>.genre.json` — the normalised pack, pretty-printed,
  via `saveBlob`. Plain JSON, no zip: unlike the word bank there are no pictures
  to carry, and a zip would be ceremony around a single text file.
- **Import** accepts `.genre.json` and `.json`, runs §3.1, and reports what was
  clamped rather than failing silently. **It supersedes** (§2, rule 2): the
  imported pack's criteria and word bank lists replace what was there entirely.
  There is no merge path and no "keep both" — an incoming list is somebody's
  considered current version of it, and half of an old one mixed in is exactly
  the stale-word problem the rule exists to prevent.
- **The share nudge** goes on the export dialog, one line, §4.4's wording:
  *"Only share wording your school wrote. Rhymes, lens names and toolkit text
  from paid schemes belong to their publishers."*

## 11. Printing

**`toPrintablePages(w)`, not `toPrintable(w)`** — the plural seam, because there
is more than one sheet and the app's existing dialog already lets the teacher tick
which are worth the paper (`app.js:9116` → `print.js:730`). No new dialog, no new
option UI. The pages, in order:

| # | Sheet | Present when |
| --- | --- | --- |
| 0 | Success criteria | always |
| 1 | Word bank | the word bank face is available (§8.5) |
| 2+ | Cold task, Hot task | a `modelwrite` widget on the same screen carries both |

`printCurrent(w)` returns `0`, so the criteria poster is the one ticked when the
dialog opens. **Everything else is one tick away rather than ticked** — SagePrint
ticks a single page on purpose, because "paper waste is the point of the feature,
so the safe default prints least" (`print.js:751`), and a widget that quietly
queued four sheets would be arguing with that.

Live `<text>` with `font-family="system-ui, sans-serif"`, matching
`modelwrite.js:618` — vector, no webfont dependency, no raster, and no `<image>`
nodes at all since this widget imports no pictures. Every string XML-escaped on
the way in, the `xmlEsc` pattern from `english-word.js:86` (criteria and word
bank entries carry apostrophes as a matter of course).

**The poster:**

- A title band: the genre name, shrunk to fit the sheet rather than run off it.
- Then each revealed item as a row — colour swatch, criterion, tick box — **in
  reveal order, not pack order.** The poster has to match the board a class has
  been reading for three weeks, and `p.revealed` is the order they met them in.
- **Directly beneath any item that has marks, its snippets** in lighter type,
  the marked tokens painted in that item's colour.
- **One snippet per sentence, not per mark.** An item with three highlights in
  one sentence gets one line with three painted runs. Per-mark was the first cut
  and it printed three near-identical copies of the same sentence, which reads as
  noise on a wall.
- **Clipped by measured width, not by character count.** The snippet grows to its
  sentence, then loses unmarked context from whichever side has more of it until
  it fits the column, always on a token boundary, with an ellipsis where it was
  cut. Never mid-word. A character count was the first cut and it could not know
  the column width — 160 characters at 22px is nearly twice it.
- **Boundary spaces are non-breaking spaces (U+00A0).** SVG collapses leading and
  trailing whitespace in a `<text>` element, so a run ending in a space is drawn
  and measured without it and the next run starts flush: `a fox` prints as
  `afox`. `xml:space="preserve"` does **not** fix it — measured in Chrome, the
  attribute works on a *parsed* node (199.47 vs 194.41) but is ignored on one
  built with `setAttribute` + `textContent`, which is exactly what the measuring
  host is, so render and measurement disagree by one space every time. A
  non-breaking space is not XML whitespace at all, so it survives in both paths
  with no attribute involved. The attribute stays on the runs as belt-and-braces;
  the nbsp is the mechanism.
- Ticks print as they sit on screen. No option — the screen is already the
  control, and a second place to decide it is a second place to get it wrong.

**The word bank is its own sheet** (page 1): the three groups, labelled, as word
cards laid out to fill the sheet. Its own sheet rather than a panel on the
criteria poster, because the two go to different places on the wall and get
replaced on different rhythms — criteria last the unit, a bank gets superseded
(§2, rule 2).

**Cold/Hot needs no control of its own.** Modelled writing already owns the tags
and the compare print (`modelwrite.js:1931`); here the pages simply join the list
when a `modelwrite` widget on the same screen carries both bookends — read the
same-screen way the sentence builder reads a word bank (`english-word.js:3201`),
then taken from `WIDGETS.modelwrite.toPrintablePages()`. A read plus a public
method, no new coupling inside modelwrite, and criteria beside the evidence of
progress whenever the teacher ticks both.

## 12. Wiring

New file, per §10 of the English design: `english-text.js` exposing
`SageEnglishText`, IIFE, deps injected at boot. It is the Sentence + Text grain
file, and the Story Map joins it at P3.

**Recorded drift, deliberately not fixed:** §10 puts the sentence builder in
`english-text.js` too, but it shipped inside `english-word.js`. Moving it now is
an unrelated refactor with real regression risk on a widget reviewed only two
days ago, and no gain. It stays where it is.

- `index.html`: `<script src="english-text.js?v=1"></script>` after
  `modelwrite.js`, before `app.js`.
- `app.js` boot, inside the existing `if (window.SageEnglishWord)` block
  (`app.js:12389`) beside `SageModelWrite.init(engDeps)`:
  `if (window.SageEnglishText) SageEnglishText.init(engDeps);`
- `TOOLS.push(widgetTool('genretoolkit', 'Genre toolkit', 'english'));`
- `icons.js`: a `genretoolkit` glyph — a ticked list.
- `english-packs.js`: the four `genre` packs join `SAGE_ENGLISH_PACKS`.
- Widget def: `title: 'Genre toolkit'`, `icon: 'genretoolkit'`,
  `accent: '#c7d2fe'`, `w: 780`, `h: 560`. Wider than modelled writing because
  the text face needs the line length. Accents are reused across the app
  (`#fbcfe8` carries seven widgets), so this is not required to be unique.
- `style.css`: a `gtwidget` block, following `sbwidget`/`wswidget`.

Existing deps cover everything needed — `el`, `iconEl`, `save`, `toast`, `uid`,
`clamp`, `settingRow`, `checkRow`, `selectInput`, `confirmDialog`, `openModal`,
`deck`, `snapshotBefore`. No new dep, no change to `app.js` beyond the four
lines above.

## 13. The four default packs

Ours or National Curriculum wording (Crown copyright, OGL v3). NC *terminology*
— fronted adverbial, relative clause, expanded noun phrase, modal verb — is used
freely; no scheme's phrasing appears anywhere.

### 13.1 Narrative (`narrative`)

**Reception – Year 2:** A beginning that says who and where · Joining words: and, but, so ·
A capital letter and a full stop in every sentence · Describing words for the
characters · A problem the character has to solve

**Years 3–4:** An opening that sets the scene · Fronted adverbials with a comma
· Expanded noun phrases to describe · Speech inside inverted commas ·
Paragraphs to show a change of time or place · An ending that solves the problem

**Years 5–6:** An opening that hooks — action, speech or setting · Relative
clauses to add detail · Show, don't tell: feelings through action · Sentence
lengths varied for pace · Dialogue that moves the story on · An ending that
echoes the opening

**Structure:** Opening · Build-up · Problem · Resolution · Ending

**Word bank:**
- *Openers* — Early one morning · Without warning · As soon as · Long before
  dawn · Deep in the forest · The moment she turned · By the time anyone
  noticed · Somewhere behind them
- *Connectives* — meanwhile · suddenly · until then · at last · moments later ·
  all the while · no sooner · even so
- *Vocabulary* — glanced · hesitated · trembling · deserted · whispered · edged ·
  frantic · gloom · brittle · sank

### 13.2 Newspaper report (`newspaper-report`)

**Reception – Year 2:** A headline that makes you want to read on · Who it happened to, and
where · What happened, in order · A picture with a caption

**Years 3–4:** The 5 Ws in the opening paragraph · Past tense all the way
through · Third person — no *I* or *we* · A quote from a witness in inverted
commas · A paragraph for each part of the story

**Years 5–6:** A headline using wordplay or alliteration · A subheading that
adds information · A formal, impersonal tone · Direct and reported speech from
more than one source · A closing paragraph that looks ahead

**Structure:** Headline · Opening — the 5 Ws · What happened · Quote · Closing

**Word bank:**
- *Openers* — Yesterday evening · Earlier this week · Witnesses report that · In
  a dramatic turn · Shortly after midday · Local residents say · According to
  police · For the second time this month
- *Connectives* — however · meanwhile · as a result · furthermore · in addition ·
  nevertheless · consequently · at the same time
- *Vocabulary* — eyewitness · incident · reportedly · investigation · alleged ·
  dramatic · scene · official · confirmed · appealed

### 13.3 Explanation (`explanation`)

**Reception – Year 2:** A title that says what you are explaining · The steps in the right
order · *because* to give a reason · A labelled picture

**Years 3–4:** An opening that says what is being explained · Present tense all
the way through · Time connectives to sequence the steps · Causal conjunctions:
*because · so that · which means* · A diagram with labels

**Years 5–6:** A general opening statement · Technical vocabulary used
accurately · The passive voice where the doer does not matter · Subordinate
clauses to pack in detail · A closing that says why it matters

**Structure:** Title · What it is · How it works, step by step · Why it matters

**Word bank:**
- *Openers* — This happens when · The process begins · Before this can happen ·
  At this stage · Once this is complete · The reason for this is · In simple
  terms · To understand this
- *Connectives* — because · so that · which means · consequently · therefore · as
  a result · in order to · this causes
- *Vocabulary* — process · stage · cause · effect · function · system · source ·
  transfer · convert · rely on

### 13.4 Persuasion (`persuasion`)

**Reception – Year 2:** A title that tells the reader what you want · Reasons for what you
think · *because* to explain a reason · Words that sound sure: *best · must ·
should*

**Years 3–4:** An opening that states your view clearly · A reason in each
paragraph · Facts and figures to back a reason up · Rhetorical questions to make
the reader think · A closing that repeats what you want

**Years 5–6:** A strong opening — a question, a statistic or a bold claim · The
other side acknowledged, then answered · Emotive language chosen on purpose ·
The rule of three for emphasis · Modal verbs to press the point · A closing call
to action

**Structure:** Title · Your view · Reason · Another reason · Answering the other
side · Call to action

**Word bank:**
- *Openers* — It is clear that · Imagine a world where · Surely nobody would
  argue · Consider this for a moment · The evidence is overwhelming · Every one
  of us · How much longer · There is no doubt
- *Connectives* — furthermore · in addition · however · above all · therefore ·
  not only that · on the other hand · most importantly
- *Vocabulary* — essential · unacceptable · vital · urgently · undeniably ·
  shocking · deserve · demand · protect · future

## 14. Verification

Browser, no test suite (§15 of the English design).

**Tokeniser** — paste a text containing `fox's`, `don't`, `"Help!"`,
`well-known`, an em dash, an ellipsis, a semicolon and a number, and confirm the
token split against §5's table. Assert whitespace is not tappable.

**Marks** — paint a phrase that crosses a comma and confirm one merged mark, not
three. Unpaint mid-range and confirm the split. Paint with item A, repaint with
item B, confirm A's mark is gone. Tap a mark with nothing active and confirm the
label names the criterion.

**Identity survives editing** — mark three criteria, then re-word a fourth,
reorder the list, and delete a fifth. The three marks must survive untouched;
only the re-worded and deleted items lose theirs.

**Bands** — set the deck to each year group in turn and confirm the reveal queue
offers the right band; toggle All bands and confirm the rest appear.

**Ticks** — confirm a marked item shows ticked with a count, that un-ticking it
keeps the mark-driven tick, and that hand-ticking an unmarked item works.

**Cover** — on the checklist, criterion text hidden, swatches visible, ticks
unaffected. On the word bank, words hidden and group labels visible. Absent on
the model text face. Switching face does not carry Cover across.

**The word bank face** — three groups render; empty a group in the editor and it
disappears; empty all three and the face itself goes, with `face` falling back to
the checklist rather than showing a blank panel.

**Supersede** (§2, rule 2) — put six words in Openers, save, then save again with
two: exactly two remain. Import a pack over a genre that has edited lists and
confirm the incoming lists replace rather than merge, both for criteria and for
the word bank.

**Hostile import** — `<img src=x onerror=alert(1)>` in a criterion *and* in a
word bank entry renders as visible text on the board and in both printed sheets;
a 500-item array clamps to 20; a 500-word `openers` clamps to 50; band `"y4"`
becomes `lks2`; `toolkit: ["a","b"]` in place of `items` loads as `lks2`;
`language: "nonsense"` (a string, not an object) yields three empty lists and a
hidden face rather than a throw; unknown keys vanish; a truncated file reports
rather than half-loads.

**Print** — poster at 400 %: sharp text, no `<image>` nodes, snippets painted
under their criterion, ellipses where clipped. The dialog opens with page 0 and
only page 0 ticked. The word bank appears as page 1 when the face is available and
is absent from the list when it is not. With a modelwrite widget on the screen
carrying both bookends, confirm its two pages join the list; with one bookend
missing, confirm neither does. Tick all four and confirm they print.

**Persistence** — reload with marks, reveals, Cover on and a mid-list active
item, and confirm all of it returns. Then hand-edit `localStorage` to break
every field in §4 and confirm the mount-time coercion recovers rather than
throws.

## 15. Open questions

1. **Superseding across a whole unit.** §2 rule 2 makes a list replace its
   predecessor inside one widget. What it does not answer is whether a teacher
   wants the *previous* version recoverable — the daily snapshot happens to give
   them that for free right now (`snapshotBefore`, and the boot-time daily copy),
   which is probably enough. Worth asking after a real unit rather than building
   version history nobody requested.
2. **The remaining eight packs.** Data-only follow-up. Worth doing after the
   four have survived a real unit, in case using them changes what a criterion
   should sound like — and now also what a word bank should hold.
3. **Snippet clipping.** §11 now clips by measured width, which guarantees one
   line per snippet. Whether one line is *enough* for a Y6 newspaper with 40-word
   sentences — or whether the snippet should wrap to two — wants a real poster at
   wall size in front of a real class before it is fixed.
