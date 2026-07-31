# Story Map — build spec (English slice 7, v1 "three faces, one spine")

**Status:** design agreed with Glenn 2026-07-30. Four decisions were pinned by him
in dialogue and are not open for re-litigation: all three faces ship in v1; the
story arc is differentiated by age and arcs are **data**, banded in the pack *and*
addressable from a named library across genres; a card on the text map **belongs
to** an arc row; the emotion graph plots named tracks, capped at three. Everything
else in this document follows from those four, from what the twelve shipped genre
packs actually contain, and from what the code already does.
Implements [english-widgets-design.md](english-widgets-design.md) §8.3 — read that
for the full story-map vision. This doc pins the v1 implementation, and it is also
the first spec for the **`arc` pack kind**, the seventh in §4.4's envelope.
**Companion documents:** [English & literacy widgets](english-widgets-design.md) ·
[Genre toolkit](genre-toolkit-design.md) · [Poster print](poster-print-design.md) ·
[Iteration log](iteration-log.md)
**Date:** 2026-07-30

---

## 1. What this is, in Glenn's terms

The shape of the writing, before any of it is written.

A unit does not start with sentences. It starts with a class retelling a model
text off a map of pictures until they own it, then boxing that model up against
their own version, and — in the older years — arguing about where the story turns
and what the character feels when it does. Three lessons, three bits of paper, and
all three are describing **the same five or six boxes**.

That is the whole argument for one widget with three faces instead of three
widgets. The boxes are the spine. The text map is the spine with pictures on it,
for retelling. The boxing-up grid is the spine with two columns, for the move from
imitation to innovation. The emotion graph is the spine laid along an axis, for the
shape. A beat added in one face is a beat in all three, because it is the same
beat, and the three can therefore never disagree about the story.

Innovation happens inside one map, in the boxing-up face's second column — the
class's version against the model, box for box, on one spine. Two maps are for
comparing two whole texts, which is a different lesson (§7.9).

The second thing Glenn was explicit about: **the arc itself is differentiated.**
A Year 1 class has beginning, middle, end. A Year 4 class has the five-part story
mountain. A Year 6 class has dilemma, conflict, choices, resolution, moral. These
are not the same list with rows hidden — `Beginning` is not `Opening` with the
wording softened — so the arc has to be data that comes in named, whole shapes,
and it has to arrive pitched at the year group without a teacher going looking.

## 2. Scope

**In:** all three faces. The plan library and the banded plans in the packs. The
spine authoring rail (rename, add, reorder, delete-when-empty). Pictures on beats, on the map face and on the boxing-up chips.
Up to three named lines on the graph. Three printed sheets. The vocabulary strip,
and its words editable in the gear. The plan swap, without a matcher.

**Out of v1, and the one cut worth arguing about:** the swap's **matcher**. The swap
itself ships. A plan may be replaced whole until the map holds a plotted value or a
typed "Our version" cell — beats do not close that window (§6) — and what lands is the
dumbest rule that loses nothing: every beat keeps its order and goes into the new
plan's **first box**, with a toast naming the count from §6's one template:

> 11 beats moved to Opening — use Move to box to sort them.

The cut is the clever half. A matcher would recognise the outgoing "Build-up" in the
incoming "Build-up" by `key`, then by wording, so most beats stayed where they already
were. That is a convenience for the bulk case, not a capability: the hand route *after*
the swap is **complete** — Move to box ▾, one beat at a time, id-preserving, zero
possible loss — and the class is standing at the board while it happens, so the sorting
is the boxing-up conversation rather than an interruption to it.

What the cut buys is that the one path in this widget that could orphan a beat stays
**closed**, not half-built: nothing is matched, so nothing can be mis-matched, and
"nothing but a hand ever deletes a beat" holds by construction rather than by a matcher
being correct.

Beats do not close the window, because locking on the first beat buys nothing. The
right spine is a property of the **text**, not of the year group, and a teacher does not
always know which she wants until the beats are down — the beats are how she finds out.
A lock at the first beat makes a reversible decision permanent before it is informed,
and sends her to rename five boxes by hand to reach a shape one tap away. Of the two
failures that is much the more expensive, and it fires in the ordinary case rather than
the hostile one.

For scale: the genre toolkit is also three faces, also one pack rail, also two
sheets, and it is 930 lines (`english-text.js:833-1762`). This slice is smaller
than that because the swap matcher, the arc file rail, both drag engines, the icon
set, the undo bin and every measured-layout path are all out. §12 lists everything
deferred with its reason, and everything **refused** — which is a different thing.

## 3. Vocabulary, settled once

One thing carrying two names is the drift that let one print action carry four
labels, and that made "Name lists" and "Class lists" the same feature
([iteration-log.md](iteration-log.md), 2026-07-30).

| Surface word | Code word | Why |
|---|---|---|
| **plan** | `arc` | Nobody in a primary staffroom says "arc". |
| **box** | `row` | The packs' own key, and the teacher's own phrase — *boxing up*. Not "row", which is a spreadsheet word. |
| **beat** | `beat` | Same word both sides. Not "card": `card` is this app's word for objects on a freeform mat (`wb-card`, `sb-card`), which these deliberately are not. |
| **line** | `track` | What a class calls the thing on a graph. |

Widget: **Story map**. Faces *and* sheets: **Text map** · **Boxing up** ·
**Emotion graph** — the identical string in the pill, the print label, the sheet
heading and the dialog title. No face carries the widget's own name: "Story map"
as a pill inside a widget titled Story map is the collision, not the fix. §8.3
already calls the first face "Text map" (`english-widgets-design.md:490`).

One concept in this widget deliberately has **no** surface word: `armed`, the one line
the axis step chips write to (§7.5). The face states it by filling the legend chip's
swatch and thickening its border, and no chip, panel, hint, toast or sheet anywhere
says the word — a class does not need a name for which line it is working on, it needs
to be able to see which one it is. A fifth row in the table above would be a staffroom
word invented for a thing nobody says aloud, which is the drift this section exists to
stop running the other way.

No control appears in both the bar and the gear.

A count spoken to a class is a **numeral**, on every face and in every toast and
refusal: "11 beats moved to Opening", "Steps has 6 beats". Each such message is one
template with the count substituted (§5.1, §6), never a sentence rewritten per branch,
and the numeral is what lets it stay one template — spelling counts as words needs a
number-to-words pass up to 96 that nobody would audit, and it would put the same
quantity in two registers beside the axis numerals of §7.5.

## 4. The plans

### 4.1 Two homes, one shape

A plan lives in one of three places, and all three normalise to the same object:

1. **A genre pack's own `arcs`** — one optional new key, authored into the five
   story-shaped genres (narrative, recount, diary, playscript, poetry).
2. **The library** — a bundled pack of kind `arc`, the seventh kind in §4.4's
   envelope, holding named shapes that work across genres. This is what makes
   Glenn's "a UKS2 dilemma arc on a recount" possible.
3. **Derived from the genre's existing `structure`** — untouched, read as a plan at
   run time. This is what means **no shipped data has to move.**

```js
{ format: 'sage-pack@1', kind: 'arc', id: 'plan-shapes', name: 'Plan shapes',
  author: 'Sage Stage',
  note: 'Named plan shapes that work across genres. Our own wording; National '
      + 'Curriculum terminology is Crown copyright under the Open Government '
      + 'Licence v3. No published scheme’s phrasing appears. A plan ships boxes, '
      + 'never beats.',
  arcs: [
    { id: 'beginning-middle-end', name: 'Beginning, middle, end', band: 'ks1',
      shape: true, genres: ['narrative', 'recount', 'diary'],
      rows: [ { box: 'Beginning', hint: 'Who it is about, and where they are' },
              { box: 'Middle',    hint: 'What goes wrong' },
              { box: 'End',       hint: 'How it is sorted out' } ] },
    { id: 'five-part-story-mountain', name: 'Five-part story mountain',
      band: 'lks2', shape: true, genres: ['narrative', 'recount', 'playscript'],
      rows: [ { box: 'Opening',    hint: 'Who, where, when — and a reason to read on' },
              { box: 'Build-up',   hint: 'Something starts to go wrong' },
              { box: 'Problem',    hint: 'The moment it all goes wrong' },
              { box: 'Resolution', hint: 'How it is put right' },
              { box: 'Ending',     hint: 'How things are now, and what changed' } ] },
    { id: 'dilemma-arc', name: 'Dilemma, conflict, choices, resolution, moral',
      band: 'uks2', shape: true, genres: ['narrative', 'diary', 'playscript'],
      rows: [ { box: 'Dilemma',    hint: 'The choice the character is left with' },
              { box: 'Conflict',   hint: 'What pulls them each way' },
              { box: 'Choices',    hint: 'What they could do, and what it would cost' },
              { box: 'Resolution', hint: 'What they choose, and what happens' },
              { box: 'Moral',      hint: 'What the reader is left thinking' } ] },
  ] }
```

The five-part library plan's boxes are **deliberately byte-identical** to
Narrative's `structure`: same wording, therefore same keys, therefore the pass-2
matcher will match all five and move nothing. Until it lands that identity buys nothing
at swap time — v1's first-box rule cannot tell an identical spine from a different one
and pools the beats either way, which is the honest price of having no matcher and the
single strongest argument for landing one. It earns its place in the library by being
addressable on a *recount*.

Authored plan fields: `id` slugged and capped; `name` ≤ 60; `band` per §4.2;
`rows` ≤ `GT_CAP.struct` (12) of `{box, hint}` with **no ids** — those are minted at
copy-in; `genres` ≤ 12, a **sort key for the picker and never a filter**, because
decision 2 is explicitly that a dilemma plan goes on a recount, and an affinity
that reads as a gate is the kind of key a later reader "fixes" into a restriction.
Unknown keys are dropped by construction.

### 4.2 Banding, and what absence means

One rule, written once in the normaliser:

```js
band = raw.band == null ? null
     : (GT_BAND_IDS.includes(raw.band) ? raw.band : 'lks2')
```

**Absent or null means "offer at every year group."** A present-but-unrecognised
value (`'y4'`, `'ks2'`) falls back to `lks2`, which is the shipped treatment of a
bad *item* band (`english-text.js:156`) — so absence and error stay two different
statements. A derived pack plan **always** gets `band: null`.

This matters more than it looks. `gtBandFor` returns null for an unset year group
and its own comment says null means *offer every band* rather than *offer none*
(`english-text.js:30-33`), and both deck factories create `yearGroup: null`
(`app.js:146`, `app.js:180`) — so "no year set" is the common case, not the edge.
Coercing null to `lks2` would hide every genre's own spine from every KS1 and UKS2
deck's picker: the one plan that must always be on offer.

Out-of-band plans are filtered **out of the offered set, never deleted**, with
`p.allBands` as the escape hatch on the picker — the toolkit's own precedent.

Absence has to **say** so on the face. The band chip reads the plan's band, and
`gtBandName` returns the empty string for a null one by construction
(`english-text.js:81`) — so an unguarded chip renders an **empty pill** beside the plan
name on all three faces, which reads as a rendering fault rather than as a fact about
the deck. The chip's own lookup over `GT_BANDS` therefore falls back to **"No year
group set"**: not blank, and not a guess at a year group nobody set.

Because a year-less deck is the common case, adding a Story map to one also raises a
**one-time** toast naming the consequence — "No year group on this deck — the plan is
the genre's own, not one pitched at the class" — with the fix one place away, the deck's
own "Set year group…" (`app.js:10190`). It fires from the seed, the one function that
has already asked the question and been told null (§4.3), and it is one-time **per
deck**, keyed `'smNoBand:' + deck.id` through `D.getPref`/`setPref` behind the shipped
`typeof` guard (`modelwrite.js:753`, `:795`), because `defaults()` also runs once per
templated widget from `instantiateTemplate` (`app.js:10861`) — a plain toast would fire
for every story map in an opened template, and a machine-wide flag would silence a fact
about *this* deck because a different deck once raised it. A deck with a year group says
nothing at all.

### 4.3 Seeding: explicit and terminal

```js
function smSeedArc(p) {
  const g = smGenre(p);
  const band = gtBandFor((D.deck() || {}).yearGroup);     // may be null
  const own = g && (g.arcs || []).find((a) => band && a.band === band);
  if (own) return smCopyArc(own);
  if (g && g.structure.length) return smPackArc(p);       // band: null
  const lib = smLibArcs();
  return smCopyArc(lib.find((a) => band && a.band === band)
    || lib.find((a) => a.band === 'lks2'));               // always exists
}
```

Four branches, and the chain **cannot bottom out** — which is what makes
"after seeding, a spine always has at least one box" an invariant, so no face needs
a spine-less empty state and no `+ beat` needs a dim state. Branches 3 and 4 exist
because `gtBlank` ships `structure: []` (`english-text.js:212-215`): without them,
a blank or structure-less imported genre returns zero rows and the re-seed fires
forever.

Seeded **once**. Never re-seeded from the year group on a later mount, which would
be a silent spine change with no confirm. A **swap** is the opposite kind of event —
a hand, in the gear, with a toast that names what moved — so §6 governs it and this
rule does not touch it. "Seeded once" is a statement about mount, never a claim that
the plan is fixed for the unit.

