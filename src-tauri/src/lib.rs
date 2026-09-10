/* Sage Stage — the desktop shell.
   Design: docs/storage-abstraction-plan.md §4, §7.

   Two jobs, and only two. Write the state file so a power cut cannot leave half
   of it on disk, and make sure the app never exits with a teacher's last
   sentence still sitting in a debounce timer. Everything else — what to write,
   when, and what to keep — is storage.js's business. */

use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Listener, Manager};

fn err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

/// Atomic, durable state write.
///
/// The ordering is the whole point: write, **fsync**, then rename. `rename(2)` is
/// an atomic replace on macOS and `MoveFileExW` + REPLACE_EXISTING on Windows,
/// and the temp file sits in the same directory as the target so it never
/// crosses a filesystem. A crash at any instant therefore leaves either the
/// complete old file or the complete new one, never a mixture.
///
/// The `sync_all()` is not belt-and-braces. Without it a post-rename crash can
/// leave `sage-stage.json` zero-length when the metadata lands but the data
/// blocks do not, and recovery then falls back to a backup — turning "lost the
/// last second" into "lost the whole day".
#[tauri::command]
fn save_state(app: tauri::AppHandle, json: String, window_label: String) -> Result<(), String> {
    // The label names a file, so it is validated rather than trusted. Tauri's own
    // labels are tame; this is simply the one place a string from JS becomes a
    // path component.
    if window_label.is_empty()
        || window_label.len() > 64
        || !window_label
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(format!("bad window label: {window_label}"));
    }

    let dir = app.path().document_dir().map_err(err)?.join("Sage Stage");
    std::fs::create_dir_all(&dir).map_err(err)?;

    // Per-window temp name. With a shared name, window B's half-written temp
    // could be renamed onto the main file by window A — garbage installed
    // through a perfectly atomic rename. Distinct paths mean concurrent windows
    // can only ever produce whole-file last-write-wins.
    let tmp = dir.join(format!("sage-stage.json.tmp-{window_label}"));
    {
        let mut f = std::fs::File::create(&tmp).map_err(err)?;
        f.write_all(json.as_bytes()).map_err(err)?;
        f.sync_all().map_err(err)?;
    }
    std::fs::rename(&tmp, dir.join("sage-stage.json")).map_err(err)?;
    Ok(())
}

/// Where the state file lives, so the "Your data" panel can name it and reveal it.
#[tauri::command]
fn state_file_path(app: tauri::AppHandle) -> Result<String, String> {
    let p = app
        .path()
        .document_dir()
        .map_err(err)?
        .join("Sage Stage")
        .join("sage-stage.json");
    Ok(p.to_string_lossy().to_string())
}

/* ---- The video bridge -------------------------------------------------- */

/// YouTube's embedded player refuses to run unless the origin of the frame
/// **directly** around it is http(s). On macOS and Linux this app is served from
/// `tauri://localhost`, so every Video widget holding a YouTube link showed the
/// player's own black card — "Video player configuration error. Error 153" —
/// whose "Watch video on YouTube" button is then one more of this webview's
/// silent no-ops. Nothing about the iframe changes it: referrerpolicy,
/// youtube-nocookie and dropping the sandbox entirely all still get 153,
/// because what the player objects to is the scheme of the origin, not the
/// referrer. Tauri hard-codes `tauri://localhost` off Windows (manager's
/// `tauri_protocol_url`), so there is no config switch either.
///
/// But the player only inspects its IMMEDIATE parent, so one frame of
/// indirection is enough. This serves exactly one page, on loopback, whose
/// whole body is the YouTube iframe; the widget frames that, the player sees an
/// http origin and the video plays on the board.
///
/// Windows serves the app from `http://tauri.localhost` and a browser tab is
/// http(s) by definition, so neither asks for this URL — the widget only
/// reaches for the bridge when its own `location.protocol` is not http(s).
///
/// Deliberately narrow, because a listening socket on a teacher's laptop is not
/// nothing and this app's badge says 100% local:
///   * bound to 127.0.0.1, never 0.0.0.0, so nothing off the machine can reach it
///   * one route, `GET /player`, and 404 for everything else
///   * a per-launch token, so another page on the machine cannot use it as a
///     general-purpose YouTube frame or fingerprint the app by its port
///   * the video id is validated against YouTube's own alphabet and is the only
///     caller-supplied thing that reaches the page, so there is nothing to
///     inject into
///   * it serves a constant. It reads no files, runs no commands, and never
///     touches a deck.
const BRIDGE_PORT: u16 = 47821;

