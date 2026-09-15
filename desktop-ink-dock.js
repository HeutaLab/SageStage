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
  }).catch(report('deck list listen'));
  T.event.emit('sage:ink-decks-please', {}).catch(report('deck request'));
})();
