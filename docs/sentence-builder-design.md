# Sentence builder — research grounding and build spec

Status: design revised 2026-07-24 against an interim research salvage;
**re-grounded 2026-07-25 against the completed run**. Supersedes §7.1 of
`english-widgets-design.md`, which was written from practitioner sources and
is wrong about the widget's organising principle.

---

## 0. Status of the evidence behind this document

Two research runs sit behind this document.

**Run 1 (2026-07-24) died partway** — a spend limit killed 46 of 110 agents,
synthesis never ran, and a silent cap meant only 25 of 129 extracted claims
were ever verified. Its salvage produced the first draft of this document.

**Run 2 (2026-07-25) completed properly**: 392 agents, 25 sources fetched,
**120 claims extracted and all 120 verified** (no cap), 116 confirmed, 4
killed on merit, 0 unverified, 17 synthesized findings. Before re-running,
the harness itself was repaired: verification now uses three *distinct
lenses* per claim (source fidelity — numbers checked against the publisher
PDF; external contradiction — replications and failed replications;
applicability — population/age/phase/dosage vs. the question's target), and
a verdict must tag itself `FACT-FAIL` / `OVERREACH` / `SCOPE` / `SOUND`,
with **only FACT-FAIL able to kill a claim**. Overreach and scope now narrow
a finding instead of binning it — the failure that, in run 1, filed the most
important finding under "refuted" while every verifier wrote "every number
verified correct".

The lens system caught real errors both ways. It killed a claim that written
sentence combining "does not emerge until seven to eight years of age
(Berninger et al., 2011)" — a line Walter et al. (2021) themselves carry —
because a verifier read Berninger (2011) directly: Grade 1 children (mean age
6;11) performed the WIAT-II sentence-combining task with systematically
predicted, non-floor performance (Grade 1 regression R² = 0.53), and no
"emerges at 7–8" finding exists in the paper. **There is no demonstrated
developmental bar against the KS1 face — it is untested, not premature.**

Confidence markers: **[V]** verified this run against full text (most
findings below; the run's verifiers worked from publisher PDFs cached on
disk, not abstracts). **[M]** medium-confidence synthesis (population or
delivery caveats attached). **[L]** low/absent evidence, marked as such.

---

## 1. The central finding: the null now brackets the primary phase

### Year 2 — the closest analogue to this widget **[V]**

> Wyse, Aarts, Anders, de Gennaro, Dockrell, Manyukhina, Sing & Torgerson
> (2026). *Journal of Writing Research* 18(1), 119–159.

Cluster-RCT of **Englicious**: ten one-hour, teacher-led, whole-class,
interactive-whiteboard lessons sequenced by NC Year 2 grammar terminology,
each ending in independent writing. 70 classes randomised at school level,
1,246 pupils analysed, published protocol and SAP.

- Narrative writing quality: **d = 0.026, 95% CI −0.152 to 0.205, p = .77.**
- Compliers only: d = 0.05, p = 0.67 — fidelity does not explain the null.
- Sentence Generation (secondary; combine two given words into as many
  sentences as possible): **d = 0.145, CI −0.060 to 0.350, p = .17** —
  positive, small, non-significant. The authors' own hypothesis for it:
  *"the manipulation of words, phrases and sentences, combined with practice
  at writing"* — not terminology.

Precision the licence requires: the control was **business-as-usual NC
grammar teaching**, so the trial shows *a better-packaged delivery of NC
grammar terminology adds nothing to narrative writing at 6–7* — not that
grammar teaching is harmful. Attrition was 28% and differential by arm — an
acknowledged limitation. The sentence-generation signal is confounded with
extra writing-practice dose and used an identical pre/post form; it is a
bet, not a finding.

### Year 6 — two EEF trials, same direction **[V]**

- **Tracey et al. (2019), EEF Grammar for Writing effectiveness trial:**
  155 schools, 5,182 Y6 pupils. Writing **ES −0.02** (CI −0.08 to 0.03),
  moderate-to-high security. A small significant **negative** effect on the
  KS2 GPS test itself (−0.06; evaluators caution it was an unprotected
  secondary outcome).
- **Torgerson et al. (2014), EEF efficacy trial:** Y6 only, 53 schools.
  Whole-class +0.10 ns, falling to **+0.06 once the separately-randomised
  small-group arm is removed**. The significant gain (+0.21–0.24) belonged
  to **small-group delivery per se**, on a targeted L3c–4b subgroup — a
  whole-class IWB tool cannot buy that effect.

So the primary-phase null is now **bracketed**: directly tested at Y2 and
Y6, inferred (direction consistent, untested) across Y3–Y5. **[M]**

### The routinely mis-cited positive result **[V]**

Jones, Myhill & Bailey (2013), e = 0.21: **744 Year 8 pupils, 31 secondary
schools.** No intention-to-treat analysis; clustering ignored; the e = 0.21
appears only in the abstract and is never reproduced in the body; the
benefit was confined to above-average writers. It must never be transferred
to primary. (Honest footnote the other way: Graham et al.'s recent grades
6–12 meta-analysis reports a *positive* grammar effect ≈ 0.77 — secondary
phase again; it does not reverse the primary nulls. **[M]**)

### What Wyse & Torgerson (2017) add **[V]**

Attention to technical terms such as "subordinate clause" or "subjunctive"
is judged *"doubtful"* in benefit; everyday language for discussing grammar
is rated probably more useful — flagged by the authors as expert conjecture,
not a demonstrated result. No trial anywhere isolates terminology as an
experimental factor.

**Design consequence, stated at its honest width:** NC terminology is not
shown harmful; there is no evidence it lifts writing; the manipulation
mechanic is the part the trial authors bet on. Organising the widget's
content by NC progression is a **curriculum-coverage and adoption utility,
not a writing lever** — and the widget must never be marketed otherwise.

---

## 2. Sentence combining and expanding — the evidence and its exact edges

### The headline effect **[V]**

- Graham & Perin (2007): sentence combining **ES = 0.50** (5 studies, all
  positive, homogeneous; CI 0.30–0.70), against controls that were mostly
  grammar instruction. Grammar instruction itself: **−0.32**, the only
  negative treatment of eleven.
- Graham et al. (2012), 115 elementary studies: grammar the only treatment
  with no significant effect — though that cell rests on just 4 low-quality
  elementary studies. **[M]**
- Andrews et al. (2006): sentence combining "more positive" than formal
  grammar — with the review's own caveat that a century of research is too
  weak to prove either case.

### The age edge — absence, not null **[V]**

The trial base clusters **Grade 4 to Grade 10 (ages 9–16)**; 17 of the EPPI
review's 18 in-depth studies are US, one Canadian, **none UK**; the youngest
solid RCT is Saddler & Graham (2005), Grade 4. The only two studies touching
ages 6–8 are low weight-of-evidence (one a null at age 8). **Kim et al.'s
(2021) K–Grade 3 meta-analysis found no sentence-level intervention at all
among 24 studies despite searching for one.** For Reception–Year 3 this is
a genuine **absence of evidence, not evidence of absence** — and the EEF's
own KS1 report already extrapolates downward (it recommends teacher-modelled
combining on the strength of a single Grade-4 US study) without flagging it.

The Berninger correction (§0) matters here: 6-year-olds *can* measurably
combine written sentences. Untested ≠ premature.

### The one UK primary trial — and its warning **[V]**

**Walter, Dockrell & Connelly (2021):** 71 struggling writers aged 7;10–10;2,
small-group withdrawal, 16 sessions. Sentence combining improved the trained
skill (**g = 0.76–0.84**, held at 3 months) but produced **no significant
gain in compositional quality, productivity or accuracy**. Better baseline
spelling predicted greater gains; the authors conclude SC alone may be
inappropriate before spelling fluency is sufficient — a direct transcription
gate. (Under-dosage is their other candidate: 400 min vs. 750 in Saddler &
Graham.)

Three consequences:
1. **Near transfer is what manipulation buys.** Do not promise
   writing-quality gains from the widget alone.
2. **The widget's design sidesteps the identified gate** — cards and teacher
   transcription remove the spelling bottleneck that capped these children.
   That is a rationale, not a demonstrated effect.
3. Their procedure is a usable lesson template: revise → 2–3 combining
   activities, **verbal AND written**, starting with explicit modelling →
   guided → independent → peer feedback → summary.

### What the EEF actually recommends **[V]**

Combining **and expanding** are the two named sentence-construction
techniques, KS1 and KS2, framed inside **transcription/fluency** (the
Berninger cognitive-load argument), with gradual release (model →
collaborative → independent) and *no* recommendation to teach terminology or
year-by-year feature progression as a route to writing. Fluency and speed
are named goals alongside meaning and effect. Caveat carried: this is
synthesis-level guidance; no effect sizes attach to the sentence
recommendation, and its anchor review spans ages 5–16.

---

## 3. The scaffolding systems

### Colourful Semantics **[V]**

Evidence base: Bryan (1997), one child; Bolderson et al. (2011), six
children, uncontrolled pre-post, clinical SLT; PenCRU (2018) attributes the
gains partly to possible test-retest/maturation and scopes the approach to
children with more severe language disorders. Whole-class delivery has been
trialled only in non-UK special-education populations (Hettiarachchi 2015,
30 Sri Lankan children with intellectual disabilities, no control) and
small-group SEN settings (Atwell 2024, mixed/null, non-indexed practitioner
journal).

**Every outcome measure in the CS literature is spoken, never written
composition.** Using CS as the default face of a *writing* tool extrapolates
across population, delivery mode, dosage **and outcome domain**. Bucket
(iii): keep for adoption and familiarity, as an optional scaffold — not the
default, and never described as evidence-based.

The palette is free: PenCRU states the colours are arbitrary and
substitutable; only within-child consistency matters. Projector-safe hues
are therefore unconstrained by the evidence. **[V]**

### Shape Coding, for contrast **[V]**

Better-evidenced than CS (two small RCTs, N = 27 and 14, plus cross-language
replication) — but all clinical DLD adolescents (11–16), developer-authored,
and Ebbels herself states there is no controlled evidence at ages 4–11 and
that whole-class delivery is measurably weaker. Two things transfer as pure
design logic: **channel separation** (colour = word class; shape = phrase
role — so structures can nest and move, which underlining cannot depict),
and a warning — **Shape Coding's colour axis collides with CS's** (yellow =
verb vs. CS yellow = "Doing what?"; blue = preposition vs. CS blue =
"Where?"). A school using both systems must be able to recolour; the pack
system already covers this.

### Colour-coded roles in general **[L]**

No controlled study shows colour-coded syntactic roles improve written
sentence construction in typically-developing primary children. The EEF's
"dual coded" scaffold mention is one school case-study box, uncited. Colour
is a usability/consistency decision, not an evidence-based one.

---

## 4. The other design questions

### Cognitive load — the strongest design principle **[V]**

The Not-So-Simple View holds: where transcription is not automatic, working
memory is consumed by graphomotor/orthographic demands. In US K–G1 children
a combined reading/spelling code factor dominated early compositional
fluency and quality (γ up to .60; 33–49% of variance explained); active WM
*updating* tracks writing skill in Grade 3–5. These are correlational — they
justify the design principle (minimal on-screen load, offload transcription,
oral before write), not a claimed effect. The constraint bites hardest at
the youngest ages — the offload rationale is strongest exactly where the
intervention evidence is thinnest.

### Oral rehearsal **[M]**

General oral-language work upstream of writing transfers: OLLI (preregistered
RCT) moved *written* expression **d = 0.42** in Year 4 — but delivered to the
weakest ~17% per class, small-group/1:1, 20 weeks. EEF Recommendation 1
names "articulating ideas verbally before writing", cited to synthesis, not
to a trial of sentence-level rehearsal. The say-it sweep's specific
micro-behaviour — rehearsing the just-composed sentence immediately before
transcription — has never been isolated in a study. Two constructs to keep
apart: rote imitation of memorised scripts (TfW review: no research
evidence) is not the same as verbal recoding of the child's own sentence
(indicative positive support in early writers). The sweep survives on the
second reading.

### Fix-it mode — the riskiest feature in the set **[V]**

The fuller literature is harsher than the interim read:

- Booth et al. (2013): incorrect examples helped **conceptual understanding
  only**, only with tightly scaffolded self-explanation of documented
  misconceptions, and the authors warn against "aimless examination of
  errors". Algebra, US Grade 8+.
- Große & Renkl (expertise reversal): novices required to *find* errors
  unaided did not benefit.
- **Jacoby & Hollingshead (1990): a single exposure to a misspelled word
  depressed adults' later spelling of that word below never-seen baseline** —
  an implicit "looks-right" mechanism a general warning does not neutralise.
- Ollesch/Wesenberg: learners spent ~40% less time on erroneous examples —
  novices disengage from errors unless forced to act.
- **Zero erroneous-examples trials exist in literacy or grammar, at any
  age, and none with children 4–11.** The extrapolation crosses domain and
  age at once.

Deliberate-error correction is genuinely popular in UK classrooms (it was
observed in the Wyse *control* classes) — bucket (iii). If kept, the
constraints are not optional:

1. Model the **correct** structure first; the error comes second.
2. **Flag where the error is** — never make the class hunt unaided.
3. Correction must be **active and whole-class** — never passive display.
4. **Never leave the error as the last thing on screen** — the corrected
   sentence is the closing image (the priming result is the reason).
5. Prefer punctuation/structure errors over misspelled words — the priming
   evidence is strongest for word forms.

### Differential attainment **[M]**

Unsettled, both in direction: the Y8 developer trial benefited able writers
only (blamed on metalanguage and load); the EEF Y6 trial's lower-attainers
showed a non-significant **−0.11** with process data noting undifferentiated
materials; the K–G3 meta pointed the other way (non-significant +.47 for
weak writers). No primary trial has cleanly tested the moderator. The
mechanism blamed — metalanguage + cognitive load — is exactly what this
widget controls. Design action: every mode needs a **low-metalanguage
floor** (the question-word labels, not the term), and nobody should assume
the tool levels attainment. Teacher grammar subject knowledge moderated the
Y8 result and not the Y6 one — a generalist primary workforce is the
audience; the widget must not require the teacher to hold the terminology
either.

### Metrics **[M]**

Instruction moves writing **quality and structural completeness** far more
than it moves **length** (SRSD meta: length effect significantly smaller
than quality/elements). No widget affordance should celebrate sentence
length or card count. Checking whether **role slots are filled** is the
validated shape of "elements" — the one countable thing worth showing.

### The displacement risk **[M]**

The EEF Talk for Writing pilot documented classrooms drifting toward
word/sentence-level grammar and metalanguage at the expense of text-level
work, and evaluators found "very little evidence" of children composing
extended text of their own nine months in. Qualitative, one city,
test-pressure driven — but it names this widget's failure mode precisely: a
sentence tool good enough to fill the lesson will, unless designed against.

---

## 5. What was missing from the design entirely: the SRSD wrapper **[V]**

Self-Regulated Strategy Development is the best-evidenced writing approach
at primary age — the only consistently significant approach in the K–G3
meta-analysis (**g = 1.04** writing quality; five Grade 2–3
mostly-struggling-writer, developer-authored studies — width noted), with a
large Catalan cluster-RCT showing whole-class delivery by regular teachers
works and persists at 18 months. Its evidence sits at the text grain; the
widget is not an SRSD implementation. What transfers is the
**architecture**:

- teacher-modelled think-aloud →
- collaborative construction →
- independent practice →
- **terminating in independent writing, with the scaffold withdrawn.**

Retention was weaker at Grade 2 than Grade 4 — younger gains need continued
practice, not a reason to withhold instruction.

---

## 6. The seven decisions, bucketed against the completed run

| # | Decision | Bucket | Verdict |
|---|---|---|---|
| 1 | Draggable card track | **defensible on evidence** | Keep. The manipulation mechanic is the part the trial authors bet on, and it aligns with the EEF sentence-construction recommendation. Near transfer is what it buys; claim no more. |
| 2 | Colourful Semantics as EYFS/KS1 default | **popular, unevidenced for this population and outcome domain** | Demote to optional mode. All CS outcomes are spoken; palette free; recolour for projectors; colours must not collide silently with Shape Coding schools. |
| 3 | NC progression as spine | **contra-indicated as a writing lever; legitimate as coverage** | Reverse the layering: combining/expanding are the spine; NC terms are labels and filters. Nulls bracket the phase (Y2 directly, Y6 twice, Y3–Y5 inferred). |
| 4 | Sentence shapes (Peat tradition) | **split verdict** | The *activity* of expanding is EEF-named and well-grounded; the *named-formula packaging* is practice-popular and unevidenced. Ship shapes as the vehicle for expanding; the names are pack content, schools': not taught as a progression. |
| 5 | Fix-it mode | **popular, unevidenced in literacy, with a documented harm mechanism** | Keep only under the five constraints in §4. The riskiest feature in the set. |
| 6 | Nudge-never-block scaffolds | **plausible, untested** | Keep on design grounds; claim nothing. |
| 7 | Oral say-it sweep | **thin, indirectly supported** | Keep. General oral→writing transfer is evidenced (d = 0.42, targeted population); the specific micro-behaviour is untested; it is verbal recoding, not script imitation. |
| — | **SRSD gradual-release wrapper** (was missing) | **best-evidenced structure in the corpus** | Add. Model → collaborative → independent, ending off-screen. |
| — | **Terminate in independent writing** (was missing) | **supported; displacement documented** | The widget is the front half of a lesson. Build the hand-off in. |

---

## 7. The build

### Modes

> **Build-time deferrals (2026-07-25, recorded so they read as decisions, not
> accidents):** (1) Named sentence-shape frames in Expand are deferred — the
> expanding *activity* shipped as question-word prompts; the named-pattern
> packaging waits for the pack rail, per §6's split verdict. (2) The
> Shape-Coding-compatible palette preset is deferred because we could not
> verify Shape Coding's actual colour conventions against a primary source at
> build time — shipping a preset with a wrong mapping labelled "Shape-Coding
> friendly" would be worse than shipping none. Two presets exist (projector
> 'sage', traditional 'cs'), the palette is deck-locked, and adding a third
> preset is one table row once the mapping is verified.

