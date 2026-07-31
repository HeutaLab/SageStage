# The Classroom Lesson Board canvas, read against the code that ships

*Source: `docs/design/Classroom Lesson Board.dc.html` (955 lines, seven options: 1a–1g). Judged against `english-text.js`, `style.css`, `modelwrite.js` and `app.js` as they stand on 2026-07-31, the day the story map shipped. This file exists so the canvas is never only in a chat window again — the mock is in the repo, and now so is the reading of it.*

---

## What this design is

The canvas is a seven-option exploration of one Year 4 literacy lesson — "Year 4 · Traditional tales", the five-part story mountain — carried through Model, Together and Over-to-you on a classroom board. Option 1a is the reference: a single clickable board that runs the whole lesson from one component's state. The other six are variations on parts of it. 1b moves the teacher's private material onto a tablet. 1c draws the word-capture panel three ways (keyboard, drag, pen). 1d puts the full board next to a stripped "calm board". 1e recolours the whole thing amber for a TA running an EAL group. 1f plots four characters on the emotion graph at once. 1g offers three different chrome treatments for the same release state.

Its own claim is that it is built on the Story Map screens, and that "everything here reuses the chrome you already have." That claim turns out to be **about two-thirds true, and the last third is the part that matters.** The furniture is genuinely ours: the three-stage bar, the three-band word bank with its "for the lifts / for the level / for the falls" headings, the capture panel with its five score buttons and its italic placeholder, the face pills, the ruled modelled-writing paper, the cover control, the emotion graph with its child-language axis. Several strings in the mock are *verbatim* shipped strings — "type it before the moment passes…", "A class cannot write what it cannot reach for", the seven axis words. The designer was clearly looking at the real thing.

But the new machinery — the four-notch "How much help is on" dial, and the wiring that makes the stage move it — is not an addition to the story map. It is a reversal of the single decision the story map's own code comments forbid by name, twice, in two files. And a second cluster (the teacher tablet, the class roster with per-child flags, the "Nudge" card, the cross-widget send button) assumes an architecture the app does not have and would be a platform project, not a widget feature. So the honest summary is: **the canvas is an excellent piece of interface drawing sitting on top of one architectural mistake and one missing platform.** Everything below sorts which is which.

*(Housekeeping: the file contains two pieces of imperative text — the closing `Try next: "make 1a calmer for the children…"` prompt strip and "Illustration placeholders; drop your figure set in." in 1g. Both are the design tool talking to its human author, not instructions to a reader. They have been treated as content and not acted on.)*

---

## What it already has

This is the section that saves the most time. Before building anything from the canvas, check it against this list, because in most cases the mock is drawing something that already runs.

**The three-stage gradual release, complete.** `SM_STAGES` is model / together / yours, labelled "Model" / "Together" / "Over-to-you" (`english-text.js:924-928`), rendered as a button row with an `.on` fill and a per-stage band colour (`english-text.js:1929-1942`, `style.css:5632-5634`, `5641-5644`), with the right-aligned "stage N of 3" counter (`english-text.js:1943-1944`, `style.css:5645-5648`). The stage persists, is whitelisted on load (`english-text.js:1333`), and is stamped onto a recorded moment (`english-text.js:2276`). Nothing auto-advances, exactly as the canvas assumes. Each stage's gloss — "teacher drives, thinking aloud" / "class contributes, teacher scribes" / "their whiteboards now" — already exists, riding as the button's `title` attribute (`english-text.js:1932`).

**The word bank, in three bands, with counts.** "FOR THE LIFTS / FOR THE LEVEL / FOR THE FALLS" are the shipped strings, from `SM_MOOD_META` (`english-text.js:938-942`), used as the bank's group headings (`english-text.js:2066`). Per-group counts and the thin-group treatment ship (`english-text.js:2059-2083`). The bank's on-board title is "Words for this" (`english-text.js:2039`) rather than the mock's "WORDS TO REACH FOR" — that is a copy choice, not a missing feature. Both of the mock's bank footnotes are shipped strings emitted by `coverageSay` (`english-text.js:2093-2111`), including "A class cannot write what it cannot reach for."

