# Sage Stage — Timer moods: sounds and faces for the two timers

**Status:** Design for review — no implementation scheduled. Art register decided
2026-08-03 with Glenn live on the board: **faces are bespoke Soft Daylight vector, no
library** (the game takes the pen register — see the Escape! spec). Face line-up and
sound picks stay open on the [direction board](design/timer-faces-directions.html);
Glenn crops what he likes.
**Origin:** First outside feedback, 2026-08-03 — a teaching colleague's field notes
(selectable end sounds, themed visual timers, tension music for tidy-up races).
**Companion documents:** [Alien Escape](alien-escape-design.md) ·
[Help system](help-system-design.md) · [App review checklist](app-review-checklist.md)
**Date:** 2026-08-03

---

## 1. What this is

The colleague's three timer asks, in their own shape:

1. *"Choose different sounds for the timer. Sometimes you want something gentle and
   calm, sometimes you want something more energetic and fast paced."* That is not a
   request for a sound-file list — it is a **mood axis**, and it should read as one.
2. The Mission Impossible story: they play the theme *while* the class races to tidy
   up. That is a second audio layer — **during** the countdown, not at its end. A
   timer has two audible jobs: mark time passing, and mark time's up.
3. Egg timer, sand timer, candle: **visual forms of remaining time** that children can
   read before they can read `01:00`.

A primary timer is a regulation tool. Transitions, talk time, brain breaks — the timer
sets the emotional tempo of the room. Mood-matched sound and form is not decoration;
it is the feature.

## 2. What ships today

Two timers, one audio primitive:

- **Timer** (`app.js:5781`) — digits + progress bar, presets 1/5/10/15m, custom
  duration in the gear, `sound: true` prop, `beep(4)` at zero, `.finished` class
  pulses the digits red (`style.css:762`). Repeat prop re-rings at intervals.
- **Visual timer** (`app.js:6738`) — canvas depleting disc, same presets, same
  `beep(4)`, own `color` prop. **It is already a de facto face of the same clock.**
- **`beep(times)`** (`app.js:154`) — pure Web Audio, 880 Hz sine, no files, whole body
  try/catch-wrapped. There are no audio assets anywhere in the app, and no global
  mute; per-widget `sound` checkboxes are the only control.

That split is load-bearing for this design: **sounds upgrade both timers; faces grow
on the Visual timer**, whose whole identity is "time you can see". The digit Timer
stays the crisp one. We do not merge the two widgets — teachers have saved layouts
and muscle memory around both, and carried-over state is the recall routine.

## 3. Principles

1. **Nothing changes until the teacher opts in.** Defaults reproduce today exactly:
   Timer and Visual timer keep the classic chime and their current look. A saved deck
   loaded after this ships looks and sounds identical to yesterday.
2. **Two audio layers, independently chosen.** *End* (a short sting at zero) and
   *During* (silence by default; ticks or music while running). The colleague's two
   stories live one per layer.
3. **Sounds are synthesized, never shipped as recordings.** Extends the `beep()`
   idiom: Web Audio recipes, zero assets, works offline, volume is a number. See §10
   for why this is also the licensing answer.
4. **Every face reads from the back of the room.** A face's one job is remaining
   fraction at a glance from six metres. Digits stay available on every face.
5. **The end is a moment, not a siren.** At zero: the face plays a short finale
   (≤ 4 s), the end sound plays **once**, and the widget keeps pulsing visually until
   touched (the existing `.finished` pattern, generalized). No looping alarms.
6. **Preview before the class hears it.** Changing any sound in the gear plays it
   immediately at the set volume. A teacher never discovers a sound live.
7. **One during-track at a time.** Starting a during-track on any timer stops another
   timer's track (end stings may overlap freely). Two tension loops is chaos, not
   atmosphere.

## 4. The sound engine

A new small file, `sounds.js`, alongside `storage.js` — app.js is past thirteen
thousand lines and this is a bounded, testable unit. Module pattern mirrors the
English module: `window.SageSounds`, no build step, script tag + `?v=` bump +
`copy-dist.sh` (§12).

```
SageSounds.play(name, { volume })          // fire-and-forget sting
SageSounds.loop(name, { volume, frac })    // start/continue a during-track;
                                           // frac() -> remaining/total, polled for tempo
SageSounds.stopLoop()                      // silence the during layer
SageSounds.unlocked()                      // AudioContext state, for the spike in §13
```

- One persistent `AudioContext`, created lazily, resumed on first `pointerdown`
  (belt-and-braces against autoplay suspension; today's `beep()` relies on sticky
  activation and has never been verified inside the Tauri webview — §13).
- Every voice is an oscillator/noise recipe with a gain envelope, same try/catch
  resilience as `beep()`.
- Loops use the standard lookahead scheduler (~200 ms horizon from the widgets'
  existing 250 ms paint tick), so pause/reset/extend resync naturally.