1. **Combine** — primary face, Y4+ (load-bearing where the evidence is);
   available and labelled as *extrapolation* below that. Two or more short
   sentence cards; the class merges them; joining words as tiles;
   alternatives kept side by side because comparing two good answers is the
   teaching act. Walter's session shape is the lesson template: model →
   verbal and written combining → guided → independent.
2. **Expand** — EEF-named, previously missing. One plain sentence grows
   detail: where, when, what like, how. Docks the word bank's `p.words` —
   harvested vocabulary is the expansion material. Sentence shapes live
   here as optional frames; their names come from packs (schools rename per
   their scheme), never taught as a sequence.
3. **Build** — the track. Word/phrase cards, punctuation tiles,
   tap-to-capitalise, drag-to-reorder. The R–Y2 face: transcription
   offloading is the strongest principle exactly there, and there is no
   developmental bar (§0), only an evidence gap that must be stated in the
   teacher-facing copy as "reasoned, not proven".
4. **Roles** — the CS-style scaffold, optional. Question-word labels
   (low-metalanguage floor); palette a deck-locked school setting,
   projector-safe defaults, alternate scheme presets (CS conventional,
   Shape-Coding-compatible) rather than one hard-coded mapping.
5. **Fix it** — under the five §4 constraints, structural errors preferred
   over misspellings, corrected sentence always the closing image.