Banding the packs is not optional dressing. Extracting all twelve today: **not one
has an `arcs` key**, and every `structure` is a single mid-KS2-pitched plan —
narrative is Opening | Build-up | Problem | Resolution | Ending. Without §4.1's
authoring, a Reception–Year 2 deck seeds "Resolution" and the whole
age-differentiation decision delivers nothing on day one, with the band chip
reading "Reception – Year 2" beside a plan that is not for them.

### 4.4 `shape`: the graph is absent when the plan is not a story in time

**Eight of the twelve shipped structures are text plans, not arcs.** Letter is
Address and date | Dear… | Why I am writing | The detail | What happens next |
Sign-off. Instructions is Title | What you need | Steps | Tips | The result.
Promoting `structure` to "the arc" without looking at what the twelve structures
*are* gives a Year 4 class writing an explanation of the water cycle an **Emotion
graph** whose bands read Title | What it is | How it works | Why it matters, with a
ghost dot inviting them to say how sad "Why it matters" is.

So an arc carries `shape: true` when its boxes are story time. The Emotion graph
pill **and its print sheet** are absent when the live plan does not carry it, and
`p.face === 'graph'` falls back to `'map'`. Library plans declare it; a derived plan
gets it from `SM_SHAPE = new Set(['narrative','recount','diary','playscript','poetry'])`.

The flag lives on the **arc**, never derived from the genre id — otherwise decision
2 breaks, because a UKS2 dilemma plan dropped on a recount must bring its graph with
it. Precedent for hiding an inapplicable face: the toolkit hides its word-bank face
entirely rather than showing empty lists (`english-text.js:906-908`). "No face
hidden for emptiness" still holds — this is inapplicability, not emptiness.

### 4.5 The `arcs` key lands in five places, in one commit

Three is not enough, and the third is the one both a normaliser-only fix and a
read-only test miss:

| # | Where | Consequence of missing it |
|---|---|---|
| 1 | `english-packs.js` | no data |
| 2 | `gtNormalize`'s returned shape, `english-text.js:189` | dropped at load |
| 3 | **`gtCopy`, `english-text.js:204-211`** | **`gtDefaults()` returns `gtDefaultCache.map(gtCopy)` and `gtCopy` builds field-by-field — `id, name, items, structure, language, model` and nothing else — so no widget ever sees a bundled pack's arcs** |
| 4 | `gtBlank`, `english-text.js:212-215` | `g.arcs` is `undefined`, not `[]` |
| 5 | `gtPackOf`, `english-text.js:226-233` | a teacher's own "Save as a file…" silently strips every plan on the way to disk — invisible until next term |

The arc library gets its **own** module-level cache (`smLibCache`, filtered
`kind === 'arc'`) handing out a fresh-row-id copy on every read, mirroring
`gtDefaults`/`gtCopy`: two story maps on one plan are two independent lesson
artefacts. `gtDefaultCache` and `GT_FACE_PAGE` are not widened.

## 5. Data model

Registered inside `english-text.js`'s existing `register()` — see §10.

### 5.1 Caps

One table, extending the existing `GT_CAP` at `english-text.js:26-29`, because
"a cap that lives somewhere else is a cap nobody audits".

```js
spine: 16,      // boxes a LIVE spine may hold. struct(12) is what an AUTHORED plan
                // may declare; 16 is the props ceiling, so a hand-edited store's
                // extra boxes never take their beats down with them. Two numbers
                // because they are two claims.
arcs: 16,       // plans in one library pack
affin: 12,      // genres[] entries per plan
beats: 6,       // beats per BOX. 6 × spine(16) = mapBeats(96) exactly, so on a spine
                // the class built by hand the total can never bite before the per-box
                // cap. A SWAP pools every beat into one box (§6), and that is the one
                // state where the total bites first — see the prose below.
mapBeats: 96,
beat: 140,      // = WB_TEXT_MAX (english-word.js:523): a beat and a word-bank line
                // clip identically
note: 140, cell: 400,
track: 24,      // = wbLabel's cap (english-word.js:542): a short label on a
                // coloured block
axisWord: 24,   // per axis step (§7.5). The same number as track(24) and a separate
                // entry, for the reason spine and struct are two numbers: this one is
                // measured against a fixed axis gutter and must hold a bilingual pair
                // (sad / حزين), where track's is measured against a legend chip. One
                // entry would mean a later edit to a legend re-caps the axis.
open: 1,        // beat panels open at once. A cap of ONE, and the only cap in this
                // table satisfied by a WRITE rather than by a refusal: opening a
                // second beat's panel RE-TARGETS the open one (§7.2), so the cap can
                // never be reached and never has to speak.
pic: 64 * 1024,       // encoded data-URL chars per picture (= WB_IMG_MAX)
picFloor: 14 * 1024,  // refit floor; below it the picture is DROPPED (= WB_IMG_FLOOR)
```

`p.tracks.length === 3` is **not** a cap. It is a shape. Writing it into `GT_CAP`
invites "relaxing" it, and the index *is* the hue.

Six beats per box, and **no band ever re-spaces itself.** The seventh is refused
with "Steps has 6 beats — the next one wants a box of its own", which teaches the
boxing-up move rather than just blocking. The alternative — re-pitching a populated
band and toasting that it has — moves dots the class is reading, which is precisely
what spatial stability exists to prevent.

`beats`(6) caps **creation and moves** — it never governs a beat that already exists.
A swap lands every beat in one box (§6), so a five-box map with eleven beats leaves the
first box holding eleven: the face renders all eleven, `mapBeats`(96) is the only total
that could bite, and the next `+ beat` in that box is refused until they have been
sorted out. Which is why the refusal speaks the count the box **actually holds** rather
than the cap, from one template — `<Box> has <n> beats — the next one wants a box of its
own`, so "Steps has 6 beats" and "Opening has 11 beats" are one string and not two —
because a box over the cap told it has six is a widget contradicting the screen in front
of the class. Reading the cap as a licence to drop the seventh beat of a swap would make
it the one thing in the widget that deletes the class's work.

### 5.2 Props

```js
w.props = {
  src: 'narrative',   // genre pack id | null. Set in the GEAR only. Colour via
                      // gtLook(p.src), NEVER stored, so a renamed or imported genre
                      // falls to the neutral card (english-text.js:72, :1597-1601).
                      // There is NO genre object here: one helper,
                      //   smGenre(p) = gtDefaults().find(g => g.id === p.src) || null
                      // is the only reader, and every arc fn takes p.
  vocab: ['glanced', 'hesitated', 'trembling'],
                      // COPY of that genre's language.vocabulary. Copied, not read
                      // live, so snapshots and undo capture it free — and so an
                      // edited pack cannot change the class's chips mid-unit.
                      // TEACHER-EDITABLE in the gear (§7.6): add, remove and
                      // reorder; a hand edits this COPY and never the pack.

  // ===== THE SPINE — shared by all three faces =============================
  arc: {              // The OBJECT is never replaced; its ROWS are — see §6.
    src: 'five-part-story-mountain',   // library id · 'pack:narrative' · null
    name: 'Five-part story mountain',  // reads IN FULL in the face header, wrapping
    band: 'lks2',     // 'ks1' | 'lks2' | 'uks2' | null  (§4.2)
    shape: true,      // these boxes are a story in TIME  (§4.4)
    rows: [
      { id: 'r_a1',   // D.uid(). The ONLY thing beats, cells and values reference.
        key: 'opening',  // deduped slug of the AUTHORED wording. Read by nothing in
                         // v1 — see §5.4.
        box: 'Opening',
        hint: 'Who, where, when — and a reason to read on',
        edited: false }, // a HAND changed box or hint. Gear only.
    ],
    // ORDER IS MEANING on all three faces and all three sheets, but no INDEX is
    // ever a reference — which is exactly what makes reordering a box safe.
  },
  allBands: false,

  // ===== THE BEATS — shared by all three faces =============================
  beats: [            // ONE FLAT array. Box membership and order are FIELDS, not
                      // array positions, so the whole shift-on-delete class of bug
                      // cannot occur.
    { id: 'b_1',
      row: 'r_a1',    // BOX ID, never an index. A beat whose row is not live is an
                      // ORPHAN: it stays byte-identical and renders in the tray.
                      // MOUNT NEVER FILTERS THIS ARRAY BY ROW ID.
      ord: 3.5,       // sort key WITHIN its box. Insert writes a fractional midpoint
                      // so no sibling's stored ord is rewritten. A PLAN SWAP is the
                      // one act that rewrites every ord (§6), and it may, because the
                      // boxes those ords were relative to have ceased to exist. ord IS the whole
                      // stored position: no x, no y, no mat clamp anywhere, because
                      // layout is GENERATED — two beats can never coincide by
                      // construction rather than by arithmetic. Contrast wbFreeSlot
                      // (english-word.js:563-593), which exists only because the
                      // word-bank mat is freeform.
      t: 'The wolf watches from the trees',   // cap 140. SINGLE LINE — a newline in
                      // an SVG <text> renders as a space, not a break.
      img: null,      // data URL, via D.pickImage(cb, SM_PIC_W) — POSITIONAL
                      // callback FIRST (app.js:8797). Shares ONE fixed thumb area
                      // with the empty ghost frame, so a picture arriving can never
                      // change the footprint.
      note: '',       // cap 140. ON THE BEAT, not on a dot: written on the graph,
                      // found on the map, printed on both. Three lines must not give
                      // one beat three notes.
      vocab: ['trembling'],  // tapped from p.vocab, cap 4, non-exclusive.
                      // NEVER pruned against p.vocab, which is now editable (§7.6):
                      // a word the class chose and attached is typed work, not
                      // derived state, and the strip losing it changes nothing here.
                      // MEMBERSHIP ONLY — no score, rank or "temperature" is stored
                      // or derived. The packs carry no valence data.
      v: { t_1: -2 }, // emotion values by TRACK ID. Sparse. A BEAT IS THE DOT, so
                      // the graph adds no id space, and deleting a beat takes its
                      // values with it.
    },
  ],

  // ===== THE LINES =========================================================
  tracks: [           // EXACTLY THREE SLOTS. Length is ALWAYS 3.
    { id: 't_1', name: 'the story', on: true },  // slot 0 → --sm-t1, circle
    null,                                         // slot 1 → --sm-t2, square
    null,                                         // slot 2 → --sm-t3, triangle
  ],
  // THE INDEX IS THE HUE, THE SHAPE AND THE LEGEND POSITION. filter(Boolean),
  // splice, sort and pop are BANNED. Slot 0 is seeded by defaults(), never by a tap.

  armed: 't_1',       // THE ONE ARMED TRACK (§7.5). An id, never a per-entry flag:
                      // three flags can say two lines are armed and this state cannot
                      // hold two. Mount RESOLVES it — an id that is not a live and
                      // VISIBLE track falls to the first visible track in slot order,
                      // slots walked 0,1,2 with holes skipped and never a compacted
                      // copy. If a track is live but none is visible, the first live
                      // track is armed and its `on` set true, because a chip with no
                      // destination and a ghost with no colour are the same bug. null
                      // only when all three slots are holes.

  cells: { r_a1: { model: '', ours: '' } },   // BOXING UP, keyed by ROW ID

  face: 'map',        // 'map' | 'box' | 'graph' — SM_FACES, the ONE vocabulary
  view: { map: { top: 0 }, box: { top: 0 }, graph: { top: 0 } },   // per face
  open: ['b_1'],      // AT MOST ONE beat id — GT_CAP.open is a cap of 1. The panel
                      // RE-TARGETS rather than stacking (§7.2), so order carries
                      // nothing: insertion order is no longer a stacking order and no
                      // reader may treat it as one. Still an array, so a hand-edited
                      // store holding four ids coerces by PRUNING rather than by
                      // type-testing — and mount empties it either way (§5.5).
  coverMap: false, coverBox: false, coverGraph: false,   // ONE FLAG PER FACE
  steps: 7,           // 5 (−2..+2) ks1, 7 (−3..+3) lks2/uks2
  axisWords: ['as happy as it gets', 'happy', 'a bit happy', 'all right',
              'a bit sad', 'sad', 'as sad as it gets'],
                      // ONE STRING PER STEP, TOP FIRST (§7.5), seeded from
                      // SM_AXIS_WORDS[steps]. Cap 24 each; '' is legal and renders as
                      // the NUMERAL alone. length === p.steps is a SHAPE, not a cap —
                      // as with tracks, and for the same reason. A store carrying
                      // axisTop/axisMid/axisBot and no axisWords is read ONCE here:
                      // those three words take the top, middle and bottom seats, the
                      // rest are '', and the three old keys are then dropped like any
                      // other unknown key. Guarded by the ABSENCE of axisWords,
                      // because a migration that runs on every mount overwrites the
                      // class's own wording with the old defaults.
  size: 1, hints: true,
};
```

Deliberately **not** in props: beat `x`/`y` (layout is generated); arrow geometry
(a pure function of `row` and `ord`); ink or strokes (`#drawLayer` owns the pen,
`app.js:11914`); `p.bin`; `p.feel`; `p.orphans`; `p.arcSrc`; `SM_FACE_PAGE`; any
model-column seed key; any tick or progress state; the editor's current target
(module-local).