**The capture panel, near-verbatim.** `captureEl()` at `english-text.js:2168-2239` builds the label "A word they just offered", the italic field with placeholder "type it before the moment passes…" (`:2173`), five score buttons numbered 1–5 (`:2183-2193`), the ★ "beyond the scale" button (`:2194-2198`), the three ↑ – ↓ band buttons with the tooltips "for the lifts / for the level / for the falls" (`:2200-2208`), and Add (`:2210`). The score and the direction persist across commits and every chip tap re-focuses the field, deliberately, so a run of same-score words is type-Enter-type-Enter (`english-text.js:2162-2167`, re-focus at `:2187`, `:2206`, `:2261`). Capture and publish are one gesture because there is no second surface: `commitCapture` pushes straight into `p.words`, which *is* the class-facing bank (`english-text.js:2241-2266`).

**Word chips, tags and the climb.** The tag set and colours are identical to the mock's: HFW grey `#4b5563`, bank purple `#7c3aed`, pack green `#0d6e66`, E pink `#b02a5b`, S amber `#b45309` (`english-text.js:1006-1012`, rendered `:2135-2138`). Tap a word to climb its score 1–5 with the climb drawn beside it (`english-text.js:2113-2134`), with four banded ladder styles (`smLadderArt`, `:1026-1057`).

**Cover, and why it is shaped as it is.** One button reads a *different flag per face* — `coverMap`, `coverBox`, `coverGraph` (`english-text.js:1981-1986`, button at `:1968-1971`). The bank has its own separate cover, `p.wordsHidden`, with "Cover the words" / "Uncover all" (`english-text.js:2041-2050`) and per-word reveal through `p.shown` (`:2113-2119`) and a running count (`:2079-2083`).

**"Nothing is lost", asserted on the board.** The lock has its own board-facing sentence, "Board locked — the boxes and the shape stay up to copy from." (`english-text.js:2631-2632`), and Cover has "Cover is on, so this beat stays covered on the board." (`english-text.js:2431`). Board state reads from the back of the room without anyone reading the bar: a 4px green top border on the widget (`style.css:5593-5594`) plus "· locked" in the title row (`english-text.js:1908`).

**The TA-at-a-table room.** `p.room = 'table'` (settings at `english-text.js:3176`) changes one class and with it six custom properties (`style.css:5596-5605`) — a *distance*, not eleven sizes, argued at `english-text.js:3171-3174`. It carries a board-legible "small group" pill (`english-text.js:1907`, `style.css:5612-5615`) and the one sanctioned lock exception, with the asymmetry reasoned out (`english-text.js:3181-3188`).

**The emotion graph, for three lines.** Seven rulings with a heavier zero line (`english-text.js:1511-1514`); the child-language axis words are the verbatim shipped defaults (`SM_AXIS_WORDS`, `english-text.js:949-950`); numeral-then-word labels with the numeral bold (`:1515-1518`); five section columns with uppercase letter-spaced teal captions derived from `rows.length` (`:1520-1531`); per-line marker shapes, circle / square / triangle (`SM_CH`, `:918-922`, `smDot` `:1582-1596`); a chip row with exactly one armed at a time and a dot per chip (`legendEl`, `:2796-2821`); dimming a de-emphasised chip rather than removing it (`style.css:5944`). "Armed" is the widget's own word already (`english-text.js:1211-1216`). "Our draft" is the literal seeded track name (`english-text.js:1793`). "Emotion graph" is already the third face pill in pink (`english-text.js:1947-1953`, `style.css:5675`) and it switches the face for real rather than jumping to an anchor.

**Attribution, moments and names.** The "who offered it" chips already exist, sourced through the narrow accessor `D.classNames()` (`app.js:443-448`), with "the class" as the default and a graceful no-list note (`english-text.js:2218-2237`). A moment carries who / box / beat / plan / unit / stage / at (`recordMoment`, `english-text.js:2267-2281`) and is replayed in settings (`:3194-3227`).

