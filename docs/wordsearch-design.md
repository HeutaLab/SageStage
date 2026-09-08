# Sage Stage — Word search: topic vocabulary, on the board and on paper

**Status:** **Slice 1 shipped 7 September 2026** — the puzzle: generator, stable
grid, drag and tap-tap and keyboard finding, typed word list, Reveal, New grid.
Slices 2 (the sheet) and 3 (the sources) are still to build. The pedagogical case
is thin and this doc says so up front (§1); everything after that is about making
the thin case pay as well as it can.
**Origin:** Glenn, 2026-09-07 — "how possible is it to make a wordsearch widget for
custom topics". Answer: the puzzle is a day; the word *"topics"* is the design.
**Companion documents:** [English widgets](english-widgets-design.md) ·
[Alien Escape](alien-escape-design.md) · [Word bank](word-bank-design.md) ·
[Poster print](poster-print-design.md) · [Help system](help-system-design.md)
**Date:** 2026-09-07

---

## 1. What this is

A word search the teacher fills with their own words: this half-term's topic
vocabulary hidden in a letter grid, playable on the board and printable as a sheet.

It teaches very little reading. There is no decoding in a word search — a child
matches letter shapes without ever sounding a word out, and can find EVAPORATION
without knowing what it means. It sits nowhere on the Sound → Word → Sentence → Text
spine, so it is **not an English widget**; it goes on the games shelf beside Memory
pairs and Connect four (§11).

It is worth building anyway, for three honest reasons. Teachers ask for it — it is
one of the two or three things every board app is expected to have. It does one real
job well: repeated *visual exposure to topic spellings*, which is exactly what a
child needs before they have to spell "photosynthesis" in a science write-up. And it
is the app's cleanest printable — a letter grid is pure vector, so one widget serves
both the board and thirty sheets of paper, which nothing on the games shelf does yet.

The design's whole job is to make sure the words in the grid are **the class's own
words**, not a generic pack. A word search full of this week's actual vocabulary is a
vocabulary starter. A word search full of stock words is a worksheet from 1997.

## 2. What ships today that this inherits

Almost everything. The novel code is one placement algorithm.

- **Custom word lists** — the games shelf already solved this three times. Prompt
  cards (`app.js:7908`), Word builder (`app.js:7971`) and Memory pairs
  (`app.js:8061`) all take a `settings()` textarea, one item per line, cleaned by
  `gameLines()` (`app.js:7892`) with a fallback and an 80-item cap. This *is* the
  custom-topic input; it needs no invention.
- **Regenerate-only-when-the-list-changes** — Memory pairs stores a `pairKey` beside
  its dealt cards and re-deals only when the key stops matching (`app.js:8061`). The
  grid follows the same pattern with a `seedKey`; §5 explains why this is load-bearing
  and not just a tidiness.
- **Reading a Word bank on the same screen** — the sentence builder's `bankWords()`
  (`english-word.js:3225`) finds the screen containing *this widget's own id* and
  pulls the bank from it, deliberately not `deck.current`. Copy it verbatim.
- **Printable SVG from widget props** — `toPrintable(w)` on the def is the whole
  contract; the widget menu grows a "Print…" item the moment the method exists
  (`app.js:10344`). Phoneme tiles' sound mat (`english-word.js:88`, hooked at
  `english-word.js:1396`) is the model: build an SVG string from props, return it.
- **Games chrome** — `.game-title-row`, `.game-score`, `.game-actions`
  (`style.css:1316`) give the header and button row for free.
- `shuffled()` (`app.js:7898`) and the accent-folding `cleanWord` (`app.js:7980`)
  already exist and are both needed.

## 3. Principles

1. **The words are the class's, or it is not worth building.** Three sources (§4),
   all of them the teacher's own material. No shipped topic lists in v1.
2. **The grid is stable.** It is generated once per word list and stored. It does not
   change on resize, on reload, on a screen revisit, or when the widget is dragged.
   Children navigate this app by memory; a puzzle that reshuffles under them is a
   puzzle they lose their place in — and half-found is the normal state of a word
   search on a Tuesday afternoon.
3. **One widget, two outputs, same grid.** What is on the board is what prints. A
   teacher who solved three words with the class and then prints gets the same grid,
   not a new one.
4. **The paper is the point as much as the board.** Every decision that trades board
   polish for a cleaner sheet takes the sheet.
5. **Nothing is found by colour alone.** A found word is marked by a drawn capsule and
   a struck-through clue, in that order of importance. Hue is decoration.
6. **It says what it cannot do.** A word that will not fit is named, not silently
   dropped. (The die that lied about its dots is the standing lesson here.)

