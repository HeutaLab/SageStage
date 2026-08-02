# Sage Stage — Widget themes: real accents and an honest swatch

**STATUS: BUILT, same day — §2–§6 complete, §7 partial.** The palette, the token
contract, `applyTheme`, the scrim, the new picker swatch, the settings-panel stamp and the
popover pins are all live and verified in the app (see §10 for what was exercised). What
remains is the tail of §7: 41 hardcoded teal literals still sit inside widget bodies — 28
in the English suite, 12 maths marks, 1 in modelled writing — plus the cubes widget's
private `--sm-acc`. Those are the ones where control and teaching material are genuinely
hard to tell apart, so they were deliberately left for a second pass rather than swept
blind. Everything measured below is shipped. Live preview at `theme-check.html` (same
convention as `icon-check.html` / `print-check.html`).
**Origin:** Glenn, 2026-08-02, live on the board: the theme picker "is too similar to
ClassroomScreen", and "the colours need a revamp because there is a clash for the text
and buttons". Both complaints turned out to have one root cause — see §1.
**Companion documents:** [App review checklist](app-review-checklist.md) ·
[Help system](help-system-design.md) · [Click assessment](click-assessment-2026-07-31.md)
**Date:** 2026-08-02

---

## 0. The ask, in Glenn's terms

Two complaints, one cause.

The picker looks like ClassroomScreen's. It does — verified against their live app on
2026-08-02. Their widget settings panel has a section headed "Color theme" containing
rounded radio cards, each drawn as a checkerboard for transparency, a long dark bar
(`rgb(17,24,39)`), then a short accent bar and a dot. That is element-for-element what
`buildThemeGrid` renders at `app.js:9034` — `tc-bar`, `tc-bar tc-short`, `tc-dot`,
`.checker` — in the same right-hand panel, under the same heading, in the same
white → transparent → pastel → bold → dark order.

The text and buttons clash. They do, and the reason is that **the swatch is lying**.

Three principles follow, and every section answers to them:

1. **The swatch must not promise anything the widget won't do.** Preview equals result.
2. **Nothing ships below the floor.** 4.5:1 for text, 3:1 for non-text — the standard
   already documented in `style.css` around `--ink-faint` and `--danger-ink`.
3. **Chrome follows the theme; teaching material never does.** A colour a child has been
   taught to read is not decoration.

## 1. What's wrong today, measured

Each of the 20 entries in `THEMES` (`app.js:8997`) carries an `acc` colour. That value is
used in exactly one place: painting the preview swatch in `buildThemeGrid`. `applyTheme`
(`app.js:9020`) applies only `--ink` and `--ink-soft` plus the `.theme-clear` /
`.theme-dark` classes. It never applies `acc` to anything.

Every real control instead keeps the one global teal `--accent: #0f766e` (`style.css:5`):
the solid `.btn`, the ghost button's hardcoded `rgba(15,118,110,0.1)` tint, checkboxes,
sliders, poll bars, `.cal-day.today`. So a teacher picks a rose widget whose swatch
promises a pink accent and gets teal buttons on pink — hues 175° apart, near
complementary.

Measured against the current palette:

- The ghost button's teal label falls below 4.5:1 on **18 of the 20 themes**. On `grape`
  it is **1.09:1** — the word is invisible. The two that pass (`card` and `glass`, both
  around 4.7) are translucent, so they pass only against the default stage; the ratio
  moves with whatever wallpaper is behind them, and a photo drops both under the floor.
- The solid button's edge falls below the 3:1 non-text floor on **all seven dark themes**:
  grape 1.04, ocean 1.22, crimson 1.52, forest 1.67, navy 2.10, dark 2.39, ink 3.26.
- The secondary ink (`soft`) falls below 4.5:1 on five themes: lilac 4.44, rose 4.50,
  tangerine 4.35, grape 3.83, ocean 4.40.

Body ink passes everywhere (5.20 on grape to 17.06 on ink), which is why the problem
reads specifically as *buttons and small secondary text* — exactly what Glenn saw.

## 2. The colour rule

A theme is **a hue plus an intent**, expressed in OKLCH. Everything else is solved.

