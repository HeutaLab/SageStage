# Sage Stage — Board Control Design (clicker, phone, voice)

**Status:** Design — approved in scope (all three phases); macOS first, Windows a later phase (§7.4)
**Date:** 2026-08-02
**Started by:** a Year 2 teacher: *"When we're at the board, we don't want to be turning away from the children — therefore can we make voice controls?"*
**Depends on:** Phase 2 and 3 need the Tauri desktop wrapper ([storage-abstraction-plan.md](storage-abstraction-plan.md)); Phase 2 rides the local server already specified in [collaboration-design.md](collaboration-design.md) §3
**Companion documents:** [camera-hub-design.md](camera-hub-design.md) (the hub contract this mirrors for microphones), [help-system-design.md](help-system-design.md) (the one table that must learn the new commands)

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

Only the fourth genuinely wants a voice. The first three are discrete triggers, and a
discrete trigger is what a button in the hand is for. This matters because a button never
mishears, and a voice command that fails in front of thirty children costs more than the
turn it saved.

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
3. **A missed command must be silent, not wrong.** Doing nothing is recoverable in front
   of a class; doing the wrong thing is not. Prefer a narrow vocabulary that refuses over
   a wide one that guesses.
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
SageCommand.run(intent)          // the single entry point
SageCommand.register(verb, fn)   // app.js registers what it can do
SageCommand.vocabulary()         // the current legal command set, for matching and help
```

An **intent** is plain data, never a string to be parsed twice:

```js
{ verb: 'timer.start' }
{ verb: 'number.make', value: 348 }
{ verb: 'number.make', value: 348, target: 'dienes' }  // explicitly named widget (§3.3)
{ verb: 'flow.next' }
{ verb: 'widget.open', type: 'dienes' }
```

`verb` is the only required field. `target` is optional and only present when the teacher
named a widget. Everything else is verb-specific payload.

Transports produce intents. The router executes them. A clicker press, a phone tap and a
spoken phrase that mean the same thing produce the *same* intent, which is what makes
the three transports cost one implementation between them rather than three.

### 3.2 What can be commanded

Two registries already exist and should be the source of truth rather than a new hand-kept
list — the same discipline `copy-dist.sh` applies to the file list, and for the same
reason.

- **Board tools** — `TOOLS` at [app.js:11337](../app.js) already carries `id`, `label`
  and `run()` for every tool and widget. Every entry is already a speakable noun
  ("Timer", "Base 10", "Place value counters").
- **Widget names and blurbs** — `window.SAGE_HELP` in
  [help/widgets-data.js](../help/widgets-data.js), the one table that already feeds both
  the in-app help and the help site. The commands must appear here too, or the help
  system will not know they exist.

Widget-specific commands are declared by the widget, not by the router. A widget
definition gains an optional map:

```js
WIDGETS.dienes = {
  title: 'Base 10',
  commands: {
    'number.make':  (w, { value }) => { /* build it on the mat */ },
    'number.pose':  (w, { value }) => { /* set task + target */ },
  },
  ...
}
```

This keeps the router ignorant of what a Base 10 block is, and keeps each widget's
behaviour where its author can see it — the isolation the rest of the codebase already
follows.

### 3.3 Routing — which widget receives it

**This is the hard part, and it is easy to miss.** `lastActiveId`
([app.js:9430](../app.js)) is set on `pointerdown`, so today "the current widget" means
"the last one someone touched". A teacher who never touches the board — the entire point
of this work — leaves it stale or null.

Resolution order, first match wins:

1. **A named widget in the command.** "Base ten, make three hundred and forty eight."
   Unambiguous, always available, and the escape hatch when anything else is wrong.
2. **Exactly one widget on this screen can accept the verb.** If only one manipulative is
   open, "make 348" has one possible destination. This will be the common case, because a
   teacher modelling place value has the place value tool open and little else.
3. **`lastActiveId`, if it is still on this screen and accepts the verb.**
4. **Otherwise refuse**, and say which widgets could have taken it.

A resolved target is shown, not assumed — see §3.4.

### 3.4 Feedback

The teacher is facing away from the board. Feedback that requires reading a small toast is
not feedback.

- **A resolved target is named before it acts** on anything destructive or surprising, and
  named *after* on anything trivially reversible. "Timer started" needs no preamble;
  "cleared the mat" does.
- **The existing `toast()`** carries the words, but is typographically too small to read
  from the carpet. Board-control confirmations use a larger, briefly-held variant.
- **A short, distinct sound per outcome** — accepted, refused, ambiguous. The timer's
  chime machinery in [timer-design.md](timer-design.md) §"every voice is an oscillator"
  already gives the vocabulary; three more recipes cost nothing and are the only feedback
  that works with your back turned.
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

**Ships in the browser build. This is the only phase that can reach the 13 Aug tester
group**, because [go-to-market-checklist.md](go-to-market-checklist.md) puts the testers
on the browser build and the Tauri work in September, already committed to storage,
installers, the updater and licensing.

### 5.1 The gap this closes

A presenter clicker is a £10 device most schools already own, and it is a plain USB
keyboard emitting PageUp and PageDown. **Sage Stage ignores it completely.** Screen
navigation is click-only — `#prevScreen` and `#nextScreen` at
[app.js:9650](../app.js) have `click` handlers and nothing else. There is no keyboard
path to the next screen anywhere in the app.