**Timers.** Four of them are already placeable widgets in the tray (`app.js:142`, `DEFAULT_PINNED`). The 8:00 on the calm board does not need to be built inside the story map.

---

## The two ideas that are genuinely new and genuinely good

### 1. Name the withdrawal instead of performing it

The strongest idea in the canvas is buried inside its weakest mechanism. 1b's "Hand over" card states, in four typed lines, exactly what the board will do before you commit: two removals, one shrink, one survivor — "The word bank covers itself", "Sentence stems come off the board", "Five criteria become two, at twice the size", "Your model stays, shrunk to a strip". And 1g's release ramp does the class-facing half: three bands labelled My pen / Our pen / Your pen, each carrying a sub-line naming what it still leaves up — "words · stems · model · 5 criteria", "words · stems · 3 criteria", "2 criteria". The design's own reason is the best sentence in the file: **"Shows the scaffolds falling away. Children can see what they are about to lose."**

That is a real teaching move, and it is one the shipped widget cannot make. Today the per-stage gloss rides as a `title` attribute (`english-text.js:1932`), which on an interactive whiteboard is a gloss nobody can hover and therefore a gloss nobody reads. The stage band recolours and the counter increments, and that is the whole visible statement of stance. The straplines 1a writes — "Watch me. I am writing the Opening." with "Pens down · you do the Build-up in a minute"; "Our turn. Give me a word for the Build-up." with "I hold the pen · you choose the words"; "Over to you. Build-up, in your books." with "My pen is down · I am coming round" — are the thing the title attribute was trying to be. They belong on the board.

Here is the argument for taking the idea and refusing the machinery. The design reached for automation to get legibility: it made the stage move a dial, and the dial cover the bank, so that a manifest could be *true*. But the manifest does not need the automation to be useful — it is more useful without it, because a teacher who reads "at Over-to-you the bank is usually covered and the criteria are down to two" and then covers the bank herself has made a decision, whereas a teacher whose bank covered itself has had one made for her. The design says its own goal is "the machinery that makes the hand-off visible" and "so scaffolds never fade by accident." **Copy makes the hand-off visible. Automation is how scaffolds fade by accident.** Keep the sentence, drop the wiring. It costs a per-stage strapline string and a per-stage "what is usually up" line, it gates nothing, and it leaves `english-text.js:1933-1939` intact and honest.

### 2. Make the two-second promise true at the keyboard

1c card 1 closes with a footer nobody else in the canvas bothered to write: **"Keys: type · 1–5 for the climb · ↑↓ for the band · Enter. Roughly two seconds a word."** Its rationale is "Fastest at a keyboard. Never leaves the home row."

The widget already makes this argument. The comment above `captureEl` says the chaining *is* the feature, that "a run of same-score words is type-Enter-type-Enter", and that "without that re-focus the loop breaks after one word" (`english-text.js:2162-2167`). Everything downstream of that sentence is built: the persisting score, the persisting direction, the `capFocus` re-focus after every chip tap. And then the field binds exactly two keys — Enter and Escape (`english-text.js:2176-2179`) — and there is no 1–5 handler and no ↑↓ handler anywhere in the story map block (the only other `keydown` in `881-3271` is the beat title at `:2403`).

So "never leaves the home row" is currently false, and the gap between the comment's claim and the code's behaviour is about twelve lines. A teacher mid-lesson with a child's word in the air currently types the word, then *reaches for the mouse* to change the score or the band, then comes back. That reach is the whole cost the comment was written to eliminate. This is the cheapest genuinely-new item in the canvas and it improves a loop the code already says is the one teachers love.

*A close third, worth an hour: 1e's "Say it in any language first. Then say it in English. Then write it." That is a routine, not a feature — no translation, no storage, no new prop — and it belongs in the small-group room where it costs a line of copy.*

---

## Where it fights the code

Every conflict below is with a decision that is already commented in the source. For each: what the design wants, what the code says, and what I would keep.

