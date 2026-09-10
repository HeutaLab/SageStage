/* The ink overlay's pill (docs/desktop-ink-design.md §2.2). Rust owns the
   pen/pointer state; this page only asks for changes and reflects the answer,
   so the pill and the ink window can never disagree about which mode is on. */
(function () {
  'use strict';
  const T = window.__TAURI__;
  const $ = (id) => document.getElementById(id);
  if (!T) {
    // Opened in a plain browser tab: nothing to talk to. Say so instead of
    // presenting five buttons that silently do nothing.
    document.body.title = 'This page is the desktop app’s ink controls; it does nothing in a browser.';
    return;
  }
  const report = (what) => (e) => console.error(what + ' failed', e);

  const reflect = (pen) => {
    $('pen').classList.toggle('active', pen);
    $('pointer').classList.toggle('active', !pen);
  };

  $('pen').onclick = () => T.core.invoke('desktop_ink_mode', { pen: true }).catch(report('pen'));
  $('pointer').onclick = () => T.core.invoke('desktop_ink_mode', { pen: false }).catch(report('pointer'));
  $('undo').onclick = () => T.core.invoke('desktop_ink_cmd', { cmd: 'undo' }).catch(report('undo'));
  $('clear').onclick = () => T.core.invoke('desktop_ink_cmd', { cmd: 'clear' }).catch(report('clear'));
  $('exit').onclick = () => T.core.invoke('desktop_ink_close').catch(report('exit'));

  T.event.listen('sage:ink-mode', (e) => reflect(!!(e && e.payload))).catch(report('mode listen'));
})();
