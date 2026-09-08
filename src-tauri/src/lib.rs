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
    if FLUSHED.swap(true, Ordering::SeqCst) {
        return; // already handshaking; do not stack timers
    }
    let want = app.webview_windows().len().max(1);
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

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_state, state_file_path, video_bridge_url])
        .setup(|app| {
            app.manage(VideoBridge(start_video_bridge()));

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