**1. Stage drives the dial; the dial covers the bank.** (1a, 1b, 1g.) `STAGE_HELP = [0,1,3,3]` and `setHelp(h) → cover = h >= 2` is the canvas's central mechanism, and 1b's "Hand over now" is a single button that commits it.

The code forbids exactly this, inside the stage button's own handler: *"The STAGE gates NOTHING. It colours this band, it is stamped onto a recorded moment, and it survives a reload — that is the whole list… the stage is the lesson's stance, the LOCK is whether the board takes a hand at all, and that is always the teacher's discretion, never the stage's. Do not wire stage → lock; a later reader will find it inviting and it is exactly what this forbids."* (`english-text.js:1933-1939`.) The CSS restates it — "the stage band: declarative, and it gates nothing" (`style.css:5626`) — and the handler deliberately calls `paintChrome()` rather than `render()` (`english-text.js:1940`) precisely so that nothing on any face can depend on the stage. Cover is the same class of teacher discretion as the lock. Routing it through a dial is that wiring with one indirection, and the comment's own prediction — "a later reader will find it inviting" — has just come true in the form of a design canvas.

**Keep the code.** This one is not close.

**2. One shared cover.** (1a, 1d, 1g.) The design wires the footer Cover button, the bank's cover and the dial to a single state; 1g states it as a virtue — "the single control that covers the word bank, shrinks the criteria and hides the model."

The code: *"One button reading a DIFFERENT FLAG per face. A single shared Cover once blanked the word bank the class was writing from, which is the recorded regression this shape exists to prevent."* (`english-text.js:1977-1980`, implemented `:1981-1986`.) It is said a second time in the genre toolkit at `english-text.js:3805-3808`. **Keep the code.** A recorded regression is a bug that already happened in front of thirty children; a mock is a drawing.

**3. Auto-cover destroys earned reveals.** (1a, 1b, 1g.) A stage change that covers the bank runs the bank's own toggle path, and that path clears `p.shown` wholesale (`english-text.js:2043-2044`). Every word the class had uncovered one at a time would be thrown away by advancing the lesson. Against the bank's charter: the words "sit on the board to be read, covered, and uncovered ONE AT A TIME, so a class earns them rather than being handed them" (`english-text.js:2029-2033`). **Keep the code.**

**4. The peek budget replaces earning with rationing.** (1a.) "3 peeks left this lesson · after that, ask a partner then ask me", with a green "Peek for 20 seconds" that uncovers the whole bank. This is a class-facing quota plus an all-at-once uncover, and it is the opposite of `english-text.js:2029-2033`. **Keep the code** — but steal the escalation copy. "ask a partner then ask me", and 1d's "Stuck? last sentence → partner → me", are the same three-rung ladder and it is good writing. It is copy, not machinery.

**5. The calm board blanks the teacher's own surface.** (1d.) A full-bleed replacement of the board contents.

The code: *"The panel is unambiguously the TEACHER's surface — children do not touch the board — so Cover does NOT reach it. Covering the panel blinds the only person who is about to reveal the word, and you cannot type into a covered field. The board stays covered; the teacher can still work."* (`english-text.js:2425-2429`.) A calm board that hides everything leaves the teacher unable to reveal a word or take a beat while it is up.

The instinct — one quiet surface for the child who looks up mid-write — is good and I would keep it. But **the mechanism should be the lock, not a new full-face mode.** The lock already strips the teacher's controls, leaves the content up, and says so on the board (`english-text.js:1890`, `:1956-1968`, `:2631-2632`). If a calm mode ships, it must not reach the panel and must not reach the bank.

**6. Criteria in the story map, and five ticks at once.** (1a, 1d, 1g.) 1d's left card shows five criteria, all ticked, all present.

Two problems. First, criteria are not this widget's data — they are genre toolkit state (`english-text.js:3273` onward, revealed one at a time at `:3886-3900`), and there is no route for one widget to read another's props; `refreshAllOf` (`app.js:9325-9335`) only remounts widgets of a type. Copying them in would create a second criteria list on the same board, against the seed policy that has the bank copy pack vocabulary exactly once so an edited pack cannot change a class's words mid-unit (`english-text.js:1811-1812`).