Three of those are worth their reasons. **`p.cells` not `p.box`**, because
`p.box[rowId]` collides with `row.box`, which is the box's own name. **`arc.src`
inside the arc**, because a sibling field is two writes and two chances to disagree
about which plan the rows came from. **`b.v` rather than `beat.emo` + `beat.track`**,
because the latter makes a beat belong to exactly one line, which makes decision 4
unrepresentable.

### 5.3 `tracks` is three slots with holes kept

The failure this prevents is on the record: mount's `filter(Boolean)` collapsed a
positional pair, so filling "The broken one" first **promoted the broken sentence
into the "Done right" slot** on the very next remount — the error presented as the
model ([iteration-log.md](iteration-log.md), sentence-builder V0.1). Here it would
silently turn the class's green "wolf" line orange.

Four deliberately redundant defences, because a fixed-length array with nulls looks
like a bug to anyone who has not read why: the comment on the field names
`filter`/`splice`/`sort`/`pop` as banned; the gear renders all three slots
**including the empty ones**, so the holes are visible in the UI and not only in
the data; `tracks: 3` is deliberately absent from `GT_CAP`; and verification check 9
plants `[null, {name:'Wolf'}]` and asserts Wolf renders **orange**, so a future
compaction fails a written check rather than shipping as a cosmetic tidy.

`on` lives **inside** the entry rather than in a sibling hidden-ids array, because
an array needs pruning against live track ids and a boolean does not.

Arming lives **outside** the entries, as one id at props level, for the mirror-image
reason: `on` is three independent truths and `armed` is one, and one truth stored in
three places is a state that can say two lines are armed at once. It is resolved by
walking slots 0, 1, 2 and skipping holes — never `find` on a compacted copy, which is
the same tidy under another name. So check 9 also asserts that with a hole in slot 0,
Wolf in slot 1 is the **armed** line and its ghost dots are orange: a compaction that
promoted Wolf to slot 0 would recolour every ghost as well as the line, and now fails
twice.

### 5.4 `key` and `edited` ship in v1 even though nothing reads them

Identity cannot be back-filled. `key` is by definition the slug of the wording *as
authored*; added in pass 2 it would be computed from wording a teacher has since
renamed, and the first swap would match the wrong boxes — losing the whole point of
splitting reference identity (`id`) from match identity (`key`) for every map built
in pass 1. `edited` records a hand event that has already happened by the time pass
2 ships. `from` does **not** ship, because nothing is **carried** in v1 — and nothing is carried
because nothing is matched (§6): the first-box rule has no unmatched row to carry and no
outgoing plan name worth recording against one. It is the matcher's field (§12.1), not a
v1 omission.

### 5.5 Mount coercion

`smCoerce(p)`, before first paint, field-by-field so unknown keys are dropped by
construction — never a spread of the parsed value. In order: `src` and `vocab`;
`arc` mutated in place through `smNormArc(p.arc, true)` then seeded if row-less;
`tracks` forced to exactly length 3 (a non-object becomes **a hole, not a shift**);
`armed` resolved against the visible set (§5.2), which needs `tracks` settled first;
`beats` rebuilt through one `smBeat(raw)`; `cells` rebuilt as an object over live
row ids (an array input is rebuilt, never read positionally); `open` **pruned empty**
rather than filtered against live beat ids — a map opens showing the map (§7.2),
which is both the stronger statement and the one no stored shape can defeat; `face` whitelisted against `SM_FACES` and demoted from `graph` when
`!arc.shape`; `view`; then the scalars, `steps` before `axisWords` because the word
count **is** the step count — and the one read of a legacy `axisTop`/`axisMid`/
`axisBot` store (§5.2) happens inside that field's own coercion and nowhere else.

**`smNormArc(raw, keepIds)` is never asked whether a box "holds something"** — it
does not receive the beats. With `keepIds: false` (a file or a bundled default) it
caps rows at `struct` (12), drops empty-box rows, and mints a fresh id and deduped
key for each. With `keepIds: true` (props) it caps at `spine` (16) and **never drops
a row** — an empty box falls back to `'Box ' + (i+1)`, which is `wbLabel`'s index
fallback (`english-word.js:542`) — keeps a string id ≤ 40 chars, re-mints duplicates
against a `seen` set, and **never restores an id by position**. That last is
`gtNormalize`'s own recorded near-miss (`english-text.js:133-138`): restoring ids by
position "silently re-points a highlight at a different criterion the moment the
normaliser drops one empty line."

Giving the normaliser a rule it cannot implement from its own arguments is how a
normaliser ends up dropping a row and its beats together. Everything that needs to
know about beats — orphan handling, cap toasts, the tray — happens in `smCoerce`,
which has them.

### 5.6 Orphans go in a tray

A beat whose `row` is not a live row id stays in `p.beats` byte-identical and
renders in a named **"Beats with no box"** strip at the top of the map face, inside
that face's one scroller, each with a one-tap "Put in ▾". It is not a drop target
and nothing in it is ever deleted. In v1 it is reachable only from a hand-edited
store, because no hand path can create an orphan.

The tray adds no rows, so it interacts with no cap: it is a filtered *view* of
`p.beats`, and the mount path is "no `filter()`" and nothing else. The rule above
it is the invariant: **nothing but a hand ever deletes a beat.** The toolkit prunes
reveals, ticks and marks against the live id set because those are *derived* state
(`english-text.js:884-892`); a beat is *typed work*, and the opposite rule applies —
invisible but safe beats deleted.

`p.beats = p.beats.filter(b => rowIds.has(b.row))` is one line and it is the
erase-resurrect class of bug. A separate `p.orphans` array is a second store of
beats that every sweep, cap and print builder must remember, and forgetting it once
is the silent delete again.

### 5.7 One `hasWork`

```js
const smPlotted = (p) => (p.beats || []).some((b) => b && b.v
                            && Object.keys(b.v).length);
const smTyped   = (p) => Object.values(p.cells || {}).some((c) => c
                            && (c.model || c.ours));
const smAxisSet = (p) => (p.axisWords || [])
                            .some((s, i) => s !== SM_AXIS_WORDS[p.steps][i]);

function smHasWork(w) {
  const p = w.props || {};
  return smPlotted(p) || smTyped(p)
    || (p.beats || []).some((b) => b && (b.t || b.img))
    || ((p.arc && p.arc.rows) || []).some((r) => r.edited)
    || (p.tracks || []).some((t, i) => t && i > 0 && t.name)
    || smAxisSet(p);
}
```

This gates the only undo a teacher gets, and nothing else: `snapshotBefore` returns
early unless `widgetWorthKeeping` (`app.js:9034`), which defers to `def.hasWork`
(`app.js:9003-9007`). The swap window is a **second, narrower** test — `smSwapOpen`
in §6, which is `smPlotted` and `smTyped` and no other clause. `smPlotted` and
`smTyped` are lifted out and named rather than inlined twice for the reason §8 gives
about presence: one restatement drifting looser is how the wrong sheet got ticked.

The two tests are two because the swap destroys nothing, and they ask different
questions. `hasWork` asks *is there anything here worth being able to get back*, and a
beat with three words in it plainly is. `smSwapOpen` asks *would replacing the boxes
lose a reading*, and the same beat is not: it keeps its id, its text, its picture, its
note, its vocabulary and its place in the order, and only its box changes. Folding them
back into one test is the drift to watch for, because the symmetry is inviting and what
it costs is a teacher told she may not change the spine on the grounds that she has
typed one beat.

`smAxisSet` is a comparison against `SM_AXIS_WORDS[p.steps]`, the banded default table
`defaults()` seeds from (§7.5), and not a truthiness test: every fresh map ships seven
non-empty words, so `.some(Boolean)` would make every map hold work and every gear apply
take a snapshot — which is the question that fires every time. Seven agreed axis words
are the same kind of authored wording as twelve box names, and a class that has renamed
its axis for a text about danger has done work that a later `steps` change can take
away.

Including `edited` rows is what stops a gear session authoring twelve box names and
hints, which is real work and the only work the authoring rail exists for, from
counting as *no* work and taking no snapshot on the one apply that replaces every one
of them. Authored wording is also where the two tests stand furthest apart: twelve
edited boxes do **not** shut the swap window, because replacing boxes is what a swap
is *for*, but they do make the snapshot fire — so the swap goes through and the twelve
names sit in 💾 behind it.
Excluding "a plan exists" is required because a fresh map always has one, and "a
question that fires every time teaches a teacher to click straight through it,
costing exactly the work it means to save".

### 5.8 The def

`w: 1120, h: 620`. Height first, because it is settled: 620 is modelwrite's measured fix
for running under the dock, and `addWidget` sets **`y`** to
`clamp(80 + n * 26, 0, window.innerHeight - def.h - 120)` (`app.js:8969`), where the 120
is that dock. It does not move.

The **width** is the number carrying the work. A label gutter plus two readable columns
at 25px board text is what 900 buys, and the Model column carries a fixed thumb on every
chip (§7.4), so those two columns need the width back — and width is the only lever that
shortens every row on every face at once (§7.2). 1120 is what makes the widget land
**whole** on a 1366-wide laptop stage: `x` is
`clamp(80 + n * 30, 0, window.innerWidth - def.w - 40)` (`app.js:8968`), so the placement
ceiling there is 1366 − 1120 − 40 = **206px** and every pixel of the widget is on the
mat. `addWidget` clamps `x` and never `w` (`app.js:8968-8970`), so a default past 1326 —
where 1366 − 1326 − 40 = 0 — arrives at `x: 0` with its right edge off the mat and only
the grip to bring it back. That makes this the widest default in the app — the class
shop is 980 (`app.js:1771`) — which is the honest consequence of a three-column face,
not an oversight.

Whether 1120 carries the characters per line a real six-box recount needs is
verification check 3's measurement, not this document's guess, and if it fails the width
rises first (§14.1).

## 6. The arc-change safety rule

The single most dangerous moment in this widget. One setter, **two** gates — the
snapshot's `hasWork` and the narrower swap window, which are deliberately not the same
test (§5.7) — and an authoring rail that is id-preserving by construction.

```js
function smSetArc(p, next) {          // next = { src, name, band, shape, rows }
  if (p.arc && typeof p.arc === 'object') Object.assign(p.arc, next);
  else p.arc = next;
  return p.arc;
}
const smSwapOpen = (w) => {           // may the boxes still be replaced whole?
  const p = w.props || {};
  return !smPlotted(p) && !smTyped(p);   // §5.7's two named clauses, and no others
};
```

**Mutate, never replace,** with the *complete* key list every time — the "nothing
of the old plan survives" guarantee depends on the list being exhaustive, not on
`Object.assign`, which does not delete absent keys. `p.arc = next` anywhere is the
bug: `settings()` captures a reference and `api.refresh()` is save-plus-remount
*without* rebuilding the panel, so replacing the object at mount left an open panel
editing an orphan whose edits vanished, while the same code pruned the live state
against the orphan's new ids (`gtSetGenre` and its own comment,
`english-text.js:217-225`).

A builder pointed at `english-text.js` for this pattern will find **two shipped call
sites that do the opposite** — `p.genre = def;` at `:957` and `:1715` — so: only
`gtOpenPack` (`:807`) uses `gtSetGenre`, and `paintPick` is not the model to copy.

**The swap window.** `smSwapOpen` is the gate on the gear's picker and it is
deliberately *not* `smHasWork`. Beats do not close it. Two things do, each for its own
reason:

- **A plotted value.** The dot rides on its beat and would survive a swap intact, but
  the *shape* would not: every dot lands in one band, and the line the class argued
  about across five boxes reads as one vertical smear. On that face the reading is the
  work, not the numbers. This closer also earns something for nothing — because a value
  shuts the window, a swap can never strand values on a plan carrying no `shape`, so
  the graph face cannot go from under stored values (§4.4) and there is no
  unreachable-value case to write.
- **A typed cell.** `p.cells` is keyed by **row id** (§5.2), and a beat can be
  re-pointed at another box where a cell cannot: there is one first box and up to
  sixteen cells. The rule is spoken as "a typed 'Our version'" because that is the cell
  the class fills and the one that fires in a real lesson; `model` sits in the same
  store under the same key and would be rebuilt away by step 4, so the test reads both
  — a closer that ignored `model` would make the swap destroy a typed Model line, which
  is the one thing this pass is not allowed to do.

While the window is open, applying a plan is one pass through `smSetArc`, with no
confirm:

1. `smSetArc(p, next)` — the whole spine, mutated in place, rows arriving with fresh
   ids from `smNormArc(raw, false)`.
2. Every beat's `row` is re-pointed at the new **first** box. Nothing is filtered,
   nothing is compared, and no beat is examined for anything except its place in board
   order. §4.3's chain cannot bottom out, but that is a statement about **seeding** and
   not about an arbitrary incoming plan: a plan the picker offers has come through
   `smNormArc(raw, false)`, which **drops empty-box rows** (§5.5), so an authored plan
   whose every box name is blank normalises to **zero** rows. A row-less plan is
   therefore **refused before step 1**, naming it — a swap with nowhere to put the beats
   is the one path left that could orphan every beat in the map, and "nothing but a hand
   ever deletes a beat" is the invariant it would break.