Worse, it is not merely inert. Many clickers send **`b`** for blank-screen, and bare `b`
already toggles the dock ([app.js:11492](../app.js)). A teacher pressing the blank button
gets a disappearing toolbar. This must be resolved before clicker support is announced,
or the first thing a tester experiences is a bug.

### 5.2 What to bind

Bindings go through the existing guard used by all three global handlers — bail when the
event target is an `input`, `textarea`, `select` or `contenteditable`
([app.js:13705](../app.js) is the pattern). That guard is why single-letter shortcuts are
safe next to the story map's capture bar, and it must not be skipped here.

| Key | Intent | Note |
|---|---|---|
| `PageDown` | `flow.next` | Clicker forward. Advances the reveal if a cover is staged, else next screen. |
| `PageUp` | `flow.back` | Clicker back. |
| `b`, `.` | `flow.blank` | Both common clicker blank keys. **`b` collides — see below.** |

**Arrow keys are deliberately not bound.** Plain arrows are free at global scope today
(only `mod`+Up/Down are taken, for z-order at [app.js:9465](../app.js)), but teachers and
children reasonably expect arrows to nudge a selected thing, and the ink layer may want
them later. `PageUp`/`PageDown` is what the hardware sends; that is enough.

**Blanking does not exist yet either.** There is no black-screen feature in the app —
`blankDeck` at [app.js:147](../app.js) is an unrelated empty-deck helper. `flow.blank` is
therefore a small new Phase 1 deliverable: a full-screen opaque cover, dismissed by any
board-control key or a click. It is a classroom staple ("eyes on me"), it is what the
clicker's second button means, and it is perhaps thirty lines.