/// The bridge URL, or `None` if the port was busy — in which case the widget
/// falls back to a card with a working "Open on YouTube" button rather than
/// pretending. A fixed port is what lets `frame-src` in both CSPs name one
/// exact origin instead of a `127.0.0.1:*` wildcard.
struct VideoBridge(Option<String>);

/// 128 OS-seeded bits without a dependency: `RandomState` is seeded from the
/// system source precisely so hash collisions cannot be provoked.
fn bridge_token() -> String {
    use std::hash::{BuildHasher, Hasher};
    let mk = || {
        let mut h = std::collections::hash_map::RandomState::new().build_hasher();
        h.write_usize(&BRIDGE_PORT as *const u16 as usize);
        h.finish()
    };
    format!("{:016x}{:016x}", mk(), mk())
}

fn bridge_page(video_id: &str, nocookie: bool) -> String {
    let host = if nocookie {
        "www.youtube-nocookie.com"
    } else {
        "www.youtube.com"
    };
    // No script of any kind, so the page needs nothing but frame-src.
    format!(
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">\
<title>Video</title><style>html,body{{margin:0;height:100%;background:#000}}\
iframe{{display:block;width:100%;height:100%;border:0}}</style></head><body>\
<iframe src=\"https://{host}/embed/{video_id}\" \
allow=\"autoplay; fullscreen; encrypted-media; picture-in-picture\" \
allowfullscreen></iframe></body></html>"
    )
}

/// One query parameter, unescaped — the only values we ever ask for are a hex
/// token, a YouTube id and `1`, none of which can contain a percent-escape, so
/// a value that would need decoding is a value we are going to reject anyway.
fn query_param<'a>(query: &'a str, key: &str) -> Option<&'a str> {
    query.split('&').find_map(|pair| {
        let (k, v) = pair.split_once('=')?;
        (k == key).then_some(v)
    })
}

fn is_video_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 64
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

fn serve_bridge(mut stream: std::net::TcpStream, token: &str) {
    use std::io::{BufRead, BufReader};

    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(5)));
    let _ = stream.set_write_timeout(Some(std::time::Duration::from_secs(5)));

    // The request line is all we need, and capping it means a client that never
    // sends a newline cannot make us buffer without end.
    let mut line = String::new();
    if BufReader::new(&stream)
        .take(2048)
        .read_line(&mut line)
        .is_err()
    {
        return;
    }

    let mut parts = line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let target = parts.next().unwrap_or("");
    let (path, query) = target.split_once('?').unwrap_or((target, ""));

    let page = if method == "GET" && path == "/player" {
        match (query_param(query, "t"), query_param(query, "v")) {
            // Compared whole, and only after the id is known good, so a wrong
            // token and a wrong id are the same answer from outside.
            (Some(t), Some(v)) if is_video_id(v) && t == token => {
                Some(bridge_page(v, query_param(query, "nc") == Some("1")))
            }
            _ => None,
        }
    } else {
        None
    };

    let response = match page {
        Some(body) => format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\
Content-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n\
Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; \
frame-src https://www.youtube.com https://www.youtube-nocookie.com\r\n\
Connection: close\r\n\r\n{}",
            body.len(),
            body
        ),
        None => "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
            .to_string(),
    };
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
}