OKLCH because it is perceptually uniform: "lightness 0.50" means the same apparent
lightness at every hue, so one rule produces an even set instead of a green that reads
heavier than its blue. Colours are converted to sRGB with chroma reduced until in gamut,
preserving lightness and hue.

The rule **proposes**; the audit **disposes**. Each theme names a designed intent; the
engine then measures every pair, and only a value that *misses* its floor is
automatically re-solved. The palette therefore stays designed but cannot ship a failure.

Targets sit above the floors deliberately — a classroom projector washes contrast out and
children sit up to 8m back, so the floor is a failure line, not a goal:

| Pair | Floor | Target |
|---|---|---|
| Body ink on card | 4.5 | 8.0 |
| Secondary ink on card | 4.5 | 5.0 |
| Button label on its fill | 4.5 | 5.0 |
| Button edge against card | 3.0 | 3.4 |
| Accent ink on card and on wash | 4.5 | 4.9 |
| Accent ink vs body ink | 0.10 perceptual | — |

That last row is not a WCAG measure and needs saying plainly: accent-coloured text must
not read as body text. Contrast is the wrong tool — two near-whites can differ by 1.03:1
and be indistinguishable — so it is measured as perceptual distance in OKLab, weighting
chroma and hue. It caught a real defect (§9, trap 3).

Three tiers of intent, applied by lightness:

- **Light cards** — ink at L 0.32, accent at L 0.50 taking a near-white label.
- **Dark cards** — ink at L 0.965, accent at L 0.875 taking a near-black label. The
  accent is the *pale* thing, which inverts the button's appearance. This is forced by
  contrast and is correct.
- **See-through cards** — measured through a scrim (§5).

Two deliberate departures from pure hue-locking, both recorded so a future 21st theme
knows the rule:

1. **`accentPin`.** `card`, `glass` and `clear` pin the brand teal `#0f766e`. They have no
   hue of their own to borrow, and `card` is the fallback for every unset theme
   (`app.js:9021`) — across the 42 shipped templates it resolves for 52 of 94 widgets. Its
   accent *is* the default look of Sage Stage. Honouring its current swatch (indigo
   `#6366f1`) would have repainted 55% of every template overnight. Pinning teal means the
   default look does not move at all, and only the coloured themes depart.
2. **`accentH`.** `lemon` and `sun` rotate their accent hue to a warm anchor (72° and 66°).
   Yellow cannot darken without going olive; the amber is still unmistakably the same
   family. `clearlight` uses the teal hue so it stays in the neutral family while going pale.

## 3. The token contract

`applyTheme` sets these on the widget element, where they cascade to every control inside
it. All are literal hex — see §9, trap 1.

| Property | Meaning | Consumed by |
|---|---|---|
| `--ink` | body text | existing |
| `--ink-soft` | secondary text | existing |
| `--accent` | solid interactive fill | `.btn`, `.cal-day.today`, sliders, ~20 existing rules |
| `--accent-ink` | label sitting **on** `--accent` | **new** — replaces hardcoded `color:#fff` |
| `--accent-wash` | ghost/tinted button background | **new** — replaces `rgba(15,118,110,0.1)` |
| `--accent-soft` | accent-coloured text on card or wash | existing name, re-pointed |
| `--accent-deep` | always the deep tone, for white surfaces inside a widget | **new** |

The card background is the seventh derived value but is not a custom property — it stays
applied directly as `background`, which is what `applyTheme` already does today.

Three notes on this contract:

- **`--accent-wash` is an opaque flat colour, not an alpha wash.** Every value in §4 is
  the composite already computed, because `color-mix()` is unusable (§9) and an alpha
  over an unknown card is unmeasurable. This is also better by the projector rule already
  recorded in the iteration log: a 10% wash reads as "very slightly lighter" from the back
  of a classroom, where a flat chip reads as a shape. **It is a visible change to app
  chrome too** — `.btn.ghost` appears in modals, the print dialog and the settings panel,
  and all of those go from a teal tint to a flat chip. Small, but it is not confined to
  widgets, and it should be looked at deliberately rather than discovered.
- **`--accent-ink` is one hyphen from `--acc-ink`**, which the genre toolkit already sets
  on the widget body. They cannot collide in CSS — different strings — but they can
  collide in a reader's head. The name is kept because it mirrors the `--danger-ink`
  precedent, and because the two families are systematic: `--acc-*` is widget-type and
  genre identity, `--accent-*` is the theme. If that proves confusing in review, the
  alternative is `--accent-text`.
