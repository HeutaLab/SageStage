# Sage Stage — Escape! (hangman without the gallows)

**Status:** Design for review — no implementation scheduled; sequenced after the
timer sound slices ([timer design §14](timer-design.md)). Art register decided
2026-08-03 with Glenn live on the board: **teacher's pen, rendered by rough.js**
(MIT, ~9 KB, one vendored file) — the timer faces take the toy register instead.
**Origin:** A teaching colleague's idea, 2026-08-03, delivered fully formed: *"I call
it alien escape and draw an alien getting away… every time they get a letter wrong, a
part of the picture is added and then the final error gets colour added and the
animation begins."* They even prototyped the staged reveal by doodling eight frames
in the Draw Pad. The best feature requests arrive with the spec attached.
**Companion documents:** [Timer moods](timer-design.md) ·
[Word Bank build spec](word-bank-design.md) · [Help system](help-system-design.md)
**Date:** 2026-08-03

---

## 1. What this is

Hangman is the best-loved spelling game ever put on a whiteboard, and its one flaw is
the gallows. Teachers already draw flowers and snowmen instead. The colleague's
version keeps everything that works — hidden word, letter guesses, a picture that
grows with each miss, mounting glee — and swaps the execution for an **escape**: run
out of guesses and the alien gets away.

One engine, skinnable scenarios, living on the existing Games shelf
(`catTab('games'…)`, `app.js:11409`) beside Memory pairs and Connect four.

**Name:** the widget is **Escape!** — scenario-proof, since the gorilla and the
monster are coming. The colleague's coinage "Alien escape" names the first scenario
and this document. (Open to Glenn: shipping v1 as "Alien escape" and renaming later
is the worse path — tray labels are teacher muscle memory, so we pick the forever
name now.)

## 2. Principles

1. **Both endings are a show; nobody dies.** Win or lose, an animation plays and the
   class laughs. Losing means the alien escapes — a *spectacle*, not a punishment.
   Winning must be staged even better, or children will throw rounds to see the
   escape (they will anyway; that is fine).
2. **The class plays as one team against the escape.** Cooperative framing — no
   child is the loser. (Team scoring like Tic tac toe's can come later if teachers
   ask; it is deliberately absent from v1.)
3. **Soft-toy gate.** Every character reads as a plush toy come to life — cheeky,
   round, zero menace. This is the same KS1 gate that constrains the tangible cubes.
4. **The word is the curriculum.** The game is a delivery vehicle for this week's
   spelling list. Word Bank integration is what makes it a teaching tool rather than
   a wet-play toy.
5. **The teacher stays sovereign.** Reveal-the-word is always one tap away, and
   giving up is graceful: the escape animation plays *and* the word is shown and
   read together.

## 3. The round

1. **Set the word** (§5). Blanks appear as chunky tiles; a letter grid a–z sits
   below (alphabetical order, lowercase by default — phonics convention — with a
   caps toggle in the gear).
2. **Guess:** tap a letter. Correct → it fills every matching blank, tile flips.
   Wrong → the letter greys out and the **next picture stage draws itself** in
   hand-drawn strokes (2–3 s, like teacher's pen on the board — kin to SagePen's
   ink). Rendering is **rough.js on canvas**: we author clean geometry tables per
   stage, rough.js performs them wobbly, and its built-in `seed` — set per
   scenario+stage — makes every replay draw identically.
3. **Eight wrong guesses** complete the picture (matching the colleague's eight
   Draw Pad doodles). The **eighth** wrong guess is the colleague's "final error":
   the drawing floods with colour and the escape animation plays (≤ 5 s). The word
   is then revealed for the teaching beat.
4. **Win** — word completed before stage eight: the caught/stayed animation plays,
   confetti in the app's tints, word stays up for the read-through.
5. **New round** button rolls the scene back to empty. Round counter, nothing else.

State is a flat JSON-safe props bag per the games idiom (`WIDGETS.tictactoe`,
`app.js:7583`): `{ word, revealed:[], used:[], wrong:0, scenario:'alien',
caps:false, phase:'setup'|'play'|'won'|'escaped', rounds:0 }` — reload-safe
mid-round like every other widget.

## 4. Scenarios

Same engine, eight cumulative stage-drawings plus two finales each:

