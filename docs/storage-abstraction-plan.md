# Sage Stage — Storage Abstraction & Tauri Desktop Design Doc

**Status:** Approved direction, ready to implement (final — incorporates data-loss, simplicity, and Tauri-correctness reviews)
**Repo:** `/Users/glenn/Sage_On_The_Stage`
**Date:** 2026-07-18

---

## 1. Goals / non-goals

### Goals

- Ship installable desktop builds (`.msi`/`.exe` for Windows, `.dmg` for macOS) using a Tauri v2 wrapper, with **no build system introduced** — the app stays plain HTML/JS/CSS.
- Introduce a small **storage interface** with two backends:
  - **localStorage backend** — byte-for-byte the behaviour of today's plain-browser app, including multi-tab sync via the `storage` event and the KB usage meter. It keeps today's write code verbatim; all new machinery lives in the file backend only.
  - **Tauri file backend** — state lives in a real, user-visible file at `Documents/Sage Stage/sage-stage.json`, with fsynced atomic writes, flush on every quit path (window close, Cmd+Q, OS shutdown), daily rotating backups, and corrupt-file recovery that distinguishes I/O failure from corruption. Webview localStorage inside Tauri is treated as a disposable cache, never as the source of truth (it is keyed to webview origin and evictable — WKWebView/WebView2 data stores).