3. `ord` is rewritten `1..n` in the **outgoing board order**: spine order, then `ord`
   within each box. This is the one place a stored `ord` is rewritten and the one place
   it is safe to, because the boxes those ords were relative to have ceased to exist and
   the sequence preserves exactly what the class was reading, left to right and top to
   bottom. §5.2's fractional-midpoint rule is about **insert**, where a sibling whose box
   still exists must not be touched.
4. `p.cells` is rebuilt over the new row ids, empty — which destroys nothing, because
   the window was open.
5. `p.face` demotes from `graph` to `map` when the incoming plan carries no `shape`, the
   same demotion `smCoerce` performs at mount (§5.5). A face whose pill has just gone is
   not a face to leave a class looking at.
6. One toast, from one template — `<n> beats moved to <Box> — use Move to box to sort
   them.` — so §2's example and §13's assertion are the same string. It reads "1 beat
   moved to Opening — use Move to box to sort it." at one, because a widget that
   miscounts aloud in front of a class is not trusted about the things nobody can check.

**A swap needs no snapshot of its own.** Nothing is destroyed: every beat keeps its id,
its text, its picture, its note, its vocabulary and its position in the order, and the
box wording it stops pointing at is precisely what the teacher has just asked to have
replaced. The general snapshot still fires on the same apply whenever `hasWork` is true,
because that is what §5.7 gates — but the swap is not the act that makes an undo
load-bearing, so there is no bespoke pre-swap capture to get wrong, and no confirm for
anyone to learn to click through.

Once the window is shut the picker still lists every plan, and tapping one names what
shut it, because a refusal without a reason is indistinguishable from a broken control:

> The class's feelings are plotted on "Five-part story mountain". Re-word or add boxes
> below instead.
>
> "Our version" is typed against these boxes. Re-word or add boxes below instead.

**The spine still evolves,** one box at a time, in the gear, always id-preserving:

- **rename** — mutate `row.box`/`row.hint` in place; keep `id` **and** `key`; set
  `edited`. Beats, cell and points stay attached.
- **add** — push `{ id: D.uid(), key, box, hint: '', edited: true }`, where `key` is
  the slug of the typed box name **deduped against the keys already in this spine**
  (a suffixed counter), because two boxes named "Detail" must not share a match
  identity. Refused past `GT_CAP.struct` with the count spoken.
- **reorder** — move the array entry. Beats ride along, because coordinates are
  box-relative; nothing re-flows and nothing is recomputed.
- **delete** — **refused** when the box holds a beat, a cell string or a value:
  "Build-up holds 3 beats and a typed 'Our version' — move those first." Refusing
  rather than confirming means nothing is lost, so nothing needs a confirm, and
  there is no confirm to learn to click through.

Every gear apply opens with the staleness guard (`english-text.js:1654-1664`):
if `p.arc !== arc`, toast "The widget changed — reopening these settings" and
refresh. A beat delete lives only in that beat's own panel — the tap that
opens the panel, then Delete inside it — and takes
`D.snapshotBefore(w, 'Story map')` behind the `typeof` guard, with no confirm. The
armour is not a tap count: a second tap on the beat itself **closes** the panel
(§7.2), so the only tap in the widget that deletes a beat is a named control on that
beat's own panel, with a snapshot sitting in 💾 behind it. Nothing about that is
reachable by a stray pat, and there is still no confirm to learn to click through.

**Prohibited in any pass:** matching or restoring rows, ids, beats, cells or values
**by array position.** Designer-drafted "keep them in order" mapping — old row *i* to
new row *i* — is **refused, not deferred**: five-part → dilemma would put the Opening's
beats under "Dilemma" and the Ending's under "Moral", read aloud to a class as their
plan and printed as their plan. A guess dressed as a placement is worse than no
placement, because nobody checks it.

The first-box rule is **not** that rule, though the two look adjacent. Positional
matching asserts that old row *i* corresponds to new row *i*. The first-box rule asserts
nothing: it puts every beat in one visible place, under a box name that is obviously not
an answer, and hands the sorting to the class. Index 0 is where the beats are **kept**,
never what they are **matched to** — the only position-shaped thing about it is that the
holding box is the first rather than the last, because the first is the one already on
screen. When the matcher lands (§12.1) it matches on `key`, then on case-folded `box`,
from a consumed pool, and never on either row's index.

## 7. The three faces

### 7.1 The bar, and one row of it

Fixed membership, byte-identical across all three faces:

```
[ Text map | Boxing up | Emotion graph ]  ···grow···  [ Cover ] [ Print… ]
```

Three reasons for one row. **Chrome:** `.mntray` contributes only `gap: 7px` plus
named selectors (`style.css:3023-3038`), so a new class inherits nothing; three bar
rows at board scale would eat ~140px of a 620px widget, and the boxing-up face is
only ever used whole. One row plus a ~28px header is ~70px. **Child reach:** the bar
is the last child, i.e. the bottom (`english-text.js:918`), and the lower half is
reserved for children's hands — choosing a unit's plan shape is a teacher's act at
whatever hour it happens — §6's window stays open until the class plots a feeling, so
it is not only a pre-lesson act, and it is a child's act at no hour at all. Which is
why the sibling toolkit's genre swap is in the gear
(`english-text.js:1721-1725`). **The plan's name is content, not a control:** every
face renders a header strip at its top carrying the full plan name (wrapping, never
truncated) and the band chip — which reads "No year group set" when the plan
carries no band, never an empty pill (§4.2) — because children read both to know
what they are about to do. The **picker** lives in the gear. With the picker there, the bar's plan name
is a label and there is no duplicate.

Rejected: `[ Arc: <name> ▾ ]` on the bar — the widget's whole spine on one tap, in
child reach, and a control that stops doing its job mid-unit the moment the class
plots a feeling, and can then only refuse (§6). And a category word in
a fixed-width pill is both the truncation failure and the category-word failure.

**Cover is one button on all three faces, reading a different flag on each.** Its
membership in the bar never changes and it never moves; only its pressed state and
which flag it writes. Three buttons would change the bar's width per face; one flag
shared between faces is the recorded regression below.
`coverMap` covers beat **text** and leaves the pictures and box labels standing —
which is the retelling routine, and what makes the picture decision load-bearing
rather than decorative. `coverBox` covers the "Our version" column. `coverGraph`
covers the beat labels under the plot. One flag per face is the verified precedent
and its reason: a shared Cover "also blanked the word bank the class was writing
from" (`english-text.js:896-902`).

**A face's flag reaches a beat panel opened on that face.** While `coverMap` is on,
a panel opened from a beat renders that beat's text and its note covered too; while
`coverGraph` is on, so does a panel opened from a dot. Without that the recall
routine has a hole in it exactly where a child looks — a tap on a covered beat
serves the wording straight back, and a class learns to tap rather than to remember.
The panel's own furniture is never covered: the axis chips, the vocabulary strip and
the move buttons stay legible, because Cover hides what the class is recalling, not
the controls the teacher is working with.

### 7.2 No measured layout, no pointer capture, and one panel

**No `api.onResize`, no `ResizeObserver`, no measured pixel.** The map and
boxing-up faces are CSS — flex and grid inside `container-type: inline-size` on
`.sm-face`, container queries for the beat footprint and type step, `clamp()` for
sizes, line-clamp for beat text. The emotion graph is **one** SVG with a viewBox
sized from the row count, so gridlines, band separators, dot positions and the step
positions all come from one coordinate space by construction.

Because every one of those container queries reads **inline** size, the quantity that
decides whether a face reads is its **width**, not its height. The query that lets a
beat's footprint and type step grow is the same one that shortens every row in every
band at once, and the boxing-up grid has three columns to fit before it has a single
row. Width is therefore this widget's size lever (§5.8, §14.1); height only buys the
map another band.

`api.onResize`'s hook is only invoked from the resize-grip handlers (`app.js:9394`,
`:9399`), and `resizeToFit` (`app.js:9180-9190`) mutates `w.w`/`w.h` and saves
without touching it — so anything depending on it is stale at mount and after
⋮ → Resize to fit. The right answer is not to call it twice more; it is to need no
measurement. One SVG coordinate space is the strongest form of the handwriting-rules
lesson — two systems with no shared reference made "whether a word sat on a line a
coincidence of widget height" — because there is only one system.

**⋮ → Resize to fit cannot measure this widget, and is left unable to.**
`resizeToFit` reads `.widget-body`'s `scrollWidth`/`scrollHeight` and adds 26 and 46
(`app.js:9184-9185`), and `.sm-face` is the **one** scroller (§7.8) — so every overflow
is inside the scroller and the body's scroll box never exceeds its client box. The item
is therefore not measuring content at all, and it is **not** a no-op: `.widget-body` is
a border-box flex child of a 1px-bordered `.widget`, so its `clientWidth` is `w.w - 2`,
its `scrollWidth` equals that, and the item sets `w.w = w.w + 24` — the body's own
12px-a-side padding (`style.css:361-368`), added on every press until it clamps at
`window.innerWidth - 20`. Pressing it three times widens the widget 72px and tells the
teacher nothing about whether the face reads. Pointing it at `.sm-face` instead means a
per-widget fit target in `app.js` — a new app-wide seam, with every widget in the app to
re-verify against it, in place of §10's one additive line — so it is recorded as deferred
(§12.13) rather than taken here. What the item cannot do, **width** does: the grip and
the size lever are where a face that does not read gets fixed (§14.1). This is already
the shipped behaviour of the sibling toolkit, whose `.gt-face` scrolls the same way
(`style.css:5570-5577`); it is named here because a control that quietly inflates a
widget is a bug report a builder spends an afternoon on.

**No pointer capture anywhere in v1.** Beats move by buttons in their own panel:
Move left, Move right, Move to box ▾, Duplicate, Delete, writing a fractional
midpoint `ord`. Emotion values are set by **tapping an axis step chip** in the
beat's panel, and the chip writes to the **armed** line and to no other (§7.5) —
which is the whole of what a tap can mean here, and why tap-to-set needs no target
picker of its own.

The button mirror is mandatory, not optional: "a hidden handle on a small target is
not findable on an interactive whiteboard, and a hold-and-drag on a wall-mounted
board is not something to make anyone depend on" (`modelwrite.js:1780-1786`). Once
the mirror exists and layout is generated, a drag can only express reordering, which
the buttons do exactly and reversibly. For dots the drag would be both the primary
and the unreliable route: seven steps in a ~300px plot is 43px of pitch against this
project's own 72–96px board floor.

Cutting both removes from v1 the 7px threshold, ghosts, landing gaps, dock
rect-testing, `pointercancel`-as-abandonment, the second-`pointerId` guard, the
single-pointer lock, and the 120-pass idempotence obligation. Tap-to-set is
idempotent by construction.

**One beat panel, and three ways to shut it.** A panel closes when its own beat or its
own dot is tapped again, and on a close control on the panel itself at the board target
floor (§9): the tap that opened it, the tap that reads as putting it back down, and a
named control for a hand that has learned neither. Opening a second beat's panel
**re-targets** the open panel rather than stacking a new one, so `open` holds at most one
beat and there is no stacking order left to reason about (§5.2). On mount it is pruned
empty (§5.5): a map opens showing the map.

A beat plotted on two lines has two dots and still **one** panel — either dot opens it
and either dot closes it again — because the panel belongs to the beat, which is where
the note, the text and every track's value live (§5.2). Per-line panels would give one
beat two notes, which is the thing `b.v` exists to prevent.

At ks1 a pat is a tap, and four stray pats bury the face; a cap of four records the
burial and states nothing about clearing it. Re-targeting also halves the look-away cost
of plotting a line: open once, then tap along the band, reading the chips rather than
hunting a close control between every beat.

### 7.3 Text map

Boxes as labelled bands down the face in spine order; beats left to right inside
their band in `ord` order. Each beat is a fixed footprint: a thumb area (a ghost
frame when empty), its text wrapping to three lines, and a chevron to the next beat
generated from `(row, ord)`.

**`+ beat`, one per band.** Each band carries a `+ beat` control at the end of its row,
at the board target floor (§9). It creates an empty beat at the end of that band's order:
ghost picture frame, empty text, no value on any track, no vocabulary. The beat exists
before anything is known about it, which is the order the class supplies — name the
event, then say what it looks like, then say how it feels.

This is the most-used control in the widget. One press per event as the class calls them
out, and eleven in a prep session on a five-box plan — which is why it sits in the band
it writes to rather than in the gear, and why it is sized as a target a child hits from
the front of the mat. It is never dimmed: at six the press answers with §5.1's refusal —
"Steps has 6 beats — the next one wants a box of its own" — which teaches the boxing-up
move, where a dead control teaches nothing and a class reads it as the map being full.

**`+ beat` appears on the text map face only.** The boxing up face has no beats of its
own — its Model column is a *view* of this face's beats (§7.4) — and the emotion graph
plots beats without authoring them, which is why its empty plot names this face rather
than carrying a control that would have to guess a band (§7.7).

Pictures ship; the icon glyph set does not. `D.pickImage((dataUrl) => {…},
SM_PIC_W)` with the word bank's shipped discipline: cap the **encoded** data-URL at
`GT_CAP.pic`, refit down toward `picFloor`, and **drop the picture rather than store
it oversized**, keeping the beat and its wording (`english-word.js:617-659`). The
whole-map budget is probed, never quoted.