### Structure across every mode

- **Gradual release is a first-class state**: Model (teacher drives, thinks
  aloud) → Together (class contributes, teacher transcribes) → Over-to-you
  (the widget shows the hand-off card: sentence stems + the class's cards,
  screen deliberately quietened). The third state exists to end the widget's
  part of the lesson.

> **Stage legibility (2026-07-25, from Glenn's second live run):** Model and
> Together are deliberately identical in behaviour — the pill is a declared
> stance, not a feature switch — but that made the seg unreadable: the only
> explanation lived in hover tooltips, which don't exist on a touch board.
> The stage pills now carry the turn written into them — *my turn / our
> turn / your turn* under Model / Together / Over to you. Child-facing turn
> language on purpose (the screen speaks to the room), not the tooltips'
> teacher stage directions ("the class calls, you place"), which stay
> hover-only. Rejected alternative: a cue line under the bar explaining the
> active stage — it only explains after the click, adds a permanent row,
> and puts teacher-directed copy on the class screen.
>
> **V0.1 teaching-face rebuild SHIPPED (2026-07-25, english-word.js v31 /
> style.css v51):** the mock's sixteen signed-off decisions are now the
> widget (full decision list in the iteration log's "V0.1 teaching-face
> redesign agreed" entry). The structural ones, as built: **per-stage
> lines** — `p.track` is Model's line (and the one shared board for Roles
> and Fix-it), `p.trackT` is Together's own copy, `p.togSrc` remembers
> which modelled sentence seeded it, so entering Together re-seeds only
> when a NEW sentence has been modelled and going back a step never costs
> the step (this retires `p.modelSnap` and the "What we modelled" strip —
> Model itself is the reference view now). **Deal it back is a watchable
> ceremony**: the data moves first (a remount can never lose a card), then
> words peel off in reading order and fly to the tray, punctuation fades,
> the bar is locked until the last card lands; reduced-motion falls back
> to instant. **Beats arm, Say it fires.** **Two docks** (+1 duplicate /
> bin) appear only while a card is in the air; a missed drop snaps home —
> only the bin deletes. **Sentence banks** ship as year-banded neutral
> topic sets in code plus teacher imports stored per-year on the deck
> (`deck.sbBank`), " / " making a Combine pair; two taps loads material
> into the current face. **Empty role slots scaffold** with
> teacher-editable ghost examples (`p.roleEg`). The aA mini now FLIPS the
> first letter's case (a dealt "They" can go lowercase mid-sentence).
> Mode pills carry plain-word subtitles and the four-level colour grammar
> (ink face / traffic turn / grey tools / teal act) holds across bar and
> ⚙ panel, which is now sectioned. The known wart stands: `srcs` are
> positional and shared across modes, so fix-it's pair lingers into
> combine's chips until replaced.
>
> **Stages become physical (2026-07-25, same session, Glenn's call):**
> stance-only stages read as "the same thing" in a real lesson, so each
> stage now owns a move, while pill taps stay always-safe (no state is ever
> created or destroyed by switching):
> *Together* gets a lead button, **Deal it back** (same ceremony pattern as
> fix-it's "Bring in the broken one"): remembers the modelled sentence and
> returns its tiles to the tray, cap-aware, for the class to rebuild from
> memory. *Model* thereafter shows the remembered sentence as a quiet
> reference strip — flipping back to peek is free and never wipes the
> class's part-built line. The snapshot clears on mode change or Clear the
> line. Fix-it is exempt: its ceremony IS its structure.
> *Say it* surfaces the shared paces on the quick bar (New / Practising /
> Fluent — tap sets the beat and plays, the phoneme-tiles pattern); the
> settings Pace row goes, one control in one place. *Over to you* ends on
> the full ritual: say yours → write it → check with your talk partner.
> Stage pills wear **traffic-light colours** (red watch me / amber we build
> / green go) — always-on underline so the format is learnable, soft fill
> when active; chosen over teal-amber-green because the class is already
> conditioned on traffic lights, and position+label carry the meaning for
> colour-blind children.
- **NC filter, not NC ladder**: a year-group filter surfaces combinations
  and expansions that exercise a chosen objective ("show me Y4"), labels on
  demand; never a level to climb.
- **No length affordances**: nothing counts words or celebrates longer
  sentences. Role-slot completeness is the one visible check.
- **Low-metalanguage floor everywhere**: every prompt has a question-word
  form; terminology is the overlay, never the gate.

### What the widget must say about itself

Teacher-facing copy claims manipulation, rehearsal and staging — never
writing-quality gains. The R–Y3 face is explicitly a reasoned extrapolation.
This is the honest reading of Walter (near transfer only), Wyse (the null),
and Kim (the empty K–G3 cell), and it is also what keeps the claim
defensible in a school that reads the same papers.

---

## 8. Still open

1. Combining/expanding at 4–8, whole-class, typically developing: no trial
   evidence in either direction. The KS1/EYFS face is an extrapolation and
   says so.
2. The say-it sweep's exact micro-behaviour is unstudied.
3. Fix-it in literacy with primary children is unstudied; the priming harm
   mechanism is adult single-word spelling. The five constraints are
   precautionary design, not tested pedagogy.
4. Colour-coded roles for written composition in the mainstream population:
   untested for both CS and Shape Coding.
5. Y3–Y5 grammar-teaching nulls are inferred from Y2 + Y6 brackets, not
   directly tested.

---

## 9. Sources

**Verified against full text this run [V]**
- Wyse, Aarts, Anders, de Gennaro, Dockrell, Manyukhina, Sing & Torgerson (2026), *JoWR* 18(1) — Englicious RCT
- Tracey et al. (2019), EEF Grammar for Writing effectiveness trial (Y6)
- Torgerson et al. (2014), EEF Grammar for Writing efficacy trial (Y6)
- Jones, Myhill & Bailey (2013), *Reading and Writing* 26(8) — Year 8
- Wyse & Torgerson (2017), *BERJ* 43(6)
- Andrews et al. (2004/2006), EPPI-Centre / *BERJ* systematic reviews
- Graham & Perin (2007) — *Writing Next* meta-analysis
- Graham et al. (2012) — elementary meta-analysis
- Walter, Dockrell & Connelly (2021), *Reading and Writing* 34 — UK primary SC trial
- Kim et al. (2021) — K–G3 writing-intervention meta-analysis
- Saddler & Graham (2005), *JEP* 97(1)
- Bolderson et al. (2011), *CLTT*; Bryan (1997); PenCRU (2018) — Colourful Semantics
- Hettiarachchi (2015); Atwell (2024) — CS beyond clinic (weak designs, noted)
- Ebbels (2007, 2014 + replications) — Shape Coding
- Booth, Lange, Koedinger & Newton (2013), *Learning and Instruction* 25
- Jacoby & Hollingshead (1990) — implicit priming from misspellings
- Große & Renkl — expertise reversal with erroneous examples
- Esposito et al. — OLLI oral-language RCT (written expression d = 0.42)
- EEF, *Improving Literacy in KS1* and *KS2* guidance reports
- EEF Talk for Writing pilot evaluation
- Salas et al. — Catalan whole-class SRSD cluster-RCT
- Sun & Wang (2022) — SRSD meta-analysis (length < quality/elements)
- Berninger et al. (2011) — read directly to adjudicate the age-7–8 claim (killed)

**Deliberately weighted down**
- Graham et al. (2023/2025) grades 6–12 meta (+0.77 grammar): secondary phase; does not reverse primary nulls.
- All clinical, small-group, or targeted-population effect sizes: inform principles, never quoted as expected effects for a whole-class IWB tool.