- **A fifth property, `--accent-deep`,** is always the deep tone regardless of theme. It
  exists for the surfaces that are hardcoded white *inside* a widget body and therefore
  need a dark accent even on a dark card: the number line's dot and labels, the frame-tile
  chip, the word bank reveal panel, the part-whole sweep. Those rules read `--accent-deep`
  instead of keeping private literals, so there is one place to change them.

**The names are forced, not chosen.** `--accent` and `--accent-soft` already exist and are
already read by roughly twenty in-widget rules, so re-pointing them costs zero CSS edits
for those. `--accent-ink` and `--accent-wash` are confirmed unused anywhere in the repo.

`--acc` is **unusable** and must never be used for this. `icons.js:7` is
`const A = 'fill="var(--acc, #c7d2fe)"'` — every icon's accent layer. Setting `--acc` on a
widget element would silently retint every icon inside every widget in one stroke. It is
additionally taken by `.widget-header` for widget-type identity (`app.js:9516`) and by the
genre toolkit, which writes `--acc` and `--acc-ink` onto the widget *body*
(`english-text.js:4119`, read at `style.css:6082`).

All seven properties must be set **unconditionally** on every theme. `buildThemeGrid`
re-invokes `applyTheme` on the live element (`app.js:9043`) rather than rebuilding it, so
anything set only for dark themes would persist after switching back to a light one — a
widget that is wrong only after a particular sequence of clicks.

## 4. The palette

| Theme | id | Card | Ink | Soft ink | Accent | On accent | Wash | Accent ink |
|---|---|---|---|---|---|---|---|---|
| Paper | `card` | `#f1f6f9` | `#28353d` | `#536672` | `#0f766e` | `#f2faff` | `#d4e5e7` | `#00668f` |
| Frost | `glass` | `#e6f3f5` | `#263638` | `#465e61` | `#0f766e` | `#f0fbfc` | `#bad0d1` | `#005a62` |
| Clear | `clear` | _transparent_ | `#28353d` | `#536672` | `#0f766e` | `#f2faff` | `#c1d3d4` | `#00597e` |
| Clear light | `clearlight` | _transparent_ | `#e8f6ff` | `#a9c2d1` | `#6fefe1` | `#012b27` | `#1d282f` | `#6fefe1` |
| Lilac | `lilac` | `#e8deff` | `#34303d` | `#666072` | `#704ea4` | `#f9f7ff` | `#d8cbf3` | `#654298` |
| Mint | `mint` | `#c6fde0` | `#29362f` | `#54695e` | `#007650` | `#f2fbf6` | `#acebcd` | `#006a47` |
| Lemon | `lemon` | `#faf6b3` | `#343427` | `#656451` | `#885700` | `#fef7f0` | `#ebe19c` | `#885700` |
| Peach | `peach` | `#ffdec3` | `#3b3027` | `#706052` | `#915100` | `#fff7f0` | `#f1ccaa` | `#804800` |
| Blossom | `pink` | `#ffe1f4` | `#3b2f36` | `#705d69` | `#933f7b` | `#fef5fb` | `#f1cce4` | `#8c3975` |
| Sky | `sky` | `#d1ecff` | `#28353d` | `#546673` | `#006b9a` | `#f2faff` | `#b6dbf2` | `#005d88` |
| Rose | `rose` | `#ffd3d3` | `#3d2e2f` | `#6c5556` | `#a23c45` | `#fff6f6` | `#f3bfc1` | `#922d39` |
| Sun | `sun` | `#f4de55` | `#353326` | `#5f5b48` | `#8d5400` | `#fef7f0` | `#e7cc4a` | `#784600` |
| Tangerine | `tangerine` | `#ffb685` | `#3c3028` | `#5a493d` | `#974c00` | `#fff7f1` | `#f1a874` | `#6d3500` |
| Grape | `grape` | `#6833bc` | `#f4f1ff` | `#d5d0e9` | `#d8ceff` | `#261f37` | `#5c2da5` | `#d8ceff` |
| Ocean | `ocean` | `#1c50b5` | `#edf4ff` | `#c9d6ed` | `#c0d7ff` | `#18243a` | `#19469f` | `#c0d7ff` |
| Crimson | `crimson` | `#851616` | `#ffefed` | `#d4b6b2` | `#ffc6be` | `#371b18` | `#751313` | `#ffc6be` |
| Forest | `forest` | `#00552e` | `#e6f9eb` | `#adc5b4` | `#96edb5` | `#102a1a` | `#004b28` | `#96edb5` |
| Navy | `navy` | `#144062` | `#eaf5ff` | `#acc1d3` | `#b2dbff` | `#0f2638` | `#123856` | `#b2dbff` |
| Slate | `dark` | `#263137` | `#e8f6ff` | `#a9c2d1` | `#a8deff` | `#0a2737` | `#212b30` | `#a8deff` |
| Ink | `ink` | `#131927` | `#eef4ff` | `#b3bed5` | `#c2d6ff` | `#19233a` | `#111622` | `#c2d6ff` |

