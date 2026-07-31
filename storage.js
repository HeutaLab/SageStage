/* Sage Stage — the storage seam.
   Design: docs/storage-abstraction-plan.md §2, §3. Phase 1: the localStorage
   backend only.

   One global, window.SageStorage, chosen at LOAD time so app.js never branches on
   which one it got. Loaded immediately before app.js, same synchronous script-tag
   idiom as everything else — no modules, no build step, which is the whole point
   of the plan.

   The seam exists so that state can move off localStorage and into a real file
   under Tauri without app.js learning about files. Everything app.js does with
   persistence goes through this object; nothing else in the app touches
   localStorage for state. (The headroom PROBE in app.js is a localStorage-quota
   measurement rather than a state write, and stays there until the file backend
   lands and it becomes a no-op — §4.)

   PHASE 1 IS A PURE REFACTOR. The parity claim is meant to be trivially true, so
   the write path below is today's code MOVED, not rewritten: same 250ms debounce,
   same synchronous setItem on the same tick, same shedding ladder, same strings.
   The known today-risk — a write lost if the tab closes inside the debounce
   window — is PRESERVED on purpose. Fixing it is not a refactor. */
(function () {
  'use strict';

  // Duplicated from app.js deliberately. It is one constant string, and a
  // cross-file config mechanism for a single literal costs more than it saves.
  const LS_KEY = 'sage-stage-v1';

  function localBackend() {
    let saveTimer = null;
    let pending = null;      // the serializer thunk, so rapid mutations coalesce
    let shedFn = null;       // app-supplied: give something up, or return null
    let errCb = null;

    const put = (json) => {
      try { localStorage.setItem(LS_KEY, json); return true; }
      catch (e) { return false; }
    };

    function doWrite() {
      const serialize = pending;
      pending = null;
      if (!serialize) return;
      let json = null;
      // The thunk runs at FLUSH time, not at call time — that is what makes a
      // hundred mutations in one gesture cost one stringify of the final state.
      try { json = serialize(); } catch (e) { json = null; }
      if (json !== null && put(json)) return;
      // Out of room. Ask the app to give up ballast, oldest first, and retry
      // after each concession. app.js owns what may be surrendered because
      // app.js owns the state; this only owns the retry loop.
      for (;;) {
        const next = shedFn ? shedFn() : null;
        if (!next || typeof next.json !== 'string') break;
        if (put(next.json)) {
          if (next.notice && errCb) errCb(next.notice);
          return;
        }
      }
      if (errCb) {
        errCb('⚠️ Could not save — storage is full. Try removing large images or clearing old writing pages.');
      }
    }

    return {
      kind: 'local',

      // Resolves in microtasks — before paint, and before any user event can
      // land — so awaiting it in app.js's boot costs nothing observable.
      async init() {
        let raw = null;
        try { raw = localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
        return { raw, existed: raw !== null, notice: null, readOnly: false };
      },

      // Synchronous signature, exactly as save() has always had.
      //   serialize  () => string
      //   opts.shed  () => { json, notice } | null   (optional)
      write(serialize, opts) {
        pending = serialize;
        if (opts && typeof opts.shed === 'function') shedFn = opts.shed;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(doWrite, 250);
      },

      // Force any pending write NOW. Nothing in the browser build calls this yet;
      // the Tauri close/quit handlers will.
      async flush() {
        if (!pending) return;
        clearTimeout(saveTimer);
        doWrite();
      },

      // THROW AWAY a pending write instead of performing it. Erase needs this and
      // nothing else does: a save queued a moment before the erase would land
      // after it and quietly undo it. app.js used to reach into its own timer to
      // do this; once the timer moved in here that reach became a dangling
      // reference, which broke erase-all silently. Not in the original plan —
      // add it to §2's interface when the file backend lands, where it means
      // "drop the queued payload", not "cancel a write already in flight".
      cancel() {
        clearTimeout(saveTimer);
        saveTimer = null;
        pending = null;
      },

      async erase() {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* already gone */ }
      },

      // The data modal's usage meter. Synchronous and local-only, so the modal
      // keeps computing its KB figure inline with no async fill-in and no
      // microtask delta in how it renders.
      usageChars() {
        try { return (localStorage.getItem(LS_KEY) || '').length; }
        catch (e) { return 0; }
      },

      onExternalChange(fn) {
        window.addEventListener('storage', (e) => {
          if (e.key !== LS_KEY) return;
          // null newValue is another window's ERASE, not a write to skip past.
          // The local backend passes it through as null and app.js decides,
          // which is what it already did inline.
          fn(e.newValue === null ? null : e.newValue);
        });
      },

      onWriteError(fn) { errCb = fn; },
    };
  }

  /* ---------------------------------------------------------------- file backend
     Plan §4. State lives in a real file the teacher can see, back up and email:
     Documents/Sage Stage/sage-stage.json.

     The governing rule for everything below is one sentence: NEVER destroy a file
     you could not read. A OneDrive "online-only" placeholder throws on read, and
     treating that as corruption would quarantine healthy data, boot empty, save
     that emptiness, and poison the cloud copy the moment sync resumed. So a read
     that FAILS gives a read-only session, and only a read that SUCCEEDS and then
     fails the shape check is ever quarantined. */

  const DIR = 'Sage Stage';
  const MAIN = DIR + '/sage-stage.json';
  const BACKUPS = DIR + '/backups';
  const KEEP_DAILY = 14;

  // Coalescing, single-in-flight write queue. The one non-obvious rule: a FAILED
  // persist puts the serializer back as pending, so `dirty` stays true and the
  // close-time flush retries. Dropping it would silently discard a teacher's last
  // edit after one transient OneDrive lock.
  function makeQueue(persist, debounceMs, maxDirtyMs, errCb) {
    let timer = null, pending = null, draining = null, dirtySince = 0;
    function drain() {
      if (!draining) {
        draining = (async () => {
          while (pending) {
            const serialize = pending;
            pending = null;
            try { await persist(serialize()); dirtySince = 0; }
            catch (e) {
              if (!pending) pending = serialize;
              if (errCb) errCb(e);
              break;
            }
          }
          draining = null;
        })();
      }
      return draining;
    }
    return {
      write(serialize) {
        if (!pending) dirtySince = Date.now();
        pending = serialize;
        clearTimeout(timer);
        // Continuous activity would reset a debounce forever, so a run of
        // non-stop annotating still reaches disk every maxDirtyMs.
        const overdue = dirtySince && Date.now() - dirtySince > maxDirtyMs;
        timer = setTimeout(drain, overdue ? 0 : debounceMs);
      },
      async flush() {
        clearTimeout(timer); timer = null;
        await drain();
        if (pending) await drain();          // one bounded retry
        if (pending) throw new Error('flush failed');
      },
      cancel() { clearTimeout(timer); timer = null; pending = null; },
      get dirty() { return !!pending || !!draining; },
    };
  }

  function fileBackend() {
    const T = window.__TAURI__;
    const fs = T.fs;
    const D = { baseDir: fs.BaseDirectory.Document };
    const label = (T.window.getCurrentWindow().label || 'main')
      .toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'main';

    let errCb = null, extCb = null;
    let readOnly = false;          // set when the file could not be READ
    let lastMtime = 0;             // for the external-modification guard
    let backedUpDay = null;        // memoised so backups cost one exists() a day
    let lastSize = 0;              // bytes, for the data panel's synchronous read
    let backupWarned = false;

    const shapeOk = (raw) => {
      try {
        const o = JSON.parse(raw);
        return !!o && (Array.isArray(o.decks) || Array.isArray(o.screens));
      } catch (e) { return false; }
    };
    const today = () => {
      // local time, deliberately: toISOString() is UTC and would label an 8am
      // lesson in Sydney with yesterday's date
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    };
    const mtimeOf = async (path) => {
      try {
        const st = await fs.stat(path, D);
        if (path === MAIN && st && typeof st.size === 'number') lastSize = st.size;
        return st && st.mtime ? +new Date(st.mtime) : 0;
      } catch (e) { return 0; }
    };

    // 3 attempts, 150ms apart, around the WHOLE persist — sync clients and AV
    // scanners lock files briefly on Windows, and the lock can hit the temp
    // create as easily as the rename.
    async function persistOnce(json) {
      let last = null;
      for (let i = 0; i < 3; i++) {
        try { await T.core.invoke('save_state', { json, windowLabel: label }); return; }
        catch (e) { last = e; await new Promise((r) => setTimeout(r, 150)); }
      }
      throw last;
    }

    async function maybeDailyBackup() {
      // Must NEVER block the main write. A broken backup is a worse reason to
      // lose today's work than no backup at all.
      if (readOnly || backedUpDay === today()) return;
      try {
        backedUpDay = today();
        if (!(await fs.exists(MAIN, D))) return;
        await fs.mkdir(BACKUPS, { ...D, recursive: true });
        const name = BACKUPS + '/' + today() + '.json';
        if (await fs.exists(name, D)) return;
        await fs.copyFile(MAIN, name, { fromPathBaseDir: D.baseDir, toPathBaseDir: D.baseDir });
        // rotation: keep the newest KEEP_DAILY, ignoring future-dated names so a
        // skewed clock cannot occupy every slot
        const now = today();
        const entries = await fs.readDir(BACKUPS, D);
        const dailies = entries
          .map((e) => e.name)
          .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(0, 10) <= now)
          .sort().reverse();
        for (const old of dailies.slice(KEEP_DAILY)) {
          try { await fs.remove(BACKUPS + '/' + old, D); } catch (e) { /* leave it */ }
        }
      } catch (e) {
        if (!backupWarned && errCb) {
          backupWarned = true;
          errCb('⚠️ Could not write today’s backup. Your work is still being saved.');
        }
      }
    }

    async function persist(json) {
      await maybeDailyBackup();
      // External-modification guard: if the file changed under us (the same
      // teacher on another machine through OneDrive), keep the other version
      // before overwriting it. No merge UI, but nothing is silently destroyed.
      if (lastMtime) {
        const m = await mtimeOf(MAIN);
        if (m && m !== lastMtime) {
          try {
            await fs.mkdir(BACKUPS, { ...D, recursive: true });
            await fs.copyFile(MAIN, BACKUPS + '/conflict-' + Date.now() + '.json',
              { fromPathBaseDir: D.baseDir, toPathBaseDir: D.baseDir });
            if (errCb) errCb('Another copy of Sage Stage changed this file — the other version was saved to backups/.');
          } catch (e) { /* the write below still matters more */ }
        }
      }
      await persistOnce(json);
      lastSize = json.length;
      lastMtime = await mtimeOf(MAIN);
    }

    const queue = makeQueue(
      (json) => (readOnly ? Promise.resolve() : persist(json)),
      1000,   // the debounce IS the data-loss window for a hard crash
      10000,  // ...and this bounds it during continuous drawing
      (e) => { if (errCb) errCb('⚠️ Could not save to your data file: ' + (e && e.message ? e.message : e)); }
    );

    async function restoreFrom(raw, whenLabel) {
      // Recovery writes back IMMEDIATELY, inside init(), before returning.
      // Otherwise a teacher who opens the app and quits without editing would
      // find no main file next boot — which reads as a total wipe.
      try { await persistOnce(raw); lastMtime = await mtimeOf(MAIN); } catch (e) { /* in memory at least */ }
      return {
        raw, existed: true, readOnly: false,
        notice: '⚠️ Your data file was ' + whenLabel
          + '. The damaged file was kept in Documents/Sage Stage.',
      };
    }

    async function recoveryCandidates() {
      const out = [];
      try {
        const now = today();
        const entries = await fs.readDir(BACKUPS, D);
        const names = entries.map((e) => e.name)
          .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(0, 10) <= now)
          .sort().reverse();
        for (const n of names) out.push({ path: BACKUPS + '/' + n, label: 'restored the backup from ' + n.slice(0, 10) });
      } catch (e) { /* no backups dir */ }
      try {
        // OneDrive conflict copies sit beside the main file
        const entries = await fs.readDir(DIR, D);
        for (const e of entries) {
          if (/^sage-stage-.*\.json$/.test(e.name)) out.push({ path: DIR + '/' + e.name, label: 'restored a conflict copy' });
        }
      } catch (e) { /* nothing */ }
      return out;
    }

    return {
      kind: 'file',

      async init() {
        await fs.mkdir(DIR, { ...D, recursive: true });
        // stale per-window temps from a crash mid-write
        try {
          for (const e of await fs.readDir(DIR, D)) {
            if (/^sage-stage\.json\.tmp-/.test(e.name)) {
              try { await fs.remove(DIR + '/' + e.name, D); } catch (_) { /* leave it */ }
            }
          }
        } catch (e) { /* nothing to clean */ }

        const present = await fs.exists(MAIN, D);

        if (present) {
          let raw = null, readFailed = false;
          for (let i = 0; i < 3; i++) {
            try { raw = await fs.readTextFile(MAIN, D); readFailed = false; break; }
            catch (e) { readFailed = true; await new Promise((r) => setTimeout(r, 700)); }
          }
          if (readFailed) {
            // COULD NOT READ. Touch nothing. Run in memory for this session.
            readOnly = true;
            return {
              raw: null, existed: true, readOnly: true,
              notice: '⚠️ Couldn’t read your data file — it may be waiting for OneDrive or locked. Nothing will be saved this session.',
            };
          }
          if (shapeOk(raw)) {
            lastSize = raw.length;
            lastMtime = await mtimeOf(MAIN);
            return { raw, existed: true, notice: null, readOnly: false };
          }
          // Read fine, but it is not a Sage Stage file. Quarantine, never delete.
          try {
            await fs.rename(MAIN, DIR + '/sage-stage.corrupt-' + Date.now() + '.json',
              { oldPathBaseDir: D.baseDir, newPathBaseDir: D.baseDir });
          } catch (e) { /* pressing on is still better than stopping */ }
          for (const c of await recoveryCandidates()) {
            try {
              const cand = await fs.readTextFile(c.path, D);
              if (shapeOk(cand)) return await restoreFrom(cand, 'damaged — ' + c.label);
            } catch (e) { /* try the next */ }
          }
          return {
            raw: null, existed: true, readOnly: false,
            notice: '⚠️ Your data file was damaged and no backup could be read. The damaged file was kept in Documents/Sage Stage.',
          };
        }

        // No main file. Before declaring a first run, look in backups — the file
        // may have been deleted in Finder, or dehydrated then removed by "free up
        // space". Declaring first-run here would seed starter widgets over a
        // recoverable class.
        for (const c of await recoveryCandidates()) {
          try {
            const cand = await fs.readTextFile(c.path, D);
            if (shapeOk(cand)) return await restoreFrom(cand, 'missing — ' + c.label);
          } catch (e) { /* try the next */ }
        }
        return { raw: null, existed: false, notice: null, readOnly: false };
      },

      write(serialize) { queue.write(serialize); },
      async flush() { await queue.flush(); },
      cancel() { queue.cancel(); },

      async erase() {
        queue.cancel();
        for (const p of [MAIN, BACKUPS]) {
          try { await fs.remove(p, { ...D, recursive: true }); } catch (e) { /* already gone */ }
        }
        lastMtime = 0; backedUpDay = null; lastSize = 0;
      },

      // The data panel asks synchronously and renders in one pass, so it gets the
      // size measured at the last read or write rather than a promise. It is a
      // figure for a human deciding whether to tidy up, not an accounting total,
      // and being one save stale is invisible at that job.
      usageChars() { return lastSize; },

      async fileInfo() {
        let sizeKB = 0, path = '';
        try { const s = await fs.stat(MAIN, D); sizeKB = Math.round((s.size || 0) / 1024); } catch (e) { /* new file */ }
        try { path = await T.core.invoke('state_file_path'); } catch (e) { path = 'Documents/Sage Stage/sage-stage.json'; }
        return { sizeKB, path };
      },
      async revealDataFile() {
        try { await T.opener.revealItemInDir(await T.core.invoke('state_file_path')); }
        catch (e) { if (errCb) errCb('Could not open the folder.'); }
      },
      async saveExport(defaultName, json) {
        // WKWebView does not honour blob-anchor downloads, so export goes through
        // the native save panel rather than a click on an <a download>.
        try {
          const p = await T.dialog.save({ defaultPath: defaultName, filters: [{ name: 'JSON', extensions: ['json'] }] });
          if (!p) return 'cancelled';
          await fs.writeTextFile(p, json);
          return 'saved';
        } catch (e) { if (errCb) errCb('Could not save the export.'); return 'cancelled'; }
      },

      onExternalChange(fn) {
        extCb = fn;
        // Left running overnight while the other machine edited: on focus, if we
        // have nothing pending of our own, adopt whatever is on disk now.
        window.addEventListener('focus', async () => {
          if (queue.dirty) return;
          try {
            const m = await mtimeOf(MAIN);
            if (!m || m === lastMtime) return;
            const raw = await fs.readTextFile(MAIN, D);
            if (!shapeOk(raw)) return;
            lastMtime = m;
            readOnly = false;               // it reads now; the session recovers
            if (extCb) extCb(raw);
          } catch (e) { /* still unreadable; stay as we are */ }
        });
      },

      onWriteError(fn) { errCb = fn; },

      // Wired at the end of init by the selection block below.
      async _wireQuit() {
        const win = T.window.getCurrentWindow();
        await win.onCloseRequested(async (e) => {
          if (!queue.dirty) return;
          e.preventDefault();
          try { await queue.flush(); }
          catch (_) {
            // Never leave the window undestroyable, and never destroy it while
            // dirty without saying so.
            if (errCb) errCb('⚠️ Could not save to your data file. Export a backup before closing.');
            return;
          }
          await win.destroy();
        });
        // Rust asks every window to flush before the app exits (Cmd+Q, Dock-Quit,
        // Windows logoff). Answer either way — a silent window costs 2s and then
        // the app quits regardless.
        await T.event.listen('sage:flush-request', async () => {
          try { await queue.flush(); } catch (e) { /* the exit is happening */ }
          try { await T.event.emit('sage:flush-done', {}); } catch (e) { /* going anyway */ }
        });
      },
    };
  }

  // Backend selection happens once, here, so app.js never branches on which one
  // it got. Tauri v2 sets window.isTauri in the webview.
  const isTauri = ('isTauri' in window && window.isTauri) || !!window.__TAURI__;
  window.SageStorage = isTauri ? fileBackend() : localBackend();
  if (window.SageStorage._wireQuit) {
    window.SageStorage._wireQuit().catch(() => { /* the app still runs */ });
  }
}());