The reason pictures rather than glyphs: `english-widgets-design.md:116` marks the
Text grain ○ for Reception and Year 1, and §8.3 says the map sheet is the retelling
prop "a child who can point at the map can retell" from, going home in a book bag.
A text-only grid is not that. Eight or sixteen abstract glyphs cannot say
"Grandma's cottage", "the wolf" or "the woods". The fixed thumb area is built now so
adding glyphs later cannot change a beat's footprint.

### 7.4 Boxing up

Box column (name, with the pack hint small beneath), **Model** column, **Our
version** column.

The Model column is a **view** of that box's beats as read-only chips via one
`smBeats(p, rowId)` — a view, so no beat is authored on this face and no band here
carries a `+ beat` (§7.3) — plus one editable `p.cells[rowId].model` line that is empty by
default and replaces the chips — on screen *and* on paper — when a teacher types
one. `p.cells[rowId].ours` is the only cell the class fills.

**Each Model chip carries its beat's picture.** `b.img` renders in the same fixed thumb
area §7.3 builds, at the same height, on the face **and** on the printed sheet; a chip
with no picture renders the ghost frame at that same footprint, so a row's height is a
function of its chips' count and wording and never of how many of its beats happen to
have a picture. The data is already on the beat (§5.2) — nothing is stored, re-encoded,
refitted or budgeted a second time, and a picture taken on the map face is on the
boxing-up sheet without a further act. Typing into `model` replaces the chips and
therefore their pictures, on screen and on paper, which is a teacher's own act and
leaves the map face's pictures where they are.

Without this, boxing up would be the widget's only picture-free surface, and it would
fall on the day the class makes the story its own — excluding, for one lesson, exactly
the children the map face includes by construction. `english-widgets-design.md:116`
marks the Text grain ○ for Reception and Year 1: a child who has planned off pictures
all week does not stop needing them the moment the grid grows a second column.

**No seeding, no prefill, no re-seed key.** That removes two whole bug classes at
source rather than capping around them: a derived re-seed key truncated shorter than
the string it named failed its own comparison after every remount, and the
all-or-nothing deal rule exists because a partial deal re-dealt after room was made
duplicated exactly what had fitted. With nothing dealt and no key, both rules are
honoured by having no such state, and flipping faces can never cost the class's work.

**This face is the move from imitation to innovation.** §8.3 puts the bridge on the
boxing-up grid in its own words (`english-widgets-design.md:492-494`) and §1 repeats it,
and the mechanism is the two columns on **one** spine: the model on the left, the class's
version on the right, box for box, both answering the same box name and the same hint.
Everything that lesson needs is on this face or one tap from it — the typed `ours` that
prints (below), the class's own words beside it (§7.6), and the graph's slot-1 line for
plotting *ours* against the model's own boxes. And nothing written in the right-hand
column touches the beats the class has been orally rehearsing from all week: `ours` is
its own string per box (§5.2), so on Friday the model map is still the model map.
Comparing two *whole* maps is a different job with a different control (§7.9).

**The typed `ours` prints.** Per box, the sheet shows the typed text where there is
text and ruled writing room where there is not. Without this, a teacher plans with
the class, prints, and hands out a sheet with the agreed plan missing — the sheet
omitting the one thing that qualified it to exist. The app's own rule for this
ambiguity is "a filled cell updates, a blank cell leaves well alone".

### 7.5 Emotion graph

Up to three named lines; boxes as labelled bands along x; beats as the dots inside
them. Tap a dot to open **that beat's** panel — the same panel as on the map, and the
same *one* panel: a dot re-targets it rather than stacking a second, tapping that dot
again closes it, and a beat plotted on two lines has two dots and still one panel
(§7.2). Inside it the axis step chips and the vocabulary strip sit next to each other,
because the teaching move is the **adjacency**: the class has just put this beat at −3
and the words it chose for this text are right there (§7.6).

The axis is banded like everything else: `p.steps` is 5 (−2..+2) for ks1 and 7
(−3..+3) for lks2/uks2, defaulted from the deck's year group, gear-editable. Seven
gradations is a KS2 scale; KS1 emotion work runs on three or five faces, and five
keeps a shape where three cannot. A deck with **no** year group gets seven, the same as
lks2: §4.2's null means *offer everything*, never *assume the youngest*, and a KS2 class
handed a five-step axis loses two gradations it will not think to look for, where a KS1
teacher meeting seven lowers it in the gear before anything is stored to move.

Lowering `steps` confirms **only** when a stored value or an edited axis word would go,
naming both counts, because moving a 3 to a 2 is not reversible by tapping back. Words
are matched to steps by **value, never by index**: seven becoming five drops the words
agreed at +3 and −3 and leaves the rest at the values they named, and five becoming seven
mints two empty strings at the new outermost values.

**`p.axisWords` is one editable string per step** — five at ks1, seven at KS2 — capped at
`GT_CAP.axisWord` (24) so a bilingual pair fits (sad / حزين). An empty string is legal
and renders as the numeral alone. Index 0 is the **top** step and the last is the bottom,
the order the axis reads on the face, so the value a word names is
`((p.steps - 1) / 2) - i` and no second array is needed to say which is which.

**Every step chip and every axis label carries its numeral beside its word**, on the face
and on the sheet. The numeral is the one cue that survives a reader who has neither the
default wording nor the class's replacement, and it is what makes an unworded step usable
rather than blank.

The defaults are `SM_AXIS_WORDS`, a ladder round one middle word a class actually says,
banded by step count: at ks1 "very happy", "happy", "all right", "sad", "very sad"; at
KS2 "as happy as it gets", "happy", "a bit happy", "all right", "a bit sad", "sad", "as
sad as it gets". Not "even", which is not a word a Year 2 class uses about a character.
The gear's axis block carries the hint that says the rest: **the axis words are the
class's to change** — a text about danger wants safe and trapped, not happy and sad.
Banding the defaults by step count but never by register is how a teacher meeting a text
with little emotional range concludes the face is not for that book; and a banded axis
with three words leaves two of five steps at ks1, and four of seven at KS2, with no name
at all — a step that cannot be named cannot be proposed, argued over, or agreed.

Line hues are `.smwidget`'s own literals `--sm-t1: #1d4ed8`, `--sm-t2: #ea580c`,
`--sm-t3: #047857` — the app's measured widely-separated set, re-declared because
`--wb-t1/2/3` are scoped to `.wbwidget` with no fallback (`style.css:4396-4398`) and
would resolve to nothing here. They stay widget-internal literals and must never
become `var(--ink)`, because `applyTheme` re-declares `--ink` per widget; and the
printed SVG emits raw hex, because a `var()` in an SVG string is meaningless.
`GT_COLS` is not borrowed: it is an eight-**fill** register legible with dark slate
on top (`english-text.js:84-100`), and #fcd34d as a 5px stroke on white is close to
invisible. Second and third cues are dot **shape** (circle, square, triangle) and
the line's name printed at its last dot — not dashes or weight, which are lost in a
school laser's greyscale.

**Exactly one visible track is armed at any moment.** Axis step chips write to the armed
track and to no other; ghost dots render in the armed track's colour (§7.7); and a beat
panel names the armed track above its chips, so no tap is ever a guess. `p.armed` holds
its id (§5.2).

Show and hide is a legend chip on the face, because it is a live teaching move and the
legend is content — and the chip carries **arming as well as visibility**:

- Tapping a visible, unarmed chip **arms** it.
- Tapping the **armed** chip hides its line; arming passes to the next visible track in
  slot order.
- Tapping a hidden chip shows it **and** arms it.

One stated exception: **the last visible line's chip does not hide.** A graph with
nothing visible has no destination for a chip and no colour for a ghost, so the tap that
would empty the face does nothing instead — which is also the state `smCoerce` repairs in
a hand-edited store (§5.2), and it is better not to have a control that reaches it.

A single-track map is unambiguous by construction: slot 0 is armed and stays armed, and
ks1 never meets the concept. Hiding a line costs two taps when it is not the line being
worked on; re-showing costs one, which is the direction that matters — the reference line
flashes back for a child losing the shape without a gear trip and without a name being
named.

The legend is on this face, so arming changes here and only here. On the map face the
beat panel names the armed line above its chips, and that naming is the whole of what a
teacher needs: a value set on the map is read on the graph, where the chip that would
change the arming is one pill away.

The armed chip is marked by a filled swatch and a heavier chip border. Static, per §7.10
and §12.12 — no pulse, no motion.

Arming is what gives the face's central verb a destination, and the control that carries
it is already on the face: the teaching move — you may not copy a line you cannot see —
and the authoring move are then the same gesture. Naming, adding and removing lines are
in the gear.

### 7.6 The vocabulary strip

`p.vocab` renders as read-only tappable chips **in the beat's panel**, next to the
axis steps the class has just set. Tapping attaches or detaches a word on that beat,
cap 4, non-exclusive — a word can belong to several beats, which is what makes ten
words enough for a unit. Attached words **print** under their beat on the map sheet
and inside the Model column on the boxing-up sheet.

The strip renders in a second place: on the **boxing up** face, beside the "Our version"
cells — one strip clamped at the head of that column, not a copy in every row, because
width is this widget's size lever (§14.1) and one list is one memory of the talk rather
than eleven of them. It is clamped as furniture on §7.7's rule, since the words must not
follow the grid into a scroll on the one lesson they are for. Clamped means it holds its
own band at the head of the column and the grid scrolls **under** it: the band wraps to
two rows and then scrolls inside itself, because furniture that grows eats the face it is
furniture for, and this is the face with three columns to fit before a single row. It
prints in the same place on the boxing-up sheet, above the grid and never inside a row,
so it cannot reach the row height the ruling is measured from (§8). Boxing up is the
lesson where the class actively chooses its own words, so it is the one face that must
show them.

The Model chips are read-only **views** of beats (§7.4), not beats, and the strip beside
them belongs to no one of them: **nothing on this face opens a beat panel or attaches a
word.** Attaching happens in a beat's panel, reached from the map or the graph, and
nowhere else — which has to be said out loud now that a chip carries its beat's picture
(§7.4) and therefore reads, at board size, exactly like the tappable beat it is a view
of.

**The words are the class's, so the gear edits them.** Narrative ships ten — `glanced`
through `sank` (`english-packs.js:115-116`) — pitched at one year group and chosen for
nobody's text in particular, while every real book a class reads supplies better ones. So
`p.vocab` takes add, remove and reorder in the gear: one textarea, one word per line, the
toolkit's own shipped language editor (`english-text.js:1648-1652`, applied at
`:1695-1698`), where typing adds, deleting a line removes, moving a line reorders, and
order in the box is order on the strip. Capped as at creation and by the same numbers —
`GT_CAP.word` (60) per word, `GT_CAP.lang` (50) entries (`english-text.js:26-29`) —
because a second table is a cap nobody audits (§5.1). Non-exclusivity is what keeps such
a list short: the words a class chooses for one text run to ten or a dozen, so 50 is the
props ceiling and never a target. The pack's `language.vocabulary` stays the **seed** and
is copied once (§5.2), so editing the copy cannot reach the genre pack, a re-imported
pack cannot change a class's chips mid-unit, and every snapshot carries the class's own
list for free. The words themselves are read-only wherever they render: a chip's text
changes in the gear and nowhere else.

Attached words are **not** pruned against the strip. `b.vocab` holds bare strings, and a
word the class chose and attached is typed work, not derived state: removing "trembling"
from the strip removes it from what can be tapped next and leaves every beat already
carrying it rendering and printing exactly as before. That is §5.6's rule again, and
deliberately the opposite of what the toolkit does to its reveals and ticks
(`english-text.js:884-892`) — those are derived, this was a choice a class made out loud.

The widget never labels, scores, ranks or colours a word as hot or cold. The packs
carry no valence data anywhere — narrative's `language.vocabulary` is a flat
ten-string array — so any temperature displayed would be invented, and a machine
verdict on word choice becomes the model. The teaching move is the **adjacency**,
not a scale.

And a chip is a **bare orthographic form**. "trembling" on the strip is a run of letters;
what makes it teachable is the teacher saying it aloud, using it in a sentence about this
beat, and asking who else in the story could be trembling. The oral gloss is the entire
scaffold, and none of it is in the widget. So the strip is a **memory of the talk, not a
teacher of the word**: it holds what was said so the class can find it again next lesson
and on the sheet that goes home, and it claims nothing about whether the word is
understood. A strip nobody has talked through is decoration, and the widget cannot tell
the difference — which is the honest reason it prints what was attached and never a count
of it (§7.10).

§8.3 names "the vocabulary temperature it wants" as the graph's teaching move, so
cutting the strip would drop a spec'd feature; but a teaching move whose output has
vanished by the next lesson is worse than none, which is why it prints.

An empty `p.vocab` is a legitimate state — a genre with no vocabulary list, none chosen,
or a teacher who has cleared the box in the gear to build the list from this text
instead — and the strip is then simply absent, from the beat panel and from the
boxing-up face alike. It is never an empty frame. The gear's box is there whether the
list is empty or not, so clearing the strip is never a state a hand cannot get back out
of.

