# The help system — instant synopses, the ? everywhere, and the help site

Designed with Glenn, 2026-08-01. Follows the click assessment (docs/click-assessment-2026-07-31.md),
which shipped the first ? button and the in-app help sheet this design extends.

**STATUS: BUILT, same day.** §1–§4 live in the app (registry sourced from
`help/widgets-data.js` — the one table, shared with the site); §5's site lives in
`help/`, published by `.github/workflows/pages.yml`. Verified per §8 in the
desktop-mode harness, including the shield test on destructive buttons. Still
with Glenn: the repo's Pages settings, the Hover DNS records, and the synopsis
wording pass (edit `help/widgets-data.js`; both surfaces follow).

## 0. The ask, in Glenn's terms

A busy application with many parts. New users need an **instant synopsis of what any
part / tool / widget does**, reachable **from any window**, by click or hover. Confident
users grow out of busy help, so nothing may be always-on or in the way. **Support is
paramount** — the compliance answers and long-form guidance must stay first-class.
Onboarding tours for scenarios are a **future** plan, explicitly not this build.

Three principles fall out, and every section below answers to them:

1. **Opt-in, always.** No help surface appears unless summoned. Experts see nothing.
2. **The board is touch.** Hover exists only at the laptop; every path must also work
   by tap, or it doesn't exist in the classroom.
