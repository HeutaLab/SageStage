/* Sage Stage — desktop-mode TEST HARNESS. Never shipped: copy-dist.sh derives
   the dist file list from index.html, which does not reference this file.

   Emulates exactly the window.__TAURI__ surface storage.js + SagePlatform use,
   backed by a fake disk persisted in localStorage ('tauri-mock-fs'), so the
   browser can click-test the app with SageStorage.kind === 'file' and every
   desktop branch live. Inspect window.__MOCK__ from the console. */
(function () {
  'use strict';
  const FS_KEY = 'tauri-mock-fs';
  const DOC = '/Users/glenn/Documents/';

  let disk = {};
  try { disk = JSON.parse(localStorage.getItem(FS_KEY) || '{}'); } catch (e) { disk = {}; }
  const flushDisk = () => { try { localStorage.setItem(FS_KEY, JSON.stringify(disk)); } catch (e) { /* full */ } };

  // Asset bytes are held HERE, not in `disk`, because `disk` is persisted to
  // localStorage and a few hundred kilobytes of picture would blow the mock's
  // own quota — reproducing the exact bug the asset store exists to remove, in
  // the harness that is meant to prove it gone. Contents do not survive a
  // reload; nothing under test depends on that.
  const blobs = new Map();

  const calls = { saveState: 0, stateFilePath: 0, dialogSave: [], openUrl: [], reveal: [], windows: [], print: 0, emits: [], errors: [] };

  // path resolution: plugin-style calls pass a relative path + baseDir option;
  // saveExport passes an absolute path with no options at all
  const norm = (path, opts) => {
    if (typeof path === 'string' && path.startsWith('/')) return path;
    const base = opts && (opts.baseDir || opts.fromPathBaseDir || opts.oldPathBaseDir);
    return (base === 7 || base === undefined ? DOC : DOC) + path; // Document is all we emulate
  };
  const entry = (p) => disk[p];
  const isDir = (p) => Object.keys(disk).some((k) => k !== p && k.startsWith(p + '/')) || (entry(p) && entry(p).dir);

  const fs = {
    BaseDirectory: { Document: 7 },
    async exists(path, opts) { const p = norm(path, opts); return !!entry(p) || isDir(p); },
    async mkdir(path, opts) { const p = norm(path, opts); if (!entry(p)) { disk[p] = { dir: true, mtime: Date.now() }; flushDisk(); } },
    async readTextFile(path, opts) {
      const p = norm(path, opts); const e = entry(p);
      if (!e || e.dir) throw new Error('mock fs: no such file ' + p);
      return e.content;
    },
    async writeTextFile(path, content, opts) {
      const p = norm(path, opts);
      disk[p] = { content: String(content), mtime: Date.now() };
      flushDisk();
    },
    async writeFile(path, bytes, opts) {
      const p = norm(path, opts);
      blobs.set(p, bytes ? Uint8Array.from(bytes) : new Uint8Array(0));
      disk[p] = { content: '<binary ' + (bytes && bytes.length || 0) + ' bytes>', bytes: bytes && bytes.length, mtime: Date.now() };
      flushDisk();
    },
    async readFile(path, opts) {
      const p = norm(path, opts);
      const b = blobs.get(p);
      if (!b) throw new Error('mock fs: no such file ' + p);
      return b;
    },
    async rename(oldPath, newPath, opts) {
      const from = norm(oldPath, opts), to = norm(newPath, { baseDir: opts && opts.newPathBaseDir });
      const e = entry(from); if (!e) throw new Error('mock fs: rename missing ' + from);
      disk[to] = { ...e, mtime: Date.now() }; delete disk[from]; flushDisk();
    },
    async copyFile(fromPath, toPath, opts) {
      const from = norm(fromPath, opts), to = norm(toPath, { baseDir: opts && opts.toPathBaseDir });
      const e = entry(from); if (!e) throw new Error('mock fs: copy missing ' + from);
      disk[to] = { ...e, mtime: Date.now() }; flushDisk();
    },
    async remove(path, opts) {
      const p = norm(path, opts);
      delete disk[p];
      if (opts && opts.recursive) for (const k of Object.keys(disk)) if (k.startsWith(p + '/')) delete disk[k];
      flushDisk();
    },
    async stat(path, opts) {
      const p = norm(path, opts); const e = entry(p);
      if (!e && !isDir(p)) throw new Error('mock fs: stat missing ' + p);
      return { size: e && e.content ? e.content.length : 0, mtime: new Date(e ? e.mtime : Date.now()).toISOString(), isFile: !(e && e.dir) };
    },
    async readDir(path, opts) {
      const p = norm(path, opts) + '/';
      const names = new Set();
      for (const k of Object.keys(disk)) if (k.startsWith(p)) names.add(k.slice(p.length).split('/')[0]);
      return [...names].map((name) => ({ name }));
    },
  };

  // window-scoped event bus, same delivery contract as tauri's (payload wrapper)
  const listeners = {};
  const event = {
    async emit(name, payload) {
      calls.emits.push({ name, payload });
      for (const fn of listeners[name] || []) { try { fn({ payload }); } catch (e) { calls.errors.push(String(e)); } }
    },
    async listen(name, fn) { (listeners[name] = listeners[name] || []).push(fn); return () => {}; },
  };

  const label = location.hash.match(/#w=/) ? 'w-mock'
    : (location.hash.match(/#s=/) ? 'screen-mock' : 'main');
  let fullscreen = false;
  const currentWindow = {
    label,
    async onCloseRequested(fn) { currentWindow._closeCb = fn; },
    async destroy() { calls.emits.push({ name: 'mock:destroyed' }); },
    // Tauri's close() REQUESTS a close: onCloseRequested runs first and may
    // preventDefault, which is exactly what the file backend's quit hook does
    // when it has an unsaved edit to flush. Emulated in that order so the
    // pop-out ✕ exercises the same sequence it will hit in the binary.
    async close() {
      calls.emits.push({ name: 'mock:close-requested' });
      let prevented = false;
      if (currentWindow._closeCb) {
        await currentWindow._closeCb({
          preventDefault: () => { prevented = true; calls.emits.push({ name: 'mock:close-prevented' }); },
        });
      }
      if (!prevented) calls.emits.push({ name: 'mock:closed' });
    },
    async setFocus() {},
    async setFullscreen(v) { fullscreen = !!v; calls.emits.push({ name: 'mock:fullscreen', payload: v }); },
    async isFullscreen() { return fullscreen; },
  };

  class WebviewWindow {
    constructor(lbl, opts) {
      calls.windows.push({ label: lbl, url: opts && opts.url });
      this.label = lbl;
    }
    once() {}
    async setFocus() {}
    static async getByLabel(lbl) {
      return WebviewWindow._open && WebviewWindow._open[lbl] ? { setFocus: async () => {} } : null;
    }
  }
  const currentWebviewWindow = { ...currentWindow, async print() { calls.print++; } };

  window.isTauri = true;
  window.__TAURI__ = {
    fs,
    path: {
      async documentDir() { return DOC.replace(/\/$/, ''); },
    },
    core: {
      // The asset protocol, which is how the webview is allowed to display a
      // file it cannot open by path. Shape only: this proves the app asks for
      // the right path, and cannot prove the real protocol or the CSP that
      // gates it — those live below __TAURI__ and need the binary.
      convertFileSrc(p) { return 'asset://localhost/' + encodeURIComponent(p); },
      async invoke(cmd, args) {
        if (cmd === 'save_state') {
          calls.saveState++;
          await fs.writeTextFile('Sage Stage/sage-stage.json', args.json, { baseDir: 7 });
          return;
        }
        if (cmd === 'state_file_path') { calls.stateFilePath++; return DOC + 'Sage Stage/sage-stage.json'; }
        if (cmd === 'plugin:webview|print') { calls.print++; return; }
        throw new Error('mock invoke: unknown command ' + cmd);
      },
    },
    event,
    window: { getCurrentWindow: () => currentWindow },
    webviewWindow: { WebviewWindow, getCurrentWebviewWindow: () => currentWebviewWindow },
    webview: { getCurrentWebview: () => currentWebviewWindow },
    dialog: {
      async save(opts) {
        const p = '/mock/Desktop/' + ((opts && opts.defaultPath) || 'export.json');
        calls.dialogSave.push(p);
        return p;
      },
    },
    opener: {
      async openUrl(url) { calls.openUrl.push(url); },
      async revealItemInDir(p) { calls.reveal.push(p); },
    },
  };

  window.__MOCK__ = {
    calls,
    disk: () => disk,
    file: (p) => (disk[DOC + p] || {}).content,
    listFiles: () => Object.keys(disk),
    wipe: () => { disk = {}; flushDisk(); },
    emit: (name, payload) => event.emit(name, payload),
    requestClose: () => currentWindow._closeCb && currentWindow._closeCb({ preventDefault: () => { calls.emits.push({ name: 'mock:close-prevented' }); } }),
  };
}());
