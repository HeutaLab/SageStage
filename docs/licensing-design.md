# Sage Stage — Licensing, Bundles & Release

**Status:** Concept design — nothing implemented. **The Tauri block is lifted** (working macOS build 26 Aug 2026, §2.1's precondition met); §3.5 added the same day when Glenn set the platform direction.
**Companion documents:** [Storage abstraction & Tauri desktop](storage-abstraction-plan.md) · [App review checklist](app-review-checklist.md) · [English widgets](english-widgets-design.md) · [Iteration log](iteration-log.md)
**Date:** 2026-07-22
**Depends on:** [storage-abstraction-plan.md](storage-abstraction-plan.md) §9 phases 1–4 complete (a static folder cannot be licensed — see §2.1)

---

## 1. What this is

How Sage Stage goes from a free static folder to a downloadable desktop app that
earns money, without breaking the thing that makes teachers recommend it.

The shape in one paragraph: **the app installs and runs with no code, no account
and no internet.** Thirty-two widgets are free forever, including everything a
teacher needs to run a classroom. The eleven maths manipulatives — the expensive,
genuinely differentiated ones — are a single paid bundle unlocked by a code that
the store emails automatically and the app verifies offline. Updates arrive
through Tauri's updater and never touch the teacher's saved work.

---

## 2. The three constraints

These are constraints, not preferences. A proposed change to the licensing model
that fails any of them should be cut rather than softened.

### 2.1 Gating is impossible before Tauri

The app is currently `index.html` plus a folder of readable JavaScript. Anyone
can open `app.js` and delete a check, and there is no installer, no update
channel and no per-machine storage that survives a cache clear.

So the entire contents of this document are downstream of the desktop migration.
Nothing here can ship first, and nothing here should be half-built into the
browser version "ready for later" — it would only advertise the seam.

### 2.2 Gating must never destroy a teacher's work

**A locked widget must still load, still hold its saved props, and still occupy
its place on the screen.** It renders a padlock panel instead of its normal body.
Unlock it a year later and the number line is exactly as it was left.

This is not a nicety. Two existing code paths will silently *delete* content if
locking is implemented by removing entries from the `WIDGETS` registry:

| Path | Line | Behaviour on unknown type |
|---|---|---|
| `sanitizeTemplate()` | [app.js:9961](../app.js) | `if (!w \|\| !WIDGETS[w.type]) continue;` — **drops the widget permanently on import** |
| `mountWidget()` | [app.js:8903](../app.js) | `if (!def) return;` — renders nothing, silently |

A teacher who lets a licence lapse, or who imports a school template containing a
paid widget, must not lose the lesson. This is the same class of failure as the
erase-resurrect bug in the [app review checklist](app-review-checklist.md), and it
is the one that generates refunds and a reputation.

**Rule: entitlement is consulted at render, never at registry load.** Every
widget stays in `WIDGETS` at all times.

### 2.3 The free tier must be a whole product

A free version that cannot save is a demo. Nobody builds a term of lessons in a
demo, so it never reaches the staff room — and the staff room is the only
marketing this product has.

Free teachers get: full save, unlimited decks and screens, unlimited name lists,
export, import, templates, multi-window projector mode. Everything. The only
difference is which widgets are in the picker.

What converts is not friction. It is a free-tier teacher watching a colleague
pull a rekenrek onto the projector.

---

## 3. What is free and what is paid

The boundary already exists in the code. `widgetTool(type, label, cat)`
([app.js:10260](../app.js)) tags eleven widgets `cat: 'maths'`, and that set is
exactly the right bundle.

**Paid — "Maths Toolkit" (11):** `teachclock` · `moneytray` · `shop` ·
`frametiles` · `counters` · `dienes` · `pvcounters` · `rekenrek` · `numberline` ·
`barmodel` · `partwhole`

**Free (32):** everything else — the whole classroom-management set (clock,
timer, visual timer, stopwatch, traffic light, name picker, groups, dice, noise
meter, work mode, agenda, poll, scoreboard, calendar, countdown), all media
widgets (image, video, webcam, document, embed, link, QR, sticker), text, draw
pad, prompt cards, word builder, and all five `cat: 'games'` widgets.

Thirty-two free widgets is a genuinely generous product. That is the point.

### 3.1 Rejected: Key Stage bundles

EYFS/KS1 and KS2 bundles cut straight through the middle of the best widgets.
`dienes` runs from tens-and-ones to a seven-column millions chart; `frametiles`
is documented as covering "the whole of primary"; `numberline` spans 0–10 to
negatives and thirds. These were deliberately built to grow with the child.

Splitting them by Key Stage means either selling the same widget twice or
crippling its settings by tier — degrading the exact feature the README boasts
about. A Y1 and a Y5 teacher use the *same* Dienes widget with different options.

**Sage Stage splits by subject, not by Key Stage.** Design accordingly.

### 3.2 Rejected: per-widget purchase

Produces a wall of padlocks, decision fatigue at the moment of use, a support
burden proportional to the number of SKUs, and a pricing page nobody finishes
reading. Schools also do not buy this way — they buy per department.

There is a classroom dimension too: a padlock appearing on the projector in front
of thirty children embarrasses the teacher, and they remember the feeling.

### 3.3 Deferred: an English bundle

There is not enough to sell yet. `wordbuilder`, `promptcards` and the letters
round of `countdowngame` are games, not teaching tools of the kind `dienes` is.

Revisit when [english-widgets-design.md](english-widgets-design.md) has shipped
its 10 widgets / 4 engines. That bundle is real; today's is not.

### 3.4 Not gated: multi-class and multi-deck

Tempting, and wrong. Decks are the unit of *saved work* — a teacher naturally has
one per class. Gating them means a lapsed or free teacher is locked out of
lessons they already built, which violates §2.2. Leave decks free.

---

### 3.5 The platform axis — added 26 Aug

§3 divides the product by **widget**. Glenn's direction adds a second axis, by
**platform**: *"it's in need of being web for free with limited data and memory
use, the downloaded app needs to be Windows and Mac."*

Three tiers, then, where this document had two:

| | storage | pictures | widgets |
|---|---|---|---|
| **Web** — free | browser, bounded | one at a time | 32 free |
| **Desktop** — Mac + Windows | a real file, no ceiling | own picture folders | 32 free |
| **Desktop + Maths Toolkit** | — | — | all 43 |

**The limit on the web tier must fall on capability, not on size.** Two reasons,
and the second is the one that decides it.

The first is that a size limit cannot be stated honestly. Browser storage
ceilings vary by engine and by profile, so "limited data" becomes a wall that
arrives at an unpredictable point — which is exactly what happened to Glenn on
26 Aug: the taster refused a save mid-work, and the experience was *broken*, not
*bounded*. An accidental ceiling is the worst possible free tier.

The second is §2.3, which this document already argues: a free version that
cannot save is a demo, nobody builds a term of lessons in a demo, and the staff
room is the only marketing this product has. **Deliberately crippling the web
build contradicts that.**

The resolution is that the honest limit already exists and needs no inventing.
**A browser cannot hold a persistent reference to a folder.** So the media
library ([media-library-design.md](media-library-design.md) §6–7) is inherently
desktop-only — not withheld, unavailable. That gives:

> **Web, free:** the whole app, pictures one at a time.
> **The app:** your own picture folders, and no ceiling.

which is §2.3's instinct extended — everything is the same, only the folders
differ — and it requires no artificial limitation at all.

**And the size problem is largely self-solving.** On 26 Aug Glenn's desktop file
was 529 KB, of which **98% was two base64 images and about 10 KB was the entire
lesson**. Once the asset store lands (media-library §5, P1), images stop living
in the state JSON, and the browser build's ceiling stops being about pictures.
At ~10 KB a lesson that is hundreds of lessons before anything complains. P1 is
therefore a licensing prerequisite as well as a storage one.

**Open, and it decides the rest of this section:**

1. **Is the download itself paid, or is it free-with-a-paid-bundle?** The table
   above assumes the latter, consistent with §3. Glenn's phrasing — free *web*,
   downloaded *app* — can be read either way, and the two produce different
   products.
2. **Is the web build the free tier, or is it the taster?** They are not the
   same thing and both currently exist: `window.SAGE_DEMO` is set only by the
   deployed taster, which is *designed* to hit its ceiling as a sales moment
   (app.js:14826). If the web build becomes a real free tier, that behaviour
   has to change, because §2.3 forbids it there.

## 4. Positioning: what has to change in the README

The README currently opens with:

> 100% local: no account, no subscription, no server, no tracking.

Three of those four survive this design intact and should be defended loudly —
**no account, no subscription, no tracking.** The app never phones home; licence
checks are pure local signature verification; there is no telemetry.

What changes is that some widgets cost money once. Rewrite the promise rather
than deleting it, e.g. *"No account, no subscription, no tracking — buy once, own
it."* Teachers notice when a claim quietly disappears, and the honest version is
still a strong pitch against the SaaS competition.

---

## 5. Licence keys

### 5.1 Format

A licence is a signed payload the app verifies **offline**. You hold a private
key; the app embeds only the public half, so a code cannot be forged or
hand-edited to upgrade its own tier.

```
payload  = { v:1, tier:'maths'|'founder', batch:<u16>, serial:<u32> }   // ~9 bytes packed
licence  = base32( payload ‖ ECDSA-P256-signature(payload) )            // ~120 chars
display  = groups of 5, hyphenated, case-insensitive
```

**Use ECDSA P-256, not Ed25519.** Ed25519 only reached Chrome's WebCrypto in
2025, and Windows builds run in WebView2 — whose version is whatever the machine
happens to have, often an old school image. P-256 `crypto.subtle.verify` has been
universal for a decade. The keys are longer; teachers paste rather than type.

No email in the payload. Codes are pre-generated in batches before any buyer
exists (§6), so there is no email to embed.

### 5.2 Verification

Runs once at boot and on paste. Whitespace- and case-tolerant; accepts a pasted
code with or without hyphens. On success, store the raw code via `SageStorage`
alongside app state — it then survives updates and reinstalls for free.

Entitlement resolves to a plain set: `{ maths: true }`. `founder` grants every
bundle including ones that do not exist yet, which is what makes §7 work.

### 5.3 Revocation

Offline verification cannot revoke a leaked code. If one is posted publicly, ship
a small blocklist of serials in the next app update. This is slow and partial and
that is acceptable — it only needs to handle the one code that ends up on a forum,
not casual sharing between two colleagues.

### 5.4 On bypassability

`app.js` ships as readable JavaScript inside the Tauri bundle. A determined person
can patch out the check. Signature verification stops the realistic leak — a code
being passed around a department — and that is all it needs to do.

**Do not invest in obfuscation.** The market is primary teachers. Effort spent
hardening the gate is effort not spent on the English widgets, which is where the
next bundle's revenue actually comes from.

---

## 6. Purchase and delivery — with no server

Fully automatic key delivery, nothing running, nothing to maintain:

1. Generate a batch of ~500 codes locally with a small script.
2. Upload the list to the store as its licence-key pool.
3. On purchase, the store hands out the next unused code and emails it
   automatically, within seconds.
4. Refill when the pool runs low.

**Use a merchant of record — Lemon Squeezy or Paddle, not raw Stripe.** Selling
digital goods to UK schools means VAT, and into the EU means VAT MOSS. They
handle the filing and become the seller of record; the extra percentage is far
cheaper than the accountancy.

The trade-off: pre-generated codes are not bound to a buyer's email, so they are
more shareable. For a modestly priced teacher product this is fine, and moving to
per-buyer codes later (a webhook minting on purchase) changes nothing the teacher
sees.

Schools buy on invoice and purchase order rather than card, and — per Glenn's
procurement experience at international schools — they buy **per seat, in
volume, expanding incrementally**, not as a site licence. The observed pattern:
Explain Everything grew to 35 seats before a site licence was even discussed, and
was then rejected because 80+ secondary teachers were not opening it, making the
whole-school price bad value. Classroom Screen runs at 60 seats on the same basis.

So the unit to design for is **an assignable batch of seats a department grows
over time**, not a single school-wide code. Two consequences:

- **Seat reassignment is the hard requirement.** Staff churn annually and a
  department expects to move a leaver's seat to a new arrival. Perpetual offline
  codes handle this badly — the leaver's code stays activated on a machine you
  cannot reach, so schools over-buy to compensate. This is the strongest argument
  against "buy once, own forever" (§11).
- **The buyer will be asked to prove uptake**, since that is the argument that
  kills site licences. Sage Stage has no telemetry and must not acquire any.
  Instead, issue codes as an assignable batch with a record of which seat went to
  whom, so the ed-tech lead can make the internal case from their own MDM data.
  Administration convenience *is* the feature here.

---

## 7. Sequencing: why the free run comes after the gate

The instinct is to ship v1.0 unlocked, see if 75 teachers like it, then add
licensing. **That cannot work.** An offline app cannot count downloads, and an
update cannot take away what an installed copy already has without a visible
retraction that reads as a bait-and-switch.

Invert it:

1. Ship v1.0 **with the gate already on**.
2. Issue free `founder` codes to the first 75 teachers — full Maths Toolkit,
   permanent, plus every future bundle.
3. Paid codes begin after that.

Same generosity, but founders keep everything because their licence says so, not
because the gate was forgotten. Retaining the ability to change the model later is
the entire value of this ordering.

---

## 8. Where the gating attaches

Small and contained. All line numbers verified against `app.js` at time of writing.

| # | Site | Line | Change |
|---|---|---|---|
| 1 | `WIDGETS` registry | [app.js:270](../app.js) | Add `bundle: 'maths'` to the 11 paid definitions. Absent = free. |
| 2 | `widgetTool()` | [app.js:10260](../app.js) | Locked tools stay in the toolbar; add a padlock class and route `run` to the unlock sheet instead of `addWidget`. |
| 3 | `addWidget()` | [app.js:8739](../app.js) | Guard: a locked type cannot be added fresh. |
| 4 | `mountWidget()` | [app.js:8903](../app.js) | If locked, mount the padlock panel instead of `def.mount()`. **Props untouched.** |
| 5 | `sanitizeTemplate()` | [app.js:9961](../app.js) | **Must not drop locked widgets.** Keep them; count them for the import summary at [app.js:10068](../app.js) so the teacher is told the template contains paid widgets *before* importing. |
| 6 | Settings panel | new | Licence section: paste box, status, and what the code unlocks. |

A single `hasBundle(name)` helper backed by the verified entitlement set. One
function, consulted at render.

### 8.1 The locked-widget panel

Inside the widget box, in place of its body: the widget's own icon and accent,
one line of what it does, and a quiet "Part of the Maths Toolkit" link.

**Never a modal, never a popup, never anything timed.** The app runs on a
projector in front of a class; an upsell that can appear unbidden mid-lesson is
worse than no upsell. The teacher opens the sheet by choosing to.

The toolbar's padlocked entries are the discovery surface — a teacher browsing
tools sees eleven maths widgets exist. That is the prompt, and it is enough.

---

## 9. Updates and releases

### 9.1 What you do

1. Fix the bug; bump the version.
2. One build command produces a signed `.dmg` and `.msi`.
3. Upload both, plus a small `latest.json` manifest naming the version, the
   download URLs and the signatures, to any static host (GitHub Releases works).

That is the whole release process.

### 9.2 What the teacher sees

On next launch the app reads `latest.json`, notices a newer version, and shows a
small "Update available" notice — never mid-lesson, and dismissible. One click
downloads, verifies the signature, restarts. Around thirty seconds, no reinstall,
no admin password.

- **Saved work is untouched.** Decks live in `Documents/Sage Stage/sage-stage.json`,
  outside the app bundle. Updates replace the bundle only.
- **The licence survives.** Stored with app state, not in the bundle. Never re-entered.
- **Schema changes** go through a version field in the state file, migrated
  forward on load. Add the field before v1.0 ships, even unused.

### 9.3 Also ship a plain download link

Many teachers are on school-managed laptops and cannot install or update anything
themselves — it is an IT-deployed MSI. Keep a permanent, plainly versioned
"download 1.0.1" link so IT can deploy it their own way.

### 9.4 Four separate signing things — do not conflate them

A common trap: these are unrelated, and all four are needed.

| What | Purpose | Cost |
|---|---|---|
| **Licence keypair** (ECDSA P-256) | Signs licence codes; public half embedded in app | Free, self-generated |
| **Updater keypair** (minisign) | Signs releases so nobody can push a fake update | Free, self-generated |
| **Apple Developer Program** | Developer ID cert + notarization (notarization itself is free with membership) | ~£79/yr |
| **Windows OV code-signing cert** | Authenticode; ships with a mandatory hardware token | ~£150–250/yr via reseller |

The last two are not optional. An un-notarized `.dmg` shows *"Sage Stage is
damaged and can't be opened"* on modern macOS — fatal, and indistinguishable from
real corruption to a teacher. Notarization has been mandatory for distribution
outside the App Store since Catalina.

**Back up both private keys, offline, in more than one place.** Lose the updater
key and you can never update any installed copy again — every teacher would have
to reinstall manually. It is the single most important file in the operation.

### 9.5 Windows: buy OV, not EV

The received wisdom — *pay for EV, get instant SmartScreen trust* — **is out of
date and would waste money here.** Microsoft's March 2024 Trusted Root Program
update removed EV's distinct SmartScreen status. EV and OV now accrue reputation
identically, through clean-install download volume. EV remains necessary only for
kernel-mode driver and WHQL signing, neither of which applies.

Three consequences that shape the release process:

- **Early downloads will trip SmartScreen regardless of cert.** Reputation is
  earned by volume, and the first 75 teachers *are* the volume. Budget for a
  warning being visible for the opening months. Ship an install guide with a
  screenshot of the "More info → Run anyway" path — a teacher who hits an
  unexplained warning assumes malware and stops.
- **Reputation attaches to the signature, so do not churn certificates.** Renew
  the same subscriber identity rather than switching CA to save £20.
- **The private key lives on a FIPS 140-2 hardware token**, mandated by the CA/B
  Forum. A USB token is posted to you. Signing therefore happens on the machine
  with the token plugged in — plan releases around that rather than assuming a
  cloud CI can sign. Note also that from February 2026 certificate lifetimes cap
  at 459 days (~15 months), so this is a roughly annual renewal.

**Field evidence, 26 Aug — and it weakens the case for buying early.**
Practitioner report from the target setting: unsigned installers are not in
practice a barrier there, and where a machine does object, the people who
administer it can allow it. Taken with the first bullet above — the warning
appears regardless of certificate until download volume earns reputation — the
conclusion is that **a certificate bought before there is volume buys almost
nothing**. Ship Windows unsigned, put the "More info → Run anyway" screenshot in
the install guide as planned, and buy the cert when there are downloads for it to
accrue against. The ~£230/yr floor in §11 moves out of the pre-revenue budget.

One caveat to keep: this is a single setting, and it is strong evidence precisely
because that setting is the first market. It should still be checked against a
second before it is load-bearing for anyone else's deployment.

**Azure Trusted Signing (~$10/month) is not available.** It is restricted to
US/Canada organisations with 3+ years of verifiable trading history, and
individual onboarding has been paused since April 2025. Worth re-checking at
renewal — Microsoft has said it intends to widen eligibility — but it cannot be
planned around.

### 9.6 The publisher identity decision comes first

Both certificates attest to *who publishes Sage Stage*, so this must be settled
before either can be bought:

- **Apple, as an individual:** clears in 24–48 hours, no D-U-N-S needed, but
  **your personal legal name is shown as the developer.** A school IT admin
  vetting the installer sees a private individual.
- **Apple, as an organisation:** shows the company name, but needs a registered
  legal entity plus a D-U-N-S number, and runs **2–4 weeks** — D-U-N-S issuance
  alone can take days to several weeks.

Windows OV can be issued to an individual (Sectigo and Certum both do), so the
company route is not strictly forced — but selling to schools on invoice, a
consistent registered entity across the installer, the invoice and the licence
terms is worth the delay.

**This is calendar time, not work time, and it is the long pole.** Start the
paperwork during P0 while the Tauri migration is being written, not at P1. Two to
four weeks of waiting discovered at the end of the build is two to four weeks
where a finished app cannot ship.

---

## 10. Build order

| Phase | Work | Gate to the next phase |
|---|---|---|
| **P0** | Tauri migration ([storage-abstraction-plan.md](storage-abstraction-plan.md) §9 phases 1–4). **In parallel from day one:** settle publisher identity (§9.6), then start Apple enrolment and the OV cert order — 2–4 weeks of waiting that must overlap the build, not follow it | App runs from `Documents`, multi-window intact; certs ordered |
| **P1** | Signed + notarized `.dmg` and Authenticode `.msi`, installing cleanly on a school-spec machine | A stranger installs it without a dialog they can't get past |
| **P2** | Updater keypair, `latest.json`, updater plugin. **Ship a throwaway 1.0.1 and watch it land on a test machine.** | Update verified end to end before any paid user exists |
| **P3** | Licence verify + `bundle` tags + the six sites in §8 + padlock panel | Locked deck opens, saves, survives export/import round-trip with props intact (§2.2) |
| **P4** | Key-generation script; batch uploaded to store; buy a copy yourself with a real card | Code arrives by email and unlocks |
| **P5** | Ship v1.0. Issue 75 founder codes. | — |

P2 before P3 is deliberate: the updater is the only way to fix a licensing bug
after teachers have the app. Do not ship a gate you cannot patch.

---

## 11. Open decisions

- **Publisher identity — sole trader or limited company?** Blocks both
  certificates and carries a 2–4 week Apple lead time (§9.6). **Decide first.**
- **Price.** Not decided here. Anchor against what it replaces — a year of a
  White Rose or Mathsbot-style subscription — and remember it is bought once.
  Note the floor: ~£230/yr of certificates before a single sale.
- **Perpetual or annual? — REOPENED.** The doc assumes buy-once-own-forever to
  match the "no subscription" promise (§4), but **seat reassignment cuts against
  it** (§6): annual per-seat lets seats lapse and be reissued when staff leave,
  which is what departments actually need. Resolve alongside the anti-ransom
  guarantee — whatever the licence does, **export must keep working forever,
  regardless of licence state**. That is the line Classroom Screen crossed.
- **Per-seat pricing anchor — needs Glenn's real numbers.** Two live datapoints
  sit inside his own schools: the per-seat annual on the 60 Classroom Screen
  licences, and what the department paid per seat for Explain Everything at 35.
  Those set the range better than any external comparison.
- **Founder count.** 75 is the working number; nothing in the design depends on it.
- **Is the download paid, or free-with-a-bundle?** §3.5#1. Decides what the
  three-tier table actually means.
- **Free tier or taster — which is the web build?** §3.5#2. If it is the free
  tier, the taster's deliberate ceiling has to stop being its behaviour.
