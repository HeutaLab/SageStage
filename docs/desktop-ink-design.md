# Desktop ink — drawing over anything

Designed with Glenn, 2026-09-10, from a tester's question: *"how do I get 'Draw over
anything' to work — can I swap to a Chrome tab and annotate over the top of it?"* The
answer in the browser is no and always will be; the answer in the desktop app is this
document. Ships to macOS and Windows testers together (Glenn's call, 10 Sep).

## 0. What it is, and the lines it must not cross

A second window the size of the projected display, fully transparent, always on top,
carrying **the same annotation layer the board has** — same pens, colours, shapes,
undo, multi-touch — so a teacher can draw over a YouTube video, a Keynote or PowerPoint
slideshow, a PDF, anything. The ink is ephemeral: it lives while the overlay is open and
goes when it closes.

Lines:

- **Nothing is ever written.** The overlay never touches the state file, never writes
  localStorage, never saves a snapshot. Its strokes live in a scratch screen that exists
  only in that window's memory.
- **No screenshot, ever.** Freezing the screen behind the ink would need macOS Screen
  Recording permission — a frightening prompt on a managed school Mac, and a new thing
  for an IT department to refuse. So the ink floats; scroll the page underneath and the
  circle stays where it was. Every screen annotator makes this trade.
- **Desktop only, not withheld — unavailable.** A web page cannot paint outside its own
  tab. The dock button renders only when `window.SagePlatform` exists, so the browser
  build and the taster never show a control that cannot work. Same class as the media
  library in [licensing-design.md](licensing-design.md) §—"desktop-only".
- **No new permissions from the OS.** No accessibility, no screen recording, no input
  monitoring. Everything here is ordinary window management.

## 1. The three approaches, and the one taken

1. **A second window running the real app in an `#ink` boot mode — TAKEN.** app.js
   already boots differently per hash (`#s=` pins a screen, `#w=` shows one widget);
   `#ink` is the third mode. The window boots the whole app with every piece of chrome
   hidden and the draw layer switched on, pinned to a scratch screen. The teacher gets
   the exact tools they know; the new code is window plumbing.
2. *A fresh minimal drawing page.* Tiny and isolated, but a second drawing engine that
   drifts from the board's, with no undo, shapes or select unless rebuilt. Rejected.
3. *Extract the draw layer into a shared module first.* Cleanest long term; the draw
   code is entangled with the screen accessors, save, the selection bar and the geometry
   tools. Refactoring the most-used tool the week before a tester build is the wrong
   week. Rejected for now — the `#ink` mode is designed so that extraction later would
   not change its behaviour.

## 2. The pieces

Three windows, two of them new, and one Rust seam.

| piece | label / file | what it is |
|---|---|---|
| the board | `main` | unchanged, gains one dock button |
| the ink window | `desktop-ink` → `index.html#ink` | transparent, borderless, always on top, the size of the board's monitor; the app in `#ink` mode |
| the pill | `desktop-ink-dock` → `desktop-ink-dock.html` + `.js` | a small always-on-top window: **Pen · Pointer · Undo · Clear · Exit**, draggable; static page, no app.js |
| the seam | `src-tauri/src/lib.rs` | three commands: `desktop_ink_open`, `desktop_ink_mode`, `desktop_ink_close` |

### 2.1 Entry

A new button in the dock beside Annotate — "Draw over the desktop", help key
`dock:desktop-ink` — rendered only under the platform seam. Clicking it invokes
`desktop_ink_open`. The board is not brought forward, hidden, or otherwise touched; the
teacher Cmd-Tabs or clicks across to Chrome and the overlay is already there, because it
joins every Space / sits topmost.

If the overlay is already open the button does nothing but focus the pill (a second
click must not open a second overlay).

### 2.2 Pen and pointer

Two modes, owned by Rust so both windows agree:

- **Pen** — the ink window catches every pointer; the familiar draw bar shows. Rust calls
  `set_ignore_cursor_events(false)` and focuses the ink window so Escape and the tool
  keys work.
- **Pointer** — the ink window ignores cursor events (`set_ignore_cursor_events(true)`:
  `setIgnoresMouseEvents:` on macOS, `WS_EX_TRANSPARENT | WS_EX_LAYERED` on Windows). The
  draw bar hides; the committed ink stays visible; clicks reach the app underneath. Only
  the pill remains clickable, because it is its own window.

The pill's Pen / Pointer buttons invoke `desktop_ink_mode { pen }`. Rust flips the
cursor-events flag and emits `sage:ink-mode { pen }` to both windows: the ink window
switches its draw layer on or off, the pill highlights the active mode.

**Escape in pen mode drops to pointer mode** — it never exits and never discards ink.
Exit is the pill's ✕ only. (On the board Escape leaves draw mode; the same key here
leaving a transparent window with nothing on it would read as the overlay vanishing.)

Opens in **pen** mode: the teacher clicked "draw", so the first thing they do is draw.

### 2.3 Ink lifetime

Strokes go into the scratch screen's `ink` array through the existing stroke code; undo
and redo work as on the board. **Clear from the pill clears without a confirm** —
undo exists and a modal on a transparent window over someone else's app is wrong.
`desktop_ink_close` destroys both windows; the scratch screen dies with the ink window.