Measured contrast. **No value falls below its floor.**

| Theme | ink | soft | label | edge | accent ink / card | accent ink / wash |
|---|---|---|---|---|---|---|
| Paper | 11.57 | 5.49 | 5.18 | 5.03 | 5.85 | 4.90 |
| Frost | 9.17 | 5.04 | 5.19 | 3.99 | 5.80 | 4.94 |
| Clear | 9.55 | 4.53 | 5.18 | 4.15 | 5.83 | 4.96 |
| Clear light | 12.65 | 7.52 | 10.98 | 10.03 | 10.03 | 10.82 |
| Lilac | 9.98 | 4.69 | 5.97 | 4.92 | 5.86 | 4.94 |
| Mint | 11.14 | 5.21 | 5.37 | 5.00 | 5.88 | 4.92 |
| Lemon | 11.34 | 5.41 | 5.80 | 5.54 | 5.54 | 4.63 |
| Peach | 10.07 | 4.73 | 5.86 | 4.88 | 5.80 | 4.91 |
| Blossom | 10.53 | 5.01 | 6.07 | 5.35 | 5.86 | 4.90 |
| Sky | 10.29 | 4.87 | 5.57 | 4.81 | 5.87 | 4.93 |
| Rose | 9.51 | 5.05 | 6.05 | 4.75 | 5.84 | 4.91 |
| Sun | 9.33 | 5.01 | 5.82 | 4.54 | 5.77 | 4.91 |
| Tangerine | 7.46 | 5.00 | 5.92 | 3.67 | 5.69 | 4.91 |
| Grape | 6.77 | 5.03 | 10.64 | 5.09 | 5.09 | 5.98 |
| Ocean | 6.63 | 5.00 | 10.65 | 5.03 | 5.03 | 5.96 |
| Crimson | 8.86 | 5.24 | 10.56 | 6.63 | 6.63 | 7.57 |
| Forest | 8.17 | 4.88 | 11.02 | 6.45 | 6.45 | 7.40 |
| Navy | 9.80 | 5.84 | 10.68 | 7.46 | 7.46 | 8.38 |
| Slate | 12.09 | 7.18 | 10.72 | 9.23 | 9.23 | 10.02 |
| Ink | 15.90 | 9.40 | 10.69 | 12.00 | 12.00 | 12.36 |

**Colour vision deficiency.** Every button label and edge was re-measured through a Viénot
simulation of deuteranopia and protanopia — together roughly 5% of boys in any class. No
measurement falls below its floor under either. The tightest is Tangerine's edge at 3.56
(deuteranopia), still clear of 3.0.

**Distinguishability.** Themes are also a colour-coding tool, so the backgrounds must be
tellable apart. The closest remaining opaque pair is Lilac / Sky at 0.06 perceptual
distance; Paper / Frost measure closer still but are separated by translucency rather than
hue. Pastel hues were spread and their lightnesses alternated to open these gaps — an
earlier draft had Blossom and Rose only 25° apart, effectively the same card at distance.

**Colour-coding and colour blindness — the honest limit.** Passing contrast is not the
same as being tellable apart. Re-measuring the *backgrounds* through the same simulations
shows pairs that collapse almost completely: under deuteranopia Lilac / Sky fall to 0.01
and Grape / Ocean to 0.02; under protanopia Blossom / Sky fall to 0.03.

