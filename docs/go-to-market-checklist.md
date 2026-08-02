# Sage Stage — Go-to-Market Checklist

**Status:** Working checklist — distilled from the go-to-market discussion of 2026-07-30
**Companion documents:** [Licensing, bundles & release](licensing-design.md) · [Storage abstraction & Tauri desktop](storage-abstraction-plan.md) · [Iteration log](iteration-log.md)
**Date:** 2026-07-30 · **§1 rewritten 2026-08-02** — the original assumed a
UK-resident founder and front-loaded paperwork that gates nothing.

The model in one line: **never sell data, attention, or access to a teacher's
own work — sell new capability (widget bundles) and convenience (seat
administration for schools).** Every item below serves that, and any proposed
item that fails it gets cut rather than softened.

---

## 1. Now → mid-August — the testers are the only hard date

_Rewritten 2026-08-02. The original section was written for a UK-resident sole
trader or Ltd. That is not the situation: **UK citizen with no UK ties** — no
bank, no address, an NI number and a US filing obligation — resident where Apple
bills in THB, banking through Wise, [first market international
schools](iteration-log.md) rather than UK primaries, and macOS-first on
platform. Almost everything the old §1 called a blocker turned out to gate
nothing._

**Nothing in this section blocks shipping.** This chain works today with no
company, no D-U-N-S and no UK address:

> individual Apple enrolment → Developer ID + notarization → merchant of record
> sells → Wise receives

The certificates were only ever the long pole on the *organisation* route: the
individual route has no entity to verify and no D-U-N-S queue in front of it.
Enrolment is nonetheless gated on getting hold of a **credit card** (see the
first item) — a constraint unrelated to entity, region or route.

**Operational note for a Thailand-based operation:** there is **no Apple
Developer Program support in Thailand**. Enrolment and membership issues route
through Apple Singapore. Worth knowing before the next problem, and worth
factoring into any support expectation for the App Store path the assessment
suite's iPad app will take.

- [ ] **Enrol in the Apple Developer Program as an individual.** For Developer ID
      signing and notarization outside the Mac App Store the individual account
      is functionally complete; the only thing forgone is the vendor name on the
      installer. **Blocked at payment until a credit card is available — a debit
      card will not do it.** Confirmed with Apple on 2026-08-02 (see below): the
      membership is an *auto-renewing annual subscription*, so enrolment needs
      the issuer to authorise a recurring mandate, not a one-off charge, and the
      Thai debit card cannot carry one. That is why the same card works fine for
      one-off e-commerce (hotel bookings the same week) and why the bank had
      nothing to show: a mandate that fails at setup never becomes a declined
      transaction, so it appears in no log they read from. It surfaces only as
      Apple's banner, *"your card issuer could not verify the validity of the use
      of card ···5708."* **Action: obtain a credit card** — Bangkok Patana
      employment plus work permit should make a Thai one routine, if not quick.
      Not urgent: testers run on the browser build, and signing is not needed
      until the September Tauri work.
- [ ] **Open the merchant-of-record account** — Lemon Squeezy or Paddle. Both
      onboard individuals as seller of record and handle global sales tax and
      VAT, which is the genuinely hard part at this distance and the reason MoR
      matters more here than it would for a UK-resident founder. Confirm both:
      a licence-key pool with automatic email delivery, and invoice/purchase-order
      buying for schools. Payout to Wise.
- [ ] **Run the 13 Aug tester group** on the browser build. Watch for the
      widget testers mention unprompted — that moment becomes the demo video,
      the thumbnail, and the first ten seconds of every clip.
- [ ] **Collect tester quotes and written permission** to use them publicly.
- [ ] **One cross-border tax consultation — before revenue arrives, not before
      the build.** UK citizenship, Thai residency and a US filing obligation is
      a three-jurisdiction question, and whether to incorporate *at all* falls
      out of the tax answer rather than the other way round. The wrong structure
      is expensive to unwind, so this comes before the first money, not before
      the first build.

### Deferred, with reasons

- **Publisher identity / any entity.** Buys the vendor name on the installer and
  whatever the tax consultation recommends — nothing else. A UK Ltd specifically
  would mean permanent Companies House and corporation-tax filings in a country
  with no other connection, plus a registered-office service, for that one
  cosmetic gain. Revisit when revenue makes the question concrete.
- **Windows OV code-signing certificate.** OV requires a verified legal business
  entity — registration, verifiable address and phone — so it is not orderable
  as specced ([licensing-design §9.5](licensing-design.md) assumed the entity).
  Individual-validation certificates are the alternative when the time comes.
  macOS-first defers this regardless.
- **Trademark check on "Sage on the Stage" vs Sage plc.** Reweighted, not
  dropped — UK primaries are no longer the first market, so UK-specific exposure
  is not the first question. Still worth doing before money is spent on the name.

