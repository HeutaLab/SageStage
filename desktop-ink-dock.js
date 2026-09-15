/* The ink frame's pill (docs/ink-frame-design.md §2, §3). Rust owns the
   pen/pointer state and carries every verb to the frame, so this page holds no
   state of its own beyond which deck is chosen — it asks for changes and
   reflects the answers, and so the pill and the frame can never disagree. */
(function () {
  'use strict';
  const T = window.__TAURI__;
  const $ = (id) => document.getElementById(id);
  if (!T) {
    // Opened in a plain browser tab: nothing to talk to. Say so rather than
    // presenting a row of buttons that silently do nothing.
    document.body.title = 'This page is the desktop app’s ink controls; it does nothing in a browser.';
    return;
  }
  const report = (what) => (e) => console.error(what + ' failed', e);
  const cmd = (name) => T.core.invoke('desktop_ink_cmd', { cmd: name }).catch(report(name));

  // The window Rust opens is a guess; the row's real width depends on the deck
  // name in the chooser and on the fonts that loaded. So the pill measures
  // itself and sizes its own window to fit, keeping the same centre — otherwise
  // the ends are clipped by the window edge with nothing on screen to say why.
  const dpi = () => {
    const d = T.dpi || T.window || {};
    return { P: d.LogicalPosition, S: d.LogicalSize };
  };
  let fitting = false;
  async function fitWindowToPill() {
    if (fitting) return;
    fitting = true;
    try {
      const pill = document.querySelector('.pill');
      const r = pill.getBoundingClientRect();
      const w = Math.ceil(r.width) + 2;
      const h = Math.ceil(r.height) + 2;
      const win = T.window.getCurrentWindow();
      const f = await win.scaleFactor();
      const before = await win.innerSize();
      const pos = await win.outerPosition();
      const oldW = before.toLogical ? before.toLogical(f).width : before.width / f;
      if (Math.abs(oldW - w) < 2) return;
      const { P, S } = dpi();
      await win.setSize(S ? new S(w, h) : { type: 'Logical', width: w, height: h });
      const lp = pos.toLogical ? pos.toLogical(f) : { x: pos.x / f, y: pos.y / f };
      const x = Math.round(lp.x + (oldW - w) / 2);
      await win.setPosition(P ? new P(x, Math.round(lp.y)) : { type: 'Logical', x, y: Math.round(lp.y) });
    } catch (e) {
      console.error('pill could not size itself', e);
    } finally { fitting = false; }
  }

  const reflect = (pen) => {
    $('pen').classList.toggle('active', pen);
    $('pointer').classList.toggle('active', !pen);
  };

  $('pen').onclick = () => T.core.invoke('desktop_ink_mode', { pen: true }).catch(report('pen'));
  $('pointer').onclick = () => T.core.invoke('desktop_ink_mode', { pen: false }).catch(report('pointer'));
  $('place').onclick = () => cmd('place');
  $('paste').onclick = () => cmd('paste');
  $('undo').onclick = () => cmd('undo');
  $('clear').onclick = () => cmd('clear');
  $('exit').onclick = () => T.core.invoke('desktop_ink_close').catch(report('exit'));
  $('save').onclick = () => T.core.invoke('desktop_ink_save', { deckId: $('deck').value || null }).catch(report('save'));

  // Escape closes when the pill has focus. The frame itself uses Escape to drop
  // from pen to pointer, so this is the second rung of the same ladder rather
  // than a competing shortcut.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') T.core.invoke('desktop_ink_close').catch(report('exit'));
  });

  T.event.listen('sage:ink-mode', (e) => reflect(!!(e && e.payload))).catch(report('mode listen'));

  // The pill has no state, so it asks the board which decks exist. If the board
  // never answers — it is the only window that can — the chooser keeps its one
  // honest option, which sends the picture to whichever deck is active.
  T.event.listen('sage:ink-decks', (e) => {
    const list = (e && e.payload) || [];
    if (!list.length) return;
    const sel = $('deck');
    const keep = sel.value;
    sel.innerHTML = '';
    for (const d of list) {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = d.name;
      sel.append(o);
    }
    if (keep) sel.value = keep;
    fitWindowToPill();   // a long deck name changes the row's width
  }).catch(report('deck list listen'));
  T.event.emit('sage:ink-decks-please', {}).catch(report('deck request'));

  // Once, at load, and again when the webfonts settle — a row measured before
  // Quicksand arrives is measured in a fallback face and comes out short.
  fitWindowToPill();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWindowToPill);
  window.addEventListener('load', fitWindowToPill);
})();