This is a pre-existing property of spreading twenty themes around the hue wheel, not
something this change introduces — twenty mutually distinguishable colours do not exist
for a deuteranope. It cannot be fixed by picking better hues, only by telling the truth
about it.

The largest set whose members stay separable under **both** simulations is seven:

> **Lilac · Lemon · Tangerine · Grape · Crimson · Navy · Ink**

These are separated by lightness as well as hue, which is what survives both a colour
vision deficiency and a washed-out projector. Around 5% of boys in any class have a
red-green deficiency, so this belongs in front of teachers, not just in a spec: the theme
picker or the help entry should say which themes to reach for when the colour is doing
real work. Never colour-code two groups as Crimson and Forest, or as Rose and Sun.

The derivation, the contrast engine and the CVD simulation live in
[`design/theme-palette/`](design/theme-palette/) and are the source of truth for this
table. Change a theme by editing the rule and re-running, never by hand-editing hex into
this spec or into `app.js` — see that folder's README.

## 5. See-through themes and the scrim

`clear`, `clearlight` and `glass` sit on whatever the teacher put behind them — nine
gradients, ten solid colours (including near-white `#f8fafc`), or an arbitrary photo. No
contrast ratio can be *guaranteed* against an unknown background, so the rule is:

> A see-through card keeps its translucent field, but its **controls** sit on a scrim
> plate at 0.82 alpha. Contrast is then measured against that plate compositing over a
> worst-case mid-grey wallpaper.

Mid-grey is the worst case because it is the furthest a wallpaper can get from both a
light and a dark plate at once; a plate that clears the floor over mid-grey clears it over
anything lighter or darker.

`glass` is included, and that inclusion is not cosmetic. At 0.55 alpha it is as
see-through as `clear`, and measuring it honestly is what revealed its accent edge was
**2.93:1** — below the floor — against a mid-grey wallpaper. Its apparent pass today is an
artefact of only ever being measured against the default stage. With the scrim it reaches
3.99.

This keeps the frosted, lifted look that Soft Daylight chose, while making the one thing
that must be legible actually verifiable.

## 6. The picker swatch

The swatch stops being abstract. Each one shows the theme's **real ink rendered as "Aa"**
beside its **real accent rendered as a button pill**, with a **visible name** underneath —
an honest preview of the only two things a theme controls.

That kills the ClassroomScreen resemblance by construction: there is no long bar, no short
bar, no dot, and nothing that has to be decoded.

- **Anatomy.** Card face 54px tall, 14px radius, 1px hairline border, soft lift. Inside,
  centred with an 8px gap: "Aa" at 19px/700 in `--ink`, and a 26×13px pill at full round in
  `--accent`. Name below at 12px/600. Four across in the side panel.
- **Names.** All 20 get a spoken name — "put yours on Mint" is a thing a teacher can say
  across a classroom. Four had no natural noun and get one: `card` → **Paper**,
  `glass` → **Frost**, `clear` → **Clear**, `clearlight` → **Clear light**. **The ids
  never change** — they are what's persisted in every deck and template.
- **See-through swatches** show the stage wallpaper behind the face, so the checkerboard
  goes too.
- **Selection** cannot rely on the global teal ring, which is invisible against several
  themed cards. Selected state is a 2px ring in the app chrome's ink plus a check mark, so
  it never depends on the theme's own colours, and never on colour alone.
- **Accessibility.** Each swatch is a `role="radio"` in a `radiogroup` with the theme name
  as its accessible name, arrow-key navigable, one tab stop for the group. Target is 54px
  plus the label — comfortably over the touch minimum, which matters because the board is
  touch and hover does not exist there.

## 7. Scope: chrome follows, content does not

Decided with Glenn, 2026-08-02.

**Follows the theme** — anything that is a control: `.btn` and all its variants except the
semantic ones, `.btn.ghost`, form inputs, sliders, checkboxes, active tabs and pills,
progress bars, `.cal-day.today`, plus the roughly 40 hardcoded teal literals inside widget
bodies (the English suite's word sorter / word bank / sentence builder, the number line,
the scoreboard, group cards). Converting only the `var(--accent)` sites would produce
half-themed widgets — `.btn` turning rose while `.btn.ghost` stays teal beside it — because
there are 56 hardcoded `rgba(15,118,110,…)` sites against only 55 variable ones.