**The `b` collision.** Bare `b` currently toggles the dock ([app.js:11492](../app.js)).
Three options: leave it (a clicker's blank button hides the toolbar instead), move the
dock to another key (breaks a shipped shortcut teachers may have learned), or make `b`
context-sensitive. Recommendation: **`b` blanks, and the dock toggle moves to `d`**, with a
one-time toast the first time `b` is pressed explaining the change. Blanking is the more
classroom-important verb, it is what the hardware means by that key, and the dock has a
visible on-screen control whereas a blanked board will not.

### 5.3 The reveal that does not exist

The teacher's "reveal the next line" is not a slow action — **there is no such action**.
Screen cover ([app.js:11290](../app.js)) creates four independently draggable edges and
nothing else. There are no steps to advance.

Phase 1 adds a **staged reveal** to the screen cover: the teacher marks positions (or
takes evenly divided bands), the cover starts closed, and `flow.next` opens the next band.
Dragging still works exactly as it does now; staging is an addition, not a replacement,
because the drag is what teachers already know.

### 5.4 Deliverables

1. `command.js` — router, intent shape, registry, vocabulary, resolution order (§3.3).
2. `app.js` registers the global verbs from `TOOLS` and the screen pager.
3. Widget `commands` maps on the timer, dice, name picker, Base 10, place value counters,
   and the text widget; `mkNum` lifted to module scope.
4. Staged reveal on the screen cover.
5. Blank the board (§5.2) — a full-screen cover and its dismissal.
6. Key bindings, `b` resolved and the dock moved to `d`, one-time toast.
7. Feedback: large confirmation, three sounds, refusal reasons.
8. `help/widgets-data.js` learns the command vocabulary so the `?` system explains it.
9. `index.html` loads `command.js`; `copy-dist.sh` needs no change, because it derives its
   file list from `index.html`.

**On size.** Items 4, 5 and 7 are new interface, not wiring, and item 1 is the piece
everything else depends on. If the 13 Aug date is at risk, the honest cut is to ship items
1, 2, 3, 6 and 9 — the router and the clicker — and let the staged reveal follow. A clicker
that changes screens already answers most of the teacher's question; a half-built reveal
answers none of it.

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
queue, no safeguarding surface. It is the right walking skeleton for Class Link, and
proving the server against one phone is far cheaper than proving it against thirty.

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
- **A firewall prompt** appears on first bind to a non-loopback interface on both macOS
  and Windows. This is a first-run experience to design, not an error to hide.

### 6.4 Layout

A concept sketch was made during design: paired status and the resolved widget at the top,
a number pad with a send key, four thumb-findable flow buttons, and a large hold-to-talk
bar at the bottom once Phase 3 exists. The number pad matters more than it looks — it is
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

- **Verbs** are a closed set of perhaps thirty phrases. Keyword spotting is exactly the
  right tool: it is small, it is fast, and it *structurally cannot* invent a command that
  was not on the list — which is principle 3 enforced by the decoder rather than by hope.
- **Numbers and words are open.** "Make three hundred and forty eight" is connected speech.
  Keyword spotting can be pushed at it by enumerating digit words and composing what it
  hears in order, but the classic teen/ty confusion ("forty" against "fourteen") is a poor
  thing to bet a maths lesson on. Full recognition is the honest tool.

This split, not the operating system, is the real boundary in this feature.

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
- [help/data.html](../help/data.html) and the FAQ entry at [app.js:12325](../app.js) gain
  a microphone paragraph covering push-to-talk: held-to-talk only, recognised on this
  computer, nothing recorded, kept or sent.
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

Both readings are already supported by machinery the presets use, and both are a few
lines.

- **Build it on the mat.** `mkNum()` exists in both Base 10
  ([app.js:3551](../app.js)) and place value counters ([app.js:4196](../app.js)) and is
  what the "Y5 · 34,052" preset calls. Note the place value version takes **thousandths**,
  so 348 is `mkNum(348000)`.
- **Pose it as a challenge.** `setTask(true)` with `target` set renders "Build 348" and
  the existing check-and-praise loop runs unchanged.

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
- **A visible indicator whenever the microphone is open**, on the board, not only on the
  phone. Children and any visiting adult can see when the room is being listened to.
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
- **Phase 3**: measure recognition in a *real* room at teaching volume, not a quiet office —
  the moments a teacher is at the board are the quietest of the day, which helps, but the
  test must be the real one. Measure refusal rate as carefully as accuracy; a command that
  fires wrongly is worse than one that does not fire.
- Every phase: confirm no path reaches a network. The strongest check is running with the
  machine's network off.

---

## 11. Build order

1. `command.js` and the intent shape.
2. Widget `commands` maps; lift `mkNum` to module scope.
3. Key bindings and the `b` resolution.
4. Staged reveal on the screen cover.
5. Feedback: large confirmation, three sounds, refusals with reasons.
6. Help table learns the vocabulary. **← Phase 1 ends; browser build; testers can have this**
7. Local server (shared with Class Link) and QR pairing.
8. Phone remote page, reconnection, connection indicator.  **← Phase 2 ends**
9. Shared audio seam; Noise meter conflict resolved.
10. Apple on-device recognition behind the seam (Swift sidecar), with the router enforcing
    the closed vocabulary (§7.4). Verbs and numbers together.  **← Phase 3 ends, macOS**
11. Windows: sherpa-onnx keyword spotting for the verbs; number dictation decided
    separately.  **← later phase**

---

## 12. Open questions

1. **Does "make 348" build or pose?** Ask the teacher; §8 recommends supporting both with
   distinct verbs.
3. **Is 348 the right example?** Year 2 works to 100. The teacher may have been speaking
   generally, or may teach a mixed or higher group. It changes nothing structurally but it
   changes which widgets matter most.
4. **How is a staged reveal authored?** Evenly divided bands are free; teacher-placed stops
   are better and cost a small editing interaction.
5. **Does the phone remote need the widget list**, or only flow plus a number pad? More
   surface is more to look at, and looking down is the thing being avoided.
6. **What happens on a second screen?** Sage Stage can open a screen window
   ([app.js:9827](../app.js)); which display does a command act on when both are live?
7. **Is a lapel microphone a supported accessory or an assumption?** Because the laptop's
   position varies, a Bluetooth or USB lapel mic may be the difference between working and
   not — and teachers in soundfield-equipped rooms already wear one. If it is supported, it
   needs an input-device picker and a note in the help.
