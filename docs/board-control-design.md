# Sage Stage — Board Control Design (clicker, phone, voice)

**Status:** Design — approved in scope (all three phases); macOS first, Windows a later phase (§7.4)
**Date:** 2026-08-02
**Started by:** a Year 2 teacher: *"When we're at the board, we don't want to be turning away from the children — therefore can we make voice controls?"*
**Depends on:** Phase 2 and 3 need the Tauri desktop wrapper ([storage-abstraction-plan.md](storage-abstraction-plan.md)); Phase 2 rides the local server already specified in [collaboration-design.md](collaboration-design.md) §3
**Companion documents:** [camera-hub-design.md](camera-hub-design.md) (the hub contract this mirrors for microphones), [help-system-design.md](help-system-design.md) (the one table that must learn the new commands)

> **On the line numbers below.** They were verified against `app.js` on the date above and
> they will rot — `app.js` shifted by 77 lines *during the session this document was
> written in*. Every citation names the function or constant as well, so search for the
> name and treat the number as a hint about where to start looking.

---

## 1. What this is

A teacher standing at the board turns their back on the class every time they need the
machine. This document designs the way back: a single **command layer** inside Sage
Stage, and three **transports** that reach it — the keyboard and a presenter clicker,
the teacher's phone, and the voice.

The teacher asked for voice. Voice is the third of the three, and the least of them for
most of what they actually described. That is not a refusal; it is the order the work
should be done in, and §2 explains why.

### 1.1 What the teacher named

Four moments, in their words and expanded:

1. **Widget triggers** — start or pause the timer, roll the dice, pick a name, add a score.
2. **Lesson flow** — reveal the next line under a screen cover, tick the agenda, move the
   spotlight.
3. **Annotating** — writing and highlighting over work while facing the class.
4. **Dictation into the maths and text widgets** — *"take note of words being used and
   numbers such as 'make 348' and the numbers or place value appear."*

Moments 1, 2 and 4 are discrete triggers, and a discrete trigger is what a button in the
hand is for. A button never mishears, and a voice command that fails in front of thirty
children costs more than the turn it saved.

**Moment 3 is not designed here, and that is a decision rather than an oversight.**
Annotating is *continuous* — a line follows a hand across the board — and no clicker press,
phone tap or spoken verb performs it. What a command layer can reach is the annotation
*modes*, which the app already binds to bare `v`/`p`/`m`/`l`/`e` while the draw layer is
active ([app.js:13780](../app.js)); switching pen to highlighter without walking to the
laptop is genuinely useful. The drawing itself needs a hand at the board or a graphics
tablet, and pretending otherwise would be the one part of this document that promised
something it cannot do. Mode-switching verbs are in scope; the stroke is not.

### 1.2 Two answers that shape everything

Asked whether a teacher may hold their own phone in front of a class, the answer was
**it depends on the school** — some sites have a visible-phone rule for safeguarding.
Asked where the laptop sits relative to the board, the answer was **it varies a lot**.

So the design may assume **neither a phone in the hand nor a laptop within earshot**.
Every transport is therefore optional, and none of them may be the only way to do
anything. That single constraint is why the command layer exists as its own thing.

---

## 2. Design principles

1. **The command layer is the product; transports are accessories.** One router, many
   ways in. A command that can only be spoken is a command most teachers cannot use.
2. **Nothing becomes voice-only.** Every command keeps its existing mouse or touch path.
   Voice is a second door, never a replacement lock.
3. **A missed command must refuse, not guess.** Doing the wrong thing in front of a class
   is far worse than doing nothing — but a *silent* nothing is nearly as bad, because the
   teacher stands there repeating themselves at a machine. Refuse out loud, say why, and
   prefer a narrow vocabulary that declines over a wide one that approximates.
4. **The teacher must know it landed without looking.** Confirmation is audible or
   large enough to read from the carpet, or it does not count (§3.4).
5. **Nothing leaves the device, and the published sentence stays true.**
   [help/data.html](../help/data.html) tells schools that nothing is recorded, kept, or
   sent, and that paragraph is pasted into DPIAs. Any recognition happens on the machine
   or does not happen. §7.1 shows this rules out the obvious shortcut.
6. **No always-listening microphone in a classroom of children.** Push-to-talk only. A
   wake word in a Year 2 room will be learned and shouted by lunchtime, and an open mic
   is a safeguarding conversation no teacher should have to have.

---

## 3. The command layer

A new file, `command.js`, loaded from `index.html` before `app.js`. It is pure
JavaScript with no platform dependency, so it works identically in the browser build and
the desktop build, and every later transport plugs into it.

### 3.1 Shape

```
SageCommand.run(intent)              // execute — the single entry point
SageCommand.register(verb, spec)     // app.js and widgets declare what they can do
SageCommand.vocabulary()             // [{ verb, patterns, slots, confirm }] — matching and help
SageCommand.fromText(transcript)     // text -> intent | null. The ONLY text boundary.
```

An **intent** is plain data:

```js
{ verb: 'timer.start' }
{ verb: 'number.make', value: 348 }
{ verb: 'number.make', value: 348, target: 'dienes' }  // explicitly named widget (§3.3)
{ verb: 'flow.next' }
{ verb: 'widget.open', type: 'dienes' }
```

`verb` is the only required field. `target` is optional and only present when the teacher
named a widget. Everything else is verb-specific payload.

**Where the spoken words live.** Nothing in the app currently holds a speakable phrase —
`TOOLS` ([app.js:11414](../app.js)) has `label` and `run()`, `SAGE_HELP` has `name` and
`blurb`, and a `commands` map is keyed by verb id. So registration must carry the phrases,
or §7.4's matcher has nothing to match against:

```js
SageCommand.register('timer.start', {
  say: ['start the timer', 'start timer'],
  fn:  () => ...,
});
SageCommand.register('number.make', {
  say: ['make <number>', 'build <number>'],
  fn:  (payload) => ...,
});
```

`<number>` is **the only slot type in v1**, and it fills `intent.value`. Anything else is a
fixed phrase. This keeps the matcher a small closed problem rather than a grammar engine.

**Text is parsed exactly once, at the transport boundary.** `fromText()` is where §7.4's
normalise → exact → bounded-fuzzy → floor sequence lives; it returns an intent or null, and
`run()` never sees a string. The clicker and the phone build intents directly and never
touch `fromText()` at all — which is precisely why a mis-recognition can never reach a
widget by a route the other transports share.

A clicker press, a phone tap and a spoken phrase that mean the same thing all arrive as the
*same* intent, which is what makes the three transports cost one implementation between
them rather than three.

### 3.2 What can be commanded

Two registries already exist. They stay the source of truth for **what exists and what it
is called**; the `say` phrases of §3.1 are genuinely new and have to be written once. The
discipline `copy-dist.sh` applies to its file list still holds — derive what can be
derived, and hand-keep only what cannot — so the phrases are declared **beside the verb**
and nowhere else, with `SAGE_HELP` learning them from `vocabulary()` rather than repeating
them. Two hand-kept copies of the same phrase is the failure this rule exists to prevent.

- **Board tools** — `TOOLS` at [app.js:11414](../app.js) already carries `id`, `label`
  and `run()` for every tool and widget, which gives the *verbs* for opening things. The
  labels are not reliably speakable as written, though — see §3.3 on "Base 10" and on the
  four different things called some kind of timer.
- **Widget names and blurbs** — `window.SAGE_HELP` in
  [help/widgets-data.js](../help/widgets-data.js), the one table that already feeds both
  the in-app help and the help site. The commands must appear here too, or the help
  system will not know they exist.

Widget commands are declared by the widget, not by the router. **There are two
registration paths, and choosing the wrong one is the most likely way to build this
badly.**

**Path A — on the definition, for prop-only commands.** Suits the timer, Base 10, place
value counters and the text widget, whose commanded behaviour is "change props, repaint".

```js
WIDGETS.dienes = {
  title: 'Base 10',
  commands: {
    'number.make': (w, { value }, api) => { /* set props */ ; return true },
    'number.pose': (w, { value }, api) => { /* set props */ ; return true },
  },
}
```

The signature is `(w, payload, api) => boolean | void`. `api` is the same object
`mountWidget` builds and passes as `mount`'s third argument — it carries `refresh()`, which
is `save()` plus remount. Without it a handler can mutate `w.props` and nothing repaints.
A truthy return means "state changed"; the router then calls `save()`.

**Path B — per instance at mount time, for anything living in the mount closure.** The
dice's `roll()` is a plain function inside `mount` ([app.js:6391](../app.js), and its
`mount(body, w)` does not even take `api`), and the name picker's pick is an anonymous
listener. Neither is reachable from the definition. Faking them by re-randomising props and
remounting **throws away the roll and the spin**, which are the whole point of those
widgets in front of a class.

So those widgets register when they mount, keyed by widget id, exactly as
`sketchKeyHook` ([app.js:8894](../app.js)) already does for the draw pad:

```js
mount(body, w) {
  ...
  SageCommand.bind(w.id, { 'dice.roll': () => roll() });
  return () => SageCommand.unbind(w.id);   // the existing cleanup return
}
```

**Do not** use the existing `this._paint = paint` pattern as a model. It stores a
per-instance closure on the definition object, which every instance of that type shares —
with two dice widgets open, one silently drives the other.

Adding the `commands` key is safe: nothing enumerates `WIDGETS` or the keys of a widget
definition anywhere in `app.js` — every access is by name (`WIDGETS[w.type]`), so an
unrecognised key is ignored by existing code, and widgets without a map keep working
untouched.

### 3.3 Routing — which widget receives it

**This is the hard part, and it is easy to miss.** `lastActiveId`
([app.js:9507](../app.js)) is set on `pointerdown`, so today "the current widget" means
"the last one someone touched". A teacher who never touches the board — the entire point
of this work — leaves it stale or null.

**The candidate set is the *mounted* set, not `screen().widgets`.** `renderScreen` also
mounts every widget elsewhere carrying `everywhere: true`
([app.js:9696](../app.js)) — the "show on all screens" pin. A timer pinned across a deck
lives in another screen's array but is visible and usable here, and a pinned timer is
exactly what a teacher who never touches the board sets up. Iterate `instances`
([app.js:504](../app.js)) and resolve each id.

Resolution order, first match wins:

1. **A named widget in the command.** "Base ten, make three hundred and forty eight."
   Always available, and the escape hatch when anything else is wrong — so its failure
   modes matter. Match the **whole** label after digit normalisation (§7.2.1 showed "base
   ten" arrives as "Base 10", which is the label), and **longest label wins**: "place value
   counters" must beat "counters". This is not optional, because the label set is genuinely
   ambiguous — `TOOLS` contains Timer, Visual timer, Countdown and Stopwatch; Clock and
   Teaching clock; Counters and Place value counters. Any substring match hits two, and
   under a fuzzy matcher they sit inside each other's edit distance. Labels that do not
   speak well ("Base 10", "QR code") get an explicit `say` alias list.
2. **Exactly one mounted widget can accept the verb.** If only one manipulative is open,
   "make 348" has one destination. This is the common case, because a teacher modelling
   place value has the place value tool open and little else.
3. **`lastActiveId`, if it is still mounted and accepts the verb.**
4. **Otherwise refuse**, and name the candidates that could have taken it.

**Two of the same widget.** Duplicates are cheap and normal (`duplicateWidget` at
[app.js:9389](../app.js), ⌘D and the ⋮ menu), and comparing two mats is a real place-value
lesson. With two Base 10 mats open, rule 1 matches both, rule 2 fails, rule 3 leans on the
`lastActiveId` this section just called unreliable, and rule 4's refusal would name the same
widget twice. Resolve it explicitly: **prefer the front-most (highest `z`) and name it in
the confirmation**, so the teacher hears which one took the number and can correct with one
touch.

A resolved target is named, not assumed — see §3.4.

### 3.4 Feedback

The teacher is facing away from the board. Feedback that requires reading a small toast is
not feedback.

**The router owns all feedback; handlers only return a result.** If each widget emits its
own confirmation, principle 4 is unenforceable and every widget author reinvents it. A
handler returns truthy, falsy, or a refusal reason; the router says it.

**Destructiveness is declared, not inferred.** Nothing in the intent shape or either
registry tells the router that `mat.clear` is surprising and `timer.start` is not, so it is
a flag at registration: `SageCommand.register('mat.clear', { say: [...], confirm: true })`.

- **A confirming command announces and then acts, without waiting.** "Clearing the mat."
  Announce-and-wait would need a second input that voice does not have, and a teacher
  mid-sentence will not supply one. Recovery leans on the existing bin and undo rather than
  on a prompt.
- **The existing `toast()`** carries the words, but is typographically too small to read
  from the carpet. Board-control confirmations use a larger, briefly-held variant.
- **A short, distinct sound per outcome** — accepted, refused, ambiguous. `beep(times)` at
  [app.js:63](../app.js) already exists and is what the timer and the Noise meter alarm
  use; three distinguishable recipes cost almost nothing and are the only feedback that
  works with your back turned. They must be distinguishable *from each other* across a
  noisy room, not merely present.
- **Refusals say the reason.** "No timer on this screen" is actionable. A silent failure
  makes a teacher repeat themselves at a machine, which is worse than turning round.

---

## 4. Transports

| Transport | Platform | Needs | Reliability in a live room |
|---|---|---|---|
| Keyboard / presenter clicker | Browser + desktop | Nothing | Total. A keypress is a keypress. |
| Phone remote | Desktop only | Local server (§6) | High, with reconnection handled |
| Voice | Desktop only | Native audio + engine (§7) | Numbers are reliable; the verbs are where the errors are (§7.2.1) |

None is mandatory. A school that forbids phones uses the clicker; a room whose laptop is
across the hall uses the phone; a teacher who wants their hands free uses the voice.

---

## 5. Phase 1 — the keyboard and the clicker

**Ships in the browser build. This is the only phase that *could* reach the 13 Aug tester
group**, because [go-to-market-checklist.md](go-to-market-checklist.md) puts the testers on
the browser build and the Tauri work in September, already committed to storage,
installers, the updater and licensing.

**Could, not will.** The working window before 13 August is a few days, not a few weeks,
and this phase contains real new interface (§5.3, §5.4) rather than wiring alone. Treat the
tester date as a reason to *order* the work well, not as a commitment to land all of it —
see the cut line at the end of §5.4. Shipping a clicker that works beats shipping four
things that half-work in front of the people whose quotes become the marketing.

### 5.1 The gap this closes

A presenter clicker is a £10 device most schools already own, and it is a plain USB
keyboard emitting PageUp and PageDown. **Sage Stage ignores it completely.** Screen
navigation is click-only — `#prevScreen` and `#nextScreen` at
[app.js:9727](../app.js) have `click` handlers and nothing else. There is no keyboard
path to the next screen anywhere in the app.

Worse, it is not merely inert. Many clickers send **`b`** for blank-screen, and bare `b`
already toggles the dock ([app.js:11569](../app.js)). A teacher pressing the blank button
gets a disappearing toolbar. This must be resolved before clicker support is announced,
or the first thing a tester experiences is a bug.

### 5.2 What to bind

**There is no single guard to reuse — that is the first thing to fix.** The global
handlers each implement their own, in two different variants: `closest('input, textarea,
select, [contenteditable="true"]')` in one, and `t.isContentEditable ||
/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)` at [app.js:13782](../app.js) in another. A
fourth handler would be a fourth copy. Phase 1 extracts one helper and the new bindings
share it.

**Text fields are not the whole risk.** A clicker press must also do nothing — and must
certainly not page the deck and `save()` underneath — while the dashboard (`dashEl`), a
modal (`modal`), or What's-this pointing mode (`helping`) is open. The existing Escape
handler at [app.js:9511](../app.js) already branches on all three, which is the list to
copy.

| Key | Intent | Note |
|---|---|---|
| `PageDown` | `flow.next` | Clicker forward. Advances the reveal if a cover is staged, else next screen. |
| `PageUp` | `flow.back` | Clicker back. |
| — | — | **`flow.*` clamps at the deck ends; it must not wrap.** `setCurrent` takes the index modulo the deck length ([app.js:462](../app.js)), so the ‹ › buttons wrap. That is fine behind a visible "3 / 3" label and wrong behind a clicker held at a teacher's back — running off the end silently restarts the lesson. Running past the last screen is a refusal case; the ‹ › buttons keep wrapping. |
| `b`, `.` | `flow.blank` | Both common clicker blank keys. **`b` collides — see below.** |

**Arrow keys are deliberately not bound.** Plain arrows are free at global scope today
(only `mod`+Up/Down are taken, for z-order at [app.js:9542](../app.js)), but teachers and
children reasonably expect arrows to nudge a selected thing, and the ink layer may want
them later. `PageUp`/`PageDown` is what the hardware sends; that is enough.

**Blanking does not exist yet either.** There is no black-screen feature in the app —
`blankDeck` at [app.js:147](../app.js) is an unrelated empty-deck helper. `flow.blank` is
therefore a small new Phase 1 deliverable: a full-screen opaque cover, dismissed by any
board-control key or a click. It is a classroom staple ("eyes on me"), it is what the
clicker's second button means, and it is perhaps thirty lines.

**Its colour is not this document's to choose.** A blanked board is chrome, so it takes a
token from [widget-theme-design.md](widget-theme-design.md) §3 rather than a hardcoded
black — the stage is already a considered dark surface, and a raw `#000` overlay dropped on
top of it would look like a fault rather than a deliberate pause. Ask that document for the
token; do not invent one here.

**The `b` collision.** Bare `b` currently toggles the dock ([app.js:11569](../app.js)).
Three options: leave it (a clicker's blank button hides the toolbar instead), move the
dock to another key (breaks a shipped shortcut teachers may have learned), or make `b`
context-sensitive. Recommendation: **`b` blanks, and the dock toggle moves to `d`**, with a
one-time toast the first time `b` is pressed explaining the change. Blanking is the more
classroom-important verb, it is what the hardware means by that key, and the dock has a
visible on-screen control whereas a blanked board will not.

### 5.3 The reveal that does not exist

The teacher's "reveal the next line" is not a slow action — **there is no such action**.
`toggleShades()` ([app.js:11367](../app.js)) creates four independently draggable edges and
nothing else. There are no steps to advance.

**It is worse than "no steps": the screen cover has no state at all.** Each side's `size`
is a `let` in a closure, the root is appended to `document.body`, nothing is written to
props or `state`, it appears nowhere in `renderScreen`, and it survives nothing — not a
screen change, not a reload. Staged reveal is therefore not a small addition to an existing
feature; it is **the first persistent state the screen cover has ever had**, and it is its
own build step.

The decisions, made here so they are not made accidentally during the build:

- **One nominated edge stages** — default bottom, the reading direction. The other three
  stay plain drags, exactly as now.
- **The staged edge starts fully covering**, which reverses today's open default *for that
  edge only*.
- **`flow.next`** opens the next band; past the last band it advances the screen.
- **`flow.back`** re-covers the last band, and only once fully closed does it fall through
  to the previous screen.
- **Stops persist into the screen's data.** Teacher-placed stops that die on a screen change
  are worse than no stops, because the teacher has to author them twice in one lesson.
- **A staged cover belongs to its screen** and is torn down on a screen change, like any
  other per-screen state.

Dragging still works as it does now; staging is an addition, not a replacement, because the
drag is what teachers already know.

### 5.4 Deliverables

1. `command.js` — router, intent shape, registration with `say` phrases, `vocabulary()`,
   `fromText()`, resolution order (§3.3).
2. One shared input guard extracted from the two existing variants (§5.2), plus the
   `dashEl` / `modal` / `helping` bail-out.
3. `app.js` registers the global verbs from `TOOLS` and the screen pager, with `flow.*`
   clamping rather than wrapping.
4. Widget commands — **path A** (definition) for the timer, score, Base 10, place value
   counters and text; **path B** (per instance at mount) for the dice and name picker
   (§3.2). `mkNum` lifted to module scope; mat selection and misfit refusal (§8).
   The score widget covers "add a score" from §1.1 moment 1, which the first draft dropped.
5. Blank the board (§5.2) — a full-screen cover and its dismissal.
6. Key bindings, `b` resolved and the dock moved to `d`, one-time toast.
7. Feedback: router-owned confirmation, three `beep()` recipes, refusal reasons, `confirm`
   flag on the destructive set.
8. `help/widgets-data.js` learns the command vocabulary so the `?` system explains it.
9. `index.html` loads `command.js`; `copy-dist.sh` needs no change, because it derives its
   file list from `index.html`.
10. **Staged reveal on the screen cover** — its own step, because it is the first
    persistent state that feature has ever had (§5.3).

**On size.** Items 5, 7 and 10 are new interface rather than wiring, item 1 is what
everything else depends on, and item 10 is the largest single piece in the phase. If the
13 Aug date is at risk, the honest cut is items 1, 2, 3, 4, 6 and 9 — the router and a
clicker that drives the deck — leaving the staged reveal to follow. A clicker that changes
screens already answers most of the teacher's question; a half-built reveal answers none of
it and breaks a tool teachers already rely on.

---

## 6. Phase 2 — the phone as a remote

**Desktop only.** The teacher's phone shows a small page with the lesson-flow buttons, a
number pad, and the widget the command will land on.

### 6.1 The rule that decides the architecture

A page served over plain HTTP from a LAN address is **not a secure context**, so
`navigator.mediaDevices` is `undefined` and the Web Speech API is `[SecureContext]`.

**A phone on classroom Wi-Fi can be a button. It can never be a microphone.**

Every route to a secure context on a school LAN fails: a local CA needs a root profile
installed plus a buried iOS trust toggle and is typically blocked on managed Android;
Let's Encrypt's IP certificates (GA January 2026) cover public addresses only; the
Plex-style wildcard needs working external DNS, is exactly what router DNS-rebinding
protection blocks, and means shipping a private key inside the app. None is acceptable in
a classroom.

### 6.2 What it rides on

The transport is already designed. [collaboration-design.md](collaboration-design.md) §3
specifies an axum HTTP server plus WebSocket in the Rust side, the join page embedded via
`rust_embed`, and QR pairing carrying the raw IP. The board remote is a **much smaller
first customer** for that machinery: one trusted device, no student data, no moderation
queue. It is the right walking skeleton for Class Link, and proving the server against one
phone is far cheaper than proving it against thirty.

**But it is not free of safeguarding, and the pairing must not be inherited.** Class Link's
join flow *projects* a five-or-six character code and a QR at the whole class — that is its
entire purpose. A board remote that reused it would hand every child in the room a page
that can blank the board, advance the lesson and clear a mat. So:

- The remote pairs from a QR shown in a **teacher-only panel**, never from a projected code.
- The pairing secret is a **per-session random token**, unrelated to any class join code.
- **Exactly one remote holds the control socket.** A second connection is rejected, and the
  board says so by name rather than silently handing over control.
- The teacher can **revoke and re-pair** from the same panel, because a phone gets lost, and
  a lost phone that still drives the board is the failure that matters.

**Never mDNS.** The Class Link design already forbids it as unreliable on school networks;
there is now a second reason, which is that resolving a `.local` name triggers the macOS
local-network permission prompt while merely listening does not.

### 6.3 What the phone page must handle

- **The screen will sleep.** Wake Lock is secure-context-only, so it is unavailable. For
  push-to-talk this is arguably correct semantics — a sleeping screen means the button is
  released — but the page must treat it as such deliberately rather than be surprised.
- **iOS Safari drops the socket** on lock or backgrounding; Android Chrome freezes timers
  so heartbeats stop and the server times out. **Treat every pocket-and-return as a fresh
  connection**: reconnect with backoff and jitter on `visibilitychange` and `pageshow`,
  hold session state server-side so the lesson resumes rather than resets, and show a
  connection indicator so the teacher knows the button is live *before* they rely on it.
- **The firewall is an install-time problem, not a prompt to design.**
  [collaboration-design.md](collaboration-design.md) §4 already established that the
  Windows first-listen prompt is a trap: for non-admin users — typical on school laptops —
  Windows writes *block* rules whatever the user clicks. The **installer** must create the
  allow rule, scoped to Private/Domain, and that is a Phase 2 prerequisite. macOS admits
  signed apps silently, so a prompt there is a dev-build phenomenon. Designing a friendly
  first-run prompt would produce a flow that silently fails on exactly the machines this
  phase targets.
- **The LAN interface picker and the connectivity self-test** (collaboration-design §3 and
  §4) come along with the server and are named deliverables, not details — a teacher whose
  laptop has three interfaces needs to be told which address the QR carries.

### 6.4 Layout

A concept sketch is saved at
[docs/design/board-remote-concept.html](design/board-remote-concept.html): paired status
and the resolved widget at the top,
a number pad with a send key, four thumb-findable flow buttons, and a large hold-to-talk
bar at the bottom once Phase 3 exists.

**The hold-to-talk bar does not contradict §6.1.** Pressing it sends `voice.hold` and
`voice.release` intents over the WebSocket; the *machine's* microphone opens through the
§7.6 seam. The phone never captures audio — it cannot, per §6.1 — it is a button whose
label happens to be a microphone. This also makes §12 Q6 load-bearing rather than
decorative: if the laptop is out of earshot, the input device that seam opens is what makes
the bar work at all. The number pad matters more than it looks — it is
silent, exact, immune to classroom noise, and needs no recognition at all. For a teacher
who wants "348" on the board and cannot risk a mishearing, tapping three digits without
turning round already solves the original problem.

---

## 7. Phase 3 — voice

### 7.1 What was ruled out, and why it matters

The obvious shortcut is the webview's own speech API. **It is unusable for this product**,
and the reason is worth recording because it will look attractive again in six months.

Probed directly in WKWebView on macOS 26.2: `webkitSpeechRecognition` exists, but
`processLocally`, `phrases` and `grammars` are all absent from its prototype. WebKit sets
`requiresOnDeviceRecognition` itself *only* when the system happens to support it for that
locale at that moment; there is no `else` branch, so otherwise the audio goes to Apple's
servers. No event, error or property tells the page which happened, and the decision is
made per session and per locale — the same Mac can be private on Monday and remote on
Tuesday.

The detail that settles it: making the API work at all requires shipping
`NSSpeechRecognitionUsageDescription`, which Apple defines as explaining why the app
sends user data to Apple's speech recognition servers. **Sage Stage would be shipping, in
its own bundle, a string that contradicts the sentence schools paste into their DPIA.**

Windows is no better. WebView2 runs Edge's platform, whose recogniser is an Azure cloud
service — Microsoft's own policy documentation states that voice data leaves the machine —
with a roughly two-month global outage across Edge 147 and 148 in 2026, a silent no-op on
ARM, and an on-device replacement still behind a Canary flag.

**Conclusion: any voice feature needs a bundled offline engine. There is no shortcut.**

### 7.2 The engines

| Engine | Bundle | Platforms | Vocabulary control | Note |
|---|---|---|---|---|
| sherpa-onnx keyword spotting | ~5 MB (int8) | macOS x64/arm64, Windows x64 | **Hard restriction** — the decoder cannot emit anything outside the list | Apache-2.0; first-party Rust crate |
| Apple `SpeechAnalyzer` / `SpeechTranscriber` | 0 MB | macOS 26+ only | `contextualStrings` — biasing, ~100 phrases | Documented as never sending audio to Apple |
| Apple `SFSpeechRecognizer` + `requiresOnDeviceRecognition` | 0 MB | macOS 10.15+ | `contextualStrings`, `SFSpeechLanguageModel` | Objective-C, reachable via `objc2-speech` |

Verified on the development Mac (macOS 26.2): `SFSpeechRecognizer(en-GB)` reports
`supportsOnDeviceRecognition: true`, and `SpeechTranscriber` lists **en-GB among nine
already-installed English locales**. On-device British English works today with nothing
bundled and nothing downloaded. `SpeechAnalyzer` is Swift-only, so Rust reaches it through
a Swift sidecar or static library.

### 7.2.1 Measured, not assumed

Ten command phrases were synthesised with a British voice and transcribed through
`SpeechTranscriber` on-device, with and without `contextualStrings` biasing seeded from a
stand-in vocabulary. **This is clean synthetic speech in a silent room — the easiest
possible case, and not a substitute for a real teacher in a real classroom.** It is
reported here because three of its results change the design.

| Spoken | Returned |
|---|---|
| "make fourteen" / "make forty" | `Make 14.` / `Make 40.` |
| "make three hundred and forty eight" | `Make 348.` |
| "base ten make twenty three" | `Base 10 make 23.` |
| "start the timer" / "roll the dice" | `Start the timer.` / `Roll the dice.` |
| "reveal the next line" / "clear the mat" | `Reveal the next line.` / `Clear the mat.` |
| **"pick a name"** | **`Take a name.`** |

1. **Numbers arrive already normalised as digits.** Every number came back as a numeral,
   including the connected "three hundred and forty eight". **Do not write a number-word
   parser** — take the digits the engine gives. This also disposes of the teen/ty risk
   flagged in §7.3: 14/40 and 16/60 were correct every time. That risk belongs to keyword
   spotting, not to full recognition.
2. **"Base ten" normalises to "Base 10"**, which happens to be exactly the widget's name
   in `SAGE_HELP`. Widget-name matching should normalise digits rather than assume words.
3. **Biasing did not help.** `contextualStrings` seeded with the exact phrase "pick a name"
   changed nothing — nine of ten correct in *both* conditions, with the same single error.
   The engine returns a fluent, plausible, wrong sentence with no signal that it is wrong.

The third result is the load-bearing one. **Accuracy comes from the router's matcher, not
from the engine's biasing.** "Take a name" is trivially close to "pick a name" under an
edit-distance or phonetic match against a closed vocabulary of ~30 phrases, and impossible
to recover from if the router accepts free text. Results also arrive capitalised and
punctuated (`Make 348.`), so normalisation of case and trailing punctuation is required
before matching.

**sherpa-onnx caveats to budget for, not discover.** The English keyword model measured
under 10% wake success out of the box; usable accuracy needs build-time BPE tokenisation
(`sherpa-onnx-cli text2token`) plus per-keyword boost and threshold tuning. There is no
Windows ARM64 prebuilt, which would run under x64 emulation. The crate downloads prebuilt
archives at build time, so either the build machine has network or they are vendored.

### 7.3 Verbs and numbers are different problems

- **Verbs** are a closed set of perhaps thirty phrases. Keyword spotting suits them: it is
  small, it is fast, and it *structurally cannot* invent a command that was not on the
  list — principle 3 enforced by the decoder rather than by hope.
- **Numbers and words are open.** "Make three hundred and forty eight" is connected speech.
  Keyword spotting can be pushed at it by enumerating digit words and composing what it
  hears in order, but the teen/ty confusion ("forty" against "fourteen") is a poor thing to
  bet a maths lesson on. Full recognition is the honest tool.

This split, not the operating system, is the real boundary in this feature.

**The measurement inverted the intuition, and it is worth saying so plainly.** Before
testing, numbers looked like the risky half and verbs the safe one. §7.2.1 found the
opposite on this engine: every number was correct, including the teen/ty pairs, while the
single error was a *verb* ("pick a name" → "Take a name"). Full recognition dissolves the
number problem entirely and moves all the remaining risk onto short command phrases — which
is precisely the risk the router's closed-vocabulary matcher exists to absorb (§7.4).

### 7.4 Platform strategy — macOS first

**Decided: macOS first, Windows as a later phase.** The deciding fact is the go-to-market
one — the first market is **international schools**, whose device estates skew far more
Apple than a UK maintained-primary estate does. Shipping the richer platform first is
therefore shipping to the larger share of the first market, not the smaller.

**What this simplifies.** Because Apple's on-device stack handles connected speech, it
covers **both** halves of §7.3 — the verbs *and* the numbers — with one engine, zero
bundled model, and no tokenisation or threshold tuning. A macOS-first v1 therefore needs
**no sherpa-onnx at all**. That is materially less work than a cross-platform first
release, not more, and it delivers "make three hundred and forty eight" on day one rather
than deferring the one thing the teacher actually asked for.

**What this costs, and how it is paid.** Apple's `contextualStrings` is *biasing*, not the
hard restriction sherpa-onnx's decoder gives — and §7.2.1 measured it making **no
difference at all** on the one phrase that failed. So principle 3 — refuse rather than
guess — must be enforced **in the router**, and the router's matcher is not a nicety but
the component the whole feature's accuracy rests on:

1. Normalise the transcript: lower-case, strip trailing punctuation, normalise digits.
2. Match against `SageCommand.vocabulary()` — exact first, then a bounded fuzzy match
   (edit distance or phonetic) with an explicit confidence floor.
3. Below the floor, **refuse audibly**. Never approximate, never pick the nearest thing
   and hope. A wrong action in front of a class costs more than a repeated command.

`contextualStrings` should still be seeded from the vocabulary — it costs nothing and may
help on real speech where it did not help on synthetic — but the design must not depend
on it.

**Windows, when it comes**, is sherpa-onnx keyword spotting for the verbs (~5 MB, hard
restriction, §7.2 caveats apply), with number dictation needing a bundled small ASR model
and its own decision. The verb-and-number split of §7.3 makes a partial Windows release
explainable — "the spoken commands work; saying numbers is a Mac feature for now" — rather
than a capability simply missing.

**On announcing it.** This project has already decided once not to advertise ahead of
reality (the no-public-download-CTA spec). "Coming soon" on Windows is a roadmap statement
rather than a broken promise *only* while Windows is not the market being sold to. If that
changes, this section changes with it.

### 7.5 Permissions and published copy

- `src-tauri/Info.plist` exists and declares `NSCameraUsageDescription` and
  `NSMicrophoneUsageDescription`; tauri-build merges it automatically, which the shipped
  bundle confirms. There is no `bundle.macOS` section in `tauri.conf.json` and none is
  needed.
- The microphone string is written specifically about the Noise meter. It is the sentence
  a teacher reads in the macOS prompt, so it must be rewritten to cover both uses honestly.
- `NSSpeechRecognitionUsageDescription` is **not** required by a native on-device path and
  must not be added for one — see §7.1 for why adding it would undercut the product's own
  privacy claim.
- **Three copy surfaces, not two**, and the third is the one that matters most:
  1. [help/data.html:40](../help/data.html) — the "Camera and microphone" details block.
  2. The in-app FAQ at [app.js:12402](../app.js).
  3. **[help/data.html:50](../help/data.html) — the DPIA paste block**, whose current
     wording is *"Camera and microphone, where used, display or measure live and record
     nothing."* That is narrower than recognise-and-discard, and it is the artefact a school
     pastes into a legal document. It must be widened deliberately, not left to be
     technically-arguable.

  All three gain the push-to-talk wording: held only while a control is held, recognised on
  this computer, nothing recorded, kept or sent.
- If `tauri dev` is used to test, note that an unbundled binary has an empty
  `Bundle.main.infoDictionary` — plist entries only take effect in a real `.app` from
  `tauri build`.

### 7.6 The microphone is now shared

The Noise meter calls `getUserMedia` directly ([app.js:6449](../app.js)) — the same
anti-pattern [camera-hub-design.md](camera-hub-design.md) flags for the Webcam widget.
Voice makes it the second consumer. Two consequences:

1. Audio capture moves behind a small shared seam, mirroring the Camera Hub contract.
2. **The Noise meter's alarm will trip on the teacher's own voice.** A room-loudness meter
   and a person speaking into a microphone are in direct conflict. At minimum, the meter
   must ignore input while push-to-talk is held.

---

## 8. What "make 348" should do

Both readings are supported by machinery the presets already use — but "a few lines" would
be wrong, for the reasons below.

- **Build it on the mat.** `mkNum()` exists in both Base 10
  ([app.js:3551](../app.js)) and place value counters ([app.js:4196](../app.js)) and is
  what the "Y5 · 34,052" preset calls.
- **Pose it as a challenge.** Set props and remount; mount honours a pre-set target
  (`if (p.task && p.target == null) newTarget();`) and re-initialises the transient state
  itself.

Three implementation notes, each of which would otherwise produce a wrong result rather
than a failure:

1. **Go through props and a remount — do not reach into the mount closure.**
   `setTask()`, `newTarget()`, `commit()`, `checkTask()` and the `taskDone` flag all live
   inside `mount(body, w)` and are unreachable from a definition-level handler. Worse,
   `setTask(true)` calls `newTarget()`, which **randomises** — the spoken number would be
   silently discarded. The recipe is `w.props.task = true; w.props.target = value;
   w.props.val = false;` then `api.refresh()`. So the closing note below is not only about
   `mkNum`.
2. **Set the mat, or refuse.** Every preset sets `mat` in the same object for a reason:
   `paint()` only draws denominations that exist in `DN_COLS[p.mat]`
   ([app.js:2959](../app.js)), while `dnTotal` sums **every** item regardless
   ([app.js:2978](../app.js)). `DN_COLS.to` is `[1, 0]` — tens and ones — so `mkNum(348)`
   onto a tens-and-ones chart draws 48 and shows a value pill reading 348. That is exactly
   the wrong-not-silent outcome principle 3 forbids, and it would look like a bug in the
   maths rather than in the command. So `number.make` and `number.pose` either select the
   narrowest mat whose columns cover every required denomination and set it alongside
   `items`, or run the existing guards — `dnMisfit` ([app.js:2980](../app.js)) and
   `pvMisfit` ([app.js:3647](../app.js)) — and refuse audibly naming the reason: "that
   chart has no hundreds column".
3. **Place value counters work in thousandths, Base 10 does not.** 348 is `mkNum(348000)`
   and `target = 348000` on place value counters, but `mkNum(348)` and `target = 348` on
   Base 10. The command layer passes a plain 348 and each widget's own handler converts —
   which is exactly why the conversion belongs in the widget and not in the router (§3.2).

Both `mkNum` helpers currently live inside the `settings()` closure and must be lifted to
module scope before a command can reach them.

**The value arrives as a number, not as words.** §7.2.1 measured the recogniser returning
`Make 348.` for connected speech, so the intent carries `value: 348` and no number-word
parsing is needed on any transport. The phone's number pad produces the identical intent,
which is the point of §3.1.

**These are different lessons, and the teacher should choose.** "Make 348" meaning *there
it is, now read it* is a different move from *here's the target, now you build it*.
Recommendation: `number.make` builds it, `number.pose` sets the challenge, both are in the
vocabulary, and the widget's existing Build/Random controls make the distinction visible
so nobody has to remember which word does which.

---

## 9. Safeguarding and privacy

- **Push-to-talk only.** No wake word, no ambient listening, ever. The microphone opens
  while a control is held and closes when it is released.
- **Two indicators, because one cannot carry both meanings.** The Noise meter acquires its
  stream on the "Enable microphone" click ([app.js:6449](../app.js)) and releases it only in
  its unmount cleanup, so a running Noise meter holds the microphone for the whole lesson.
  A single light meaning "the microphone is open" would therefore be lit continuously and
  could signal nothing. So: a quiet persistent **microphone in use** state, and a distinct,
  visually louder **listening for a command** state shown only while push-to-talk is held.
  **The safeguarding promise is about the second one**, and the §7.6 seam must report its
  consumers separately so the two can be told apart.
- **Nothing is retained.** No audio buffer outlives the utterance; no transcript is stored;
  nothing enters the deck file.
- **Recognition is on-device or absent.** If no engine is available, the feature reports
  itself unavailable rather than falling back to anything networked.
- **Children's voices are not the target and must not become it.** The vocabulary is a
  teacher's control surface. Nothing here transcribes a class discussion, and the design
  should not be extended in that direction without a fresh DPIA conversation.

---

## 10. Verification

This project has no automated test suite, so verification means exercising it.

- **Phase 1** in the browser: bind a real clicker, walk a staged reveal across a multi-screen
  deck, confirm every single-letter shortcut still behaves inside the story map's capture
  bar and every other text input, and confirm the `b` change is announced once and only once.
- **Phase 2**: pair a phone, drive a full lesson, then deliberately lock the phone mid-lesson
  and confirm the reconnect resumes rather than resets. Test on a network with client
  isolation to see the failure honestly.
- **Phase 3**: the §7.2.1 numbers came from *synthesised* speech in a silent room and must
  not be quoted as evidence the feature works. Re-measure with real voices — including
  non-British and non-native English accents, which international schools will have in
  every staffroom — in a real room at teaching volume. The moments a teacher is at the
  board are the quietest of the day, which helps, but the test must be the real one.
  Measure refusal rate as carefully as accuracy; a command that fires wrongly is worse than
  one that does not fire.
- **Phase 3, the copy**: read the microphone prompt in a real `tauri build` bundle — §7.5's
  last bullet warns that `tauri dev` shows nothing — and confirm it names both the Noise
  meter and push-to-talk. Re-read all three copy surfaces (§7.5) as a school's data
  protection officer would, not as their author.
- Every phase: confirm no path reaches a network. The strongest check is running with the
  machine's network off.

---

## 11. Build order

1. `command.js` — intent shape, `say` phrases, `vocabulary()`, `fromText()`, resolution
   order; `index.html` loads it.
2. One shared input guard, plus the `dashEl` / `modal` / `helping` bail-out.
3. Key bindings, `flow.*` clamping, the `b` resolution, the dock moved to `d`.
4. Widget commands — path A on the definition, path B per instance for dice and picker;
   lift `mkNum`; mat selection and misfit refusal.
5. Blank the board.
6. Feedback: router-owned confirmation, three `beep()` recipes, refusals with reasons.
7. Help table learns the vocabulary.
8. Staged reveal on the screen cover — the largest piece, and the first persistent state
   that feature has had. **← Phase 1 ends; browser build; testers could have this**
9. Local server (shared with Class Link), LAN interface picker, connectivity self-test, and
   the Windows installer firewall allow rule (collaboration-design §4).
10. Teacher-only pairing panel, per-session token, single control socket, revoke.
11. Phone remote page, reconnection, connection indicator.  **← Phase 2 ends**
12. Shared audio seam reporting consumers separately; Noise meter conflict resolved; the
    two-state microphone indicator.
13. Apple on-device recognition behind the seam (Swift sidecar), with the router enforcing
    the closed vocabulary (§7.4). Verbs and numbers together.
14. **Published copy and permissions**: rewrite `NSMicrophoneUsageDescription`; add the
    push-to-talk wording to the help details block, the in-app FAQ, and the DPIA paste
    block (§7.5).  **← Phase 3 ends, macOS**
15. Windows: sherpa-onnx keyword spotting for the verbs; number dictation decided
    separately.  **← later phase**

---

## 12. Open questions

1. **Does "make 348" build or pose?** Ask the teacher; §8 recommends supporting both with
   distinct verbs.
2. **Is 348 the right example?** Year 2 works to 100. The teacher may have been speaking
   generally, or may teach a mixed or higher group. It changes nothing structurally but it
   changes which widgets matter most.
3. **How is a staged reveal authored?** §5.3 settles the behaviour and persistence; what is
   still open is the *authoring gesture* — evenly divided bands are free, teacher-placed
   stops are better and cost a small editing interaction. Decide before step 8, not during.
4. **Does the phone remote need the widget list**, or only flow plus a number pad? More
   surface is more to look at, and looking down is the thing being avoided.
5. **What happens on a second screen?** Sage Stage can open a screen window
   ([app.js:9904](../app.js)); which display does a command act on when both are live?
6. **Is a lapel microphone a supported accessory or an assumption?** Because the laptop's
   position varies, a Bluetooth or USB lapel mic may be the difference between working and
   not — and teachers in soundfield-equipped rooms already wear one. If it is supported, it
   needs an input-device picker and a note in the help.
7. **Which locale, and who chooses it?** `SpeechTranscriber` supports thirty locales and had
   nine English ones installed on the development machine, but an international-school
   staffroom is full of accents the en-GB model was not built for, and some of those
   schools teach partly in another language. Is the recognition locale a setting, is it
   inferred from the system, and does a locale that is supported-but-not-installed prompt a
   download the teacher has to understand?