### 7.7 Empty states

The map's empty box shows its pack `hint` as a ghost whisper at a **fixed 19px on a
fixed 34px face base**, gone the moment a beat lands. Those numbers are the measured
fix for a fallback that made the *empty* state shout, and for em-sized furniture
inflating past the mat into a scroll.

The graph's empty state is every beat as a **hollow ghost dot on the zero line in the
armed line's colour** (§7.5), sitting in that line's own lane, and the line joins only
**placed** dots, skipping ghosts. A line drawn through unplaced beats would assert
feelings nobody chose — and it prints. A ghost renders only for the armed line and only
where that line has no value, so a ghost and a placed dot can never coincide: one slot,
one lane, one value. The **sheet carries no ghosts at all** — arming is a face state, and
a hollow dot on the zero line reads on paper as a plotted zero to anyone who was not in
the lesson. That is the one place a face and its sheet differ, and §8 names it as an
exception rather than leaving it to be rediscovered.

A face with **no beats at all** is a different state, and only one face can answer it.
`+ beat` lives on the text map (§7.3), so the graph's empty plot says where beats begin —
"Beats start on the Text map" — instead of ghosting dots it does not have, or carrying a
control that would have to choose a band on the class's behalf. That line is an empty
state and not the cue line rejected below: it is addressed to a face with no content, and
it is gone the moment the first beat lands.

**Every dot of track *n* sits at a fixed horizontal lane within its band:**
`(slot - 1) * SM_DOT_D`, where `SM_DOT_D = SM_DOT_R * 2` is one dot diameter, computed in
the same coordinate pass as the gridlines. The offset applies **always**, not only where
two lines share a value. A dot's position is therefore a pure function of
`(beat, value, slot)`: no dot can move because another line changed, and none moves when
a hidden line is re-shown.

Three lanes claim `2 * SM_DOT_D` of the horizontal pitch between adjacent beats, so the
beat pitch inside a band has a **floor of `3 * SM_DOT_D`** — below it slot 2 of one beat
sits right of slot 0 of the next and the lines read as crossing where they do not. Six
beats in a band at that floor is what the viewBox is sized from (§7.2), alongside the row
count.

A **conditional** offset would be the one violation of this widget's own creed that
nothing the class is reading moves, and it would fire constantly rather than rarely: a
text where two lines converge — the common case in a moral arc — trips it on every beat
of the convergence. A full diameter of separation is also what stops the circle and the
square reading as one blob from the back tables. The lane is still a **hit-testing** fix
first: distinct shapes help reading and do nothing for tapping, and two characters
commonly share a value at the same beat — both at −3 in the crisis — which is the word
bank's named worst outcome reappearing, "the one underneath is a word the class cannot
see, tap or drag back out".

**No instruction text on any face.** A stage-coloured cue line was built once and
rejected on sight. Box labels, axis words with their numerals, the legend and the
boxing-up face's vocabulary strip (§7.6) are clamped as furniture, because furniture
never follows content into a scroll.

### 7.8 One editor

One persistent `<textarea class="sm-editor">`, built once in mount, parented to the
widget **body outside every repaint zone**, and **moved** over whatever is being
typed into — a boxing-up cell, a beat's text, or a beat's note. `input` commits
nothing; change, blur, Tab (commit and step), Escape (revert) and Ctrl/Cmd+Enter
(commit and stay) commit, and a commit repaints only that text node. Its target is
module-local state, not props.

Refocus-after-rebuild was tried and rejected as insufficient: a repaint from any
other source — a resize mid-word — still ate the caret. One element widget-wide
means there is exactly one place in the widget where focus can be lost, which is
the thing worth getting right once. Beat text and notes are single-line; only
`cells[].ours` keeps line breaks.

The editor **stops accepting** at its target's cap and says so: `GT_CAP.cell` (400) over
an "Our version" cell, `beat` and `note` (140) over a beat's text or its note, and
`axisWord` (24) over an axis word in the gear. The keystroke or the pasted tail that would
pass the cap is refused with the cap spoken, and **nothing is ever clipped on commit.**
Clipping at the props door is right for a hostile store (§5.1); clipping words a hand has
just typed is not the same act at all — a teacher who watches two sentences commit as one
and a half cannot tell a cap from a bug from a lost save, and the half she loses is the
half the class agreed.

`.sm-face` carries `min-height: 0; overflow: auto` and is the **one** scroller, as
`.gt-face` does (`style.css:5570-5577`), because `.widget-body` already scrolls
(`style.css:361-368`) and a scroller inside it is a second touch surface fighting
the first on a board. Never `touch-action: none` on it.

### 7.9 Duplicate compares two whole maps

A story map is copied whole by the existing ⋮ → Duplicate (⌘D, `app.js:9222`, `:9287`,
definition at `:9137`), which copies props wholesale, so two independent maps cost zero
new code. What two maps are **for** is comparing two whole maps: this text against
another in the same genre, this year's class against a map kept from last year's, the
model as the teacher planned it against the map the lesson actually produced. Each copy
is a complete lesson artefact with its own spine, its own beats and its own lines, and
neither can change the other — which is the whole value, and also the whole limit.

**Duplicate is not the imitation-to-innovation path.** That path is the boxing-up face's
two columns on **one** spine (§1, §7.4), where §8.3 puts it in its own words
(`english-widgets-design.md:492-494`). Innovation is box-for-box against the model, and
the comparison only holds while both columns are describing the same box. A duplicate
puts the class's version on a **different** spine, one whose boxes can be renamed,
reordered or deleted apart from the model's; the moment that happens nothing lines up to
compare, on screen or on paper, and the two sheets a child holds are two different plans.
So the gear's hint names both jobs in those words — compare two maps here, innovate in
the second column there — because a teacher reaching for Duplicate at the innovation
lesson has reached for the wrong control and will not find out until the second sheet
prints.

Two things in this widget are called Duplicate, which §3 would normally forbid: the beat
panel's **Duplicate** copies one beat inside its own box (§7.2), and ⋮ → **Duplicate**
copies the widget. Neither name is ours — one is the app's shipped ⋮ item and ⌘D, the
other is the app's word for the same act on a smaller object — so they are told apart by
where they are, a beat's own panel against the widget's own menu, and no gear or hint
text says "Duplicate" without naming what it copies.

### 7.10 Nothing marks a box or a plan done

No tick, no per-box completion state, no "x of y boxes planned", no progress, no
praise, no count of beats presented as achievement — on any face and on any sheet.

The lesson is on the record in full: a criterion ticked itself the moment it had a
highlight and the poster printed that tick, so the working wall went up with all
eight boxes ticked three weeks before any of it was taught — "the one place the
widget made a claim in front of a class that was not true, and it came from putting
'we found this in the model' and 'we can do this' in the same box". A filled "Our
version" cell is evidence of shared writing, not a claim of independent capability,
and the sheet goes home.

## 8. Printing

Page kinds **are** face ids, so there is nothing to desynchronise:

```js
const SM_PAGES = [
  ['map',   'Text map',      smMapSvg],
  ['box',   'Boxing up',     smBoxSvg],
  ['graph', 'Emotion graph', smGraphSvg],
];
const SM_FACES = SM_PAGES.map((r) => r[0]);        // the ONE face vocabulary
```

The toolkit needs `GT_FACE_PAGE` because its faces (list/text/bank) and pages
(poster/text/bank) genuinely differ (`english-text.js:722`). Here they do not, so
the map would be furniture whose only function is to drift: with a face of `'grid'`
against a page kind of `'box'`, `indexOf` returns −1 and `print.js:752` clamps it
into range, so the boxing-up face silently pre-ticks the map sheet. That is the
wrong-sheet root cause exactly.

Presence is **the same named function**, called from the builder's first line and
from `smPageKinds` — not a restated condition, because one restatement being looser
is how the wrong sheet got ticked:

```js
const smLive   = (p) => new Set(((p.arc && p.arc.rows) || []).map((r) => r.id));
const smHasMap = (p) => smLive(p).size && (p.beats||[]).some((b) => smLive(p).has(b.row));
const smHasBox = (p) => smLive(p).size && (smHasMap(p)
                   || Object.entries(p.cells||{}).some(([k,c]) => smLive(p).has(k)
                        && c && (c.model || c.ours)));
const smHasGraph = (p) => !!(p.arc && p.arc.shape) && smLive(p).size
  && (p.beats||[]).some((b) => smLive(p).has(b.row) && b.v
       && (p.tracks||[]).some((t) => t && t.on && b.v[t.id] != null));
```

`printCurrent` is the shipped form (`english-text.js:863-866`), `i < 0 ? 0 : i` —
**not** `|| 0`, because `(-1) || 0` is −1 and only 0 is falsy.

**Geometry.** All three sheets 1000 × `max(content, 1414)` — one aspect, so no
ticked combination can disagree about orientation. "A multi-page job prints every
page into one @page box, so the whole job shares one sheet orientation — openDialog
plans page 1 freely and forces the rest to agree" (`print.js:123-128`). Titles
through `gtHead`. Every teacher- and pack-supplied string through `xmlEsc` after
`gtStr` has stripped C0 at the props door. Internal ids get a per-render counter,
because the same sheet can render four times into one document.

**Order on paper is board order, never pack order:** both the face and the sheet
read the same `smBeats(p, rowId)`.

**One stated exception, and it is a subtraction.** The face draws ghost dots and the
sheet does not (§7.7). A ghost is a function of which line is **armed**, and arming is a
face state with no meaning on paper: a hollow dot on the zero line reads to anyone who
was not in the lesson as a feeling the class chose. Nothing else differs, and nothing is
drawn on paper that the face does not have — which is why this is recorded here, beside
the rule it is an exception to, rather than discovered twice in two builders' heads.

The three sheets, and what each is *for*:

- **Text map** — boxes as labelled bands down the sheet, beats left to right inside
  their band, beat text full size, picture beside its beat, scene note under it in
  lighter ink, attached vocabulary under that. This is the one that goes home in a
  book bag. No hints, no ticks, no counts.
- **Boxing up** — box column with its hint, Model column (chips **with their
  pictures**, or the typed `model`), an "Our version" column carrying the typed text
  where there is text and **ruled** writing room where there is not, the rules drawn
  from the same pass that measured the row height (ks1 and lks2; off at uks2), and the
  class's own vocabulary strip clamped at the head of that column, above the grid and
  never inside a row (§7.6). This is the sheet a child writes on. Ruling it is safe
  here — and only here — because a shared reference exists: the row height is already
  measured from the Model column's wrapped chips, and a chip's thumb is a **constant**
  in that measurement (§7.4) — a picture and a ghost frame occupy the same box — so a
  half-illustrated map rules identically to a fully illustrated one, and the lines a
  child writes on do not move with picture coverage.
- **Emotion graph** — the plot with boxes as bands and beats as dots, every dot in
  its own lane (§7.7), up to three named lines, each axis step labelled with its
  **numeral beside its word** — the numeral alone where the class left the word empty —
  a swatch-**plus-wording** colour key so the sheet stands alone, and each plotted
  beat's text listed below against its band. No ghosts, per the exception above. This
  is the discussion poster.

**Control.** "Print…" last on the bar, pinned right, ghost weight, always present,
never conditional on the face; the ⋮ item stays. Toast "Print engine not loaded"
when `window.SagePrint` is absent; one try/catch around both calls; "Nothing to
print yet" on an empty list; then `SagePrint.openDialog(job, { title: 'Story map',
current: at, budget: 1 })` and nothing else.

That needs **one additive line** in `print.js:759-760`:

```js
budget: wantContact ? 1 : (BUDGETS.includes(opts && opts.budget) ? opts.budget : 4)
```

`plan()` already accepts `o.budget` against `BUDGETS = [1,2,4,8]` (`print.js:28`,
`:115`) while `openDialog` hardcodes 4, so a 1000 × 1414 planning sheet otherwise
arrives as **four A4 sheets to trim and tape** — which is not the artefact a child
writes on. No existing caller passes `budget`, so nothing else changes. Telling
teachers to set Size 1 every time is not a design.

`toPrintable(w)` is deliberately **not** implemented as well: `app.js:9225-9235`
prefers the plural seam when both exist, so the singular becomes dead code that
could print a sheet the dialog never showed.

## 9. CSS

```css
.smwidget {
  /* The app's measured widely-separated set (style.css:4390-4398), re-declared
     because --wb-t1/2/3 are scoped to .wbwidget. Widget-internal LITERALS: never
     var(--ink), because applyTheme re-declares --ink per widget, and the printed
     SVG emits the raw hex. */
  --sm-t1: #1d4ed8;  /* slot 0 · circle */
  --sm-t2: #ea580c;  /* slot 1 · square */
  --sm-t3: #047857;  /* slot 2 · triangle */
  position: relative;
}
.sm-face  { container-type: inline-size; display: flex; flex-direction: column;
            gap: 6px; min-height: 0; overflow: auto; }