## 2. September — build, and become findable

- [ ] **Tauri P0–P2** per [licensing-design §10](licensing-design.md):
      Documents storage → signed installers → updater proven with a throwaway
      1.0.1 — the updater ships **before** any gate exists, because it is the
      only way to fix a licensing bug once teachers have the app.
- [ ] **Generate and back up both private keys offline** (updater + licence),
      two places minimum. The updater key is the single most important file in
      the operation.
- [ ] **One-page website:** a 90-second real-classroom video, the download,
      and an email signup — "hear when new widgets ship" is the only data
      collected, and the box says so.
- [ ] **"What Sage Stage never does" page:** no account, no cloud, no
      tracking, no telemetry; works offline; files are readable JSON in the
      teacher's own Documents; export works forever regardless of licence
      state. The privacy policy is one paragraph because there is nothing to
      police.
- [ ] **SLT/DPO one-pager:** no data processed means no data-processing
      agreement to vet — a procurement shortcut, and it should say so. Offline,
      runs on old hardware.
- [ ] **Start the weekly clip habit** — one 60-second real-lesson widget clip
      a week, term time: the big UK primary Facebook groups, the
      Instagram/TikTok teacher community. Cadence beats polish.

## 3. October — launch on the talk

- [ ] **Tauri P3–P4:** gate, offline licence verify, padlock panel —
      entitlement consulted at render, never at registry load
      ([licensing-design §2.2](licensing-design.md)) — then buy a copy with a
      real card, end to end.
- [ ] **Ship v1.0 with the gate already on** ([§7](licensing-design.md) —
      never public-free-then-gated; that door only closes once).
- [ ] **Issue the 75 founder codes** — full Maths Toolkit, permanent, plus
      every future bundle.
- [ ] **Make the October talk the launch event** — time the founder offer to
      it.
- [ ] **Permanent plainly-versioned download link** for school IT to deploy
      their own way ([§9.3](licensing-design.md)).
- [ ] **SmartScreen install guide** with "More info → Run anyway" screenshots
      — early downloads trip the warning regardless of certificate
      ([§9.5](licensing-design.md)), and an unexplained warning reads as
      malware.
- [ ] **SagePrint staffroom poster** — the app prints its own A4 for the
      noticeboard.

## 4. After the founders — first money

- [ ] **Set the Maths Toolkit price** — bought once, anchored against a year
      of the subscription it replaces. Working range £25–35 until the real
      datapoints say otherwise.
- [ ] **Pull the two real per-seat datapoints** — the Classroom Screen
      60-seat annual and what the department paid per seat for Explain
      Everything at 35 — and set department pricing from those.
- [ ] **Adopt the licence split:** individuals buy once and own it forever
      (the README promise, made to people spending their own money);
      departments buy annual per-seat batches, because seat reassignment at
      staff churn is the service they are actually paying for. Export works
      forever either way.
- [ ] **Turn on paid codes;** refill the key pool as it drains.
- [ ] **Department offering:** invoice/PO flow plus assignable batch records
      the ed-tech lead can defend from their own MDM data — no telemetry,
      ever.
- [ ] **English bundle as the second SKU** —
      [licensing-design §3.3](licensing-design.md)'s condition is now met
      (twelve genre packs shipped 2026-07-28).

## 5. Ongoing — the name

- [ ] **Publish essay versions of the design docs** — spatial stability, the
      small-world-toy gate, why the padlock never appears mid-lesson, why
      there is no telemetry.
- [ ] **Name and publish the honesty standard** — the promises page schools
      and teachers can hold the product to. The app proves the standard is
      possible; the writing is what attaches the name to it.
- [ ] **Open-source posture:** formats and export stay open always; revisit
      open-sourcing the engine once revenue exists (Krita and Aseprite prove
      paid-plus-open coexists). The gate is honesty infrastructure, not DRM.
- [ ] **Measure "used it again next week", not downloads.** Expect 2–5% of
      active free users to buy — that is success; the other 95% are the
      marketing.
- [ ] **2027: the assessment suite** is the schools product the name carries.

---

## Open decisions (carried from [licensing-design §11](licensing-design.md))

- ~~**Publisher identity** — blocks everything in §1; decide first.~~
  **Resolved 2026-08-02: it blocks nothing.** Ship as an individual; revisit an
  entity only if the tax consultation recommends one, or when the vendor name on
  the installer is worth its filing overhead. See §1.
- **Price** — needs the two per-seat datapoints above. Note the working £25–35
  range is anchored on UK comparators while the first market is international
  schools; the MoR sells in local currency either way, but the anchor should be
  re-checked against what those schools actually pay.
- **Perpetual vs annual** — recommended resolution: the individual/department
  split in §4.
- **Founder count** — 75 is the working number; nothing depends on it.