- **The Alien** *(v1, the eponym).* Stages: hill → parked UFO → ladder → body →
  head and big eyes → tiptoeing legs → open hatch → glowing beam. **Escape:** hops
  aboard, UFO wobbles up, waves through the porthole, zips off with a sparkle.
  **Win:** the UFO sputters confetti and won't start; the alien shrugs, pulls out a
  tiny teacup and stays for tea.
- **The Gorilla** *(later).* Zoo cage, bars bend one by one; cheeky, not fierce.
  **Escape:** cartwheels out, waves, gone. **Win:** a banana arrives; the gorilla
  shrugs and settles down to eat it.
- **The Monster at the Window** *(later, softened).* The colleague pitched a monster
  "pointing at the children through the screen"; pointing at a reception child is a
  step too far, so ours **peeks** — eyes over the sill, then nose pressed flat to
  the glass, pulling faces. **Escape:** one last enormous raspberry, then ducks
  away. **Win:** it turns out to want a wave; wave back, it beams and pops off.
  Flagged for Glenn's judgment and clearly labelled in the picker — a reception
  teacher simply picks the alien.

Art is the long pole: each scenario is 8 stage drawings + 2 finales in code (canvas
strokes, baked app-palette colours). **v1 ships one scenario, engine ready for
three.**

## 5. Where words come from

- **Type it, masked.** The board is on the projector, so word entry shows dots as
  you type, with a hold-to-peek eye. Quick path: a "New word…" button using
  `promptDialog` (`app.js:11703`) extended with a `mask: true` opt — a natural
  growth of the seam that exists precisely because native `prompt` is a webview
  no-op.
- **From the Word Bank.** "Use my Word bank" pulls a random eligible card from the
  Word Bank **on the same screen**, exactly the sentence builder's precedent
  (`english-word.js:3225` — scoped by the widget's own screen, deliberately not
  `deck.current`). Eligible: a–z letters only, 2–12 characters. Same-screen scoping
  is pedagogically right — the topic's screen owns the topic's words. Zero-prep
  replay: every "New round" draws a fresh word from the list.
- v1 is single words, letters a–z; hyphens and phrases wait for a real request.

## 6. Layout

One widget, games-shelf sized (~640×520): scene panel on top (the drawing is the
star), blank tiles beneath it, letter grid at the bottom, `.game-title-row` header
with round counter and New round / Reveal buttons per the shared games chrome.
`ResizeObserver` drops the grid to two rows and shrinks the scene at small sizes;
the 150×100 floor shows scene + blanks only.

## 7. Sound

Three stings through `SageSounds` ([timer design §4](timer-design.md)): a soft
*doink* on a wrong letter, a bright *pling* on a correct one, and the finale uses
**Ta-da** (win) / **Pop** + a slide-whistle-ish drop (escape). This is why Escape!
sequences after timer slice 1 — the engine exists by then. All governed by the
widget's own sound checkbox like every timer.

## 8. Registration and help

One object `WIDGETS.escape` in the activity-games section (`app.js:7326` region),
one tray line `widgetTool('escape', 'Escape!', 'games')` beside `app.js:11380`, one
help row:

> `{ id: 'escape', cat: 'games', name: 'Escape!', blurb: 'Hangman reborn: wrong
> letters build the picture, and the alien gets away. Nobody hangs.', inclass:
> "This week's spellings — the alien only escapes if the whole class runs out of
> ideas." }`

Build logistics as ever: `?v=` bumps + `copy-dist.sh`. Plus one new vendored file:
`vendor/rough/rough.js` (UMD single file, MIT — keep the licence header, add the
licence text beside it, per house rules on vendored assets). Read the actual licence
file the day it lands; canvas mode, not SVG, for webview performance. Art colours are
baked at authoring time — no runtime `var()` in artwork (brand-session lesson,
2026-08-02).

## 9. Out of scope for v1

Teams and scoring; phrases; custom scenarios; letter-frequency hints; TTS reading
of the word; difficulty settings (stage count stays eight, always — the colleague's
doodles are the spec). Each returns only on a real classroom request.

## 10. Slices

1. **Engine + The Alien** — full round loop, masked entry, Word Bank pull, both
   finales, sounds via `SageSounds`. This is the shippable game.
2. **The Gorilla** — second scenario proves the skin contract.
3. **The Monster at the Window** — after Glenn signs off the softened treatment.
