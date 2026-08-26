# Click assessment — 31 July 2026 (desktop-first)

Every interactive element audited against one question: **when clicked, does it do
what it says?** — with the Tauri desktop build as the target, per Glenn's
instruction. Three methods, cross-checked:

1. **Static sweep** — five parallel read-throughs covering all of app.js, the
   english modules, print/export/pptx/zip/snapshots/qr/templates/sanitize, and an
   index.html id/icon cross-check, briefed with the verified facts about wry
   0.55's WKWebView (what is genuinely dead there, from the wry source itself).
2. **Dynamic pass** — the app driven in the browser with a Tauri mock
   (`.tauri-mock.js` + `.desktop-mock.html`, both dev-only, never shipped) so the
   real desktop code paths ran: `SageStorage.kind === 'file'`, `SagePlatform`
   live, every save going through the fake IPC/disk. All 50 spawnable widgets,
   all 51 frame menus, the shell operations, bin, data panel, erase, dashboard
   tabs, deck sidebar, second-window flow, draw overlay, shades, mini dock.
3. **Real app smoke test** — `src-tauri/target/debug/sage-stage` launched
   against the dev server: boots, reads the real `Documents/Sage Stage` file,
   renders correctly. (No synthetic clicking — macOS assistive access isn't
   granted — so the webview-API facts rest on the wry source, which is
   unambiguous: none of the JS-dialog/print delegates are implemented.)

**Legend:** ✅ fixed & verified in the desktop-mode harness · ✔ fixed, verified by
code read (UI too pointer-heavy to script) · 📝 noted, deliberately not changed.

---

## A. Desktop-only breakage (the Tauri build)

- [x] ✅ **`prompt()` is dead in the desktop webview** — wry implements no
  WKUIDelegate JS dialogs, so `prompt()` returns null instantly, no dialog.
  Every rename/create flow silently did nothing on desktop: new deck, deck
  rename, subject tag, screen rename, class-list create/rename (4 sites), text
  widget Link URL, pad template name, template-source address, dropped-register
  class name, word-bank set name, sorter target word, word-card lines,
  modelwrite fallbacks. **Fix:** new app-styled `promptDialog()` (sibling of
  `confirmDialog`, stacks over open modals, Enter/Esc, never returns null) and
  all ~18 call sites converted; english modules receive it through `engDeps`.
  The text-widget Link button also carries the editor's selection across the
  dialog, which native prompt used to preserve for free.
- [x] ✅ **⛶ Fullscreen button dead** — element-fullscreen is not enabled in this
  webview. **Fix:** `SagePlatform.toggleFullscreen()` drives the *window*
  (mac-native fullscreen Space); browser build unchanged. Capabilities:
  `core:window:allow-set-fullscreen`, `allow-is-fullscreen`.
- [x] ✅ **`window.print()` is a no-op** — and the old route also left
  `document.title` overwritten for the session. **Fix:** `printRoute` goes
  through `SagePlatform.printPage()` (the webview plugin's native print;
  `@media print` CSS applies), cleanup no longer depends on `afterprint`, and
  repeated prints can't cross-clean each other. Capability:
  `core:webview:allow-print`.
- [x] ✅ **Every blob-anchor download silently did nothing — several with a false
  "downloading to your Downloads folder" toast.** Affected: screen exports
  (PNG/PDF/PowerPoint from deck sidebar, deck menu, dash menu), SagePrint "Save
  PDF" (and with it contact sheets), draw-pad Export as PNG, word-bank
  set/sheet saves, sorter list download, genre-pack save. **Fix:**
  `SagePlatform.saveBlob()` (native save panel + binary `fs.writeFile`;
  capability `fs:allow-write-file`) wired into export.js `downloadBlob`,
  print.js `exportPdf`, the pad, english-word and english-text savers — and
  every toast now only claims success on a real save ('cancelled' stays quiet).
