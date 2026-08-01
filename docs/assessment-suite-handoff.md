# Assessment Suite — handoff brief

Paste this entire document as the first message of a new chat (or drop it into the new
project's repo and point Claude at it). It is self-contained: the chat it lands in has
none of the context behind it. If that chat has persistent project memory, save the key
facts below into it before doing anything else.

## Who you're working with

Glenn — UK primary school teacher and solo developer (HeutaLab). Works spec-first:
brainstorm, then a design doc, then code; he expects honest pushback, one question at a
time, and UK school vocabulary (SLT, head of year, MIS, parents' evening). He already
ships **Sage Stage**, a 100%-local classroom screen (~50 widgets, no accounts, no
server, no tracking). Sage Stage has its own sessions and is **out of scope here** —
it stays out of this pipeline in 2026.

## What this project is

A four-piece assessment suite — separate web apps, not part of Sage Stage:

1. **Classroom Helper** — in-class assessment capture. MS-Lists-like (items + tags)
   but child-shaped: a one-stop-shop where a teacher marks traits against children at
   classroom speed. Replaces Glenn's current MS Lists workflow; his Lists exports seed
   the trait bank and test data.
2. **Report Writer** — LLM-backed school reports: the teacher's voice, the school's
   style-guide constraints, summative traits pulled from a bank into the prompt, per
   subject/topic, to a set character count.
3. **SLT dashboard** (sister app, unwritten) — a head of year aggregates teacher data
   en masse; progress made readable for a non-data-literate SLT readership.
4. **iPad student-voice app** (satellite) — captures, in situ, a child's own voice and
   a photo about a personal best on a topic. Feeds Report Writer with the child's own
   words.

**The pipeline:** Helper (teacher marks) + iPad (child voice/photo) → Report Writer
(quotes the evidence) and → SLT dashboard. November 2026 is "round 1 of integration."
The pipeline is the moat — any single app is copyable; the loop is not.

## The thesis every design decision answers to

**"The Human in the Middle"** — Glenn's 1-hour workshop at the AIFE conference (NIST),
October 2026. Snorkl-style tools close the loop child → AI → child, reducing the
teacher to "the meat between the student and screen." This suite's topology keeps a
human at every joint where meaning happens: the teacher witnesses, a human evaluates,
the output flows home. The AI is the typist at the edge, never the judge in the center.

Product consequences (treat as design law):

- **Provenance — "every sentence has a witness."** Every report line traces to a trait
  a teacher ticked, a moment a teacher observed, or words the child actually said.
  Schema carries source attribution from day one. SLT sign-off becomes an
  evidence-coverage check, not a grammar check.
- **Warmth = specificity, not adjectives.** The model assembles and formats; it never
  emotes. No adjective the evidence didn't earn. Parents detect synthetic warmth
  instantly. The child's verbatim sentence is the one guaranteed-authentic ingredient.
- **The fridge test** is the acceptance criterion: would a parent pin it up? "No parent
  has ever framed an email from a school" — the product goal is the first one that
  does get framed.

## Non-negotiable constraints (settled — do not reopen)

1. **Children's names never reach an LLM API.** Generate with placeholder tokens;
   substitute the real name locally, after generation.
2. **Raw voice recordings and photos stay on school-controlled storage.** Privacy
   claims are written per-feature, DPIA-ready; a DPIA is mandatory (children's data +
   novel tech) and schools will ask.
3. **Schema before apps.** One shared vocabulary — child, class, subject, strand/trait,
   assessment event, evidence item, report unit — with provenance fields throughout.
   Helper's trait bank must BE Report Writer's prompt vocabulary, or November's
   integration becomes a mapping exercise.
4. **Evidence-grounded generation:** no evidence, no sentence. Character limits need a
   local trim pass (LLMs can't count characters reliably).
5. **Build order:** Classroom Helper first (early September — it needs a term of real
   marks accumulating for November), Report Writer by the October talk, SLT dashboard
   prototype in October, integration in November.

## Open decisions (confirm with Glenn before assuming)

- **Files or server for November's round 1?** Proposed: file-based hand-off — Helper
  exports a class file, the dashboard ingests files — so 2026 needs no server,
  accounts, or hosting, matching Glenn's files-the-teacher-owns ethos. Not yet
  confirmed; "live reporting" may or may not mean realtime.
- **Report Writer MVP = the "fridge note"?** Proposed: a short evidence-grounded note
  home quoting the child + photo, shipped before the full style-guide report engine —
  smaller build, works any week of term, demoable at the talk, and it is the thesis as
  an artifact. Not yet confirmed.
- **iPad app: web-on-iPad or native?** Proposed: web for round 1 (mic + camera in
  Safari, no App Store or MDM friction); native with on-device transcription later.
- **Report Writer hosting/key model** — single-tenant for Glenn's own school first?

## Hard dates

- **~4–11 Aug** — Glenn on vacation.
- **~13 Aug** — Sage Stage opens to first testers (separate track, handled elsewhere).
- **Sept–Oct** — Classroom Helper and Report Writer open for use.
- **October** — AIFE workshop at NIST: "The Human in the Middle." The suite's privacy
  and provenance architecture is talk material.
- **November** — round 1 integration: reporting from Helper data + student voice.
- Solo dev + conference: the MVP lines above are survival, not preference.

## Competitive frame

Real competitors are UK primary assessment trackers — Insight, Juniper Sonar, OTrack —
not Power BI/Looker. They own "teacher marks it, SLT views it"; none generate authentic
reports from captured evidence or carry the child's voice to the parent. Lead with the
pipeline, not the dashboard. Steelman to handle: Snorkl also captures children
explaining their thinking — the capture layer isn't the difference, the loop topology
is. The iPad app will look like Snorkl in screenshots, so the difference must be
legible in the design: teacher sees it first, human evaluates, it flows home.

## First tasks in the new chat

1. Confirm the open decisions above with Glenn.
2. Write the **schema two-pager** (with provenance fields) — before any app code.
3. Then a short design doc per app, in build order, before building each.