### 2.4 The `#ink` boot mode in app.js

Mirrors `soloBoot` — a constant read from the hash at boot, consulted in a handful of
guarded places, inert everywhere else:

- `viewDeck()` returns an in-memory scratch deck `{ id: 'ink', screens: [{ id: 'ink',
  widgets: [], ink: [] }], current: 0 }` so `screens()`, `screen()`, `currentIndex()`
  and every ink helper resolve without knowing.
- `save()` returns immediately. It is the single write path (`SageStorage.write` is only
  called from there), so one guard makes "nothing is ever written" true.
- Boot skips the dashboard, the first-run clock and the deck sidebar; adds
  `body.desktop-ink`; calls `toggleDraw()`; then **shows the window** (Rust creates it
  hidden, so a transparent window never flashes the topbar).
- Listens for `sage:ink-mode` (switch the draw layer on/off) and `sage:ink-cmd`
  (`undo` / `clear`).
- Escape while drawing → `desktop_ink_mode { pen: false }` instead of `toggleDraw()`.
- The `sage:flush-request` handshake still gets its `sage:flush-done` answer (storage.js
  does this for every window) — an ink window must never cost the quit two seconds.

CSS: `body.desktop-ink > :not(#drawLayer):not(#drawTools) { display: none }` plus a
transparent `html, body`. The selection mini-bar and the draw bar's pop-overs are
children of the draw tools or appended after boot, and stay visible.

### 2.5 The Rust seam

```
desktop_ink_open(window)      // from the board; sync, so it runs on the main thread
  monitor  = window.current_monitor() (fallback: primary)
  ink      = WebviewWindow "desktop-ink": index.html#ink
             transparent, decorations false, shadow false, always_on_top,
             visible_on_all_workspaces, skip_taskbar, resizable false,
             focused false, accept_first_mouse, visible FALSE,
             position/size = the monitor's physical rect ÷ scale factor (the builder
             takes logical pixels)
  dock     = WebviewWindow "desktop-ink-dock": desktop-ink-dock.html
             same flags, visible true, ~300×56 logical, bottom-centre of the monitor
  macOS    : for both, through ns_window(): the window's class is swapped to
             SageInkPanel, an NSPanel subclass, and NonactivatingPanel is added to
             its style mask — see §2.5.1; then level 1000 (NSScreenSaverWindowLevel)
             for the ink window, 1001 for the pill; collectionBehavior =
             CanJoinAllSpaces | FullScreenAuxiliary | Stationary | IgnoresCycle
  then     : the ink window shows itself once booted and asks for pen

desktop_ink_mode(pen)         // from the pill or the ink window
  ink.set_ignore_cursor_events(!pen)
  if pen: macOS makeKeyAndOrderFront on the panel (never set_focus — that
          activates the app, and activating an app from inside another app's
          fullscreen Space switches the teacher out of it); Windows set_focus
  emit_to both: sage:ink-mode { pen }

desktop_ink_close()           // from the pill
  destroy both if present
```

#### 2.5.1 Why an NSPanel — found on 10 September

The design above first said level + collection behaviour would do it. It does not.
Tested against a kiosk (fullscreen) Chrome with the window server's own list as the
judge: with `CanJoinAllSpaces | FullScreenAuxiliary` set, the ink window and the pill
were **off-screen** in Chrome's Space at levels 3, 25, 101, 1000 and the shielding
level, with and without `Stationary`, with the non-activating style bit on a plain
NSWindow, and with the app switched to the accessory activation policy. The one thing
that put both windows on-screen was **being an NSPanel with
`NSWindowStyleMaskNonactivatingPanel`** — at which point the level did not matter
(it worked at 3). macOS admits another app's windows to a fullscreen Space only when
they cannot activate that app.

tao creates NSWindows and offers no panel, so `float_above_everything` swaps the
object's class after creation (`object_setClass`, the same trick the tauri-nspanel
plugin uses). NSPanel adds no instance variables, so the layout is untouched; tao's
one override (`canBecomeKeyWindow` via its `focusable` ivar) is replaced by
`SageInkPanel`'s, which answers yes — a plain non-activating NSPanel answers no, and
then Escape never reaches the ink window. `canBecomeMainWindow` answers no so the
board stays the app's main window. Consequences that follow:

- pen mode takes the keyboard with `makeKeyAndOrderFront`, not Tauri's `set_focus`;
- clicking the overlay or the pill never activates Sage Stage, so the board is never
  dragged in front of the app being drawn over — the §5 hazard about exit is moot;
- `objc2` becomes a direct dependency for `define_class!` and the class swap.

`macOSPrivateApi: true` goes into `tauri.conf.json` and `macos-private-api` into the
tauri crate's features — the builder's `transparent()` is compiled out on macOS without
it, and `cargo build` on its own does not read the config flag. Only the Mac App Store
minds the private API; Developer ID distribution does not.

`objc2-app-kit` is already in `Cargo.lock` as a Tauri dependency at 0.3; it becomes a
direct macOS-only dependency with the `NSWindow` and `NSResponder` features.

