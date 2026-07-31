# Sage Stage — Go-to-Market Checklist

**Status:** Working checklist — distilled from the go-to-market discussion of 2026-07-30
**Companion documents:** [Licensing, bundles & release](licensing-design.md) · [Storage abstraction & Tauri desktop](storage-abstraction-plan.md) · [Iteration log](iteration-log.md)
**Date:** 2026-07-30

The model in one line: **never sell data, attention, or access to a teacher's
own work — sell new capability (widget bundles) and convenience (seat
administration for schools).** Every item below serves that, and any proposed
item that fails it gets cut rather than softened.

---

## 1. Now → mid-August — paperwork and proof

The certificates are calendar time, not work time, and they are the long pole
([licensing-design §9.6](licensing-design.md)). Start them before the Tauri
build, not after.

- [ ] **Decide publisher identity** — sole trader or limited company.
      Recommendation: Ltd (~£50, Companies House) so the installer, the
      invoices and the licence terms all show a vendor, not a private
      individual. Blocks both certificates — decide first.
- [ ] **Trademark sanity check** on trading as "Sage on the Stage" given Sage
      plc — one short IP consultation, before anything is bought in the name.
- [ ] **Start Apple Developer Program enrolment** (2–4 weeks as an
      organisation; needs the registered entity plus a D-U-N-S number).
- [ ] **Order the Windows OV code-signing certificate** (OV, not EV —
      [licensing-design §9.5](licensing-design.md); a hardware token arrives by
      post and signing happens on the machine it is plugged into).
- [ ] **Open the merchant-of-record account** — Lemon Squeezy or Paddle.
      Confirm both: a licence-key pool with automatic email delivery, and
      invoice/purchase-order buying for schools.
- [ ] **Run the 13 Aug tester group** on the browser build. Watch for the
      widget testers mention unprompted — that moment becomes the demo video,
      the thumbnail, and the first ten seconds of every clip.
- [ ] **Collect tester quotes and written permission** to use them publicly.

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

- **Publisher identity** — blocks everything in §1; decide first.
- **Price** — needs the two per-seat datapoints above.
- **Perpetual vs annual** — recommended resolution: the individual/department
  split in §4.
- **Founder count** — 75 is the working number; nothing depends on it.