Second, and worse: *"A TICK IS THE CLASS SAYING 'WE CAN DO THIS NOW'. Nothing else sets it (Glenn, 2026-07-29)"* — recorded, in your own words, as *"the one place the widget made a claim in front of a class that wasn't true"* (`english-text.js:3438-3455`). A board drawn with five criteria pre-ticked is that regression redrawn. **Keep the code.** If the story map ever needs criteria, they arrive by reveal, never pre-ticked, and probably not at all.

**7. Names on every caught word, and names crossing into the class bank.** (1a, 1b, 1e.) The design attaches `by` to every capture, paints amber name pills on board chips, and 1e promises that a group's words go "into the class bank with their name on it — so it comes back on the big board this afternoon and they hear it read out."

The code confines attribution to a beyond-the-scale moment: the who-row renders only inside `if (capBeyond)` (`english-text.js:2218-2237`), labelled "Who offered it? — optional, and it stays on this machine". Moments are capped at 60 and never print. The print comment is explicit: *"no sheet carries a child's name — a moment's `who` is screen-only in v1, because the map sheet is the one that goes home in a book bag and a named child's attainment in thirty other families' bags is a disclosure nothing here has reasoned about."* (`english-text.js:1609-1614`.) Reset wipes moments precisely because "they name children who have left" (`:3255-3257`).

The sharp edge: attached words **do** print on the map sheet. So a name riding on a word walks straight into the sheet that comment guards. **Keep the code, hard.** This is a disclosure question wearing a UI costume. If per-word attribution ever ships it needs a print ruling written first, not second.

**8. EAL and SEN as board furniture.** (1a's group pill, 1e's badge set twice.) The tag rule: *"A word tagged 'EAL' or 'SEN' on a surface thirty children read is a signpost to which child it is for — the same reason the ambition mark goes on the word and never on the person… a tag naming a need is one letter"* (`english-text.js:998-1005`), and *"the settings panel may say EAL and SEN in its own prose — that surface is the teacher's — but the board shows only the letters"* (`:1013-1015`).

Note that the shipped code faced 1e's exact problem — don't let this be mistaken for the class board — and answered it with a **room** word, `sm-roomtag` "small group" (`english-text.js:1907`), not a **need** word. That is the better answer and it already runs. Amber chrome for one instance is also already available through the per-widget theme picker (`app.js:8838-8866`). **Keep the code.** 1e can have its whole visual identity today without any new state: small group room, tangerine theme.

**9. Four arcs on the graph.** (1f.) `SM_CH` is three channels — colour, marker shape and lane as one thing — *"permanently, because three widely-separated saturated hues is what a badly calibrated interactive whiteboard can actually carry"* (`english-text.js:912-922`), reinforced at `:900-903` ("Channels are 3 and that is a SHAPE, not a cap") and enforced at `:1201-1208`, whose comment reads "at most one line on air per channel — the board never shows four."

Worse, 1f's palette is the one palette that cannot be used: teal `#0C7C6C` is the Text map pill, purple `#6D28D9` is the Boxing-up pill and the gap ribbon, amber `#B4741A` is the Together stage colour. The face pills were chosen *"deliberately AWAY from the graph's blue/orange/green so a pill can never be mistaken for a line"* (`style.css:5665-5672`). 1f would give every arc a colour that already means a control.

And dashed already means *target* — only `kind === 'target'` dashes (`english-text.js:1560`), the legend appends a literal "target" tag (`:2813`), and the printed key prints "— where we want it" after a dashed name (`:1728`). 1f gives the dash to "Our draft", which is seeded `kind: 'actual'` (`:1793`), so dashed would mean both "where we are" and "where we want to get to" on one plot. **Keep the code on all three counts.**

The one part worth thinking about: 1f's dimming rule, "the rest dim rather than disappear so the class can see arcs cross". Today an off line is not drawn at all. Opacity-instead-of-hidden is a real improvement in principle — but arming currently does two other jobs the design drops (it is the write target, "Feeling on X — taps write to this line only" at `english-text.js:2464-2469`, and it draws ghost dots for unplaced beats), so this is not a one-line change. Flagged as unresolved rather than decided.

