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

  // Backend selection happens once, here. Under Tauri v2 the webview sets
  // window.isTauri; until the file backend lands (plan §4, phase 3) Tauri runs on
  // localStorage too, which is exactly what phase 2 asks for.
  window.SageStorage = localBackend();
}());