.sm-quick { display: flex; flex-direction: column; align-items: stretch; gap: 5px; }
```

`.sm-quick` overrides `.tclock-quick`'s `flex-wrap: wrap` + `justify-content:
center` (`style.css:2901-2908`), because a shrink-wrapped row cannot pin anything to
an edge — `.gt-quick`'s override verbatim (`style.css:5584-5591`). Board-scale
target sizes are written here, not inherited: `.mntray` contributes only `gap: 7px`
plus named selectors (`style.css:3023-3038`). Floor 72px on beat and dot targets at
ks1, and on **every** band for the two controls a lesson presses dozens of times: a
band's `+ beat` (§7.3) and a beat panel's close control (§7.2). Those two hold the floor
above ks1 as well, because the press count does not fall with the year group.

Four pieces of furniture are declared here because three of them are new and none is
measured: the **armed** legend chip is a filled swatch plus a heavier chip border and
nothing else — no pulse, no transform (§7.5); an axis **numeral** is one type step below
its word and shares its baseline, so a 24-character bilingual pair and a bare numeral
occupy the same gutter; a Model chip's **thumb** reuses the map beat's thumb box
verbatim, since a picture and a ghost frame must occupy one footprint on both faces
(§7.4); and the boxing-up **vocabulary strip** is `position: sticky; top: 0` inside the
one scroller, holding two rows and scrolling inside itself past them (§7.6).

## 10. Wiring, and where the code lives

**Inside `english-text.js`'s existing `register()`.** No new script tag, no new
`init()`.

Nineteen symbols the story map needs are module-private to that file and are
neither exported nor on `D`: `GT_CAP`, `GT_BANDS`, `GT_BAND_IDS`, `gtBandFor`,
`GT_BAD_CH`/`gtStr`, `gtCleanText`, `gtSlug`, `gtLook`, `GT_FONT`, `GT_W`, `GT_PAD`,
`gtWidth` and its lazily-created measuring host, `gtWrap`, `gtSvg`, `gtHead`,
`gtDefaults`, `gtCopy`, `gtBlank`, `gtPackOf`. A separate module would have to
promote all nineteen **and still edit `english-text.js` substantially**, because
`gtNormalize`/`gtCopy`/`gtBlank`/`gtPackOf` must gain `arcs` regardless — strictly
more change for the same result, plus a new load-order constraint whose failure mode
is a blank widget. Duplicating the parsing means a second `GT_CAP`, a second C0
stripper, a second measuring host and a second copy of the SVG chrome.
`genre-toolkit-design.md` already committed this file to the story map at P3.

Every helper above `register()` uses `D.el` / `D.iconEl` / `D.toast` / `D.uid`
**explicitly**; every dep the widget needs goes into `register()`'s one destructure.
This matters more than the drafts thought, not less: `def.mount.call(...)` at
`app.js:9331` is **not** wrapped in try/catch and `mountWidget` is called bare in
the render loop at `:9443`, so a bare-name `ReferenceError` takes the rest of the
screen's widgets down with it — and `SageEnglishText.init(engDeps)` at `app.js:13156`
is followed by the `TOOLS.push` calls, so a throw during registration removes every
English widget from the menu. The claim that the app's mount guard swallows such an
error is **false**, and a builder debugging against that symptom loses an afternoon.

**Touches, one commit:** `english-text.js` (v14→15) · `english-packs.js` (v4→5: the
`kind:'arc'` library plus `arcs` on five genre packs) · `style.css` (v106→107) ·
`icons.js` (v25→26: one `storymap` glyph) · `app.js` (v62→63, one line directly
after the genretoolkit push at `:13164`, carrying **the same guard** because both
widgets live in the same module:
`if (window.SageEnglishText) TOOLS.push(widgetTool('storymap','Story map','english'));`) ·
`print.js` (v14→15: the one budget line).

**Split trigger, recorded:** at ~230KB, or when a **third** widget wants the same
pack rail, split the **shared layer** — an `english-pack.js` exposing the pack rail
plus the SVG chrome through the same injected-deps pattern. Never split a widget
out: that leaves the nineteen helpers on the wrong side of the seam.
`english-word.js` ships at 237KB today, and 254KB is what actually triggered the
modelwrite split, so this file has room.

## 11. The eight wording rules a pack must obey

Written into `english-packs.js` beside the arcs. Every string goes through `gtStr`
(or `gtCleanText` where breaks matter) at the door.

1. Our own wording, or National Curriculum terminology (Crown copyright, OGL v3).
   Never a published scheme's phrasing, lens names or rhymes. **Plan names describe
   geometry** — "Five-part story mountain", not a scheme's name for it.
2. A box name is a noun the class can say aloud, ≤ 60: "Opening", never "Now write
   the opening".
3. A hint says what goes in the box, ≤ 200, one line, no trailing full stop.
4. No instructions to the **teacher** anywhere in pack text — those live in a
   tooltip or the gear.
5. No topic nouns, child names or school names.
6. Three bands only (ks1 / lks2 / uks2).
7. No angle brackets, no C0 controls, nothing markup-like — `gtStr` strips them
   (`english-text.js:106-108`; a C0 control makes the sheet **vanish** from the
   print dialog with no error). All pack text reaches the DOM via `textContent`.
8. **A plan ships boxes, never beats** — no model text, no example content, no
   per-box icons. The shape is ours; the beats are the class's.

"Story mountain" and "boxing up" are generic in UK primary practice but carry an
association with one published approach, which is why the names describe the
geometry, every hint is our own, and the OGL note sits in the pack header exactly as
`english-packs.js:1-14` does. A school wanting its scheme's exact words types them
into its **own** plan through the gear's rows editor — which is why the seventh kind
exists.

## 12. Deferred, with dates and reasons (2026-07-30)

1. **The swap's matcher** — `key`/wording matching, the plan-then-apply split, the
   confirm, carried boxes, `from`, `spine`(16) in anger. The swap itself **ships in
   v1**: open until a plotted value or a typed cell, every beat into the new plan's
   first box in board order, one toast (§6). Reason for deferring the rest: matching is
   the half that can be *wrong*, and wrong here means a class reading someone else's
   guess aloud as their plan. It is also the half that drags a confirm, a computed-once
   plan and a consumed-pool discipline in behind it, where the first-box rule needs
   none of them because it destroys nothing. **When it lands:** match on `key`, then on
   case-folded trimmed `box`, from a consumed pool; a matched row adopts the **live**
   row's id and keeps its beats, cell and values, taking the incoming wording only when
   `edited` is false; an unmatched live row holding nothing is the only drop; an
   unmatched live row holding anything is **carried** whole with `from` = the outgoing
   plan's name; refuse the whole swap if
   `incoming.length + carried.length > GT_CAP.spine`, naming the arithmetic; compute
   the plan **once**, render it in the confirm, apply it unchanged; and the confirm
   names the typed "Our version" cells that move. Carrying cells and values is what
   lets the window widen past `smSwapOpen`, and the first-box rule stays on as the
   landing for every row the pool did not match. **Refused, not deferred:** positional
   row mapping in any form.
2. **Arc-pack file import/export** over the file rail. Reason: the bundled library
   plus the in-widget rows editor meets the local need, and the unit of adoption is
   one teacher on one machine. When it lands: `gtOpenPack`'s hardening verbatim, and
   fix `english-text.js:796`'s article bug — `'That is a ' + kind + ' pack'` renders
   "That is a arc pack". No bespoke `.arc` extension, ever.
3. **The `sm-*` icon glyph set on beats.** Pictures do the KS1 job and ship now; the
   fixed thumb area is built now so adding glyphs later cannot change a footprint.
4. **Beat drag** on the map face — the button mirror is mandatory anyway and a drag
   could only express reordering.
5. **Dot drag** on the graph — 43px of pitch against a 72–96px board floor.
6. **Room / focus mode for boxing up** (`modelwrite.js:1150-1165`;
   `style.css:5418-5422` as precedent). Measurement decides: if fewer than five boxes
   read at the default size, the default **width** rises first (§14.1), height only
   once the width has run out of stage, and the dock is re-verified either way.
7. **"Arrows on/off" and "Pictures on/off"** — nobody asked for them off, and Cover
   is the recall move they were standing in for.
8. **KS1 face glyphs** beside the axis words. Reason: every step carries its numeral
   (§7.5), so a child who cannot read the wording already has a cue that is not the
   wording, and a drawn face is a second claim about the same step — one a fixed glyph
   set makes badly, because the face for −1 is either the face for −2 or a distinction
   the class never made. When it lands: one glyph per step from the live `steps` count,
   never a fixed set of five, and **beside** the numeral rather than instead of it.
9. **Reading the word bank widget** on the same screen for the vocabulary strip —
   a cross-widget read is its own review, and §8.3 puts the semantic-gradient home
   in the word bank's shades meter. Because `p.vocab` is gear-editable (§7.6) this
   deferral costs **typing the same ten words twice** on a screen holding both widgets,
   and nothing else: the capability is already on the face, and only the convenience is
   out. When it lands it reads one *named* word bank on the same screen, copies on
   demand and never live, so the strip stays a copy and closing a word bank cannot
   empty a class's strip mid-unit.
10. **The boxing-up CSV round trip.** Printing is the stated need. Rules recorded for
    whoever adds it: a filled cell updates and a blank cell leaves well alone; every
    column named in the header; UTF-8 BOM verified at the **byte** level.
11. **A persisted op-history undo.** Shape pre-decided: positional ops `{t, i, was}`
    never live references, a WeakMap keyed by the widget, debounced, budgeted
    newest-first, `SageSnapshots.putAux` (`snapshots.js:284-311`) and **never**
    localStorage, with the async load skipping anything touched since mount.
12. **Animated ceremonies** — a five-clause contract each, and no face teaches
    anything one would add.
13. **A per-widget fit target for ⋮ → Resize to fit** (`app.js:9180-9190`), so the item
    measures `.sm-face`'s own scroll box instead of the `.widget-body` that clips it
    (§7.2). Reason: an app-wide seam, with every widget's fit behaviour to re-verify,
    bought for a convenience the resize grip and the size lever already cover. When it
    lands: an opt-in `def.fitSel`, absent on every existing widget, so a widget that
    does not ask keeps today's behaviour exactly.

**Refused, not deferred:** positional matching of anything; any tick, score,
verdict, progress or completion marker on any face or sheet; freeform beat
coordinates; a widget-owned pen; model-column prefill and any re-seed key; `p.bin`;
a bespoke `.arc` extension; a derived or authored vocabulary valence; reading or
writing the sibling toolkit's revealed/ticked/marks state; zoom, pan or any
auto-arrange; duration or timeline semantics (bands are equal, story time is
ordinal); a dot whose position depends on what another line is doing — the fixed lane
of §7.7 is that same ban stated for the graph; and two beat panels open at once, which
§7.2's re-target makes unreachable and which no later reader should build back as a
stack.

The first-box rule (§6) does **not** belong on that list, and a tidy that files it there
has misread it: it matches nothing, so it cannot match by position.

## 13. Verification

No automated suite: this is a browser list, run on the dev server
(`preview_start`, `http://localhost:8642/`), never `file://`. Standing rules: read
state **≥ 300ms** after the last mutation, because `save()` is debounced 250ms
(`app.js:331-363`) and racing it has produced phantom results twice; scope every DOM
query to the widget under test; never treat `textContent`, a thumbnail or a geometry
harness as proof of what renders or prints; measure at **reading** size.

**A. Wiring and names.** (1) Boot with the console open and add a Story map: the
widget **appeared** and the console is empty — and assert all six English widgets
are still in the menu, because a throw during registration removes every one of
them. (2) "Story map" reads identically in the tool menu, the title bar,
`opts.title` and the PDF filename; the first face reads "Text map" in the pill, the
print label and the sheet heading. (3) Measure `body.clientHeight` minus the bar's
`offsetHeight`: chrome ≤ ~75px, and the default 1120 × 620 clears the dock and the stage
nav — and lands **whole**, so run it on a 1366-wide stage as well as on a board, because
`addWidget` clamps `x` and never `w` (`app.js:8968-8970`). Then measure the quantity the
width is buying: at 25px with a real six-box recount — not a two-word test row — count
the **characters per line** in the "Our version" column and in a Model chip, with the
band's 72px `+ beat` target (§9) in place at the end of every map row, because that
target is width the beats do not get. Confirm five boxes read. If a 140-character beat
needs more than the three lines §7.3 allows it, or a cell line is too short to write a
sentence on, raise the **width** and re-check the stage fit; the height moves only once
the width has run out of stage. Record the characters per line, not only the box count. (4) An empty box computes a 34px
base and a 19px hint, and has not hit the type cap.