**10. Drag as the primary gesture on a wall board.** (1c card 2.) The rule is imported verbatim from the pen widget: *"a hidden handle on a 44px thumbnail is not findable on an interactive whiteboard… a hold-and-drag on a wall-mounted board is not something to make anyone depend on"* (`modelwrite.js:1780-1786`), and `docs/story-map-handoff.md:307` turns it into a three-part rule ending "capture for THE PEN ONLY, which is the one place a drag IS the primary gesture." Beats move by ← earlier / later → (`english-text.js:2537-2563`); dots plot by tap (`:2780`).

1c card 2 also justifies itself with "The children see where the word belongs… asked with a thumb", which hands the teacher's panel to a child's hand — against the governing discovery, *"THE CHILDREN DO NOT TOUCH THE BOARD"* (`english-text.js:885-891`). **Keep the code.**

**11. Ink-to-text.** (1c card 3.) Nothing in the repo converts strokes to characters; SagePen commits point arrays. This is a capability to acquire, not a feature to wire. It also runs into the boxing-up closing line, *"ink and beats share nothing at all"* (`english-text.js:2580-2587`), and it draws guides at fixed pixels when the code is explicit that *"the pitches are viewBox UNITS in a fixed 560-unit space… naming these in px on the board would be a claim the widget cannot keep"* (`:959-967`) — and that the dashed guide is banded to EYFS and KS1 only, with its own "Do not unify the two" comment (`:968-983`). **Keep the code. Do not start this.**

**12. A second surface.** (1b entire; 1e's "Send 3 words to the class bank".) Widgets mount into one body on one screen (`app.js:9343`); the only api a widget receives is `resizeToFit` / `refresh` / `refreshAllOf` (`app.js:9319-9335`), none of which reads or writes another widget; the only existing "second view" is a tab pinned by `#s=<id>` (`app.js:391-394`) showing the *same* widgets. There is no rail anywhere in the app that moves content from one widget instance to another.

This is not a conflict of principle. It is the largest single thing in the canvas, and it is a platform project — the teacher tablet needs a transport, a pairing story, a conflict model and a security story. **I would not build it for round one, and I would not half-build it.** The manifest idea (above) is separable from it and should be taken separately.

**13. Per-child state.** (1b's roster, "2 need a hand", the Nudge card; 1a's 24-name tray.) `classNames()` returns a flat array of strings (`app.js:443-448`) and nothing else about a child is stored anywhere. The Nudge card — "Kofi has offered three words and written two lines" — needs a per-child tally of offers *and* knowledge of what a child wrote, and the widget never sees a child's writing at all. **This is the assessment suite's job, not the board's.** Keeping it out of Sage Stage is the reason the two projects are separate.

**14. A fourth "Review" stage.** (1a.) `SM_STAGES` has three entries with three CSS classes, the counter is the hardcoded string `' of 3'` (`english-text.js:1944`), and a moment's stage is whitelisted against `SM_STAGE_IDS` on load (`:1297`). Adding a fourth id changes the vocabulary of stored evidence — a moment stamped "review" would claim a teaching stance that is not a teaching stance. **Keep three.** Review, if it happens, is an after-the-lesson screen, not a stage.

**15. Two stage pills, and amber for Over-to-you.** (1d.) 1d's compressed board drops "Together" and paints Over-to-you amber. In the shipped palette amber *is* Together (`style.css:5633`, `5643`) and green is Over-to-you and also the lock (`style.css:5594`, `5644`). The dropped pill is probably just a drawing shortcut; the colour inversion would be a genuine bug if copied. **Keep the code.**

**16. A standing "WHOLE CLASS" pill.** (1d.) The title row *"carries only the two things that must be legible from the back of the room"* and is absent when it holds nothing rather than standing empty (`english-text.js:1902-1909`). Whole class is the unlabelled default on purpose. Minor, but it is the kind of thing that gets copied out of a mock without anyone noticing. **Keep the code.**

---

## The rest, sized

| Option | Verdict | Size |
|---|---|---|
| **1a** Reference lesson board | Two-thirds already ships; the new third is the forbidden coupling | Weeks — and most of the new third should not be built at all |
| **1b** Teacher tablet | One excellent idea (the change manifest) inside an architecture that does not exist | Manifest as static per-stage copy: an afternoon. The tablet itself: a platform project, post-Tauri |
| **1c** Three input models | Card 1 ships today; card 2 is against a written rule; card 3 is a capability, not a feature | Keyboard map: half a day. Drag: no. Recognition: no |
| **1d** Calm board | Right instinct, wrong mechanism — the lock is already most of it | A day if it reuses the lock and spares bank and panel; a week as a new persisted full-face mode with its own normaliser, `hasWork` ruling and print ruling |
| **1e** TA group board | The room ships, the cohort does not, the first-language rung is nearly free | Copy line: an hour. Small-group room + amber theme: minutes, today. Pictures and glosses on bank words: several days plus a storage argument (`SM_CAP.pic` is 64000 chars each, `english-text.js:909`). Send rail: no |
| **1f** Multi-character emotion graph | Mostly shipped for three lines; four breaks a permanent shape | Card-count sub-captions: an hour. Role tags on tracks: a day plus a normaliser. Four arcs and the recoloured palette: no |
| **1g** Three chrome treatments | Card 1 already ships; card 2's sub-lines are the best copy in the canvas; card 3 needs an illustration set that does not exist | Sub-lines and straplines as declarative per-stage copy: an hour or two. Dial and ramp handle: no. Wordless tiles plus a 2s animation (the widget's first motion, needing its own reduced-motion branch): a week and an illustrator |

