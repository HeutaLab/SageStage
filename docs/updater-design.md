# Self-update — everyone on the same version

*Built 14 September 2026. The design the licensing doc sketched in §9, made
concrete; that section now points here.*

## 0. What it is for

A handful of testers run the desktop app and every new build had to be sent
as a link, installed by hand, and fought past Gatekeeper again. The updater
makes a published release the only step: the app notices, fetches, verifies
and installs on its own, and never in front of a class.

## 1. The moving parts

| Part | Where | What it is |
|---|---|---|
| Signing keypair | private half: two repository secrets, Glenn's password manager and one offline copy; public half: `plugins.updater.pubkey` in `src-tauri/tauri.conf.json` | minisign, generated 14 Sep 2026 with `npx @tauri-apps/cli@2 signer generate`. **Lose the private half and no installed copy can ever update again.** |
| Update artifacts | CI, `createUpdaterArtifacts: true` | macOS: `Sage Stage.app.tar.gz` + `.sig`. Windows: the NSIS `-setup.exe` + `.sig` (and the MSI's, unused — §4). |
| `latest.json` | attached to each release by the `manifest` job (`release-manifest.mjs`) | version, date, and per platform a download URL and its signature |
| The endpoint | `https://github.com/HeutaLab/SageStage/releases/latest/download/latest.json` | GitHub's *latest* skips drafts and pre-releases, so **publishing the draft is the switch** |
| The plugin | `tauri-plugin-updater`, registered in `lib.rs`; Rust only | no capability reaches the webview, the CSP is untouched |

Platform keys in the manifest are what the plugin looks up, in order
`{os}-{arch}-{installer}` then `{os}-{arch}`: `darwin-aarch64` and
`darwin-x86_64` (both the universal tarball) and `windows-x86_64-nsis`.

TLS goes through the operating system's stack (`native-tls`), not rustls: a
school that inspects TLS puts its root certificate in the OS store, and only
the OS stack looks there. The system proxy is honoured for the same room.

## 2. What happens on a teacher's machine

Twenty seconds after launch — the board has settled, the class is not waiting
on a download — and every six hours after that, because a laptop that is never
quit would otherwise never move:

1. Read the manifest. No newer version: nothing happens, nothing is said.
2. Download the platform's file and verify its signature against the public
   key. A bad signature is a failed check, not an install.
3. Install when it costs nothing:
   - **macOS** — at once. The bundle on disk is swapped; the running app is
     untouched; the next launch is the new version. The tarball is extracted
     by the app, not by a browser, so the new bundle carries no quarantine
     flag and Gatekeeper is not consulted again.
   - **Windows** — at quit, after the flush handshake in `finish_exit`. The
     NSIS installer runs per-user (no administrator prompt) with a progress
     bar and does **not** relaunch the app: a quit is a quit.
4. Say one sentence on the board, and only the board (a screen window or a
   pop-out would say it too): *Sage Stage 0.3.1 is ready. It will start next
   time you open the app.* / *…will install when you quit.* A toast, eight
   seconds, no button. Never a dialog.

Decks are not involved at any point: they live in `Documents/Sage Stage`,
outside the bundle.

### The file, before a new version touches it

An update can never reach a deck. The first save a **new version** makes can,
if a migration is wrong — and it lands on the only copy, because the daily
backup is taken before the first save of the *day*, which the old version may
already have made that morning. So the first time a version runs on a
machine, before any window has read the file, the shell copies it to
`backups/<date>_before-<version>.json`: the file exactly as the previous
version left it. The newest five are kept; the daily rotation never touches
them. Which version last ran is a marker in the app's own data folder, not
in Documents — bookkeeping about the machine, not the teacher's work — so a
file that arrives from elsewhere is still copied the first time a version
meets it. A failed copy is retried at the next launch rather than forgotten.

storage.js's recovery knows the name. If the file is ever unreadable, the
same day's pre-upgrade copy is tried **before** its daily copy (`_` sorts
after `.`): the daily may predate that morning's work; the pre-upgrade copy
cannot.

### Managed machines

Where the app folder is not the teacher's to write — an IT-installed Mac —
the plugin would ask for an administrator password, a dialog in the middle of
a lesson. `bundle_is_writable` asks `access(2)` first and, on "no", the update
is not installed and the sentence is *…this Mac needs an administrator to
install it.* An MSI-installed Windows app finds no entry in the manifest and
does nothing (§4). Both keep the plain download link from licensing §9.3 as
the way IT moves them.

### Developer hooks, inert unless set

