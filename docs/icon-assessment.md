# Icon assessment — 2026-07-28

Prompted by Glenn: "the traffic light is a cone, not traffic lights." Full audit of every
glyph the app can render, against what it labels, at the sizes it actually renders.

## How the icons work (the root cause)

Two sets coexist:

- **`icons.js`** — 100 original hand-drawn SVGs (1.7px rounded stroke, one pastel accent
  fill via `--acc`). This is the set the file's own header describes.
- **`icons-scarlab.js`** — 30 vendored public-domain Scarlab duotone SVGs (2px stroke),
  dropped in later.

The resolver (`icons.js` `icon()`, ~line 313) lets **the vendored set win whenever it has
the name**. 27 of its 30 names shadow hand-drawn originals, which sit as dead code. Most
of the problems below are vendored glyphs whose *drawing* is fine but whose *meaning*
doesn't match the Sage Stage tool wearing it — the traffic cone is exactly this. The fix
for those is one deletion each: remove the vendored key and the hand-drawn original
surfaces automatically. `print.js` uses no icons at all, so none of this touches print.

Method: contact sheet ([icon-check.html](../icon-check.html), kept as a dev harness beside
print-check.html) rendering all 103 runtime glyphs at 64/21/15px plus each shadowed
original; a full usage map (103 icons → every UI site + rendered size); every verdict
adversarially verified by agents tracing the actual SVG path geometry; a completeness
sweep over everything rated fine.

## Findings — wrong object entirely (fix: delete the vendored key)

| # | icon | shows | should show | fronts | note |
|---|------|-------|-------------|--------|------|
| 1 | `traffic` | a road **cone** | the hand-drawn three-lamp **traffic light** | Traffic light widget, dock, dashboard tile | Glenn's example. Children know what a traffic light looks like. |
| 2 | `score` | a stemmed **glass of wine** (wavy accent-filled liquid — geometry refutes the "trophy" reading) | the hand-drawn **medal** (ribbon + starred disc) | Scoreboard widget; reused by Tic tac toe | Also an audience problem, not just a semantic one. |
| 3 | `dice` | a **gamepad** (landscape body, D-pad left, two buttons right) | the hand-drawn five-pip **die** | Dice widget; reused by Numbers & letters | Found as "minor style noise", upgraded by verification to wrong-object. |
| 4 | `text` | two abstract **quote blobs**, unreadable ≤21px | the hand-drawn **Aa** | Text widget, Word builder, Rename ×3, Set subject | 8 sites. Aa reads at 13px. |

## Findings — same-looking circles fronting different tools (fix: delete the vendored keys)

| # | icon | problem | fix |
|---|------|---------|-----|
| 5 | `timer` | vendored timer ≈ vendored clock: identical accent discs; the "difference" is a detached sub-pixel tick | hand-drawn **hourglass** — unique bowtie silhouette at every size |
| 6 | `stopwatch` | third near-identical disc in the same dock; no stopwatch signifiers (no pusher/crown/stem) | hand-drawn **classic stopwatch** (top button survives 15px as a clear nub) |
| — | `teachclock` | *sweep catch:* still nearly identical to vendored `clock` (same disc, same hand pose) in the same dock | mostly resolved by #5/#6 thinning the disc trio; if it still bothers, redraw teachclock with a bolder schoolroom bezel |

## Findings — weak but right-object (fix: delete the vendored keys)

| # | icon | problem | fix |
|---|------|---------|-----|
| 7 | `background` | overlapping panels + diagonal band; muddy at 21px, vague for "what's behind the stage" | hand-drawn **paint roller** — better metaphor, cleaner silhouette |
| 8 | `video` | sprocketed film box turns to mush at 21px | hand-drawn play-frame |

## Findings — hand-drawn originals that need a redraw

| # | icon | problem |
|---|------|---------|
| 9 | `gear` | Drawn as disc r3.1 + 8 detached rays — structurally the canonical **sun/brightness** icon. Fronts settings everywhere (widget ⚙ 13.5px, hero greeting gear, geometry settings, annotate). Redraw with a toothed ring + hub hole at 1.7px stroke. The only redraw that matters. |

## Sweep catches (minor — fix opportunistically)

- **`money`** — the dominant plus-in-circle coin reads as an "add" button and collides
  with the `maths` tab's own big symbols. Consider a £-marked coin.
- **`hilite` vs `marker`** — adjacent pills in the modelled-writing toolbar differing only
  in a broken vs solid underline. Consider a wider chisel nib + swatch bar for hilite.
- **`visualtimer`** — vendored glyph is a stock exploded **pie chart** (wedge floats
  detached); a Time-Timer wedge is contiguous and anchored at 12 o'clock. Un-shadowing
  helps only partly (the hand-drawn is also a plain pie); a small redraw would nail it.
- **`list` reused as "Stroke size"** — a bulleted-list glyph on the ink-width button
  (app.js:12007) says nothing about thickness; three dots of increasing weight would.
- **`shapes`** — only glyph with a hardcoded `#fff` occlusion fill; punches a white hole
  on tinted active/hover states. Swap to `currentColor`-aware layering or accept.

## Checked and fine (called out so they're known-checked, not unexamined)

- **`countdown`'s birthday cake is intentional** — the widget is an *event* countdown
  ("Our event", finishing in 🎉). Party metaphor is correct; do not "fix".
- **`sound`'s microphone stays** — the noise meter literally asks to enable the
  microphone; mic-for-noise is honest and there's no recording tool to collide with.
  Revisit only if dictation/recording ever ships.
- **`link`'s globe stays** — `chain` already means "make this text a link" in the text
  toolbar; globe = "a website" for the Link widget is a coherent split.
- **`happy` / `help` / `quiet` are not dead** — they're the Work mode symbols
  ("Break time" / "Ask for help" / "Work in silence"), applied dynamically from the
  SYMBOLS table (app.js:6354). Child-facing and semantically sound.
- The maths manipulative family (dienes, rekenrek, numberline's frog-jumps, partwhole,
  barmodel, frametiles, pvcounters), the English set (phonemetiles, wordsort, wordbank,
  sentencebuilder, genretoolkit), geometry instruments, chrome verbs (undo/redo/copy/
  close/pin/trash/…) and the drawing tools all read correctly at their smallest sizes.

## Recommended fix order

1. **One commit, eight deletions** in `icons-scarlab.js`: `traffic`, `score`, `dice`,
   `text`, `timer`, `stopwatch`, `background`, `video`. Every one verified to fall back
   cleanly; no other code changes; instantly fixes all four wrong-object icons and the
   circle trio. Also shrinks the foreign-styled minority (30 → 22 vendored) toward the
   hand-drawn language the set's header promises.
2. **Redraw `gear`** (toothed ring + hub) in the hand style.
3. The sweep's five minors, whenever an icon pass next happens.

Un-done on purpose: nothing was changed in this assessment — it is findings only.