**Does not follow** — anything that carries meaning:

- `.btn.go`, `.btn.warn`, `.btn.danger` — these say what the button *does*.
- Traffic light red/amber/green; the noise meter.
- Word bank tier colours (`--wb-t1/2/3`), cube colours (`--sm-t1/2/3`), story map stage
  bands, genre pack colours (`GT_COLS`), sentence builder's `--sbc` roles, bar model fills.
- The three widgets with their own colour pickers: visual timer disc, draw pad ink, text
  widget colour. A stored value is never rewritten by a theme change.
- The draw pad's rose tool palette, which is deliberately not teal so pad-scoped tools stay
  distinguishable from full-screen annotation tools.

**Modelled writing is the exception that needs deciding, not defaulting.** It has already
forked a fourth accent — `#0e7490`, thirteen occurrences at `style.css:5264-5485` — which
means "app chrome keeps the global teal" is *already* untrue before this lands. Left
alone, it is the one widget that visibly ignores its own theme. The recommendation is to
convert it, since its cyan is chrome rather than teaching material, but converting means
re-checking its cue-colour layering, because `modelwrite.js` sets `--acc` on a
`.btn.ghost` pill that will now sit on a themed chip. Same call applies to the cubes
widget's `--sm-acc` triple, whose comment says outright that it avoids the variables
`applyTheme` rewrites: leave it, and say so in the code, rather than half-converting.

`sentence-builder-design.md` already commits to colour never being the sole carrier of
meaning, so this boundary is consistent with what shipped.

**Two seams to decide at build time**, both flagged by the audit:

1. **The settings side panel** is appended to `document.body` (`app.js:9100`), so it
   inherits nothing from the widget. Open the settings for a rose widget and its controls
   stay teal while the widget behind is rose. Recommendation: stamp the same seven properties
   on the panel when it opens — it already knows `settingsFor`, and the panel head already
   carries the widget's `--acc`.
2. **Three white popovers live inside the widget element** and would wrongly inherit a pale
   dark-theme accent onto a white surface: the `⋮` menu (`widgetEl.append(menuEl)`,
   `app.js:9426`), the text toolbar, and modelled writing's `.mw-pop`. They must re-pin
   `--accent` to the deep value on themselves. Same for the handful of in-widget surfaces
   that are hardcoded white regardless of theme (number line labels, word bank reveal).

## 8. The change, file by file

- **`app.js` `THEMES` (8997)** — replace all 20 entries with §4, adding `name`,
  `accentInk`, `accentWash`, `accentSoft`, and `scrim` for the see-through three.
- **`app.js` `applyTheme` (9020)** — set all seven properties unconditionally; keep the
  existing class toggles; add the scrim class for see-through themes.
- **`app.js` `buildThemeGrid` (9029)** — rebuild per §6: Aa, pill, name, radio semantics.
- **`app.js` (9426)** and the text toolbar / `.mw-pop` mounts — re-pin `--accent`.
- **`app.js` `openSettingsPanel` (9067)** — stamp the theme properties on the panel, per
  the §7 recommendation.
- **`style.css` `.btn` (700-712)** — `color: var(--accent-ink)` instead of `#fff`;
  `.btn.ghost` background becomes `var(--accent-wash)`, its colour `var(--accent-soft)`.
- **`style.css`** — the same for `.cal-day.today` (972) and the other `color:#fff`-over-accent
  rules; convert the in-widget hardcoded teal literals; add a control-scrim rule. Note
  that `applyTheme` currently toggles only `.theme-clear` and `.theme-dark`, so the
  see-through set needs **a new class** (`.theme-scrim`) applied to all three of `clear`,
  `clearlight` and `glass` — `glass` has no class of its own today.
- **`style.css` `.theme-card` block (442-467)** — replace `tc-bar` / `tc-dot` with the new
  swatch.
- **`help/widgets-data.js` and the help site** — if themes are documented there, names
  change; ids do not. This is also where the seven-theme colour-blind-safe set from §4
  should surface, so the guidance reaches teachers rather than only reviewers.