- `SAGE_STAGE_NO_UPDATE=1` — never check. For verification runs.
- `SAGE_STAGE_UPDATE_CHECK=1` — a debug binary checks (by default it never
  does: it has no bundle to replace, and the verification loop runs on an
  isolated `HOME` that must not reach GitHub unasked).
- `SAGE_STAGE_UPDATE_URL=…` — read this manifest instead. Plain http is
  accepted by debug builds only.

A dev binary has no `.app` ancestor, so `bundle_is_writable` says no and the
updater is kept away from `target/`.

## 3. Shipping an update — the runbook

1. Bump `version` in **both** `src-tauri/tauri.conf.json` and
   `src-tauri/Cargo.toml`. The manifest job refuses a tag that disagrees with
   the config.
2. Commit, tag `vX.Y.Z`, push the tag. `desktop-build` builds both platforms
   and attaches the DMG, the `.app.tar.gz`, the setup.exe, the MSI and
   `latest.json` to a **draft** release.
3. Look at the draft. Install the DMG on one Mac by hand if anything native
   changed.
4. **Publish it.** From that moment every installed copy's next check finds it.
5. Rollback is forward only: a bad release is fixed by publishing a higher
   version with the old code.

The copies of 0.1.1 and 0.2.0 already installed have no updater. The first
version that carries it is installed by hand once, and after that never again.

**Before relying on it:** ship a throwaway `x.y.1` and watch it land on one
test machine per platform — the go-to-market checklist's P2 gate. 0.3.1 is
that: it carries the pre-upgrade copy and nothing else. The first automatic
update anyone receives must be trivial, so a fault in the updater and a fault
in a feature can never be mistaken for each other. The large upgrade in
flight elsewhere (writing, screenshots and annotation on any screen, saved
into the deck) is 0.4.0, after 0.3.1 has landed, and it obeys three rules:
fields are added, never restructured; screenshots go to `assets/` by hash,
never inline in the deck; and a 0.3.x file opened and saved by 0.4.0, and a
0.4.0 file opened by 0.3.x, both lose nothing.

## 4. Decisions

- **GitHub Releases, not the help site.** One host, one URL, and the draft is
  already the gate. If a school network turns out to block
  `objects.githubusercontent.com`, the manifest and files can move to the
  sagestage.co.uk apex (Pages) without touching the app: only the endpoint
  in the config changes.
- **No MSI entry in the manifest.** Per-machine installs need an
  administrator at exactly the moment the teacher quits. IT deploys those
  and updates them itself.
- **macOS installs immediately, Windows at quit.** The platforms differ in
  what an install does to a running process; the teacher's experience is the
  same either way — nothing until the next launch.
- **Unsigned by Apple still works**, and is better than today: the updated
  bundle never meets Gatekeeper. Notarization remains the proper fix for the
  first install and is on the checklist.
- **Rust does all of it.** No permission in `capabilities/default.json`, no
  updater API in the webview, nothing for a template to reach.

## 5. Verified, and not yet

**Verified on 14 September 2026, the evening `v0.3.0` was tagged:**

- The tagged build signed both platforms with the repository secrets, and the
  manifest job wrote `latest.json` whose three URLs name real assets on the
  draft. The universal target does produce `Sage Stage.app.tar.gz`, and
  GitHub does rename it `Sage.Stage.app.tar.gz`.
- **The macOS update path, end to end, with the real signed artifact.** The
  0.3.0 tarball was unpacked into a scratch folder, its binary replaced by a
  debug build, and that bundle run on an isolated `HOME` against a local
  manifest claiming 9.9.9 and pointing at the real tarball with its real
  signature. Twenty seconds in: fetched, downloaded, signature verified
  against the public key in the config, bundle swapped while the process kept
  running — `file` on the bundle's binary went from arm64-only to the
  universal CI binary. Launched afterwards, the swapped-in release binary put
  its 1280×800 window on screen under its own process id.

- **The pre-upgrade copy**, debug binary on an isolated `HOME`: the first
  run of a version copies the file byte-for-byte and writes the marker; the
  second run does nothing; a run after a different version's marker copies
  again and rotates seven old copies down to five. A damaged file beside a
  daily copy and a pre-upgrade copy that disagreed on a deck name came back
  from the pre-upgrade copy.

**Not yet:**

- An update landing on a real installed copy through the published endpoint.
  0.3.1, the throwaway, is that.
- Windows, at all: that the `/P /UPDATE` install with no `/R` leaves the app
  closed and the new version in place.