**B. Persistence and hostile props** — one field at a time, reload each. (5) Props
survive a reload. (6) `arc = "nonsense"` re-seeds. (7) A rows array with one empty
box on the keepIds path: the box **survives** as "Box 2" and every beat still points
at the box whose wording it was on. (8) 18 rows → 16 kept, cap spoken, no beat parted
from a box. (9) `tracks = [null, {name:'Wolf'}]` → length 3, Wolf in **slot 1**,
Wolf's line **orange**, Wolf **armed** and its ghost dots orange too; four entries →
three kept, no existing line recoloured.
(10) `beats[0].row = 'nope'` → the beat is in the **tray**, and still there after a
**second** reload. This is the silent-delete regression test. (11) `ord = NaN`; a `v`
of 99; a `v` of `'x'`; a `v` key naming a dead track; `armed = 't_9'` and `armed`
naming a hidden track — the first **visible** track in slot order is armed in both,
and the panel names it; `axisWords` as forty strings, as two, as numbers and as a
bare string — trimmed or padded to `p.steps` with non-strings emptied, and every step
still labelled by its numeral; duplicate beat ids; a
5000-character beat; `face = 'wibble'`; `cells` supplied as an **array**; a C0
control inside a box name → stripped **and** the sheet still appears in the print
dialog. `open` holding four live beat ids → the face opens with **no** panel showing.
(12) `<img src=x onerror=alert(1)>` as a beat, a box name, a cell, an **axis word** and
a **vocabulary word** → visible **text** on all three faces and in all three print
previews, read off the rendered preview and not off the SVG string. The last two are
hand-typed now (§7.5, §7.6) and reach the same SVG the first three do, which is the whole
reason they join this list. (13) Two story maps on one plan: a beat
added to one appears in one only.

**C. Banding and seeding.** (14) Deck at Year 1 + Narrative → **three** boxes
("Beginning, middle, end"), band chip "Reception – Year 2". (15) `yearGroup: null` →
a plan **is** seeded, and the derived plan appears in both a ks1 and a uks2 picker.
(16) A genre with `structure: []` and a structure-less import both seed a **library**
plan, and do not re-seed in a loop across two reloads. (17) A letter or explanation
plan → the Emotion graph pill is **absent**, `face: 'graph'` falls back to `'map'`,
no graph sheet; a dilemma plan on a recount → the graph **is** present. Then, on a map holding beats but no
value and no typed cell, swap a dilemma plan for a letter plan while looking at the
**graph** face: the pill goes, the face demotes to the map in the same paint, and the
graph sheet is gone from the print dialog (§6).

**D. The arc-change safety rule.** (18) Empty map: a library plan applies. (19) One
beat, then another plan: it **applies**, and the beat is in the new plan's first box with
its `t`, `img`, `note` and `vocab` byte-identical. Then plot a value on that beat and
pick a third plan: **refused**, the toast names the plotted feelings, props
**byte-identical** before and after; clear the value, type an "Our version" cell, pick
again: refused the same way, and again with a typed Model cell and no `ours`. The volume
case is check 60. (20) Rename one box: beats, cell and points stay
attached, `edited` true, `key` **unchanged**. (21) Reorder: every beat moves with its
box, `ord` unchanged, nothing re-flows. (22) Delete a box holding 3 beats: refused,
naming the beats and the typed cell; move them, then it goes, and no other box's cell
moved. (23) Author twelve box names and nothing else, then swap the plan: the swap **applies** —
twelve edited rows do not shut the window — *and* `hasWork` is **true**, so a "Story map"
snapshot appears in 💾 and restoring it brings all twelve names back. This is the two
tests being two tests, on one apply. (24) Open the gear,
force a remount via the resize grip, then edit the plan name in the still-open panel:
the staleness toast fires and nothing was written to a dead object. (25) The 13th box
is refused with the cap spoken; the 7th beat in one box is refused with "Steps has
6 beats — the next one wants a box of its own", is **not** created, and moved
nothing.

**E. Spatial stability and gestures.** (26) Four beats in box 2: record each measured
on-screen position, then map → box → graph → map **twice**. Every beat
byte-identical; `ord` unchanged. Two full round-trips moving zero beats is the
standard. (27) A 5th beat does not move the four already down; a picture on beat 3
does not move beats 4–5. The 5th arrives from that band's own `+ beat`, empty,
last in the band, ghost frame in place; and count the controls per face — one `+ beat`
per band on the map, **none** on boxing up and none on the graph, whose empty plot names
the map face instead. (28) Opening a beat panel does not move the beat text; the
panel is below or beside, never above, never outside the face; opening a second beat's panel
**re-targets** the open one rather than stacking a second, so `open` holds one id and
never two; and the panel closes on its own beat, on its own dot and on its close
control, leaving `open` empty after each of the three. (29) Scroll the map to 900, tap map → box → map: 900 again, and
box's scroll is independent; then Cover, add a beat and tap a vocabulary chip,
asserting `scrollTop` unchanged after each. With Cover still on, open a beat panel
on that face: the beat's text and note read **covered inside the panel** too, while the
axis chips, the strip and the move buttons stay legible; repeat on the graph face with
`coverGraph`. (30) Type two words into an "Our version"
cell without re-clicking: focus **and** caret survive the commit; force a resize
mid-word; scroll the grid mid-word. Then paste 420 characters into that cell: the
editor stops accepting at 400 and says so, and what commits is what was on the screen —
read the stored string and assert no tail was clipped behind the teacher. Repeat over a
beat's text at 140. (31) Tap one axis chip 150 times: `p.beats` is
byte-identical to a single write, and all 150 wrote the **armed** line — the other two
tracks' ids are absent from that beat's `v` (§7.5). (32) Two lines both at −3 on one beat, then the
same two lines two steps apart on the next: each dot sits in **its own lane** in both
cases, each is separately tappable, and each dot's measured x is **identical** across
the two — a dot's position is a pure function of `(beat, value, slot)`. Both dots at one
beat open **that beat's** panel and either of them closes it again, because two lines at
one beat are two dots and one beat. Then hide a line and re-show it, having recorded
every remaining dot: not one moved. A ghost renders only for the armed line, in that
line's lane and colour. (33) Finger-pan a face: it pans, no beat moves, no value is set.
(34) Delete a beat from its panel: a snapshot appears in 💾, and restore works.

**F. Print.** (35) On each face, the bar's Print… ticks exactly **one** page, it is
that face's own sheet, and the dialog opens at **Size 1**. (36) Remove qualifying
content one sheet at a time; with the graph sheet absent the **graph face** pre-ticks
index 0 and the dialog shows it doing so. (37) The ⋮ item opens on the same sheet.
(38) Read each **whole** sheet at reading size — paper edge, 10mm margins, cut marks
— with a 60-character plan name, a 140-character beat, a 400-character "Our
version", and a 24-character axis word on every step, one of them a bilingual pair,
in place. (39) The boxing-up sheet prints the typed `ours` where there is
text and ruled room where there is not, the rules on the same measurement as the row
height. (40) Tick all three: none is planned into a box that shrinks it; then run the
`print-pdf.html` pass and assert PDF page count equals sheet count. `print-check.html`
tests geometry, `print-pdf.html` tests the print, and the kiosk `overflow: hidden`
defect survived 48 green harness checks. (41) `SagePrint.lint()` on all three
builders, including a hostile beat and a C0-stripped box name: zero errors.
(42) A map filled box-3-first prints in **board** order. (43) No tick, count or praise
on any sheet; the graph sheet carries its swatch-plus-wording key and a numeral
beside every axis word, including the steps the class left unworded; attached
vocabulary appears under its beat on the map sheet.

**G. The bystander — the genre toolkit must not regress.** (44) Round-trip a genre
pack carrying two banded `arcs` through the toolkit's own "Save as a file…": diff the
written JSON for `arcs` **and** confirm `structure` is unchanged; re-import and assert
both plans are still offered. Read a **bundled** pack through `gtDefaults()`
specifically, because `gtCopy` is the one a read-only test misses. (45) Re-run the
toolkit's hostile-import assertion now that the normaliser is shared by two widgets.
(46) The toolkit's three faces, picker, swap confirm and both sheets still work, and
its bar rows are unchanged. (47) Existing print callers — toolkit, modelwrite, poster
— still open at their old default of four sheets, because the `print.js` line is
additive.

**H. The armed line and the axis.** (48) Three lines on and slot 1 armed, on the
**graph** face: the panel named slot 1 above its chips before the tap, and a tap changes
slot 1's value and no other's. Then open the same beat's panel from the **map** face: it
names slot 1 there too and its chips still write slot 1, and nothing on that face changes
the arming. (49) Walk the legend — tap an unarmed chip: armed, nothing hidden; tap the
armed chip: hidden, and the next visible line in slot order armed; tap the hidden chip:
shown **and** armed — and no dot of any other line moved anywhere in the walk. (50) One
line only: its chip does not hide, arming is still slot 0 after a reload, and no face,
panel or sheet anywhere says the word *armed*. (51) Reload with `armed` naming a hidden
track, then a dead one, then nothing, then with slot 0 a hole: a visible line is armed
every time and the graph face paints. (52) `steps` 7 → 5 with words typed at +3 and −3 and
a value at −3: the confirm names **both** counts, the two words that go are the ones
agreed at +3 and −3, and the five that stay are at the values they named. Then 5 → 7: two
empty steps appear at the new outermost values and read as their numeral alone. (53) A
store carrying `axisTop`/`axisMid`/`axisBot` and no `axisWords`: the three words land on
the top, middle and bottom steps, the other four are empty, the three old keys are
**gone** from the saved props, and a word edited after that survives the next two
reloads. (54) Empty every axis word: every chip and every axis label, on the face **and**
on the sheet, still reads its numeral, and the class can still say which step it means.
(55) Type 30 characters into an axis word: refused at 24 with the cap spoken, never
clipped on commit. (56) Rename all seven axis words and nothing else, then change
`steps`: `hasWork` is **true**, a "Story map" snapshot appears in 💾 and restoring it
brings the seven words back — and a map still on the banded defaults takes **no** snapshot
for its axis alone.

**I. The class's own words, the pictures on paper, and a deck with no year.** (57) Type
four words into the gear's vocabulary box, one per line, move two and delete one: the
strip in the beat panel and the strip on the boxing-up face both read the new list in the
new order, `p.vocab` holds it after a reload, and the **pack** is unchanged — read a
bundled genre back through `gtDefaults()` and diff its `language.vocabulary`. A word
attached to a beat and then deleted from the strip **still renders and still prints**
under that beat. 60 words → 50 kept with the cap spoken; a 90-character word → 60
characters. Then put 50 words on the boxing-up face and measure: the strip holds two rows
at the head of the column, scrolls inside itself past them, and the grid scrolls **under**
it with three columns still reading. (58) Two of a four-beat box's beats carry pictures:
the Model chips on the boxing-up **face** and on the **sheet** show those two and a ghost
frame on the other two, and the row height and the "Our version" ruling measure identical
to the same map with no pictures at all — measure both, do not eyeball them. Then type a
`model` line: chips and pictures both go, on screen and on paper, and the map face still
holds its pictures. A tap on a Model chip opens **nothing** (§7.6). (59) A deck with
`yearGroup: null`: the header chip on all three faces reads "No year group set" and not
an empty pill, the axis has **seven** steps, the add raises the toast once per deck and
**not** on a second story map in that deck or after a reload, a second year-less deck
raises its own, and a deck with a year group raises none.

**J. The swap in volume.** (60) The case that matters. A five-box map with **eleven**
beats spread unevenly, swapped to the three-box plan: `p.beats.length` is still **11**;
every id, `t`, `img`, `note`, `vocab` and `v` unchanged; every `row` is the first box's
id; `ord` is 1–11 in the exact left-to-right, top-to-bottom order the class was reading
before the swap; the toast reads "11 beats moved to Beginning — use Move to box to sort
them" from §6's one template; the first box renders all eleven with nothing clipped and no
band re-spaced; the next `+ beat` there is refused **naming the 11 it holds**, not 6.
Reload and re-assert all eleven: this is the first-box rule's own silent-delete regression
test. Then offer a plan whose every box name is blank: the swap is **refused before
anything is written**, naming why, and `p.beats` is byte-identical.

## 14. Open questions

1. **The default width.** 620 is modelwrite's measured fix for running under the dock
   and does not move; 1120 (§5.8) is the number in question, and the quantity it buys
   is **characters per line**. Whether five boxes of *real* content read on the
   boxing-up face at that size is verification check 3's job, not a guess — and if it
   fails, the **width** rises first, because width shortens every row on every face at
   once where height buys the map one more band at a time and leaves a three-column
   grid unreadable at any height. Height moves only once the width has run out of stage
   (`app.js:8968-8970`), and then it is re-verified against the dock.
2. **`#drawLayer` is screen-fixed** at z-index 3000 (`app.js:11914`,
   `style.css:1493`), not anchored to widget content, so scrolling any face slides
   content out from under a teacher's ink. Pre-existing app behaviour, named here
   rather than solved: exposure is reduced structurally (no repaint, face switch,
   commit, Cover toggle or picture may move a beat; each face restores its own
   scroll). If it bites in a live run, the fix is a widget-anchored ink layer as its
   own piece of work — never a second pen inside this widget, which would compete
   for the same pointer stream and give the teacher two Clears with different scopes.
3. **Whether a Year 6 class uses three lines or two.** Three is the cap the
   projector's colour calibration allows; whether the third is ever wanted is a
   classroom question that a live run answers better than a design does.
4. **Whether the picker should mark the plan the map is already on.** With no matcher,
   re-picking a byte-identical spine is a full swap: every beat pools into the first box
   and the class sorts eleven beats to get back where it started (§4.1). A tick or a
   dimmed row on the current plan costs one line and prevents the one swap that is
   never wanted — but it is also the first dim state in this widget, and §7.3 argues
   against those. A live run says whether a teacher ever taps it.