- `beep()` itself is untouched — the maths widgets and noise meter keep their ring.

**Timbre expectation, stated up front:** synthesis at this scale sounds like a warm
8-bit music box, not an orchestra. For a children's classroom tool that is a feature —
own it, don't apologise for it. If a premium "recorded soundpack" ever matters, it is
a later licensing-tier question, not this design.

## 5. End sounds

`endSound` prop on **both** timers (replacing the bare `sound` boolean; `sound:false`
maps to `'off'`, `sound:true` to `'chime'` on first load — no migration file, just a
read-time default). Menu, each a named recipe:

| Name | Recipe sketch | Mood |
|---|---|---|
| **Classic chime** *(default)* | today's 880 Hz sine ×4 — byte-for-byte the current sound | neutral |
| **Soft chime** | 660+880 Hz sines, staggered, long 0.9 s release, low gain | calm |
| **School bell** | 1.4 kHz square with 20 Hz tremolo, lowpassed, 0.8 s | classic |
| **Ta-da** | major triad arpeggio + octave, bright and short | celebratory |
| **Rocket launch** | filtered noise sweep up + sine drop 120→60 Hz, then 3-note sparkle | energetic |
| **Pop** | short pluck + two quick high chirps | silly |
| **Off** | — | silent rooms |

The Timer's existing **Repeat** feature (`extra rings, e.g. 2 = ring at 10, 20 and 30
min`) plays the chosen end sound per cycle, unchanged in behaviour.

## 6. The during layer

`duringSound` prop on both timers, default `'off'`:

| Name | Behaviour |
|---|---|
| **Off** *(default)* | today's behaviour |
| **Tick (last 10 s)** | soft woodblock tick each second from 0:10; the universal urgency layer, works with every face including the plain digits |
| **Tick (throughout)** | same tick the whole way |
| **Heartbeat** | low pulse whose tempo climbs from ~90 to ~180 BPM as remaining fraction falls — the generic race-mode track |
| **Mountain King** | Grieg's *In the Hall of the Mountain King* motif, self-sequenced, tempo tracking remaining time — see §10. THE cartoon-chase music; literally composed to accelerate |
| **Spy vamp** | original minor 4/4 vamp with brass-ish stabs — genre, not any protected theme |

**Accelerando rule:** tempo is a clamped function of remaining fraction, resynced on
pause/resume/reset. The famous final burst of Mountain King lands inside the last ten
seconds; exact final-chord-at-zero is a stretch goal, not a promise — pauses make
exact sync fragile and a near-miss still delights.

## 7. Faces on the Visual timer

`face` prop on the Visual timer, default `'disc'` — an absent prop *is* the disc, so
every existing deck is untouched. Faces are entries in a small table, each a canvas
draw function (the disc is already canvas; particles and finales are cheap there, and
one `<canvas>` means no DOM churn):

```
FACE = { id, name, draw(ctx, frac, w, h, color, tMs), finale(ctx, tMs) -> done? }
```

| Face | Remaining time reads as | Finale at zero | Mood |
|---|---|---|---|
| **Disc** *(default)* | today's depleting disc, pixel-for-pixel | today's behaviour + red pulse | neutral |
| **Sand timer** | sand level in the top bulb, thin falling stream, small settling pile | last grains fall, glass settles, tiny dust puff | calm |
| **Candle** | wax height; flame flickers gently | flame gutters to a smoke wisp | calm |
| **Rocket** | gantry lights climb, steam builds under the rocket | **launch** — whoosh, lift-off, star burst. The deadline is the reward; a tidy-up race ends in a cheer, not an alarm | energetic |
| **Egg** | wobble amplitude grows; cracks appear at fraction milestones | shell pops, chick out, confetti | silly |

- **Digits:** `showDigits` checkbox on every face; default preserves whatever the
  disc shows today (implementation session verifies the current overlay and keeps it).
  Faces make remaining time legible to pre-readers — that is their pedagogy, and why
  a teacher may deliberately hide the numbers for time-sense work.
- **At-distance test** (principle 4) is the acceptance test per face: at 280×210 on a
  projector, can you read "about half left" from the back? Sand level, wax height,
  lit gantry count, crack count are the honest signals.
- **Small sizes:** below ~170 px height (hard widget floor is 150×100,
  `app.js:9563`), faces drop ornament and keep only the fraction signal + digits.
  Size via the dominant `ResizeObserver` idiom (~20 widgets) — the disc already has
  one at `app.js:6820`.
- **Colour:** the existing `color` prop keeps meaning per face — sand colour, wax
  colour, rocket trim, spot pattern on the egg.
- Faces animate on the existing 250 ms paint tick while running, with a rAF finale;
  paused faces are static. No idle animation loops eating laptop battery.

The digit **Timer gets no faces** — it is the typographic one, and `fitFont`
(`app.js:506`) already makes it glorious at any size.

## 8. Mood presets

Top of the Visual timer's gear, five chips that set `face + endSound + duringSound`
in one tap — mid-lesson speed matters more than combinatorial freedom:

- **Classic** — disc · classic chime · off *(the reset-to-yesterday chip)*
- **Calm** — sand · soft chime · off
- **Focus** — candle · soft chime · tick (last 10 s)
- **Race!** — rocket · rocket launch · heartbeat *(or Mountain King once heard)*
- **Surprise** — egg · pop · off

Chips are shortcuts, not modes: the three à-la-carte rows sit beneath and always show
the truth. The digit Timer gets no chips, just its two sound rows.

## 9. Settings panels

Existing idiom throughout — `settingRow`/`checkRow`/`selectInput`/`rangeInput`
(`app.js:8947`), inside `def.settings(box, w, api)` (`app.js:9067`).

**Timer:** Duration (unchanged) · End sound `selectInput` · During `selectInput` ·
Volume `rangeInput` · Repeat (unchanged).
**Visual timer:** Preset chips · Face `selectInput` · End sound · During · Volume ·
Show numbers `checkRow` · colour (existing).

Changing any sound row previews it once at the set volume (principle 6). Volume is
per-widget: `volume` prop 0–100, default 70, with the curve calibrated so 70 sounds
like today's gain-0.4 chime; a global mute in
the `prefs` bag (`app.js:269`) is noted as the natural assembly-day switch — one
checkbox, deliberately deferred until someone asks.

## 10. What we will not ship, and the clean route to the same joke

The colleague asked for Mission Impossible, Indiana Jones, Star Wars. **We cannot
ship any of them, ever** — not the recordings, not re-recordings, not close
imitations. The MI theme (Schifrin) including its signature 5/4 ostinato, and the
Williams scores, are protected compositions; a bundled soundalike is an infringement
with a famous plaintiff. And recordings carry a *second* rights layer, so we never
bundle third-party audio of anything, even public-domain works.

The clean route lands the same classroom joke:

1. **Genre-alikes, original:** the spy vamp and heartbeat evoke *tension* without any
   protected signature. The teacher's joke is "we're in a rush", not a specific film.
2. **Public domain, self-sequenced:** Grieg died in 1907, Rossini in 1868 — *Mountain
   King* and the *William Tell* gallop (a later candidate) are ours to synthesize
   from the score. No rights exist in a rendition we generate ourselves.
3. Teachers who love the real MI theme can keep playing it from their own speakers —
   that is their licence and their business. What we give them is a chase that *ends
   with the clock*, which Spotify can't do.

Khachaturian's Sabre Dance is explicitly out (in copyright until 2049 in life+70
terms). Anything added to the music list needs a dead-before-1956 composer or an
original composition.

## 11. Help table

`help/widgets-data.js` rows to update when slices land (`docs/help-system-design.md`
governs): Timer's blurb keeps "Chimes when done" truthful (it stays the default) but
gains "— or pick the sound"; Visual timer's row becomes the face story ("A shrinking
disc, a sand timer, a candle, a rocket — time you can see"). `inclass` lines write
themselves: *"Mountain King for the last two minutes of tidy-up."*

## 12. Build notes for the implementing session

- New file `sounds.js` → script tag in `index.html` with fresh `?v=`, bump the other
  touched files' `?v=`, and run `copy-dist.sh` — `dist/` is a byte mirror.
- Both timer widgets change in `app.js` only; no CSS beyond a face-agnostic finale
  pulse if the existing `.finished` doesn't transfer.
- New props ride the existing state blob (`sage-stage-v1`); absent props default to
  today's behaviour, so no migration.

## 13. Spikes (before slice 1 is called done)

1. **Audio in the Tauri webview.** `beep()` has never been proven inside WKWebView —
   verify a context created outside a gesture actually sounds after sticky
   activation, on the machine, not in Chrome. The `pointerdown` resume in §4 is the
   expected fix; confirm, don't assume.
2. **Tick drift.** Confirm the 250 ms paint tick + lookahead scheduler keeps the
   last-10-seconds ticks aligned with the displayed seconds (they must never
   disagree with the digits).

## 14. Slices

1. **Sound choice** — `sounds.js`, end-sound menu + volume + preview on both timers.
   One session. This is the colleague's literal ask and the highest-visibility win
   for the 13 Aug testers *if* a pre-vacation session exists; otherwise it is the
   first post-vacation slice.
2. **During layer** — ticks + heartbeat + Mountain King + spy vamp.
3. **Faces** — sand + candle first (the calm pair), then rocket + egg; presets chip
   row; help-table rows.

Each slice ships alone and leaves defaults untouched. Faces are picked from the
[direction board](design/timer-faces-directions.html) before slice 3 is scheduled.