## 4. Where words come from — the "custom topics" fork

Three sources, one picker in the gear. This section is the design.

- **Typed, one per line.** The `gameLines()` textarea, exactly as Prompt cards. Paste
  a list from a planning document and it works. This is the path 90% of use takes.
- **From the Word bank on this screen.** The class harvested "meander", "erosion",
  "tributary" during the unit; Friday's word search is made of them. Same-screen
  scoping via the sentence builder's `bankWords()` precedent
  (`english-word.js:3225`) — the topic's screen owns the topic's words. This is the
  source that makes the widget part of the pipeline instead of a standalone toy, and
  it costs about fifteen lines.
- **From a genre pack's vocabulary.** `SAGE_ENGLISH_PACKS` genre entries carry
  `language.vocabulary` — ten to twelve words with a level (`english-packs.js:16`).
  A picker offering "Narrative · level 2" fills a grid with ambitious vocabulary
  during a writing unit. Cheap, since the packs already load.

**What we are not building: "type Rainforest, get words."** No local data source knows
what a rainforest contains, and the only thing that does is an API call — which breaks
the promise the whole English set rests on (nothing leaves the machine, no accounts,
no names to a model). It is not a hard *no* forever; it is a *not like that*. If the
demand is real, the route is `kind: 'topic'` packs on the existing `sage-pack@1`
envelope: shipped word lists as data, school-editable, offline, on the rail packs
already ride. That is forty topic lists of authoring work and no new architecture,
and it should only start when a teacher has actually asked for it twice.

## 5. The generator

Backtracking placement, ~60 lines, runs in milliseconds at these sizes.

1. Clean each word: fold accents to base letters *before* the A–Z filter (the exact
   trap `cleanWord` at `app.js:7980` exists for — "CAFÉ" must not become "CAF"), strip
   spaces, hyphens and apostrophes for placement, but **keep the original for the clue
   list**. "Anglo-Saxon" hides as ANGLOSAXON and reads as "Anglo-Saxon".
2. Sort longest-first, then place each: random cell, random allowed direction, accept
   if every cell is empty or already holds the same letter (overlaps are good — they
   make a denser, better puzzle). On failure, retry that word up to ~200 times; on
   total failure, restart the whole grid up to ~10 times; if a word still will not
   fit, report it by name (§3.6) and place the rest.
3. Fill the empty cells **from the letter frequency of the hidden words themselves**,
   not uniform A–Z. Uniform filler scatters Q, X and Z through the grid and the hidden
   words stand out as the only ordinary-looking letters. Sampling the words' own
   letters makes them hide properly, and costs one line.
4. Scan the finished grid — rows, columns, diagonals, both directions — against a
   small blocklist, and re-fill if anything lands. This is not fastidiousness: random
   letters on a projector in front of thirty children will eventually produce
   something that ends the lesson. Cheap insurance, done once at generation.

Direction sets are the difficulty control, named by what they do rather than by year:

| Band | Grid | Directions |
|---|---|---|
| Across and down | 8×8 | → ↓ |
| Add diagonals | 12×12 | → ↓ ↘ ↗ |
| Add backwards | 15×15 | all eight |

Grid size is a separate control, floored at `longest word + 1`; asking for 8×8 with
PHOTOSYNTHESIS in the list raises the floor and says why rather than failing.

The generated grid, the placements and the found-list live in `w.props` under a
`seedKey` derived from the word list, the size and the direction set — Memory pairs'
`pairKey` pattern (`app.js:8061`). Change the words and it regenerates; change nothing
and it never does. A 15×15 grid is 225 characters, so this is nothing against the
localStorage budget.

## 6. The board

Games-shelf sized, ~620×560. Header row (title, `n/12 found`), grid, clue list beside
or beneath it depending on aspect, `.game-actions` footer: **New grid**, **Reveal**,
and a **Hide the list** toggle.

Finding a word works two ways, and both must exist:

- **Drag** from first letter to last, with the ray snapped to the eight directions —
  fine with a mouse.
- **Tap first, tap last** — the one that matters. Dragging a finger three feet across
  an interactive whiteboard is awkward for an adult and impossible for a Year 2, and
  IWB pointer tracking loses drags constantly. Tap-tap is the touch-native gesture.

On release: a correct selection draws a capsule and strikes the clue; a wrong one
flashes the selection and clears it. No penalty, no score — this is a class activity,
not a test.

**Hide the list** deserves its own line, because it is the only setting that raises
the activity above pattern-matching: with the clues hidden, children must recall the
topic's vocabulary from memory before they can look for it. That is a genuine
retrieval-practice move, and it is one checkbox.