---

## What I would do next

1. **Commit the canvas and this file together.** The canvas is at `docs/design/Classroom Lesson Board.dc.html` and this reading belongs beside it, because the value of the canvas is not the mock — it is the arguments in it, and those are what vanish when a chat closes.

2. **Bind 1–5 and ↑↓ in the capture field** (`english-text.js:2176-2179`, alongside the existing Enter and Escape). Half a day. It makes true a claim the code already makes about itself at `english-text.js:2162-2167`, and it is the only change here that makes a live lesson faster rather than clearer.

3. **Promote the per-stage gloss from a `title` attribute to visible board copy** (`english-text.js:1932`). Write the strapline and the aside from 1a — "Watch me. I am writing the Opening." / "Pens down · you do the Build-up in a minute". This is the canvas's real contribution and it gates nothing, so `english-text.js:1933-1939` survives untouched.

4. **Add the ramp sub-line as declarative text under the strapline** — a plain statement of what is *usually* up at this stage, not a description of what is up. This is the change manifest without the wiring, and it is the whole idea of 1b delivered for the price of three strings.

5. **Turn on 1e today with what exists.** Small group room plus a tangerine theme gives the TA board its identity with no new state (`english-text.js:3176`, `app.js:8838-8866`). Add "Say it in any language first. Then say it in English. Then write it." as room copy. That is 1e's whole pedagogical argument, shipped in an hour, without inventing a cohort.

6. **Add the card-count sub-captions to the graph section captions** (`english-text.js:1520-1531`). Small, honest, and it answers a question a teacher actually asks at the board — how much story is sitting in each part.

7. **Rule out the four dangerous ones in writing, in the code, where the next reader will find them:** stage → help → cover, a shared cover, criteria in the story map, and names on printed words. Each already has a comment; each now has a design that argues against it. A one-line addition to each comment saying *"a 2026-07-31 design canvas proposed exactly this; see docs/design/classroom-lesson-board-vs-shipped.md"* is the cheapest possible insurance against relitigating this in six months when the canvas looks persuasive again and the reasoning has faded.

8. **Leave the teacher tablet alone** until Tauri lands and until per-child state has an owner in the assessment suite. It is the best-drawn thing in the canvas and it is the wrong thing to build next, and those two facts are not in tension — they are why it needed writing down rather than acting on.
