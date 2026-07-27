# Sage Stage — Live Class Collaboration ("Class Link") Design Exploration

**Status:** Exploration — direction agreed in principle, not yet scheduled
**Depends on:** the Tauri desktop wrapper (see [storage-abstraction-plan.md](storage-abstraction-plan.md)) — collaboration is a desktop-build feature
**Date:** 2026-07-18

---

## 1. What this is

Students join a live session from their own devices (phone, tablet, laptop, Chromebook —
anything with a browser) by scanning a QR code or typing a short code, and interact with
the screen the teacher is projecting: vote in polls, answer quick quizzes, send moderated
responses, and — later — co-edit a live document or shared whiteboard.

The product promise stays intact: **everything runs in the classroom.** The teacher's
machine *is* the server. No accounts, no cloud, no student data leaving the room.

## 2. Why this needs the Tauri build

A web page cannot accept inbound connections — there is no way for 30 students to connect
*to* a browser tab without third-party signaling infrastructure (verified: WebRTC still
requires a signaling server; "serverless" options like PeerJS cloud or public-tracker
signaling leak student IPs to third parties no school can sign a GDPR Art. 28 processor
agreement with — worse for the "100% local" promise than anything self-hosted).

The Tauri wrapper changes everything: the Rust side can run a real embedded web server.
This makes the desktop app the "classroom hub" and gives the browser-only version a clean
story ("live sessions need the desktop app").

## 3. Architecture (verified against current ecosystem, sources in §10)

```
Teacher's machine (Tauri app)
├── webview: Sage Stage UI (unchanged)
└── Rust backend
    ├── axum HTTP server bound to 0.0.0.0:<configurable port>
    │   ├── GET /            → student join page (compiled into the binary via rust_embed)
    │   └── GET /ws          → WebSocket (tokio-tungstenite via axum)
    ├── session state (in-memory, teacher-authoritative)
    └── LAN IP discovery (local-ip-address crate; enumerate interfaces, let teacher pick)

Students' devices: any browser → http://<teacher-ip>:<port>/?c=<CODE>
```

- **Join UX** (matches the Kahoot/Mentimeter convention teachers already know): the app
  projects a big 5–6 char code + QR encoding `http://ip:port/?c=CODE`. The existing
  `SageQR.drawQR` in [qr.js](../qr.js) already renders QR codes — the join screen reuses it.
  Plain `http:`/`ws:` is fine (the student page is not a secure context; no mixed-content
  issue). Never rely on mDNS/`.local` names — multicast is unreliable or filtered on school
  networks; the QR carries the raw IP.
- **Protocol (v1): no CRDT.** Votes/quizzes are teacher-authoritative, last-write-wins,
  idempotent. Plain JSON over WebSocket: client sends `{vote:"B"}`; server holds canonical
  tallies; broadcasts aggregate state; **full-state resync on every (re)connect**;
  reconnect with jitter; app-level ping/pong keepalives; debounce anything high-frequency
  to ~10 Hz; no UDP, no multicast, ever.
- **Live documents (v2+): Yjs via yrs.** The official Rust port `yrs` + `y-sync` is
  protocol-compatible with stock browser Yjs/y-websocket (ready glue: `yrs-axum`;
  hardened reference: y-sweet). The student page keeps vanilla Yjs; the Rust server
  replaces the Node y-websocket server. Coexists with the v1 protocol on the same axum
  instance. 35 clients on LAN is trivial load for either protocol.

## 4. The real risk: school network policy (not code)

Every current K-12 network guide prescribes staff/student VLAN segregation and **client
isolation on student SSIDs** — either silently blocks students from reaching a teacher
laptop. Products with the same topology (Airtame, LocalSend) document this as their #1
support issue; the LAN classroom products that work (LanSchool, NetSupport, Veyon) are
IT-deployed, not teacher-ad-hoc. Design consequences, as **core features not afterthoughts**:

1. **Connectivity self-test on the session panel** — the app fetches its own LAN URL the
   way a student would and shows "✅ students can reach you" / "❌ this network blocks
   device-to-device — see options" *before* the teacher has 30 kids waiting.
2. **Teacher hotspot / travel router as a first-class documented mode** — works on any
   network policy, zero IT involvement. Caveat honestly: phone hotspots often cap at ~10
   clients (fine for group work); a £30 travel router handles a full class.
3. **IT one-pager** — single TCP port, inbound to teacher device, staff↔student VLAN;
   deployable via GPO/Intune.
