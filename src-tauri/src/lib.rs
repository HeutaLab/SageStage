/* Sage Stage — the desktop shell.
   Design: docs/storage-abstraction-plan.md §4, §7.

   Two jobs, and only two. Write the state file so a power cut cannot leave half
   of it on disk, and make sure the app never exits with a teacher's last
   sentence still sitting in a debounce timer. Everything else — what to write,
   when, and what to keep — is storage.js's business. */

use std::io::Write;
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
        .invoke_handler(tauri::generate_handler![save_state, state_file_path])
        .setup(|app| {
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
