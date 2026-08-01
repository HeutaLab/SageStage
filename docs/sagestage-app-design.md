# sagestage.app — the taster

Designed with Glenn, 2026-08-01, on the estate decided in docs/help-system-design.md §5:
**sagestage.co.uk is help; sagestage.app is the taster** — the live in-browser demo plus
workshop resources, the link handed out alongside HeutaLab. This doc is the taster's spec.

## 0. What it's for, and the lines it must not cross

The taster's job is to **make the name** — a teacher hears "Sage Stage", clicks, and is
dragging a rekenrek around within thirty seconds, no install, no account, no trust
decision. It converts by demonstrating, never by gatekeeping.

Decisions taken with Glenn, recorded so future sessions don't reopen them:

- **Badged, not capped.** V1 imposes no artificial limits. The sandbox is the medium's
  own truth: browser storage only (localStorage floors at ~5MB in the strictest
  browsers; images and imported PowerPoints are what fill it), evictable by a cleared
  browser or a school's nightly reset. The taster says so honestly and lets the
  pressure moment sell the desktop app's real file.
- **Monetisation guardrails** (for September's licensing revision, not this build):
  the free thing stays honestly usable forever; charge for breadth (the Maths Toolkit
  bundle model), never for the teaching moment; **never cap pupils** — KS2 classes
  genuinely run to 33–34, and a cap at a real class size refuses a real child in
  front of a real teacher once, which is how scalper reputations start. If capacity
  ever shapes a tier, cap class LISTS. Two lanes later: one-off personal purchase,
  annual school site licence, both through the signed-key gate.
- **Soft capture** (decided in the help design, repeated here because this site hosts
  it): the download is one click, no email. The signup is optional, beside it.
- **No analytics, no cookies, no third-party requests on the site.** The signup form
  is a LINK OUT to the provider's hosted page, not an embed — sagestage.app itself
  loads nothing from anyone.

## 1. The site map

Three surfaces, one small static site (its own repo — see §3):

- **`/` — the landing.** What Sage Stage is, in Glenn's register: real classrooms,
  everything stays on the machine, made by a teacher. Primary button **Try it now**
  → `/try/` (the tour). The three "what a lesson looks like" cards are DOORS: each
  deep-links `try/?deck=…` and builds that themed deck (§2). Beside the CTA:
  **Download for desktop** (§4) and the optional signup line. Header and footer
  link the help site, **heutalab.com** (the teaching-resources home carrying the
  old Edtechlounge material), and the workshop page.
- **`/try/` — the taster.** The full app, browser build, demo-flagged (§2).
- **`/workshop/` — October's shelf.** Skeleton now: title, one paragraph on "The
  Human in the Middle", and a "resources appear here after the session" note. Filled
  near the talk; it deploys like any other page edit.

## 2. The taster mechanics — one flag, three moves

The app is **unforked**. The deployed taster adds one file, `demo.js`, loaded before
app.js only in the `/try/` build (injected at assembly, §3 — the app repo's own
index.html never references it). It sets `window.SAGE_DEMO = { seed: <deck json> }`.

App.js gains three small **guarded** touches, inert everywhere the flag is absent:

| hook | behaviour under the flag |
|---|---|
| topbar tag | ".tag" reads **"Taster — work stays in this browser"** instead of "100% local"; the dashboard's tag matches |
| storage pressure | the data panel's headroom hint (and the storage-full shed warning) gain one line: *"The desktop app keeps decks in a real file in Documents, with daily backups and no browser limit — it's on the front page."* Shown only where the existing warnings already show — the medium's limit IS the prompt |
| seeding | four seeds in demo.js: the three-screen **tour** (no URL param) and three themed decks the landing cards deep-link — `try/?deck=maths` ("Maths in your hands", 2 screens), `?deck=english` ("English on the board": story map + word bank, then modelled writing + sentence builder), `?deck=everyday` ("Classroom management": the running-classroom screen, then noise/rewards/groups). Fresh browser: the chosen deck is the first state and boot lands on its screen 1. Returning browser: the app **adds the requested deck if missing and opens it** — existing work is never overwritten (added 2026-08-01 after Glenn's review). Widgets build from their own `defaults()` at boot |

Export everything → import on desktop already works; the landing page says so
("nothing you make here is hostage — export it, bring it to the real app").

## 3. The rails — second repo, pull-based, deliberate deploys

- **Repo:** `HeutaLab/sagestage-app` (public), GitHub Pages via Actions, custom
  domain **sagestage.app**. One repo = one Pages site, hence the second repo; and
  the taster must not track every push to the app repo anyway.
- **Assembly:** the workflow checks out `HeutaLab/SageStage` (public — **no tokens,
  no secrets**), assembles `site/` = the repo's own landing/workshop pages + `try/`
  built from the app exactly as copy-dist builds dist/ (same derive-from-index.html
  step, plus community/, vendor/, help/widgets-data.js), then injects the demo.js
  script tag into try/index.html with sed and drops demo.js beside it. CNAME file:
  `sagestage.app`.
- **Trigger: deliberate.** `workflow_dispatch` (a "Run workflow" click) and
  `release published` on the app repo can't reach across repos without tokens, so
  v1 is dispatch-only — updating the taster is a deliberate act, and a broken main
  in the app repo can never break the public taster.
- **DNS at Hover** (after Glenn registers sagestage.app): the same shape as co.uk —
  four apex `A` records on host `@` (185.199.108.153 / .109.153 / .110.153 /
  .111.153), `www` CNAME → `heutalab.github.io`. The `*`-vs-`@` lesson from co.uk
  applies. .app requires HTTPS by TLD policy; Pages' certificate satisfies it.

## 4. Download and the signup

- **Download** points at the app repo's **GitHub Releases**. Until Apple Developer
  enrolment lands (the signing/notarisation decision already on Glenn's list), the
  button says **"Download for macOS — free beta"** with the one-line right-click →
  Open note underneath, and no pretence otherwise. When notarised builds exist the
  page copy shortens and nothing else changes.
- **Signup** (soft capture): **MailerLite free tier** — £0 to 500 subscribers,
  double opt-in (the UK-GDPR consent receipts are theirs to keep), unsubscribe
  handled, CSV export means the choice is never permanent. The site links out to
  the hosted signup page; nothing embeds. Copy on the landing page: *"An email
  when the polished installer ships — and the occasional 'have your staff seen
  this'. Nothing else, unsubscribe anytime."* Until Glenn creates the account the
  signup line simply doesn't render (one commented block).

## 5. Not in v1

- No caps, tiers, or licence gates (September's licensing revision owns them).
- No analytics of any kind, ever, on this site.
- No embedded signup forms; no cookie banner because there is nothing to consent to.
- No auto-deploy on app-repo pushes; no iframe-embedding of the taster into the
  landing page.
- No Windows build link until one exists to link.

## 6. Hazards

- **The browser build must stay first-class** — the taster IS the localStorage
  fallback; nothing desktop-only may be assumed at boot. (Already true; the demo
  flag must keep it true.)
- **demo.js must never ship in the product**: it lives in the sagestage-app repo
  only; the app repo's index.html never references it; copy-dist never sees it.
- **The seed deck runs only when no state exists** — a returning taster visitor's
  work is never overwritten by the showcase.
- **Path depth:** the taster serves at `/try/`, so the app's relative asset paths
  must resolve under a subdirectory — they do (index.html uses bare relative srcs),
  and assembly keeps the directory layout copy-dist produces.
- The storage-pressure line must appear ONLY where the existing warnings already
  appear — no new nagging surface.

## 7. Verification

Local: assemble the site with the workflow's own steps run by hand, serve it, and
check — taster boots at `/try/` with the seed deck and taster tag; a text deck
saves and survives reload; export downloads; the storage line appears when the
headroom hint does (forceable by filling state with a large pasted image); the
landing and workshop pages render; no request leaves the origin (network panel).
Live: after first deploy, the same pass on sagestage.app, plus the redirect and
certificate checks that co.uk got.

## 8. Build order

1. App-repo hooks (tag, storage line, seed hook) — guarded, inert, shippable alone.
2. `HeutaLab/sagestage-app` repo: landing + workshop pages, site.css (help-site
   flavour), demo.js with the showcase deck, assembly workflow.
3. Hand-run assembly locally; verify per §7.
4. First deploy; Glenn's console steps: register sagestage.app at Hover → DNS →
   Pages custom domain (the API can do the repo side again).
5. MailerLite account when Glenn's ready; uncomment the signup line; redeploy.
6. Iteration log; memory update; release-download link once a Release exists.

**Glenn's actions:** register sagestage.app · Hover DNS (@ not *) · MailerLite
account (whenever) · eventually: first GitHub Release with a zipped .app, and the
Apple Developer signing decision that upgrades the download story.