4. **Windows Firewall**: the first-listen prompt is a trap — for non-admin users (typical
   on school laptops) Windows creates *block* rules regardless of what they click. The
   installer must create the allow rule (installers run elevated; standard practice), scoped
   to Private/Domain profiles. On macOS, the firewall's default "allow signed software"
   setting admits a signed app silently — one more concrete reason for the signing budget
   (already an open question in the storage plan).

## 5. Privacy & safeguarding (the selling point, designed-in)

- Sessions are **ephemeral and in-memory**: rosters and raw responses die with the session
  unless the teacher explicitly saves results.
- Saved results go through the existing `save()` into widget props (poll tallies) — the
  same local-first storage as everything else; no new persistence surface.
- Students join with a code; names optional (teacher setting: anonymous / first names).
- **Free-text responses are moderated by default**: they enter a teacher-only queue and
  appear on the projector only when approved. Rate limiting per client. Session lock
  ("no new joins") and kick controls.
- The projected screen shows aggregates by default, not individual live keystrokes.
- GDPR posture: no processor relationship exists because no third party touches the data —
  this is a genuine differentiator vs. Kahoot/Mentimeter and worth stating in marketing.

## 6. UI integration with the existing app

- **"Go live" on the Poll widget** — the existing poll gains a live toggle in its settings:
  when live, the vote buttons on the teacher screen become the student vote counts, and the
  widget shows the join code chip. Poll props remain the source of truth (`o.votes` updated
  from session tallies via the same refresh path), so rendering, reset, and persistence all
  keep working unchanged.
- **Session panel** (new, opened from the topbar): start/stop session, big code + QR
  (reusing the QR widget's renderer), connected-count, roster (if named), connectivity
  self-test result, moderation queue when free-text activities run.
- **New live activity types** later: quick quiz (A/B/C/D with right answer), exit ticket
  (free text, moderated), emoji check-in (reuses the wellbeing poll shape).

## 7. Browser-only teacher fallback

Two honest options, decided later (not v1):
- **Feature-gate**: live sessions simply require the desktop app (recommended default).
- **Opt-in relay**: a tiny self-operated stateless WebSocket fanout (~50 lines) for
  teachers who genuinely cannot install anything — clearly labeled as leaving the local
  promise, and simpler + more robust than WebRTC on school firewalls anyway.

## 8. Phasing

- **C0 (prereq):** Tauri wrapper + storage plan phases 1–3 land first.
- **C1 — Live polls:** axum server + rust_embed student page + WS protocol + join
  QR/code + session panel + connectivity self-test + installer firewall rule + "Go live"
  on the Poll widget. This alone is a headline feature.
- **C2 — Activities & moderation:** quiz, exit ticket, moderation queue, roster/lock/kick,
  save-results-to-deck.
- **C3 — Live documents:** yrs/y-sync route + collaborative doc widget (shared text first,
  whiteboard later — the draw pad's stroke model maps naturally onto a Yjs array).
- **C4 (optional): relay mode** for browser-only teachers + cross-network edge cases.

## 9. Open questions

1. Port strategy: fixed default (e.g. 4816) with override, or random with QR-only joining?
   Fixed is easier for IT one-pagers; random dodges collisions.
2. Should saved poll results record per-student answers (named mode) or aggregates only?
   Safeguarding lean: aggregates only in v1.
3. Does the student page need i18n from day one?
4. Hotspot mode documentation: recommend a specific cheap travel router model?

## 10. Key sources (from the research pass)

- Tauri embedded-server pattern: github.com/tauri-apps/tauri/discussions/2751; axum-embed; rust_embed
- LAN IP: local-ip-address crate
- Windows Firewall prompt behaviour (non-admin → silent block): learn.microsoft.com Windows Firewall rules docs
- macOS firewall auto-allows signed apps: support.apple.com/guide/mac-help/mh34041
- Client isolation as standard school practice: purple.ai school Wi-Fi guide; Airtame network-integration docs; LocalSend issue #527
- LAN classroom precedents: LanSchool Classic, NetSupport School connectivity server, Veyon, ClassQuiz (open-source Kahoot clone, ~300 players tested)
- Join-code UX: Kahoot/Socrative support docs
- CRDT stack: github.com/y-crdt/y-crdt (yrs), y-sync, yrs-axum, y-sweet
- WebRTC-without-infra impossibility + GDPR processor issue: MDN mixed content; gdpr-advisor.com edtech guidance
- Wi-Fi density: Netgear/Meraki high-density guides (~25–30 clients per AP radio)