### 2.6 Windows

Transparent + undecorated + topmost + no shadow + hidden from the taskbar is a supported
WebView2 shape in wry 0.55; the html/body transparency does the rest. Pointer mode is
the same Tauri call. Topmost sits over Chrome fullscreen and a PowerPoint slideshow (a
borderless topmost-less window), not over exclusive-fullscreen games — irrelevant here.
Sizing uses the monitor's scale factor, so a 150 % laptop display gets the right logical
size. **Untested by the author** — this machine is a Mac — hence §4.

### 2.7 Capabilities

`src-tauri/capabilities/default.json` (windows `*`, so the new labels are covered) gains
`core:window:allow-show` (the ink window shows itself after boot) and
`core:window:allow-start-dragging` (the pill drags by `data-tauri-drag-region`) if they
are not already inside `core:window:default`. Mode, close and open are app commands, and
app commands need no ACL entry.

### 2.8 dist and the mock

`copy-dist.mjs` derives its file list from index.html and cannot see pages Rust opens
directly, so `desktop-ink-dock.html` and `desktop-ink-dock.js` join the explicit
runtime list beside `community/` and `vendor/`. `.tauri-mock.js` gains the three
commands so `.desktop-mock.html#ink` exercises the boot mode in a browser tab.

## 3. Not in version one

- No global hotkey (the pill and Escape are the controls). The clicker key for
  pen/pointer is the first job for [board-control-design.md](board-control-design.md)
  when that lands.
- No "send to board", no persistence, no screen freeze, no Linux.
- The folded mini-dock does not get the button; the full dock does.
- No second overlay on a second monitor at once; the overlay opens on the board's
  monitor.

## 4. Verification

**macOS, this machine, before anything is tagged:** the overlay over fullscreen Chrome
with a YouTube video, over a Keynote slideshow, over a PDF in Preview; pen → pointer →
pen with the ink surviving; undo and clear from the pill; Escape drops to pointer; exit
destroys both windows; two displays put the overlay on the board's; the state file's
mtime is unchanged after a session of drawing; clicking the overlay in pen mode does
not drag the board window in front of Chrome. A second click on the dock button does
not open a second overlay.

**How the native side is checked with nobody at the mouse** (this machine refuses
assistive access to scripts, so nothing can click): the binary reads a few environment
variables, all inert unless set — `SAGE_STAGE_OPEN_INK=1` opens the overlay two seconds
after launch; `SAGE_INK_REPEN=<s>` flips pointer and back to pen at that many seconds;
`SAGE_INK_CLOSE=<s>` closes it, `SAGE_INK_REOPEN=1` opens and closes it once more;
`SAGE_INK_QUIT=<s>` quits with it open, the way Cmd+Q would. Run it against an isolated
`HOME` so the real state file is never touched. `screencapture -x` works and shows the
overlay; a twenty-line Swift tool over `CGWindowListCopyWindowInfo` reports each window's
level and whether it is on the current Space, which is the judge for the fullscreen
question — a screenshot cannot tell an off-screen window from a transparent one.
`OBJC_PRINT_EXCEPTION_THROW=YES` prints any Objective-C throw with its backtrace, which
is how the KVO teardown crash was found. The JS side runs in a browser tab:
`index.html#ink` for the boot mode, `.desktop-mock.html#ink` for the mode and command
events through the Tauri mock.

**Windows, before release:** the same list on a Windows machine, run by Glenn or a
tester from the checklist in the draft release notes — Chrome fullscreen, a PowerPoint
slideshow, pen/pointer, undo/clear, exit, and that the taskbar shows no extra entries.

**Release:** version 0.2.0 in `tauri.conf.json` and `Cargo.toml`, tag `v0.2.0`,
`desktop-build` attaches both installers to a **draft** release. Glenn shares the
private link; the release is not published on the page (sagestage-app-design.md §4).

## 5. Hazards

- ~~macOS may raise the board window when the overlay's key window closes.~~ Moot:
  the overlay is a non-activating panel (§2.5.1), so Sage Stage is never activated by
  it and has nothing to raise.
- Anything that later calls tao's `set_focusable` on the ink windows will reach for an
  ivar the swapped class no longer declares. Nothing does; keep it that way.
- Closed Tauri windows linger as off-screen NSWindow objects in the window server's
  list — with and without the class swap, so this is Tauri's own destroy behaviour, not
  this feature's. Each overlay session leaves two behind until the app quits. Small,
  noted, not fixed here.
- Every path that destroys the ink windows must go through `desktop_ink_close`, which
  puts the original class back first. A direct `destroy()` on one of them from anywhere
  else throws from inside WebKit's observer teardown and aborts the process.
- The draw bar's position is stored in state (`inkBarPos`); in `#ink` mode it reads but
  never writes it, so a teacher moving the bar in the overlay sees it snap back next
  time. Acceptable for v1; noted so it is not reported as a bug.
- `always_on_top` at creation sets a floating level that the later `setLevel` replaces;
  nothing in the app calls `set_always_on_top` afterwards. If it ever does, the overlay
  drops below fullscreen apps again.