The grid scales with the widget rather than reflowing (§3.2) — `ResizeObserver` sets
a cell size, and below the floor the clue list drops away before the grid does. Board
mode caps at 15×15: past that it stops being legible from the carpet, and a puzzle
nobody at the back can read is a sheet pretending to be a widget.

## 7. The sheet

`toPrintablePages(w)` returning two pages: **the puzzle** (title, grid, clue list) and
**the answers** (same grid, placements ringed). Page 0 is the default tick, so a
teacher who hits Print gets the puzzle and has to deliberately ask for the answer key.
Pure text and lines — no images, no fills — so it is the cleanest vector in the app.

One finding while reading the print path: `SagePrint.openDialog` defaults to
**budget 4** — about A2, tiled across four sheets — unless a caller passes otherwise
(`print.js:28`, and the widget menu at `app.js:10360` passes no budget). That default
is right for the poster-shaped printables it was written for and wrong for a
worksheet, whose whole point is one sheet per child, thirty times. Fix: an optional
`printBudget` on the widget def, forwarded by the menu at `app.js:10360`, with the
word search setting `1`. One line in the menu, one property here, and every future
worksheet-shaped printable inherits the right default.

The widget also carries its own **Print sheet…** button in the footer — the modelled
writing precedent (`modelwrite.js:1441`) — because printing is a first-class action
here, not something buried in a right-click menu.

## 8. Settings panel

Title · Source (typed / Word bank on this screen / genre pack) · the word textarea
(when typed) · Grid size · Directions band · Hide the list · **New grid** (reshuffles
the same words into a different arrangement — the zero-prep replay for next week).

## 9. Legibility

- The grid uses `--font-ui`, so the Aa pill carries OpenDyslexic through to the letters
  (`style.css:102`). A letter grid is precisely where a dyslexia-friendlier face earns
  its keep, and it would be absurd for the one screen full of isolated letters to opt
  out of the app's own reading font.
- Found-word capsules are drawn strokes with a struck clue, never a colour wash —
  a class contains children who cannot separate the wash from the paper, and so does
  the office (§3.5).
- Letters are upper case in the grid and sentence case in the clue list, which is the
  convention every published word search uses and the one children expect.

## 10. Out of scope for v1

Timers and scoring; teams; crosswords (a different and much larger generator);
generated-from-a-topic word lists (§4); per-child randomised sheets; picture clues;
non-Latin scripts. Each returns only on a real classroom request.

Accented vocabulary — French and Spanish word lists are an obvious use — folds to base
letters in the grid and keeps its accents in the clue list. That is the honest
compromise for v1; a genuinely accented grid is a bigger change than it looks and
should wait for someone to ask.

## 11. Registration and help

One `WIDGETS.wordsearch` object in the games region of `app.js` (the Escape! decision,
for the same reason: the games shelf lives there). If the generator plus the printable
push it past ~450 lines it splits out as `wordsearch.js` on the module pattern —
script tag, fresh `?v=`, and `copy-dist.mjs` picks it up automatically because the file
list is derived from `index.html`.

One tray line beside `app.js:12747`:

```js
widgetTool('wordsearch', 'Word search', 'games'),
```

One row in `help/widgets-data.js` (that table feeds both the app's ? system and the
help site — [help system design](help-system-design.md) governs):

> `{ id: 'wordsearch', cat: 'games', name: 'Word search', blurb: 'A word search built
> from your own words — play it on the board, print it for the table.', inclass: 'Fill
> it from the word bank the class harvested this week.' }`

Sound waits for `SageSounds` ([timer design §4](timer-design.md)) — it does not exist
yet, and a word search does not need it. A soft *pling* on a found word when the engine
lands.

## 12. Slices

1. ~~**The puzzle**~~ — **shipped 7 Sep 2026.** Generator, stable grid in props, drag,
   tap-tap and keyboard finding, typed word list, Reveal, New grid. `WIDGETS.wordsearch`
   in `app.js`, one session as estimated. Two things the build changed: the size floor
   counts only words that could fit (§5 as written would have dragged the grid to 15×15
   for a word being dropped anyway), and the filler scrub turned out to be load-bearing
   rather than precautionary — measured, one unscrubbed grid in five carries a hit, and
   for a letter-poor topic list it is one in two.
2. **The sheet** — `toPrintablePages`, the answer page, `printBudget` on the def, the
   in-widget Print button. Half a session, and the half that makes it worth having.
3. **The sources** — Word bank on this screen, genre pack vocabulary, Hide the list.
   Half a session, and the half that makes it Sage Stage's rather than anyone's.

Slice 1 alone is a complete widget. Slices 2 and 3 are what stop it being generic.