/// Binds the bridge, or gives up quietly. Called once, at setup.
fn start_video_bridge() -> Option<String> {
    let listener =
        std::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, BRIDGE_PORT)).ok()?;
    let token = bridge_token();

    let thread_token = token.clone();
    std::thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            // A connection per thread: the traffic is one request per video
            // widget, and a client that stalls mid-request must not hold up the
            // next widget's page.
            let t = thread_token.clone();
            std::thread::spawn(move || serve_bridge(stream, &t));
        }
    });

    Some(format!("http://127.0.0.1:{BRIDGE_PORT}/player?t={token}"))
}

/// The bridge URL for the Video and Embed widgets, or `None` on a build that
/// does not need one / a port that was taken.
#[tauri::command]
fn video_bridge_url(bridge: tauri::State<'_, VideoBridge>) -> Option<String> {
    bridge.0.clone()
}

static FLUSHED: AtomicBool = AtomicBool::new(false);

/// Ask every window to persist, then exit.
///
/// A webview cannot be flushed synchronously from Rust, so this is a handshake:
/// emit `sage:flush-request`, count the `sage:flush-done` replies, exit when they
/// are all in or when two seconds have passed. The timeout matters more than the
/// count — an app that refuses to quit is worse than one that loses the last
/// gesture, and the 1s debounce already bounds what that gesture can be.
fn flush_all_and_exit(app: &tauri::AppHandle) {
    // The overlay first, through the path that undoes its class swap; a
    // teardown on the way out of the process must not throw either.
    desktop_ink_close(app.clone());
    if FLUSHED.swap(true, Ordering::SeqCst) {
        return; // already handshaking; do not stack timers
    }
    // The ink windows were just told to go and have nothing to flush; counting
    // them would leave the quit waiting on an answer that never comes.
    let want = app
        .webview_windows()
        .keys()
        .filter(|l| l.as_str() != INK_LABEL && l.as_str() != INK_DOCK_LABEL)
        .count()
        .max(1);
    let seen = Arc::new(Mutex::new(0usize));

    let app_done = app.clone();
    let seen_done = seen.clone();
    app.listen_any("sage:flush-done", move |_| {
        let mut n = seen_done.lock().unwrap();
        *n += 1;
        if *n >= want {
            app_done.exit(0);
        }
    });

    let _ = app.emit("sage:flush-request", ());

    // The backstop. If a window is wedged, mid-dialog or simply slow, quitting
    // still happens.
    let app_timeout = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(2000));
        app_timeout.exit(0);
    });
}

/* ---- Desktop ink: drawing over anything ------------------------------- */
// Design: docs/desktop-ink-design.md. Two windows on the board's monitor: a
// transparent, always-on-top window running the app in its `#ink` boot mode,
// and a small pill of controls. Both are created here rather than from JS so
// the native tweaks below can land before the windows are shown.

const INK_LABEL: &str = "desktop-ink";
const INK_DOCK_LABEL: &str = "desktop-ink-dock";

/// The class each ink window had before its swap, by label. Key-value
/// observing works by swapping an object's class under it — WebKit observes
/// the window the moment the webview attaches, which is inside the builder —
/// so the swap to SageInkPanel discards that bookkeeping, and tearing the
/// window down then throws from inside WebKit ("cannot remove an observer")
/// and aborts the process. Putting the original class back just before the
/// window is destroyed makes the teardown the ordinary one. Every way the
/// windows can go — the pill's ✕, Cmd+W, quit — passes through
/// desktop_ink_close for exactly this reason.
#[cfg(target_os = "macos")]
static INK_ORIGINAL_CLASS: std::sync::Mutex<Vec<(String, usize)>> = std::sync::Mutex::new(Vec::new());