**Not affected, verified:** printing (SagePrint builds a fresh SVG from `w.props` and never
reads `w.theme`, painting an opaque white ground first), and export, which calls the same
`applyTheme` on an off-screen clone (`export.js:221`) and so inherits correctly for free.

## 9. Traps the audit found

1. **`color-mix()` must not be used.** `app-review-checklist.md:321` flags it as an open
   item: pre-2023 Chromium, common on locked-down school machines, drops the whole
   declaration. The vendored html2canvas (1.4.1, 2022) also predates it, so it would break
   PNG export too. Every value in §4 is literal hex for this reason.
2. **`.btn` hardcodes `color:#fff`** over a `var(--accent)` fill (`style.css:702`), as do
   `.cal-day.today` and several sentence-builder and modelled-writing rules. Re-point
   `--accent` without the paired ink token and every button label disappears on the seven
   dark themes.
3. **Accent ink can collide with body ink.** On dark cards an auto-corrected accent ink
   solved toward near-white and became indistinguishable from body text, destroying the
   only signal that says "this is interactive". Fixed by making the dark ghost wash go
   *darker* rather than lighter, and caught only because the perceptual separation check
   in §2 exists. Keep that check.
4. **Canvas does not repaint on theme change.** The picker calls `applyTheme` without
   remounting (`app.js:9043`), so anything painted to canvas or baked into an SVG string
   keeps its old colour: draw pad chrome, both clock faces, the timer disc, the noise
   meter. Any accent reaching a canvas needs an explicit repaint hook, or the picker will
   look broken.
5. **`export.js:213-219` is a hand-kept second copy of the widget shell** and already
   differs from `app.js:9475`. Structural changes must be mirrored or exports drift
   silently.
6. **Pre-existing, not caused here:** six widgets hardcode a white surface while reading
   ink from `var(--ink)` (number line, dice, Base 10, counters, sentence builder, modelled
   writing). They are already broken on dark themes. Shipping accents without fixing them
   makes the dark themes look deliberate while staying unusable in exactly the widgets a
   maths lesson runs on. Worth a follow-up.

## 10a. What the build actually found

Three things only showed up once it ran, and all three are recorded because they will bite
again:

1. **`index.html` cache-busts with `app.js?v=NN`.** Edits appear to do nothing until that
   number is bumped — and the browser also caches `index.html` itself, so a plain reload
   keeps serving the old version reference. This is not a dev annoyance: without the bump,
   a teacher on an existing install would keep running the old JS after an update. Bumped
   to `app.js?v=77` / `style.css?v=114`.
2. **Stamping the full theme on the settings panel was wrong.** The panel is white chrome;
   handing it a dark theme's near-white `--ink` made every label vanish. It now takes
   `paintThemeOnWhite`, which passes the hue through as `--accent-deep` and leaves ink
   alone. That is the same rule the in-widget popovers use — **white surfaces take the
   deep tone** — so it is one rule, not two special cases.
3. **`clearlight`'s swatch was unreadable.** Its near-white ink sat on a light
   checkerboard, so the "Aa" disappeared entirely. It now gets a dark checkerboard, which
   is also more honest: that theme exists for dark wallpapers.

## 10. Verification

No automated test suite, so verification is by exercising the app.

1. `theme-check.html` — all 20 cards and swatches, with measured ratios printed under
   each. Regenerated from the derivation, so it cannot drift from the shipped values.
2. Re-run the contrast and CVD audit after any palette edit; it must report zero
   measurements below floor.
3. In the app: set one widget to each of Grape, Rose, Mint, Tangerine and Ink; confirm the
   solid button, ghost button, a slider and a checkbox in each.
4. Switch a widget from Ink back to Paper and confirm nothing sticks (trap 3).
5. Open the settings panel over a rose widget; confirm the seam decision in §7 holds.
6. Open the `⋮` menu and the text toolbar on a Grape widget; both must stay legible.
7. Export a Grape widget to PNG and a Work-mode widget (which uses `color-mix` today) and
   confirm both render.
8. Print a Grape widget via SagePrint; confirm it is still ink-on-white.
9. Check the picker by keyboard alone, and on the board by touch.