3. **Two cadences.** What's inside the app is true of *this build* and works offline;
   what changes weekly (guides, FAQs, what's-new) lives on the web, one click away,
   fetched by nobody unless they choose it.

## 1. The ? from every window

- **Dashboard**: gains its own ? pill in the top chrome, beside the Aa. The dashboard
  (z 4900) covers the topbar (z 4000), so today the most newcomer-facing view has no
  help at all. Same `openHelp()`; its contextual notice already knows it's on the
  dashboard.
- **Teaching screen / fullscreen / second window**: the topbar ? already serves these
  (the second window renders the same chrome). No changes.
- The ? keeps its click behaviour everywhere: open the help sheet.

## 2. Hover the ? — the instant synopsis card

- Hovering (or keyboard-focusing) any ? shows a small card anchored beneath it after
  ~80ms — instant to a human, immune to drive-past flicker.
- Content: a bold locator line ("A teaching screen — 4 widgets"), two or three lines
  of synopsis for the current view, and a footer: *Click for help & your data answers ·
  "What's this?" points at any tool.*
- Dismisses on mouse-out / blur. Steals no focus, intercepts no clicks, never appears
  while a modal, sheet, or What's-this mode is open.
- Touch: hover never fires; tap opens the sheet as today. Nothing is hover-locked.
- Implementation: one `.help-hover` element, created lazily, positioned from the ?'s
  rect, `pointer-events: none`. z 5100 (above modals' 5000 — it can annotate them
  never, because of the suppression rule; the z simply guarantees it's never buried).

## 3. "What's this?" — the pointing mode

- **Entry**: a button at the top of the help sheet ("What's this? — point at anything").
  The sheet closes; the mode arms.
- **While armed**: `body.helping` is set; the cursor becomes `help`; a small floating
  pill reads *"Tap anything to see what it does — Esc or tap ? to finish."* The pill is
  fixed near the top centre, is itself the touch exit, and never overlaps the card.
- **Pointing**: one delegated handler on `pointermove` (live-tracking card, laptop)
  and `pointerdown` (pin the card, board). The target resolves through `closest()`:
  explicit `data-help` id → dock tool / More-panel cell (tool id) → widget frame
  (widget type) → chrome id. The card renders the registry entry beside the target,
  flip-aware at screen edges.
- **Safety invariant**: while armed, `pointerdown`, `pointerup`, and `click` are
  intercepted **at capture phase** and stopped before the app sees them. Most widgets
  act on `pointerdown` (drag, mat taps), so intercepting `click` alone would not be
  safe. Pointing at "Erase all local data" must be — and is — inert by construction.
- **Exit**: Esc, tapping any ?, or tapping the pill. The mode never persists across
  reloads and never auto-arms.
- **Annotate interplay**: arming What's-this while the draw overlay is active pauses
  drawing input (the capture-phase interception already achieves this); leaving the
  mode restores it. The draw toolbar itself is pointable.
- **Second window**: the mode is per-window state; arming it on the laptop does not
  arm it on the projector.

## 4. The registry — one map, Glenn's voice

**Shape.** One flat map in app.js, populated where TOOLS is built (english entries
join at boot beside `TOOLS.push`):

```js
const HELP = {
  'tool:clock':      'A clock for the wall …',
  'widget:storymap': '…',
  'chrome:dataBtn':  '…',
};
```

**Resolution order** (first hit wins): explicit `data-help="<key>"` attribute (used
for all chrome — the `chrome:`, `dock:`, `dash:`, `draw:` and `minidock` keys below
are simply the strings those attributes carry) → `tool:<id>` derived from dock
buttons and More-panel cells → `widget:<type>` derived from the widget frame. A
target with no key but a `title` attribute shows the title text in the card —
coverage degrades to *something true*, never to silence.

**Depth rule.** One sentence of *what it does*; a second sentence only when there is a
classroom move worth naming. No adjectives the evidence didn't earn. UK vocabulary.

**v1 scope line.** Widgets answer as what they *are* (type level). Controls *inside*
widget bodies keep their native titles — per-control synopses are v1.1 if testers ask.

### The wording table (Glenn edits — this is the support voice)

**Dock tools & widgets** (`tool:` / `widget:` share these)

| key | synopsis |
|---|---|
| background | Change this screen's backdrop — colours, gradients, or a photo. |
| spotlight | Darken everything except one widget, for one-thing-at-a-time attention. |
| shades | Pull a cover over any part of the screen — hide the answer, reveal line by line. |
| lists | Your class name lists — paste a register once, every name tool uses it. |
| sketch | A drawing pad with proper paper — ruled, squared, handwriting guides, staves. |
| text | A text box with sizes, colours and links. Double-click to start typing. |
| clock | The time, analogue or digital, always right. |
| teachclock | A teaching clock with draggable hands, snap steps, and time challenges. |
| moneytray | Coins and notes to drag, count, and make amounts with. |
| shop | A role-play till — price things up, pay, and make change. |
| frametiles | Ten-frames and tiles for number shapes to five and ten. |
| counters | Two-colour counters for sorting, arrays, and addition stories. |
| dienes | Base-10 blocks — build numbers, then exchange ten of a kind upwards. |
| pvcounters | Place-value counters on a chart, up to millions. |
| rekenrek | A counting frame — beads in fives and tens, slid in groups. |
| numberline | A number line you set the ends of — jumps, marks, and fractions. |
| partwhole | Part–whole circles — split a number and see the bonds. |
| barmodel | Bar models for comparing, sharing, and missing numbers. |
| timer | A countdown for tidy-up, tasks, and transitions. Chimes when done. |
| visualtimer | A shrinking disc of time — how long is left, visible from the carpet. |
| stopwatch | Counts up. Races, readings, and how-long-did-that-take. |
| countdown | Days until sports day, the trip, the holidays — the class countdown. |
| calendar | This month, on the board. |
| agenda | Today's plan as a tickable list — the class sees what's next. |
| traffic | A traffic light you click — noise, readiness, or any three-state signal. |
| symbols | Work-mode symbols: independent, partner, group, whiteboards out. |
| sound | A noise meter — the room's loudness as a bar the class can see. Nothing is recorded. |
| picker | Picks a name from your class list, fairly. Can rest picked names. |
| groups | Sorts your class into random groups or pairs in one click. |
| dice | One to three dice. Click to roll. |
| poll | A quick class vote with big buttons and a live tally. |
| score | Points for teams — house points, table points, quiz scores. |
| promptcards | Heads-up and guess-it card packs — vocabulary games for the front of class. |
| wordbuilder | A spelling engine with friendly build-up games. |
| memory | Find-the-pairs on words or pictures you choose. |
| tictactoe | Noughts and crosses, for quick turns and talk. |
| connectfour | Connect four counters, two teams. |
| countdowngame | Numbers and letters rounds, Countdown-style. |
| strategyboard | Mini checkers and an original line-up strategy game. |
| image | A picture on the board — upload one or paste a web address. |
| video | A video or YouTube link, sized to its frame. |
| webcam | This device's camera on screen — a visualiser. Nothing is recorded or sent. |
| embed | A live webpage in a frame — some sites refuse; most work. |
| pdf | A document on the board — PDF, image, or text file. |
| qr | A QR code for any address — the class scans it from their seats. |
| link | A big friendly button that opens a website. |
| sticker | Stamps and emoji to decorate and mark with. |
| phonemetiles | Phoneme tiles and sound mats — build words sound by sound. |
| wordsort | Sort words by class — noun, verb, adjective — against the year's lists. |
| wordbank | A picture word bank the class earns words into. Saves and shares as a file. |
| sentencebuilder | Build sentences from parts — model the grammar move of the day. |
| modelwrite | Modelled writing on proper paper, with school inks and saved pages. |
| genretoolkit | A genre's checklist, word bank and model text — reveal as you teach. |
| storymap | Plan a story in beats — map, emotion graph, and boxing-up, one widget. |

**Chrome** (`chrome:` keys)

| key | synopsis |
|---|---|
| homeBtn | All your decks and class lists — the landing page. |
| dataBtn | Your data: backups, restore, recently closed widgets, and the erase button. |
| helpBtn | Help — what you're looking at, how things work, and where your data lives. |
| fullscreenBtn | Fill the screen — the same board, no window edges. |
| starPill | Class stars this week — tap to award one. |
| aaPill | The reading font — switch the whole app to a dyslexia-friendlier face. |
| prevScreen / nextScreen | Step between this deck's screens. |
| deckBtn | The whole deck as a sidebar — rename, reorder, duplicate, send to a second window. |
| addScreen | A new blank screen after this one. |
| delScreen | Delete this screen (it asks first; the bin keeps its work). |
| dock:more / maths / english / games | The full shelf of widgets in this category — click one to add it, 📌 pins it to the bar. |
| dock:annotate | Draw over everything — the annotation layer. |
| dock:hide | Fold the bar away (B brings it back). |
| minidock | The folded bar: annotate, select, and bring the full bar back. |
| dash:decks / templates / lists / wallpaper | Your decks · ready-made screens · class registers · the landing page's look. |
| dash:start | Back to the board — the last screen you taught from. |
| dash:newdeck | A fresh deck — most teachers keep one per class. |
| dash:template | Start a deck from a ready-made screen set. |
| dash:importppt | Turn a PowerPoint into a deck — one slide, one screen. |
| draw:select | Select and move what you've drawn. |
| draw:pen / marker | Ink over anything on screen. |
| draw:shapes | Lines, arrows, boxes and ellipses. |
| draw:eraser | Rub ink out — just ink, never widgets. |
| draw:geometry | Ruler, protractors, set square — drag along an edge to rule a line. |
| draw:undo / redo / clear | Step drawing back and forward, or clear this screen's ink. |

## 5. The help site — sagestage.co.uk

**Layering.** In-app = offline, always true of this build (synopses, basics, the
compliance FAQ). The site = long-form and fast-moving: the guide, FAQs, what's-new,
workshop links. Nothing in the app fetches it; the app only *links* it, and the
compliance FAQ gains one honest line: *"The full guide opens in your browser — a
normal web page visit, and only when you click it."*

**Mechanics.**
- Source: a `help/` folder in this repo, published by GitHub Pages. Editing help =
  edit markdown, push, live in minutes — fully decoupled from app releases.
- Domain: **sagestage.co.uk** (Glenn registers at Hover), set as the Pages custom
  domain with HTTPS. Hover DNS: apex `A` records `185.199.108.153`, `.109.153`,
  `.110.153`, `.111.153`; `www` CNAME → `heutalab.github.io`.
- URL strategy: once the custom domain is configured, Pages 301-redirects the
  `*.github.io` address to it automatically — so the app bakes
  `https://sagestage.co.uk/help/` and nothing ever strands even if the link ships
  before DNS settles (the github.io fallback keeps resolving into a redirect).
- In-app entry points: a "Open the full guide" button in the help sheet, and the
  hover card's footer mention. Both via `SagePlatform.openExternal` on desktop.
- **Format (Glenn, 2026-08-01: "fantastically simple and useful")** — three pages,
  one nav, nothing nested: **Widgets · FAQ · Your data**, plus one outward link,
  *Get Sage Stage* → sagestage.app.
  - **Widgets**: ONE page holding every widget, grouped by the app's own dock
    categories, with a client-side filter box at the top (static, collects
    nothing). Every widget gets a stable anchor (`/help/widgets#rekenrek`) —
    linkable from a staff email, printable, Ctrl+F-friendly. Entry format: the
    registry one-liner verbatim + one "In class:" line the app doesn't carry.
    The entries are GENERATED from the same table as the in-app registry by a
    small derive script — two hand-maintained copies of the same words is the
    copy-dist mistake wearing a new hat.
  - **FAQ**: fold-out questions (the in-app sheet's pattern), practical and
    compliance together — new laptop, projector windows, printing, backups.
  - **Your data**: a page a DPO can read alone — the sheet's answers expanded,
    ending in a copy-and-paste DPIA note.
  - What's-new lives as a short strip on the Widgets page top, not a page.

**The wider estate (recorded here, designed separately).**
- **sagestage.app** = the live demo ("the taster") + workshop resources — the link
  Glenn hands out alongside HeutaLab. The demo is this same no-build app served
  statically with a demo flag: browser storage only, visibly a taster, sandbox lines
  drawn by the licensing tiers. **Own design doc before building.**
- **Download + mailing list**: decided 2026-08-01 — **soft capture**. The download is
  one click, no email required; an optional signup sits beside it ("update notes and
  things worth showing your staff"). Needs a static-site-friendly newsletter provider
  and a two-line privacy notice — scoped to the site, never the app.
- **Tier shaping** (free tier ≈ one full class: 33-pupil class cap, 2 class lists;
  EYFS sections and suite data-integration as future paid tiers): an evolution of
  `docs/licensing-design.md`, to be designed there, enforced through the same
  offline signed-key gate, shared by app and demo.

## 6. Not in v1

- Onboarding tours ("scenarios") — future; the registry + pointing mode is exactly
  the substrate a tour replays later, so nothing here is throwaway.
- Per-control synopses inside widget bodies (native titles remain).
- Always-on hover popovers anywhere.
- In-app fetching of remote help content (would dent "nothing phones home"; the
  linked site does the fast-moving work instead).

## 7. Hazards

- **Interception must be capture-phase and pointer-complete** — widgets act on
  `pointerdown`; a click-only shield would let pointing at a widget drag it.
- **Never activate the pointed-at thing** — the erase button test is the invariant.
- **Z-order**: card and pill above everything (5100/5090); dashboard sits at 4900,
  modals at 5000.
- **Touch**: every entry and exit reachable by tap alone (pill exit, ? exit).
- **Second window**: mode and card are per-window; no cross-window events.
- **Spatial stability**: the mode moves nothing, resizes nothing, saves nothing.
- **Fullscreen**: topbar ? remains present in fullscreen (verified in the release
  build 2026-08-01); the card anchors to it as normal.

## 8. Verification

Desktop-mode harness (.desktop-mock.html): hover card appears/dismisses on ? hover
and focus; arming from the sheet; pointing at ten representative parts including
**Erase all local data** (card shows, nothing activates); synthetic-tap path (pin,
move, exit by pill); Esc exit; dashboard ? present and working; annotate pause;
registry fallback (an element with only a title). Then the browser build sanity pass
and a rebuilt release bundle. Site: Pages deploy previewed, DNS checked with `dig`,
redirect from github.io confirmed.

## 9. Build order

1. Registry + chrome `data-help` ids (pure data, no behaviour).
2. Hover card on all ?s (incl. the new dashboard ?).
3. What's-this mode (shield → resolver → card → exits).
4. Help-sheet additions (What's-this button, "Open the full guide" link).
5. `help/` site skeleton + Pages + DNS handoff to Glenn.
6. Harness verification, release rebuild, checklist + iteration log entries.