// A borderless non-activating NSPanel answers "no" to canBecomeKeyWindow,
// and then Escape and the tool keys never reach the ink window in pen mode.
// This subclass answers yes — and no to main, so the board stays the app's
// main window. No ivars, no Drop: the class swap below stays sound.
#[cfg(target_os = "macos")]
objc2::define_class!(
    // SAFETY: NSPanel has no subclassing requirements beyond main-thread use;
    // SageInkPanel declares no ivars and does not implement Drop.
    #[unsafe(super(objc2_app_kit::NSPanel))]
    #[name = "SageInkPanel"]
    struct SageInkPanel;

    impl SageInkPanel {
        #[unsafe(method(canBecomeKeyWindow))]
        fn can_become_key_window(&self) -> bool {
            true
        }
        #[unsafe(method(canBecomeMainWindow))]
        fn can_become_main_window(&self) -> bool {
            false
        }
    }
);

/// What gets a window into ANOTHER app's fullscreen Space is being a
/// non-activating NSPanel. Level and collection behaviour on their own leave
/// it off-screen there — tested 10 Sep 2026 against a kiosk Chrome: levels 3,
/// 25, 101, 1000 and the shielding level, with and without Stationary, all
/// off-screen; the class swap alone put both windows on. tao creates
/// NSWindows and offers no panel, so the class is swapped after the fact.
/// NSPanel adds no instance variables, so the object's layout is untouched;
/// the one method tao's subclass overrode (canBecomeKeyWindow, through its
/// `focusable` ivar) is replaced by NSPanel's own answer, which for a
/// non-activating panel is yes — the ink window can take Escape and the tool
/// keys without our app ever becoming active.
///
/// `CanJoinAllSpaces` follows the teacher across Spaces, `FullScreenAuxiliary`
/// admits it to a fullscreen one, `Stationary` keeps it out of Mission
/// Control, `IgnoresCycle` keeps Cmd+` off it. 1000 is NSScreenSaverWindowLevel;
/// the pill sits one above the ink.
#[cfg(target_os = "macos")]
fn float_above_everything(w: &tauri::WebviewWindow, level: isize) {
    use objc2::runtime::AnyObject;
    use objc2::ClassType;
    use objc2_app_kit::{NSPanel, NSWindowCollectionBehavior, NSWindowStyleMask};
    let Ok(ptr) = w.ns_window() else { return };
    if ptr.is_null() {
        return;
    }
    // SAFETY: ns_window() is the NSWindow tao owns for this window, alive for
    // the duration of this call, and sync commands run on the main thread,
    // which is the only thread AppKit accepts these calls from. The class
    // swap is sound because NSPanel declares no ivars beyond NSWindow's.
    let obj: &AnyObject = unsafe { &*(ptr as *const AnyObject) };
    if let Ok(mut v) = INK_ORIGINAL_CLASS.lock() {
        v.retain(|(l, _)| l != w.label());
        v.push((w.label().to_string(), obj.class() as *const _ as usize));
    }
    unsafe { AnyObject::set_class(obj, SageInkPanel::class()) };
    let panel: &NSPanel = unsafe { &*(ptr as *const NSPanel) };
    panel.setStyleMask(panel.styleMask() | NSWindowStyleMask::NonactivatingPanel);
    panel.setLevel(level);
    panel.setCollectionBehavior(
        NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::FullScreenAuxiliary
            | NSWindowCollectionBehavior::Stationary
            | NSWindowCollectionBehavior::IgnoresCycle,
    );
    if std::env::var_os("SAGE_STAGE_OPEN_INK").is_some() {
        eprintln!(
            "desktop ink: {} level {} behaviour {:?} style {:?} key-able {}",
            w.label(),
            panel.level(),
            panel.collectionBehavior(),
            panel.styleMask(),
            panel.canBecomeKeyWindow()
        );
    }
}

/// Pen mode needs the ink window to be key — Escape and the tool keys — but
/// Tauri's set_focus activates the app first, and activating an app from
/// inside another app's fullscreen Space switches the teacher out of it.
/// A non-activating panel can be made key on its own.
#[cfg(target_os = "macos")]
fn take_keyboard(w: &tauri::WebviewWindow) {
    use objc2_app_kit::NSWindow;
    let Ok(ptr) = w.ns_window() else { return };
    if ptr.is_null() {
        return;
    }
    // SAFETY: as in float_above_everything.
    let ns: &NSWindow = unsafe { &*(ptr as *const NSWindow) };
    ns.makeKeyAndOrderFront(None);
}