- [x] ✅ **The shipped bundle was missing all of vendor/** — copy-dist.sh derives
  its file list from index.html, which never mentions the four lazy-loaded
  libraries (jszip/jspdf/html2canvas/pptxgen) **or the .woff2 files fonts.css
  pulls via CSS url()**. The built app had every export dying as a 404 and the
  Soft Daylight typefaces falling back to system fonts. **Fix:** copy-dist.sh
  now ships vendor/ wholesale (with a comment naming the trap); dist went from
  17 files to 64.
- [x] ✅ **CSP repaired** (built app only — dev via devUrl never enforced it):
  `font-src` had no `'self'` (bundled fonts blocked — and Google Fonts hosts
  allowed despite nothing using them: dropped); no `frame-src` (Embed widget,
  YouTube in Video, and the Document widget's blob-PDF iframes all blocked →
  now `'self' blob: https:`); `media-src` lacked `https:`/`data:` (direct-URL
  video dead); no `worker-src` (export.js's blob workers refused → now
  `'self' blob:`); `object-src 'none'` added (nothing uses it).
- [x] ✔ **Webcam + Noise meter would get the app killed by macOS** — wry grants
  the webview-level capture permission, then TCC kills a process that asks for
  camera/mic without usage strings; the webcam widget even persists
  `auto: true` after first success, so the deck would relaunch-and-die.
  **Fix:** `src-tauri/Info.plist` with `NSCameraUsageDescription` and
  `NSMicrophoneUsageDescription`, worded for a teacher (nothing recorded,
  nothing sent — matching what the code actually does).
- [x] ✔ **OS drag-drop interception ate the drop routes** — Tauri v2 defaults
  `dragDropEnabled: true`, so the DOM never saw dropped files: the .pptx-drop
  and dropped-register routes were unreachable. **Fix:**
  `dragDropEnabled: false` on the main window (tauri.conf.json) *and* on the
  second screen-window (storage.js `openScreenWindow`).
- [x] ✅ **Stored rich-text links did nothing** — sanitize.js stamps
  `target="_blank"` on every stored anchor (pptx-imported slides, templates)
  and `_blank` is inert in the webview. **Fix:** one delegated click handler
  under `SagePlatform` sends external http(s) anchors to the system browser
  (sanitised first; contenteditable clicks still place carets; guarded anchors
  that handle themselves are skipped). Browser build untouched.
- [x] ✅ **Deck "Export…" PDF could fail with "Invalid argument passed to
  jsPDF.scale"** — `rasterScreen` read `window.innerWidth` raw; a hidden or
  minimised window reports 0×0 and the exporter built a [0,0]-format PDF.
  deckThumb already carried the guard for exactly this; the exporter now
  carries the same one. (Found live in the harness; export then produced a
  real 46 KB PDF through the native save panel.)

### Added 26 Aug (found reviewing the pop-out work before the first build since 1 August)

- [x] ✔ **The ✕ on a popped-out window was a no-op in the desktop build.**
  `closeThisWindow()` calls `getCurrentWindow().close()`, which the ACL routes
  through `core:window:allow-close`. `capabilities/default.json` granted
  `allow-destroy`, `allow-set-focus`, `allow-set-fullscreen` and
  `allow-is-fullscreen` — the mutating window commands, added one at a time as
  each was needed — and never `close`. `core:window:default` does not carry it
  (28 entries; the only close-adjacent members are `allow-is-focused` and
  `allow-is-closable`). So the call rejected on a permission denial, and
  `closeThisWindow`'s `catch` swallowed it: the window simply sat there.
  Browser-correct, desktop-silent — the same shape as every other item in this
  section, and reached by the same route, a feature tested where it works.
  **Fix:** grant `core:window:allow-close` (54721b4), strictly weaker than the
  `allow-destroy` already granted since it fires `onCloseRequested` and so runs
  the flush hook; and make the failure speak (ea26733 — `closeThisWindow`
  returns a result, the caller toasts on false, the console names the missing
  permission).
  **Marked ✔ and not ✅ deliberately: the harness cannot reach Tauri's
  permission layer at all.** The mock proves the JS calls the right command with
  the right arguments and reports a refusal loudly; it cannot prove the ACL
  permits it, because it stands in for `__TAURI__`, which sits *above* the ACL.
  A third layer this audit had not previously had to separate — JS correctness,
  ACL grant, OS behaviour — and only the first is scriptable here. See F.

## B. Logic bugs in every build

- [x] ✔ **Base 10: the "10 ⇄ 1" exchange chip rendered but dead above hundreds**
  — `exchange()` opened with a hard-coded `d >= 3` guard that predates the big
  charts, so Th→TTh and up chips did nothing on the tth/m charts. The real
  gates (column exists, room in the cap) already followed; the stale guard is
  now an index-only `d >= 6`.
- [x] ✅ **Memory pairs could wedge permanently** — flipping two non-matching
  cards saves `open: true` *before* the 850 ms unflip timer; a reload/remount
  in that window stranded both cards open and no pair could ever resolve
  again. Mount now forgets a half-flip. (Reproduced, fixed, re-verified.)
- [x] ✅ **Story map (built yesterday): opening ⚙ orphaned the live board** —
  `smNorm` reassigns every collection, and the mounted board's closures kept
  writing to the detached objects (a beat note typed after opening the gear
  looked saved and wasn't). The file's own `setArc` comment documents this
  exact hazard for `p.arc`; settings now remounts the board so every closure
  re-captures — via `refreshAllOf('storymap')`, because the settings-panel
  `api.refresh` re-enters `settings()` (found the hard way: stack overflow).
- [x] ✅ **Story map: an empty bank removed the capture bar** — with no words
  there was no on-board way to add the *first* word (the widget's headline
  loop). An unlocked empty bank now renders the capture bar with a nudge;
  locked boards stay bare as designed.
- [x] ✔ **Story map: all-lines-off graph face rendered an unusable empty grid**
  (reachable via imported props only) — now says "No line is on air — tap a
  legend chip above."
- [x] ✔ **Draw pad PNG export dropped the paper** — ink was exported on bare
  white; a handwriting guide without its lines isn't the sheet the class saw.
  Every paper now paints into the export (line/grid/dot papers in canvas, the
  SVG papers drawn from their own data-URIs).
- [x] ✅ **Shapes ⇄ Geometry pop-overs swallowed the first click** — each
  closed *any* open pop and returned, so switching always took two taps. Each
  now only toggles off its own.
- [x] ✔ **Name picker & Dice: spin intervals outlived the widget** — closing
  mid-spin left a timer writing a winner/values into a widget the teacher had
  removed. Cleanups now clear them.
- [x] ✔ **Teaching clock:** AM/PM button was enabled-but-inert in live mode
  (now disabled with an explaining title, like the step buttons); "Snap
  minutes" saved but never repainted the on-widget chips (now refreshes).
- [x] ✔ **Number line:** the Labels cycle button did nothing on a blank line —
  hidden there now, matching the Fractions chip's pattern.
- [x] ✔ **Part–whole:** with every part deleted, the whole's input and −/＋
  steppers were dead — typing a whole now births the first part.
- [x] ✔ **Unguarded `setPointerCapture`** on the pad canvas and teaching-clock
  canvas (modelwrite and the annotation layer already guard theirs — a touch
  pointer can be gone before the handler runs). Both wrapped.

## C. Smaller click/UX repairs

- [x] ✅ Deck-menu **Move up / Move down** now render disabled at the ends
  (the `deck-up`/`deck-down` classes never had CSS — "enabled but inert" was
  all anyone saw on screen 1).
- [x] ✅ **Screen cover (shades): Esc now closes it** — it sat above the dock
  with no keyboard exit; spotlight already had Esc parity.
- [x] ✅ **Class-list "＋ Add name…" keeps focus** — every Enter used to rebuild
  the dashboard and lose the field, so a 30-child register meant 30 clicks; it
  also now drops case-insensitive repeats like the paste route.
- [x] ✅ **Dashboard search with no hits** answered with a "New deck" tile;
  now says "No deck matches …" (the tile still appears when there truly are
  no decks).
- [x] ✔ **More-panel tool cells are keyboard-real** — `role="button"
  tabindex="0"` now honours Enter/Space.
- [x] ✔ **Snapshot "Restore…"** had no `.catch` — a failed IndexedDB read now
  says so instead of doing nothing.
- [x] ✔ **Zero-screen decks** (possible via import) no longer throw the deck
  card or its menu; "Open in new tab" hides when there's no screen to pin.
- [x] ✔ **Unknown widget type in a template** now toasts and skips instead of
  throwing mid-apply; settings-panel body swap guards a missing node.
- [x] ✔ **Draw pad declares `hasWork`** — closing a pad with strokes now asks,
  instead of leaning on the 400-char JSON heuristic alone.
- [x] ✔ **Geometry "Grid size" slider** switches the grid on when moved (it
  silently did nothing unless "Snap to grid" was already on); background
  change refreshes the open deck sidebar's thumbnail; spotlight hint now says
  "Click **outside the widget**"; starter clock can't spawn off-screen at
  `x = -320` when the window reports zero width; clipboard copies that fail
  now *say* so (pad, AI-prompt button) instead of failing silently.

### Added 1 Aug (Glenn's testing of the release build)

- [x] ✅ **Dock jumped hard-left in a normal-width window** ("the toolbar shifts
  left except on full screen"). fitDock's stage 3 pinned the bar to `left:16px`
  whenever *perfect centring* couldn't clear the screen-nav pill — and centring
  reserves the nav's ~249px on **both** sides, so at the default 1280 window the
  compact dock missed the centred budget by ~13px and leapt ~110px left,
  leaving a dead gap in front of the nav. Stage 3 now **centres the dock in the
  span the nav actually leaves free** (measured from the live `#screenNav`
  rect, via a `--dock-left` custom property): at 1280 it sits balanced with
  ~108px each side; at 960 it reaches the old left-pinned position naturally;
  wide/fullscreen behaviour unchanged. Verified at 960 / 1280 / 1470.

## D. Verified working (desktop-mode harness, no changes needed)

All 50 widgets spawn clean · all 51 frame menus open (Print… seam on Genre
toolkit, Modelled writing, Phoneme tiles, Story map) · duplicate / lock /
spotlight / resize-to-fit / layers / show-on-all-screens · close-to-bin policy
(work kept, empty discarded) and "Put it back" · data panel: export via native
dialog, file-path hint, reveal-in-Finder, import confirm, **erase** (file +
backups deleted, other windows quiesced first, snapshots cleared, nothing
resurrects) · screens add/prev/next/delete, deck sidebar + reorder, second
window (flush-first, correct `#s=` URL, `dragDropEnabled` off) · dashboard
tabs, search, sort, Aa pill, star pill, quick-launch tiles, templates gallery,
wallpaper grid · draw overlay tools + stroke + undo/redo/clear · mini dock ·
help sheet. Boot from a real `Documents/Sage Stage` file in the real binary.

## E. Noted, not changed (deliberate)

- 📝 **Graph-face "Cover" is much weaker than its siblings** — it hides only the
  axis box-names; dots, lines and legend stay readable. The beat labels it was
  specced to cover were deliberately dropped from the plot. Needs a design
  call (options: also dim dots/lines, or drop the button from that face) —
  the mock is the behaviour authority, so not touched here.
- 📝 **Custom-colour swatches** (draw overlay ×2, pad, modelwrite inks) drive a
  hidden `<input type="color">` — fine on current macOS WKWebView (16.4+),
  worth one tap on the real board during tester week.
- 📝 **Shade tabs' "double-click to open"** may be unreachable on touch boards
  (pointerdown preventDefault suppresses derived dblclick in WebKit) — dragging
  home still works; needs a minute on the actual IR panel before rewiring.
- 📝 **Exports don't harvest hyperlinks out of rich text** (`linksFor` reads
  widget types only) — a pptx-imported slide's links survive on screen but not
  into PDF link annotations. Enhancement, not a broken click.
- 📝 **`.tauri-mock.js` / `.desktop-mock.html`** are the desktop-mode test
  harness (same spirit as `.sm-mock.html`): dot-prefixed, never shipped by
  copy-dist. Open `.desktop-mock.html` on the dev server and the app runs
  with the file backend + `window.__MOCK__` inspectable.

## F. Before testers

- [ ] Run `tauri build` fresh — the CSP, Info.plist, and dist/vendor fixes only
  reach the *bundled* app on the next build (dev via devUrl doesn't enforce
  CSP, so the browser-visible dev app can't prove them).
- [ ] One on-device pass over the 📝 items above, plus a real print to paper
  from the bundled app (the native-print route is new).

### Added 26 Aug

- [ ] **Confirm the pop-out ✕ actually closes a window in the bundled app.**
  Granted at build time — `gen/schemas/capabilities.json`, the build's own
  resolution of the capability, carries `core:window:allow-close` for
  `windows: ["*"]` — and never once invoked against the real ACL. One click
  closes the gap and nothing short of the binary can.
  *Dead end recorded so it isn't repeated:* grepping the shipped binary for
  `allow-close` finds it, and proves nothing. The control settles it —
  `allow-minimize`, `allow-set-title`, `allow-hide`, `allow-center`,
  `allow-start-dragging` all appear at the same counts and none of them are
  granted. The binary embeds the manifest of *available* permissions regardless
  of the grant. A test that cannot fail is not a test.

- [ ] **A build is a snapshot of the working tree, not of the commit graph** —
  and in a shared worktree that is a real way to ship something you believe you
  tested. `beforeBuildCommand` runs `copy-dist.sh`, which copies **live files**
  off disk; `dist/` is gitignored, so nothing anywhere flags the drift.
  Observed 26 Aug with two sessions in one worktree: a build's copy-dist ran at
  15:05, a commit landed at 15:07, and the resulting binary lacked that commit
  while `git log` showed it present and `git status` showed the tree clean. The
  build was not wrong about anything; it simply answered a question asked two
  minutes earlier.
  **Before any build that matters, record what it was made from** — `git
  rev-parse HEAD` and `git status --porcelain` at build time, not after — and
  where a specific change is expected, grep `dist/` for it once copy-dist has
  run. That is what caught this one.