- Keep the existing JSON export/import as the universal transfer/backup format between browser and desktop. (The export *mechanism* changes on macOS desktop only, because blob-anchor downloads don't work in WKWebView — see §4; the file format is untouched.)
- Preserve multi-window behaviour in Tauri: the "open screen in new tab" projector workflow (`#s=<id>` pinning) and live cross-window state sync.
- Minimal churn in `app.js`: `save()` keeps its synchronous fire-and-forget call signature at all ~125 call sites; boot becomes async in exactly one contained place.

### Non-goals

- **No PWA / File-System-Access backend now.** Chromebook support via installable PWA is future work; this design only reserves a slot for it (§8).
- **No assets/ folder implementation now.** Images stay as data-URLs inside state JSON; §8 defines the convention so nothing here blocks it.
- **No auto-updater in v1** (plugin-updater is scoped in §7 as "later").
- **No change to the state schema, `normalize()`, or the export file format.** A backup exported from the browser imports into the desktop app unmodified, and vice versa.
- **No multi-machine sync engine.** One machine at a time is the supported model; OneDrive-synced Documents folders get cheap conflict *mitigation* (§4, §10#3), not merging. The README must say this plainly.
- **No Linux packaging** in v1 (Tauri supports it; trivially added later if asked).

---

## 2. Storage interface

### Design

One new file, **`storage.js`**, loaded in `index.html` immediately before `app.js` (same synchronous script-tag idiom, no modules, with the repo's existing `?v=` cache-buster convention). It defines a single global, `window.SageStorage`, chosen at load time: the file backend when `'isTauri' in window && window.isTauri`, otherwise localStorage. Under Tauri it also defines `window.SagePlatform` (window/link opening, §5); **in the browser `SagePlatform` is undefined** and every existing anchor/`window.open` call site behaves exactly as today.

Key decisions that keep `app.js` changes minimal and Phase 1 genuinely near-zero-change:

- **`save()` stays synchronous-signature.** It becomes one line: hand the backend a *serializer thunk* (`() => JSON.stringify(state)`). Serialization happens at flush time, so rapid mutations coalesce into one write of the latest state.
- **The localStorage backend keeps today's write path verbatim** — `clearTimeout`/`setTimeout(250)`/`localStorage.setItem` with the existing quota toast. The async coalescing queue (`makeQueue`) exists **only in the file backend** (§4), where single-in-flight and coalescing actually matter. This makes the Phase 1 parity claim trivially true instead of something an 8-item checklist has to defend.
- **Boot goes async in exactly one place:** the outer IIFE in `app.js` (which is `(function () {` at app.js:3, not an arrow) becomes `(async function () { ... })()` and gains a single `await SageStorage.init()` immediately before `let state = load() || ...` (app.js:196). Scripts sit at the end of `<body>`, all top-level listeners register inside the IIFE after the await point, nothing outside `app.js` calls into it, and the localStorage `init()` resolves in microtasks — before paint and before any possible user event. Two honest residual deltas, both handled: boot exceptions become promise rejections, so the IIFE gets a `.catch` that logs and shows a plain failure message; and a stale-cached `index.html` without the storage.js tag would break, so `storage.js?v=1` ships in the same commit as the `app.js` `?v=` bump.
- **`normalize()` stays in `app.js`** and remains the single funnel for every data entry point. The backend hands back a *raw JSON string* (plus flags); `app.js` parses and normalizes it exactly as `load()` does today. The file backend only does a minimal plausibility check (`JSON.parse` succeeds and has a `.decks` or `.screens` array — the same shape check the import path at app.js:4343 already uses) for backup-recovery decisions.
- **No generic `info()`/actions mini-framework.** The "Your data" modal branches on `SageStorage.kind`: the local path keeps today's synchronous usage computation and copy character-for-character; the file path calls file-backend-only methods (`fileInfo()`, `revealDataFile()`, `saveExport()`) and builds its DOM with the same direct `el()` idiom the modal already uses.

### Interface shape

```js
// storage.js — window.SageStorage. One object, backend picked at script load.
window.SageStorage = {
  kind: 'local' | 'file',

  // Resolves when the backend is ready. The ONE thing app.js awaits.
  //   raw:     string | null   — persisted JSON, exactly what load() used to read
  //   existed: boolean         — replaces the raw `!localStorage.getItem(LS_KEY)`
  //                              first-run probe at app.js:5079
  //   notice:  string | null   — a toast to show after first render (recovery /
  //                              migration messages), null in the normal case
  //   readOnly:boolean         — file backend only: true when the data file could
  //                              not be READ (I/O error, not corruption); all
  //                              writes are suppressed this session (§4)
  init(): Promise<{ raw, existed, notice, readOnly }>,

  // Synchronous signature; schedules a debounced flush. Called by save().
  // local: today's setTimeout/setItem code verbatim. file: makeQueue (§4).
  write(serialize /* () => string */): void,

  // Force any pending write NOW. Awaited by the Tauri close/quit handlers.
  // local: clear the timer and setItem immediately if a write was pending.
  flush(): Promise<void>,

  // Delete persisted data (localStorage key / data file + backups). See §4 for
  // the file backend's multi-window quiesce.
  erase(): Promise<void>,

  // Replaces the window 'storage' listener at app.js:5056. fn receives the raw
  // JSON written by ANOTHER window/tab, or null meaning "another window erased
  // everything" (file backend only; the local backend never passes null,
  // matching today's `!e.newValue` early-return).
  onExternalChange(fn /* (raw: string | null) => void */): void,

  // app.js registers its toast so backends can surface write failures with
  // backend-appropriate copy (quota vs. disk error).
  onWriteError(fn /* (msg: string) => void */): void,

  // ---- file backend only (undefined on the local backend) ----
  fileInfo(): Promise<{ sizeKB, path }>,     // for the data modal
  revealDataFile(): void,                    // "Show in Finder/Explorer"
  saveExport(defaultName, json): Promise<'saved'|'cancelled'>,  // dialog-save (§4)
};
```

### `app.js` diffs (sketch)

```js
// app.js:3 — the outer IIFE becomes async; a .catch is appended at the very end
-(function () {
+(async function () {
   'use strict';

// app.js:186-196 — load() reads the preloaded raw string instead of localStorage
+  const persisted = await SageStorage.init();   // ← the one await in the file
   function load() {
     try {
-      const raw = localStorage.getItem(LS_KEY);
-      if (!raw) return null;
-      return normalize(JSON.parse(raw));
+      if (!persisted.raw) return null;
+      return normalize(JSON.parse(persisted.raw));
     } catch (e) { return null; }
   }
   let state = load() || normalize(defaultState());

// app.js:198-208 — save() delegates; the local backend contains this exact code
-  let saveTimer = null;
-  function save() {
-    clearTimeout(saveTimer);
-    saveTimer = setTimeout(() => {
-      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
-      catch (e) { toast('⚠️ Could not save — storage is full. …'); }
-    }, 250);
-  }
+  function save() { SageStorage.write(() => JSON.stringify(state)); }
+  SageStorage.onWriteError((msg) => toast(msg));

// app.js:5056-5065 — storage event → backend-neutral external-change hook
-  window.addEventListener('storage', (e) => {
-    if (e.key !== LS_KEY || !e.newValue) return;
-    try {
-      const incoming = normalize(JSON.parse(e.newValue));
+  SageStorage.onExternalChange((raw) => {
+    if (raw === null) {                       // another window erased everything
+      state = normalize(defaultState());
+      renderScreen(); if (dashEl) renderDashboard();
+      return;
+    }
+    try {
+      const incoming = normalize(JSON.parse(raw));
       if (!incoming) return;
       state = incoming;
       renderScreen();
       if (dashEl) renderDashboard();
     } catch (err) { /* ignore malformed writes */ }
   });

// app.js:5079 — first-run probe
-  if (!localStorage.getItem(LS_KEY)) {
+  if (!persisted.existed) {
     addWidget('clock'); …
   }
+  if (persisted.notice) toast(persisted.notice);   // recovery / migration message
   if (!viewId) openDashboard();
-})();
+})().catch((e) => {
+  console.error(e);
+  document.body.textContent = 'Sage Stage failed to start — see the console.';
+});
```

Remaining `app.js` touch points, all mechanical: the erase button and the data modal's backend branch (§3/§4), and — **in the Tauri phases only, not Phase 1** — a `SagePlatform` intercept at the three `_blank`/`window.open` sites (§5). `LS_KEY` stays defined in both files (it's a constant string; duplicating it beats inventing a cross-file config mechanism for one literal).

`index.html` change: add `<script src="storage.js?v=1"></script>` on the line before the `app.js` tag, and bump `app.js?v=18` → `?v=19` in the same commit.

---

## 3. localStorage backend

Must be indistinguishable from today — achieved by *moving* today's code, not rewriting it:

```js
function localBackend() {
  let saveTimer = null, pending = null;
  function doWrite() {
    try { localStorage.setItem(LS_KEY, pending()); pending = null; }
    catch (e) { writeErrCb('⚠️ Could not save — storage is full. Try removing large images.'); }
  }
  return {
    kind: 'local',
    async init() {
      const raw = localStorage.getItem(LS_KEY);
      return { raw, existed: raw !== null, notice: null, readOnly: false };
    },
    write(serialize) {                      // app.js:198-208, verbatim semantics
      pending = serialize;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(doWrite, 250);
    },
    async flush() { if (pending) { clearTimeout(saveTimer); doWrite(); } },
    async erase() { localStorage.removeItem(LS_KEY); },
    onExternalChange(fn) {
      window.addEventListener('storage', (e) => {
        if (e.key === LS_KEY && e.newValue) fn(e.newValue);   // never passes null
      });
    },
    onWriteError(fn) { writeErrCb = fn; },
  };
}
```

Parity notes:

- **Timing:** identical 250 ms debounce, synchronous `setItem`, same tick as before. The known today-risk (write lost if the tab closes within 250 ms) is *preserved*, not fixed — Phase 1 is a pure refactor.
- **Multi-tab sync:** writes still go through `localStorage.setItem`, so the browser still fires the `storage` event in other tabs; `removeItem` still produces `newValue: null`, which is still ignored — two-tab erase semantics unchanged.
- **Data modal:** the `kind === 'local'` branch keeps the synchronous `Math.round((localStorage.getItem(LS_KEY) || '').length / 1024)` computation at app.js:4315 and the exact `~N KB (browser limit is about 5,000 KB …)` hint copy at app.js:4361. No async fill-in, no microtask delta.
- **Quota toast:** identical string, still fired from the write path via `onWriteError`.
- **Erase / first-run:** `erase()` and `existed` route the two raw localStorage calls (app.js:4368, 5079) through the interface with identical semantics.

---

## 4. Tauri file backend

### Files on disk

```
Documents/Sage Stage/
  sage-stage.json                       # the state, compact JSON
  sage-stage.json.tmp-<windowLabel>     # transient, one per window, exists only mid-write
  sage-stage.corrupt-<epochms>.json     # quarantined damaged files (never deleted by us)
  backups/
    2026-07-17.json                     # daily snapshots, newest N=14 kept
    2026-07-16.json
    pre-import-<epochms>.json           # safety snapshots taken before import-replace,
                                        #   pruned separately (newest 3 kept)
    conflict-<epochms>.json             # on-disk state snapshotted before an
                                        #   externally-modified file is overwritten
  assets/                               # reserved, not created until §8 lands
```

Reads, backups, rotation, quarantine renames, and erase go through `@tauri-apps/plugin-fs` (via `window.__TAURI__.fs` — `withGlobalTauri: true`, no bundler), with relative names resolved against `BaseDirectory.Document`. **The atomic state write goes through one small Rust command** (below). `mkdir('Sage Stage', { baseDir: Document, recursive: true })` runs in `init()`; the Rust command also creates the directory defensively.

### Atomic, durable write (Rust command, shipped in v1)

Data-loss review conclusion, adopted: deferring fsync turns a power-loss event from "≤1 s lost" into "up to a full day lost" (a post-rename crash before the data blocks hit disk can leave `sage-stage.json` zero-length, and recovery then restores *yesterday's* backup), and the "escalate if VM testing shows torn files" trigger is unreliable because host page caches absorb the write in VM tests. So the ~20-line Rust command ships from the start instead of `writeTextFile` + `rename`:

```rust
#[tauri::command]
fn save_state(app: tauri::AppHandle, json: String, window_label: String) -> Result<(), String> {
    let dir = app.path().document_dir().map_err(err)?.join("Sage Stage");
    std::fs::create_dir_all(&dir).map_err(err)?;
    // window_label is validated: [a-z0-9-]+ only (it names our tmp file)
    let tmp = dir.join(format!("sage-stage.json.tmp-{window_label}"));
    let mut f = std::fs::File::create(&tmp).map_err(err)?;
    f.write_all(json.as_bytes()).map_err(err)?;
    f.sync_all().map_err(err)?;                    // data + metadata on disk BEFORE rename
    std::fs::rename(&tmp, dir.join("sage-stage.json")).map_err(err)?;
    Ok(())
}
```

- `std::fs::rename` is atomic replace-if-exists on both macOS (POSIX `rename(2)`) and Windows (`MoveFileExW` + `MOVEFILE_REPLACE_EXISTING`). Temp file is in the same directory as the target, so the rename never crosses filesystems. A crash at any point leaves either the complete old file or the complete new file.
- **Per-window temp names** (`sage-stage.json.tmp-<windowLabel>`) close the cross-window torn-write hole: with a *shared* temp name, window B's in-progress temp write could be renamed onto the main file by window A, installing garbage through a perfectly atomic rename. Each window's queue serializes its own writes; distinct temp paths mean concurrent windows can only produce whole-file last-write-wins, never a mix. `init()` deletes stale `sage-stage.json.tmp-*` files.
- App-defined commands are invoked via `window.__TAURI__.core.invoke('save_state', …)`; unlike core/plugin commands they need no capability entry (if a Tauri version change ever demands one, add the generated allow permission to §7's capability file).
- JS wraps the whole invoke in a **retry helper: 3 attempts, 150 ms apart** — sync clients (OneDrive) and AV scanners briefly lock files on Windows, and the lock can hit the temp create as easily as the rename, so the retry covers the entire persist, not just the rename.
- Windows `MOVEFILE_WRITE_THROUGH`/directory-handle flushing is deliberately not chased in v1; `sync_all()` on the file before the rename covers the data-blocks hazard, and the daily backups + recovery walk remain the backstop for the residual metadata-ordering window.

### The write queue (file backend only)

```js
function makeQueue(persist /* async (json) => void */, debounceMs, maxDirtyMs, errCb) {
  let timer = null, pending = null, draining = null, dirtySince = 0;
  function drain() {
    if (!draining) draining = (async () => {
      while (pending) {                        // coalesce: always write the newest
        const serialize = pending; pending = null;
        try { await persist(serialize()); dirtySince = 0; }
        catch (e) {
          if (!pending) pending = serialize;   // KEEP dirty: a failed write must
          errCb(e);                            // stay pending so flush/close retries
          break;                               // stop the loop; next write/flush retries
        }
      }
      draining = null;
    })();
    return draining;
  }
  return {
    write(serialize) {
      if (!pending) dirtySince = Date.now();
      pending = serialize;
      clearTimeout(timer);
      const overdue = dirtySince && Date.now() - dirtySince > maxDirtyMs;
      timer = setTimeout(drain, overdue ? 0 : debounceMs);
    },
    async flush() {
      clearTimeout(timer); timer = null;
      await drain();
      if (pending) await drain();              // one bounded retry of a failed persist
      if (pending) throw new Error('flush failed');   // caller decides (close handler)
    },
    get dirty() { return !!pending || !!draining; },
  };
}
```

The critical change from the draft: **a failed `persist` restores the serializer as `pending`** (unless a newer one already arrived), so `dirty` stays true and the close-time flush retries instead of silently discarding the teacher's last edit after one transient OneDrive lock.

### Debounce: 1000 ms, plus a 10 s max-dirty flush

- **Why not 250 ms like localStorage:** every `save()` rewrites the entire state file, which with data-URL images can be multiple MB. Ink strokes and drags call `save()` on every stroke-end/drag-end; 250 ms would hammer the disk (and OneDrive upload) during active drawing.
- **Why not longer:** the debounce window is exactly the data-loss window for a hard crash. 1 s bounds loss to "the last gesture".
- **Max-dirty guard:** continuous activity resets a debounce forever; the `maxDirtyMs` (10 s) path above force-flushes so a full lesson of nonstop annotating still hits disk every 10 s. This guard is also the loss bound for any quit path that slips past the handshakes below, so it stays in v1.

### Flush on every quit path

`onCloseRequested` alone is **not** enough: macOS Cmd+Q / Dock-Quit triggers app termination without dispatching per-window close-requested events (documented Tauri limitation — discussions #8341, feature request #12978), and Windows shutdown/logoff (`WM_ENDSESSION`) likewise bypasses it. Three layers:

**1. Per-window close (red button / Alt-F4):**

```js
const win = window.__TAURI__.window.getCurrentWindow();
win.onCloseRequested(async (e) => {
  if (!queue.dirty) return;                 // nothing pending: close proceeds
  e.preventDefault();
  try { await queue.flush(); }              // flush() already retries once
  catch (_) {
    const giveUp = await confirmExportDialog();   // small modal: [Export backup…]
    if (!giveUp) return;                          // [Close anyway] / keep window open
  }
  await win.destroy();
});
```

A rejecting flush must never leave the window undestroyable *or* silently destroy it while dirty: on persistent failure the window stays open with a modal offering the export path (dialog-save, below) and an explicit "Close anyway". Needs `core:window:allow-destroy` (§7).

**2. App quit (Cmd+Q, Dock-Quit, Windows exit):** Rust-side handshake in `lib.rs` (§7): a `flush_all_and_exit(app)` helper emits `sage:flush-request` to all webviews, each window's backend listener runs `queue.flush()` and emits `sage:flush-done`, and Rust exits when all windows have answered or after a 2 s timeout. It is wired in two places:

- A **custom macOS Quit menu item** replacing the default (keeps the Cmd+Q accelerator) whose handler calls `flush_all_and_exit` — this is the primary macOS mechanism, because `RunEvent::ExitRequested` is reported unreliable on macOS (issue #9198).
- A `RunEvent::ExitRequested` handler that calls `api.prevent_exit()` and runs the same helper (guarded by an "already flushed" flag so the post-flush `app.exit(0)` passes through) — covers Windows and any macOS path that does fire it.

**3. Backstop:** the 1 s debounce / 10 s max-dirty bound means even a path that defeats both handshakes (power pull, `kill -9`) loses at most the last gesture or 10 s of continuous drawing, and §10#1's durability guarantees the file on disk is whole.

Phase 3's checklist explicitly tests "Cmd+Q immediately after an edit" and "OS restart with the app open".

### Daily rotating backups

- **Trigger:** before the *first overwrite of the calendar day*, if `sage-stage.json` exists, copy it to `backups/YYYY-MM-DD.json` (skip if that name already exists). This snapshots yesterday's final state — a file that was validated at boot and untouched this session.
- **Never blocks saving:** `maybeDailyBackup()` is wrapped in its own try/catch; on failure it toasts at most once, memoizes the failure for the day (no retry storm), and **always proceeds to the main write**. A broken backup must never prevent persisting state.
- **Date:** local time from the machine clock — `new Date()` formatted `YYYY-MM-DD` via `getFullYear/getMonth/getDate` (not `toISOString()`, which is UTC and would label an 8 a.m. lesson in Sydney with yesterday's date).
- **Rotation:** after writing a new backup, `readDir('Sage Stage/backups')`, keep names matching `/^\d{4}-\d{2}-\d{2}\.json$/`, **ignore names dated in the future** (clock-skew artifacts must not occupy rotation slots), sort descending, `remove()` everything past the newest **14**. `pre-import-*.json` files are pruned separately to the newest 3; `conflict-*.json` likewise.
- Memoized per day per process (`backedUpDay`), so it costs one `exists()` per write at most, usually nothing.

### Boot: reading, recovery, and the I/O-vs-corruption distinction

`init()` logic, in order. The central rule: **quarantine only a file whose bytes were read successfully but fail the parse/shape check. Never quarantine, rename, or overwrite a file you could not read.** (An OneDrive "online-only" placeholder on an offline machine *throws* on read; treating that as corruption would quarantine healthy data, boot an empty state, persist it, and poison the cloud copy when sync resumes.)

1. **Read succeeds, plausibility check passes** (`JSON.parse` ok, `.decks` or `.screens` array) → `{ raw, existed: true, notice: null, readOnly: false }`. Record the file's mtime (used by the conflict check below). Normal case.
2. **Read throws (I/O error)** → retry 3× over ~2 s (placeholder hydration may just be slow). Still failing → **read-only degraded session**: `{ raw: null, existed: true, readOnly: true, notice: "⚠️ Couldn't read your data file — it may be waiting for OneDrive or locked. Nothing will be saved this session." }`. With `readOnly` set, `write()` and `maybeDailyBackup()` are no-ops for the whole session (until a later successful re-read on window focus, below, clears it). The app runs in memory; the file on disk is untouched.
3. **Read succeeds but parse/shape fails** → quarantine: `rename` to `sage-stage.corrupt-<Date.now()>.json` (kept forever — never overwrite or delete a teacher's damaged data). Then walk recovery candidates in order: `backups/YYYY-MM-DD.json` newest-first (**skipping future-dated names**, and applying the *same* shape check as the main file — a backup containing `{}` is not a recovery), then any OneDrive conflict copies matching `sage-stage-*.json` in the main directory ordered by mtime. The first candidate that passes is **immediately written to `sage-stage.json` through the atomic path, inside `init()`, before returning** — recovery must not depend on the teacher editing before quitting, or the next boot would find no main file and look like a total wipe. Return it with `existed: true` and `notice: "⚠️ Your data file was damaged — restored the backup from <date>. The damaged file was kept in Documents/Sage Stage."`
4. **Read ok but no candidate passes** → `{ raw: null, existed: true, notice: "⚠️ Your data file was damaged and no backup could be read. The damaged file was kept in Documents/Sage Stage." }`. `existed: true` suppresses starter-widget seeding, so the fresh state is visibly empty rather than pretending to be a first run.
5. **No main file at all → check `backups/` before declaring first run.** If any backup passes the shape check (the main file may have been deleted in Explorer, or dehydrated-then-removed by "free up space"), restore the newest one exactly as in step 3, with `notice: "⚠️ Your data file was missing — restored the backup from <date>."` Only when the folder is genuinely empty of usable state does boot proceed to the migration/first-run path (§6).

`app.js` shows `persisted.notice` as a toast after the first `renderScreen()` (one added line, §2's diff).

### External-modification guard (OneDrive two-machine reality)

Known Folder Move means a teacher signed into the same Microsoft account on a school desktop and a home laptop shares `sage-stage.json` via cloud sync — and an app instance left running overnight holds stale state in memory that its next save would silently clobber. No sync engine; three cheap layers:

- **Before each persist**, `stat` the main file's mtime. If it differs from the last mtime this window read or wrote, first copy the on-disk file to `backups/conflict-<epochms>.json`, then proceed with the write and toast "Another copy of Sage Stage changed this file — the other version was saved to backups/." Newer-elsewhere work is never silently destroyed, without any merge UI.
- **On window focus**, if not dirty, re-read the file; if its content changed, adopt it through the normal external-change path (this also clears a `readOnly` session once the file becomes readable). This covers the left-running-overnight case.
- **Documentation** states plainly: one machine at a time is the supported model; the JSON export is the way to move data.

Conflict-copy filenames (`sage-stage-*.json`) are already in the recovery walk, above.

### Erase-all

The danger-zone button (app.js:4364-4373) changes to:

```js
confirmDialog(
  'Erase ALL screens, widgets and name lists on this device — including all daily backups? This cannot be undone.',
  () => {
    SageStorage.erase().then(() => {
      state = normalize(defaultState());
      renderScreen(); finish();
      toast('Everything cleared');
    });
  }, { label: 'Erase' });
```

(The local backend gets the same new dialog copy minus the backups clause? No — the string is built from `SageStorage.kind`: local keeps today's exact text, file adds the backups sentence.)

File backend `erase()` sequence:

1. **Quiesce other windows first:** emit `sage:erased`; every other window's backend listener drops its pending write (clears the queue) and invokes the app's `onExternalChange` callback with `null`, which resets that window to `defaultState()` (§2 diff). Without this, a pinned window's debounced write would resurrect the full old state one second after the backups are gone — the teacher would have lost the backups while believing erase "didn't work". Wait ~250 ms for delivery.
2. `remove('Sage Stage/sage-stage.json')` and `remove('Sage Stage/backups', { recursive: true })`. Quarantined `.corrupt-*` files are deliberately left alone.
3. The next `save()` recreates the file; post-erase the app behaves like a fresh install except starter widgets aren't re-seeded (same as today).

The quiesce is best-effort (the explicit dialog is the primary guardrail); a pathologically-timed straggler write can only recreate the main file, which is visible, not silent backup loss.

### Import safety snapshot

The import flow (app.js:4339-4359) is the single most likely catastrophic-loss path on desktop: a wrong `.json` picked in good faith replaces everything, and the daily backup only holds *yesterday's* state. One contained change inside the existing import confirm handler, guarded by `kind === 'file'`: **before** `state = next; save()`, copy the current `sage-stage.json` to `backups/pre-import-<epochms>.json` (best-effort, non-blocking on failure), and the success toast becomes "Backup restored — your previous data was saved to backups/." Browser behaviour unchanged.

### Export under Tauri (macOS blob-anchor fix)

The draft's claim that blob-anchor downloads work in WKWebView is **wrong** — WKWebView does not honour `download` on `blob:` anchors (WebKit bug 216918; Tauri #6171, wry #349). Clicking Export on the macOS build would silently do nothing, and export is the design's only browser↔desktop bridge. So this is in scope now, not a follow-up: the modal's export button branches on `kind` — browser keeps the existing blob-anchor code verbatim; file backend calls `SageStorage.saveExport(name, json)`, which uses `tauri-plugin-dialog`'s `save()` for the path and plugin-fs `writeTextFile` to write it (dialog-selected paths are runtime-permitted without widening the static fs scope; the `fs:allow-write-text-file` command permission in §7 covers the command itself). WebView2 handles downloads natively, but the dialog path is used on both platforms for consistency. Import (`<input type=file>` + FileReader) works in both webviews and stays unchanged.

### `fileInfo()` and the "Your data" modal

```js
async fileInfo() {
  const s = await stat(MAIN, { baseDir: D }).catch(() => null);
  const path = await join(await documentDir(), 'Sage Stage', 'sage-stage.json');
  return { sizeKB: s ? Math.round(s.size / 1024) : 0, path };
},
revealDataFile() { window.__TAURI__.opener.revealItemInDir(this._path); },
```

Modal changes, all inside the `#dataBtn` handler (app.js:4313-4376), branching on `SageStorage.kind`:

- `local`: byte-for-byte today's modal (intro copy, synchronous KB hint, blob-anchor export, import, erase text).
- `file`: intro becomes *"Everything you see lives in a file on this computer — no account, no server, no tracking."*; hint shows `Your data: Documents/Sage Stage/sage-stage.json (~N KB) · daily backups kept for 14 days` (filled from `fileInfo()`) plus a **Show in Finder/Explorer** button; export via `saveExport`; import gains the pre-import snapshot; erase text mentions backups.

---

## 5. Multi-window sync under Tauri

The `storage` event does not exist for file writes, and `target="_blank"` is unreliable in Tauri webviews. Replacements — **all Tauri-only; browser call sites keep their current anchors and `window.open`, so middle-click and copy-link keep working in the browser**:

### State sync: emit-after-persist, re-read, last-write-wins

- After every successful `save_state` invoke, the writer emits `sage:written` with payload `{ from: myWindowLabel }` (`@tauri-apps/api/event` — global emit reaches all windows). **The explicit `from` field is required, not decorative: Tauri v2 event payloads no longer carry the v1 `windowLabel` field, so without it there is no echo suppression. Do not "simplify" it away.**
- The file backend's `onExternalChange` wires `listen('sage:written', …)`: ignore own-label events, otherwise `readTextFile` the main file and pass the raw string to the app callback (and update the stored mtime for the conflict guard). It also wires the `sage:erased` listener (§4) to drop pending writes and call the callback with `null`, and the `sage:flush-request` listener (flush + `sage:flush-done` ack) for the quit handshake.
- The event carries **no state payload** — receivers re-read the file. This avoids pushing multi-MB JSON through IPC and, because writes are atomic renames, the read always sees a complete file.
- Semantics are **identical to today's two-tab behaviour**: whole-state replace via `normalize()`, re-render, last-write-wins at whole-state granularity. Per-window temp files (§4) guarantee "last-write-wins" can never degrade into "torn file". A window with a dirty pending write that adopts an external change ends up writing the adopted state (the thunk closes over the replaced `state`) — a harmless convergent no-op.

### `#s=` open-in-new-tab links

The two anchor sites (app.js:3323-3324 dashboard menu, 3424-3425 deck bar) **keep building the same `target="_blank"` anchors**. Under Tauri only, the anchor additionally gets an onclick that calls `e.preventDefault(); SagePlatform.openScreenWindow(s.id)` (guarded by `if (window.SagePlatform)` — undefined in the browser, so Phase 1 doesn't touch these lines at all; the guard lands in Phase 4).

```js
// storage.js, Tauri branch only
window.SagePlatform = {
  async openScreenWindow(id) {
    const { WebviewWindow } = window.__TAURI__.webviewWindow;
    // v2: getByLabel is ASYNC (returns Promise<WebviewWindow|null>) — awaiting it
    // is mandatory; the sync-looking v1 form would always take the truthy branch
    // and throw. Callers may stay fire-and-forget.
    const existing = await WebviewWindow.getByLabel('screen-' + id);
    if (existing) { await existing.setFocus(); return; }
    const win = new WebviewWindow('screen-' + id, {
      url: 'index.html#s=' + id,          // hash set at creation, before app.js runs
      title: 'Sage Stage — screen',
      width: 1280, height: 800,
    });
    win.once('tauri://error', (e) => console.error('window create failed', e));
  },
  openExternal(url) { window.__TAURI__.opener.openUrl(url); },
};
```

Labels are `screen-<id>` (screen ids are `[a-z0-9]`, within Tauri's allowed label charset). Requires `core:webview:allow-create-webview-window`, `core:window:allow-set-focus` (**not** in `core:window:default`, which is getters-only — same reason `allow-destroy` must be listed), and `"windows": ["*"]` in the capability. The new window runs the full boot: file backend `init()`, `viewId` parsed from the hash (app.js:214), pinned rendering — all unchanged.

The link widget's external URLs (app.js:1627) become `window.SagePlatform ? SagePlatform.openExternal(w.props.url) : window.open(w.props.url, '_blank', 'noopener')` — system browser under Tauri, identical behaviour in the browser.

---

## 6. Migration & onboarding

Reached only when §4's boot sequence found neither a main file **nor any usable backup** (step 5). Inside file-backend `init()`:

1. **Adopt webview localStorage if present** (~3 lines, kept for interim/dev builds that ran the localStorage backend inside Tauri). If `localStorage.getItem(LS_KEY)` inside the Tauri webview is present and passes the shape check: write it to the file through the atomic path, return `{ raw, existed: true, notice: 'Moved your existing data into Documents/Sage Stage.' }`. The localStorage copy is left in place untouched.
2. **Otherwise fresh state:** `{ raw: null, existed: false, notice: "Welcome! If you've used Sage Stage in a browser, bring your data over: in the browser open Your data → Export, then import the file here." }`. `existed: false` triggers starter-widget seeding (app.js:5079-5086); the "Your data" modal's import button is the actual transfer mechanism, using the existing JSON format.

Nothing is ever deleted or overwritten during migration; the only destructive-looking operations anywhere in this design are quarantine-by-rename (§4) and the explicitly-confirmed erase.

**Browser ↔ desktop ongoing:** both builds read/write the same export format and the same `normalize()`. The README/download page states: browser data and desktop data are separate stores; the JSON export is the bridge; one desktop machine at a time is supported.

---

## 7. Tauri scaffold

### Layout

```
Sage_On_The_Stage/
  index.html  app.js  storage.js  style.css  icons.js  icons-scarlab.js
  templates.js  qr.js  community/
  src-tauri/
    Cargo.toml
    tauri.conf.json
    capabilities/default.json
    icons/               # generated by `npx tauri icon icon-source.png`
    src/main.rs          # generated stub: calls sage_stage_lib::run()
    src/lib.rs
```

`src/lib.rs` — the entire Rust surface for v1 (~60 lines): the `save_state` command (§4), the quit handshake, and the macOS Quit menu item:

```rust
use std::sync::atomic::{AtomicBool, Ordering};
static FLUSHED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn save_state(/* §4 */) -> Result<(), String> { /* write tmp → sync_all → rename */ }

fn flush_all_and_exit(app: &tauri::AppHandle) {
    // emit "sage:flush-request"; each window flushes and emits "sage:flush-done";
    // exit when all current windows have answered or after a 2 s timeout.
    // Sets FLUSHED so the subsequent exit passes ExitRequested through.
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_state])
        // macOS: menu with a CUSTOM Quit item (Cmd+Q accelerator) whose handler
        // calls flush_all_and_exit — the primary macOS quit path, since
        // ExitRequested is unreliable there (tauri#9198).
        .build(tauri::generate_context!())
        .expect("error while building Sage Stage");
    app.run(|app, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = &event {
            if !FLUSHED.load(Ordering::SeqCst) {
                api.prevent_exit();
                flush_all_and_exit(app);       // Windows & non-menu quit paths
            }
        }
    });
}
```

### `tauri.conf.json` (sketch)

```json
{
  "productName": "Sage Stage",
  "identifier": "org.sagestage.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:8642",
    "beforeDevCommand": { "script": "python3 -m http.server 8642 -d .", "cwd": ".." },
    "beforeBuildCommand": { "script": "sh copy-dist.sh", "cwd": ".." }
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [{ "title": "Sage Stage", "width": 1280, "height": 800 }],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ipc: http://ipc.localhost https:; media-src 'self' blob:"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "app", "dmg"],
    "windows": { "webviewInstallMode": { "type": "downloadBootstrapper" } }
  }
}
```

Notes:

- **`frontendDist: "../dist"` with a copy step is the primary plan, not a fallback.** The config reference states a directory `frontendDist` is read recursively and embedded whole; there is no documented exclusion of `src-tauri`, so `frontendDist: ".."` would embed `src-tauri/target` (multi-GB after one build) and `.git`, and would also thrash tauri-build's rebuild detection (target/ changes every build). `copy-dist.sh` copies exactly `index.html app.js storage.js style.css icons.js icons-scarlab.js templates.js qr.js` + `community/` into `dist/` (gitignored). Dev uses `devUrl`, so no copy is needed during development.
- **`beforeDevCommand` uses the object form with an explicit `cwd`** — the CLI's default working directory for these commands is unspecified, so a bare `-d ..` could serve the wrong folder. Port 8642 matches `.claude/launch.json`; if that server is already running, skip `beforeDevCommand` for the session.
- **CSP** is derived from actual usage: Google Fonts (`index.html:7-9`), Unsplash photo backgrounds and arbitrary-https user template sources (`img-src https:`, `connect-src https:`), inline `style=` attributes throughout `el()` calls (`'unsafe-inline'` in style-src), and Tauri's IPC endpoints. No inline scripts exist, so `script-src 'self'` is safe. **Known trap to verify in Phase 2:** Tauri appends its own nonces/hashes to CSP directives at compile time, and per the CSP spec the presence of any nonce/hash makes browsers *ignore* `'unsafe-inline'` in that directive — which would block every inline `style=` in the app and collapse the UI. If Phase 2 shows style-src violations, set `app.security.dangerousDisableAssetCspModification: ["style-src"]` (documented config: a string[] of directives Tauri must leave untouched) while keeping script-src under Tauri's management.
- **`withGlobalTauri: true`** injects `window.__TAURI__` for plain-script access — required, no bundler. Runtime detection in `storage.js` uses `'isTauri' in window && window.isTauri`.
- **Identifier is permanent:** changing it later resets all webview storage and the app-data dir — pick once (open question §11).
- **`frontendDist` community check:** Phase 2 verifies the relative `fetch('community/index.json')` (app.js:3966; default source in normalize) resolves under the app protocol.

### `capabilities/default.json`

```json
{
  "identifier": "default",
  "windows": ["*"],
  "permissions": [
    "core:default",
    "core:window:allow-destroy",
    "core:window:allow-set-focus",
    "core:webview:allow-create-webview-window",
    "opener:default",
    "dialog:default",
    { "identifier": "fs:scope", "allow": [
        { "path": "$DOCUMENT/Sage Stage" },
        { "path": "$DOCUMENT/Sage Stage/**" }
      ] },
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-rename",
    "fs:allow-exists",
    "fs:allow-mkdir",
    "fs:allow-read-dir",
    "fs:allow-remove",
    "fs:allow-stat",
    "fs:allow-copy-file"
  ]
}
```

Scoped to the single `Documents/Sage Stage` subtree (bare dir + glob so the folder itself matches) — deliberately *not* the whole-Documents recursive presets. `core:window:allow-destroy` and `core:window:allow-set-focus` are listed explicitly because `core:window:default` contains only getters. `dialog:default` covers the export save dialog. `"windows": ["*"]` covers the dynamically created `screen-<id>` windows. The `save_state` app command needs no entry (§4). `fs:allow-write-text-file` remains for the dialog-picked export path (the dialog grants the path scope at runtime; the command permission is still required). `fs:allow-rename` remains for quarantine renames.

**Plugins now:** `tauri-plugin-fs`, `tauri-plugin-opener`, `tauri-plugin-dialog`. **Later:** `tauri-plugin-updater` (needs a signing keypair and a release-manifest endpoint — GitHub Releases works; deferred, §11).

---

## 8. Future-proofing

**assets/ folder for file-referenced images (PDF/PPT import).** Convention reserved now: an image reference in state is either a `data:` URL (today, always valid in every backend) or a relative name of the form `assets/<uid>.<ext>` under the data directory. All rendering of `w.props.src`, `screen.background.value`, and `state.dashBg.value` will route through one resolver — `resolveImageSrc(src)` — which passes `data:`/`https:` strings through untouched and, for `assets/` names, returns a displayable URL (Tauri: `convertFileSrc()` of the absolute path; localStorage backend never produces such refs). The natural write-side seam already exists: `pickImage()` (app.js:2738-2762) is the single ingestion funnel, and its callback boundary is where "return data URL" becomes "write file into `Documents/Sage Stage/assets/`, return the reference" for large images in the file backend. Two invariants the eventual implementation must honour: **export must inline** `assets/` refs back into data-URLs so the JSON backup stays self-contained and browser-compatible, and `normalize()` must tolerate refs pointing at missing files (render a placeholder, don't crash). Nothing in the current design writes into `assets/`, but `erase()` and backup rotation already deliberately skip it, and the folder layout leaves it room.

**File-System-Access PWA backend (Chromebooks).** A third implementation of the same `SageStorage` interface, selected when the user opts in on a Chromium browser (`'showDirectoryPicker' in window`): `init()` retrieves a `FileSystemDirectoryHandle` persisted in IndexedDB (re-prompting via `requestPermission()` when needed); `persist()` writes through a `FileSystemWritableFileStream` (already atomic — commits on `close()`); `onExternalChange` uses `BroadcastChannel`. Chromium-desktop-only (Firefox rejects the API, Safari has only OPFS), which is exactly the Chromebook audience. Not designed further here; the interface in §2 requires no changes to accommodate it.

---

## 9. Phased implementation plan

### Phase 1 — Storage interface extraction (thin seam, browser only)

Steps: create `storage.js` containing the localStorage backend (today's write code moved verbatim, §3) and backend selection; add `<script src="storage.js?v=1">` to `index.html` and bump `app.js?v=`; apply the `app.js` diffs from §2 (async IIFE + `.catch`, `persisted`-based `load()`, one-line `save()`, `onExternalChange`, `onWriteError`, `existed`, `erase()`, kind-branch scaffolding in the data modal whose local path is identical to today). **No `makeQueue`, no `SagePlatform`, no anchor changes** — those are Phase 3/4.

Verification (dev server `http://localhost:8642`, browser preview) — near-zero behaviour change (honest deltas: boot errors surface via the `.catch`; nothing else):
- [ ] Fresh profile/incognito: starter clock widget appears top-right; dashboard opens.
- [ ] Reload with existing data: state restores; no starter widget; no console errors.
- [ ] Edit a widget, reload within/after 250 ms — persistence timing unchanged.
- [ ] Two tabs open: edits in one live-update the other (storage event path).
- [ ] "Open in new tab" on a screen: new tab pins via `#s=`; anchors still middle-clickable.
- [ ] Data modal: KB figure and 5,000 KB copy identical; export downloads; import replaces after confirm; erase-all clears and resets.
- [ ] Quota toast: fill localStorage to near-quota in devtools, mutate, see the exact existing toast.

### Phase 2 — Tauri scaffold (no file backend yet)

Steps: `npx tauri init`; `tauri.conf.json`, capability file, `lib.rs` skeleton (plugins only; `save_state`/quit handshake land in Phase 3), `copy-dist.sh`, icons; run `npx tauri dev`. The app runs on the **localStorage backend inside Tauri** temporarily (force `kind:'local'`).

Verification (`tauri dev` on macOS; Windows VM if available):
- [ ] App boots, renders, all widgets work; **no CSP violations — specifically watch for style-src violations from Tauri's nonce injection neutralizing `'unsafe-inline'`** (§7); if hit, apply `dangerousDisableAssetCspModification: ["style-src"]` and re-verify.
- [ ] Community templates tab loads (relative `community/` fetch under the app protocol).
- [ ] Google Fonts render; Unsplash photo backgrounds load; remote template source over https fetches.
- [ ] `tauri build` produces a launching `.app`/`.exe`; binary size sane (dist/ contains only the eight web files + community/).

### Phase 3 — File backend

Steps: implement per §4 — `makeQueue` (failure-keeps-dirty semantics), Rust `save_state` with per-window temp names + `sync_all`, 3×150 ms whole-persist retry, 1 s debounce + 10 s max-dirty, `onCloseRequested` flush with export-or-close-anyway fallback, Rust quit handshake + macOS Quit menu item, daily backups (non-blocking, future-date-aware rotation), boot sequence with I/O-vs-corruption distinction + persist-on-recovery + backups-before-first-run + read-only degraded mode, external-modification guard (mtime check, focus re-read, conflict snapshots), migration/first-run per §6, `erase()` with explicit dialog + `sage:erased` quiesce, pre-import snapshot, `fileInfo()`/reveal/dialog-save export, modal file branch.

Verification (`tauri dev`):
- [ ] First run: `Documents/Sage Stage/sage-stage.json` created; starter widget; onboarding toast.
- [ ] Edit → within ~1 s file mtime updates; close window immediately after an edit → edit present on relaunch (close-flush).
- [ ] **Cmd+Q immediately after an edit → edit present on relaunch (menu-quit handshake).**
- [ ] **OS restart/logoff with the app open and a dirty edit → at most the last gesture lost, file whole.**
- [ ] Continuous drawing for 30 s → file updates at least every 10 s (max-dirty flush).
- [ ] Next-day simulation: first edit creates `backups/<date>.json`; 15 fake backups prune to 14; a future-dated backup is ignored by rotation and skipped by recovery.
- [ ] Corrupt the file (truncate mid-JSON) → relaunch: quarantined `.corrupt-*` exists, newest backup restored, **`sage-stage.json` re-exists immediately without any edit**, toast shown. Quit without editing, relaunch → restored state still there (not a fake first run). With no backups: empty state + toast, no starter seeding.
- [ ] Delete `sage-stage.json` (backups present) → relaunch restores newest backup with "was missing" toast.
- [ ] Make the file unreadable (chmod 000 / locked) → relaunch: read-only session warning, **no quarantine, no writes, file untouched on disk**.
- [ ] Erase-all: dialog mentions backups; file and backups gone; next edit recreates the file.
- [ ] Import a wrong file → `backups/pre-import-*.json` contains the prior state; import round-trips browser↔desktop.
- [ ] **Export works on macOS** (dialog-save path), and the exported file imports into the browser build.
- [ ] "Show in Finder/Explorer" reveals the file; modal shows path + size, no 5,000 KB copy.
- [ ] Plain browser via dev server still passes the Phase 1 checklist (no regression).

### Phase 4 — Multi-window

Steps: `SagePlatform` (Tauri-only, §5) with the **async `getByLabel`** open/focus logic; anchor click-intercept guards at app.js:3323/3424 and the 1627 ternary; `sage:written` emit/listen re-read; `sage:erased` cross-window handling exercised for real.

Verification (`tauri dev`):
- [ ] "Open in new tab" spawns a second window pinned to that screen; re-invoking focuses the existing window (verifies `allow-set-focus` and the awaited `getByLabel`).
- [ ] Edits in the main window appear in the pinned window within ~1 s; deck switches don't move it.
- [ ] Deleting the pinned screen: window falls back exactly as a browser tab does today.
- [ ] Rapid alternating edits in both windows for 60 s, then hard-close both → file always parses (per-window temp names), last writer wins.
- [ ] Erase in main window → pinned window resets and does **not** resurrect the state; backups stay gone.
- [ ] Cmd+Q with both windows dirty → both flush (handshake waits for all windows).
- [ ] Link widget opens the system browser; browser build's anchors unchanged.

### Phase 5 — Packaging & distribution

Steps: final icons and product metadata; `tauri build` for `.dmg` (macOS) and `.msi` + NSIS `.exe` (Windows); install instructions including unsigned-app workarounds if signing is deferred; decide signing per §11.

Verification:
- [ ] Clean-machine installs (macOS VM, Windows VM): install → first run → migration hint → create data → uninstall leaves `Documents/Sage Stage` intact.
- [ ] Windows without WebView2 preinstalled (older Win10 image): bootstrapper path works.
- [ ] Full Phase 3/4 checklists pass on installed builds, not just `tauri dev`.

---

## 10. Failure-mode test plan

| # | Scenario | How to test | Expected behaviour |
|---|----------|-------------|-------------------|
| 1 | **Power loss / hard kill mid-write** | Fault hook in the retry wrapper throwing between invoke stages; `kill -9` in a loop while a script mutates state; VM power-pull if available. | Disk holds either the complete old or complete new `sage-stage.json` — `sync_all()` before the rename (§4, shipped in v1) closes the zero-length/torn-file window that plain `writeTextFile`+`rename` left open. Stray `.tmp-*` files are cleaned at next init. Worst case loses ≤ the debounce/max-dirty window. Recovery (§4) is the backstop. |
| 2 | **Disk full / transient write failure** | macOS: small `hdiutil` image as the target dir; Windows: small VHD. Fill, edit, then free space and close the window. | Temp-file write fails before the rename; existing file untouched. Toast: "⚠️ Could not save to disk — check free space in Documents/Sage Stage." **The failed serializer stays `pending` (dirty stays true)**, so the close-flush retries after space frees; if it still fails at close, the window stays open with an Export / Close-anyway modal — never a silent dirty destroy. |
| 3 | **OneDrive-redirected / locked / offline Documents (school Windows machines)** | Windows VM with Known Folder Move; test synced, paused, and "online-only" (Files-On-Demand) states — including **offline with dehydrated placeholders**; run an editing loop while OneDrive syncs; also test the two-machine same-account setup. | `$DOCUMENT` follows the redirect (data lands in the synced folder — survives re-imaging). Transient locks: absorbed by the 3×150 ms whole-persist retry; persistent failure → toast, dirty preserved. **Offline placeholder: read *throws* → read-only degraded session, no quarantine, no writes, cloud copy never poisoned** (§4 step 2). Two machines: mtime guard snapshots the on-disk version to `backups/conflict-*.json` before overwriting; focus re-read adopts overnight sync; conflict-copy filenames are recovery candidates. Blocked-Documents policy: `init()` mkdir failure → clear startup toast, in-memory session. |
| 4 | **Two windows editing simultaneously** | Phase 4 build: rapid alternating mutations in both for 60 s; hard-close both. | Never a torn/corrupt file: each window serializes its own writes **and writes through its own `sage-stage.json.tmp-<label>`**, so cross-window interleaving can only produce whole-file last-write-wins (accepted, identical to today's two-tab semantics). Both windows converge after each `sage:written`. |
| 5 | **Corrupt / missing JSON at boot** | Truncate at 50%; garbage bytes; `{}` (parses, fails shape check); empty file; delete the file entirely. Repeat with 0, 1, several backups; corrupt newest backup; future-dated backup; `{}`-content backup. | Read-ok-parse-fail → quarantine + walk candidates (shape-checked, future-dated skipped, conflict copies included) → **restored state persisted inside `init()` before the app even renders**, dated toast. Missing file with backups → restore + "was missing" toast, never a fake first run. No usable candidate → empty state, `existed:true` (no starter seeding), toast. Nothing is ever deleted. |
| 6 | **Abrupt quit (Cmd+Q, Dock-Quit, logoff)** | Cmd+Q within 1 s of an edit; Dock-Quit mid-drawing; Windows logoff with dirty state. | macOS: custom Quit menu item runs the flush handshake (primary path — `ExitRequested` is unreliable on macOS, tauri#9198); Windows/other: `ExitRequested` + `prevent_exit` handshake; 2 s timeout means quit is never hung. Any path that defeats both loses ≤ 1 s (≤ 10 s during continuous drawing). |
| 7 | **Very large state (many images)** | Script-generate ~40 MB of data-URL images (bypassing `pickImage` downscaling); drive save-heavy actions. | Writes succeed (no 5 MB quota); `JSON.stringify` of ~40 MB costs ~100–300 ms on the main thread once per debounced flush (≤1/s) — measure for dropped frames; if noticeable, that is pressure to prioritize §8's assets/ work, not to redesign this layer. Quit handshake completes within its 2 s budget at this size (verify). `pickImage` downscaling (app.js:2745) stays as-is for v1 — cross-backend export compatibility benefits from small images anyway. |
| 8 | **Wrong-file import** | Import last month's backup over a day of new work. | `backups/pre-import-<ts>.json` holds the pre-import state; toast points at it. Recoverable by importing that snapshot back (it's a normal state JSON). |

---

## 11. Open questions for the user

1. **Code signing budget.** macOS unsigned `.dmg`s hit Gatekeeper's "damaged/can't be opened" block — right-click-Open instructions work but scare teachers; proper fix is the Apple Developer Program ($99/yr) + notarization. Windows unsigned installers show SmartScreen warnings (click-through-able); OV certs ~$100–400/yr still warn until reputation builds, EV (~$300–700/yr) clears immediately. Sign both, sign macOS only, or ship unsigned with instructions for v1?
2. **Permanent app identity.** Product name "Sage Stage" and a bundle identifier (proposal: `org.sagestage.app`) must be chosen once — changing the identifier later orphans app data and resets webview storage. Confirm both, and whether a domain exists to anchor the reverse-DNS id.
3. **Offline-school Windows installer.** The default WebView2 `downloadBootstrapper` needs internet during install (WebView2 is preinstalled on all recent Windows 10/11, so it's usually a no-op). Do target schools have locked-down/offline machines that justify the `offlineInstaller` variant (+~127 MB)?
4. **Backup retention and erase scope.** Proposal: keep 14 daily backups (+3 pre-import snapshots), and "Erase all local data" deletes backups too, with the dialog saying so explicitly. Confirm, or prefer erase to spare backups?
5. **Auto-update.** Proposal: defer `plugin-updater` past v1 and distribute via a download page/GitHub Releases, since the updater requires standing infrastructure (signing keypair + manifest endpoint). Acceptable, and is GitHub Releases the intended channel when we do wire it?

---

## Review notes — suggestions deliberately rejected

- **"Implement Phase 3 without the 10 s max-dirty guard and the persist retry; add them only when §10 tests fail"** (simplicity, low): rejected — both are load-bearing in the accepted data-loss fixes: the max-dirty guard is the loss bound for quit paths that defeat the handshakes, and the retry is the primary absorber of OneDrive/AV lock transients on the exact machines this app targets.
- **"Move file + backups to the OS trash / keep a final snapshot on erase-all"** (data-loss, part of a medium): rejected — erase is also a privacy control on shared classroom machines; leaving a full renamed copy defeats "erase ALL … on this device". The mandatory parts of that finding (explicit backups-included dialog text, cross-window quiesce) are applied instead.
- **"Verify the temp file parses before renaming"** (data-loss, optional rider on the temp-name fix): rejected — it means reading back a potentially multi-MB file up to once per second; the hazards it guards against are closed more directly by per-window temp names and `sync_all` (a short write now throws before the rename).
- **"Surface a choice dialog when the on-disk file changed externally"** (data-loss OneDrive fix, one of two options offered): the snapshot-then-overwrite variant was chosen instead — a conflict-resolution dialog is a merge UI in disguise, and the snapshot makes the same guarantee (nothing newer is silently destroyed) with zero new UX.
- **"Replace onExternalChange/onWriteError methods with settable properties or init() parameters"** (simplicity, low): rejected — pure churn; the methods cost nothing, and the local backend needs a wrapper around the `storage` event either way.
- **"Drop migration step 1 (adopt Tauri-webview localStorage)"** (simplicity, low): rejected under the review's own escape clause — it is kept strictly at ~3 lines and prevents silent data loss for any interim build that ran the localStorage backend inside Tauri (Phase 2 does exactly that).
- **"Drop beforeDevCommand entirely"** (tauri-correctness, alternative fix): the object-form-with-`cwd` variant was applied instead, so `npx tauri dev` stays standalone while the launch.json server remains usable.
- **Windows `MOVEFILE_WRITE_THROUGH` / directory-handle flush** (tauri-correctness, rider on the fsync item): rejected for v1 — `sync_all()` before the rename closes the data-blocks hazard that causes day-scale loss; the residual metadata-ordering window is covered by daily backups + recovery, and the Win32-specific rename path isn't worth the Rust surface yet.