#[cfg(not(target_os = "macos"))]
fn take_keyboard(w: &tauri::WebviewWindow) {
    let _ = w.set_focus();
}

/// Undo the class swap so the window tears down as the NSWindow it was built
/// as — see INK_ORIGINAL_CLASS.
#[cfg(target_os = "macos")]
fn restore_class(w: &tauri::WebviewWindow) {
    use objc2::runtime::{AnyClass, AnyObject};
    let original = INK_ORIGINAL_CLASS.lock().ok().and_then(|mut v| {
        let i = v.iter().position(|(l, _)| l == w.label())?;
        Some(v.remove(i).1)
    });
    let (Some(original), Ok(ptr)) = (original, w.ns_window()) else { return };
    if ptr.is_null() {
        return;
    }
    // SAFETY: as in float_above_everything; the class pointer is the one read
    // from this very object before the swap, and classes are never freed.
    let obj: &AnyObject = unsafe { &*(ptr as *const AnyObject) };
    let cls: &AnyClass = unsafe { &*(original as *const AnyClass) };
    unsafe { AnyObject::set_class(obj, cls) };
}

#[cfg(not(target_os = "macos"))]
fn restore_class(_w: &tauri::WebviewWindow) {}

/// Pen: the ink window takes every pointer and the keyboard. Pointer: it
/// ignores the cursor entirely (`setIgnoresMouseEvents:` / `WS_EX_TRANSPARENT`)
/// so clicks fall through to whatever is underneath, and only the pill — its
/// own window — stays clickable. Both windows are told, so they never disagree.
fn set_ink_mode(app: &tauri::AppHandle, pen: bool) {
    if let Some(ink) = app.get_webview_window(INK_LABEL) {
        let _ = ink.set_ignore_cursor_events(!pen);
        if pen {
            take_keyboard(&ink);
        }
    }
    for label in [INK_LABEL, INK_DOCK_LABEL] {
        let _ = app.emit_to(label, "sage:ink-mode", pen);
    }
}

/// Sync on purpose: window creation and the AppKit calls belong on the main
/// thread. `window` is the board that pressed the button — its monitor is the
/// one the overlay covers.
#[tauri::command]
fn desktop_ink_open(app: tauri::AppHandle, window: tauri::WebviewWindow) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    // Already open: a second press must never open a second overlay.
    if let Some(dock) = app.get_webview_window(INK_DOCK_LABEL) {
        let _ = dock.set_focus();
        return Ok(());
    }

    let monitor = match window.current_monitor().map_err(err)? {
        Some(m) => m,
        None => window
            .primary_monitor()
            .map_err(err)?
            .ok_or_else(|| "no monitor to draw over".to_string())?,
    };
    // The builder takes logical pixels; the monitor reports physical ones.
    let scale = monitor.scale_factor();
    let x = monitor.position().x as f64 / scale;
    let y = monitor.position().y as f64 / scale;
    let w = monitor.size().width as f64 / scale;
    let h = monitor.size().height as f64 / scale;

    // Hidden until app.js has booted and hidden its own chrome — a transparent
    // window must never flash the topbar. `focused(false)` for the same reason:
    // the teacher is about to switch to another app.
    let ink = WebviewWindowBuilder::new(&app, INK_LABEL, WebviewUrl::App("index.html#ink".into()))
        .title("Sage Stage — ink")
        .transparent(true)
        .decorations(false)
        .shadow(false)
        .always_on_top(true)
        .visible_on_all_workspaces(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .accept_first_mouse(true)
        .visible(false)
        .position(x, y)
        .inner_size(w, h)
        .build()
        .map_err(err)?;

    let (dw, dh) = (330.0, 62.0);
    let dock = WebviewWindowBuilder::new(
        &app,
        INK_DOCK_LABEL,
        WebviewUrl::App("desktop-ink-dock.html".into()),
    )
    .title("Sage Stage — ink controls")
    .transparent(true)
    .decorations(false)
    .shadow(false)
    .always_on_top(true)
    .visible_on_all_workspaces(true)
    .skip_taskbar(true)
    .resizable(false)
    .focused(false)
    .accept_first_mouse(true)
    .position(x + (w - dw) / 2.0, y + h - dh - 28.0)
    .inner_size(dw, dh)
    .build()
    .map_err(err)?;

    #[cfg(target_os = "macos")]
    {
        float_above_everything(&ink, 1000);
        float_above_everything(&dock, 1001);
    }

    // Pen from the start, but no focus yet — set_focus on a hidden window
    // would show it. The ink window asks for pen itself once it is visible.
    let _ = ink.set_ignore_cursor_events(false);
    Ok(())
}

#[tauri::command]
fn desktop_ink_mode(app: tauri::AppHandle, pen: bool) {
    set_ink_mode(&app, pen);
}

/// The pill's undo / redo / clear, forwarded to the ink window.
#[tauri::command]
fn desktop_ink_cmd(app: tauri::AppHandle, cmd: String) -> Result<(), String> {
    if !matches!(cmd.as_str(), "undo" | "redo" | "clear") {
        return Err(format!("unknown ink command: {cmd}"));
    }
    app.emit_to(INK_LABEL, "sage:ink-cmd", cmd).map_err(err)
}

/// Both windows, and the ink with them. destroy() rather than close(): there
/// is nothing to flush, and nothing may hold the window open.
#[tauri::command]
fn desktop_ink_close(app: tauri::AppHandle) {
    for label in [INK_LABEL, INK_DOCK_LABEL] {
        if let Some(w) = app.get_webview_window(label) {
            restore_class(&w);
            if let Err(e) = w.destroy() {
                eprintln!("desktop ink: could not close {label}: {e}");
            }
        }
    }
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_state,
            state_file_path,
            video_bridge_url,
            desktop_ink_open,
            desktop_ink_mode,
            desktop_ink_cmd,
            desktop_ink_close
        ])
        .setup(|app| {
            app.manage(VideoBridge(start_video_bridge()));

            // Developer hook, inert unless the variable is set: open the ink
            // overlay as soon as the board is up, so the native side —
            // transparency, level, the fullscreen-Space behaviour — can be
            // looked at on a machine where nothing is allowed to move the
            // mouse. Two seconds is only so the board window has settled.
            if std::env::var_os("SAGE_STAGE_OPEN_INK").is_some() {
                if let Some(main) = app.get_webview_window("main") {
                    let handle = app.handle().clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_secs(2));
                        let h = handle.clone();
                        let m = main.clone();
                        let _ = handle.run_on_main_thread(move || {
                            if let Err(e) = desktop_ink_open(h, m) {
                                eprintln!("desktop ink open failed: {e}");
                            }
                        });
                        // SAGE_INK_REPEN=<secs>: flip to pointer and back to pen
                        // that many seconds after launch, so "pen mode does
                        // not pull the teacher out of a fullscreen Space" can
                        // be checked with nobody at the mouse.
                        if let Some(secs) = std::env::var("SAGE_INK_REPEN").ok().and_then(|v| v.parse::<u64>().ok()) {
                            std::thread::sleep(std::time::Duration::from_secs(secs));
                            let h = handle.clone();
                            let _ = handle.run_on_main_thread(move || set_ink_mode(&h, false));
                            std::thread::sleep(std::time::Duration::from_secs(2));
                            let h = handle.clone();
                            let _ = handle.run_on_main_thread(move || set_ink_mode(&h, true));
                        }
                        // SAGE_INK_CLOSE=<secs>: close the overlay that many
                        // seconds after launch — destroying a class-swapped
                        // panel is the one native path nothing else exercises.
                        if let Some(secs) = std::env::var("SAGE_INK_CLOSE").ok().and_then(|v| v.parse::<u64>().ok()) {
                            std::thread::sleep(std::time::Duration::from_secs(secs));
                            let h = handle.clone();
                            let _ = handle.run_on_main_thread(move || desktop_ink_close(h));
                            // SAGE_INK_REOPEN=1: open again three seconds later and
                            // close five after that — the second cycle in one process.
                            if std::env::var_os("SAGE_INK_REOPEN").is_some() {
                                std::thread::sleep(std::time::Duration::from_secs(3));
                                let h = handle.clone();
                                let m = main.clone();
                                let _ = handle.run_on_main_thread(move || {
                                    if let Err(e) = desktop_ink_open(h, m) {
                                        eprintln!("desktop ink reopen failed: {e}");
                                    }
                                });
                                std::thread::sleep(std::time::Duration::from_secs(5));
                                let h = handle.clone();
                                let _ = handle.run_on_main_thread(move || desktop_ink_close(h));
                            }
                        }
                        // SAGE_INK_QUIT=<secs>: quit the app with the overlay open,
                        // the way Cmd+Q would.
                        if let Some(secs) = std::env::var("SAGE_INK_QUIT").ok().and_then(|v| v.parse::<u64>().ok()) {
                            std::thread::sleep(std::time::Duration::from_secs(secs));
                            let h = handle.clone();
                            let _ = handle.run_on_main_thread(move || flush_all_and_exit(&h));
                        }
                    });
                }
            }

            // macOS: replace the default Quit item with one that flushes first.
            // ExitRequested is documented as unreliable on macOS (tauri#9198), so
            // on the platform where Cmd+Q *is* how you close an app, this menu
            // item is the primary mechanism rather than a nicety.
            #[cfg(target_os = "macos")]
            {
                use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

                let quit = MenuItemBuilder::with_id("sage-quit", "Quit Sage Stage")
                    .accelerator("Cmd+Q")
                    .build(app)?;
                let app_menu = SubmenuBuilder::new(app, "Sage Stage")
                    .about(None)
                    .separator()
                    .hide()
                    .hide_others()
                    .show_all()
                    .separator()
                    .item(&quit)
                    .build()?;
                let edit_menu = SubmenuBuilder::new(app, "Edit")
                    .undo()
                    .redo()
                    .separator()
                    .cut()
                    .copy()
                    .paste()
                    .select_all()
                    .build()?;
                let window_menu = SubmenuBuilder::new(app, "Window")
                    .minimize()
                    .fullscreen()
                    .close_window()
                    .build()?;
                let menu = MenuBuilder::new(app)
                    .items(&[&app_menu, &edit_menu, &window_menu])
                    .build()?;
                app.set_menu(menu)?;

                let handle = app.handle().clone();
                app.on_menu_event(move |_app, event| {
                    if event.id() == "sage-quit" {
                        flush_all_and_exit(&handle);
                    }
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Sage Stage");

    app.run(|app, event| {
        // Cmd+W on the ink window (it is key in pen mode) or the pill: close
        // the overlay as a pair, through the path that undoes the class swap.
        if let tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::CloseRequested { api, .. }, .. } = &event {
            if label == INK_LABEL || label == INK_DOCK_LABEL {
                api.prevent_close();
                desktop_ink_close(app.clone());
                return;
            }
        }
        if let tauri::RunEvent::ExitRequested { api, .. } = &event {
            // Covers Windows shutdown/logoff and any macOS path that does fire
            // this. The FLUSHED guard lets the exit(0) that ENDS the handshake
            // pass straight through instead of starting another one.
            if !FLUSHED.load(Ordering::SeqCst) {
                api.prevent_exit();
                flush_all_and_exit(app);
            }
        }
    });
}
