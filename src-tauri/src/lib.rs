/* Sage Stage — the desktop shell.
   Design: docs/storage-abstraction-plan.md §7.

   PHASE 2 IS PLUGINS ONLY, deliberately. The `save_state` command, the quit
   handshake and the macOS Quit menu item are §4/§7 work and land in phase 3 —
   until then the app runs inside this window on the SAME localStorage backend it
   uses in a browser, which is exactly what phase 2 is for: prove the shell, the
   CSP and the asset protocol before anything starts writing files.

   Adding the file backend before the window is known-good would mean debugging
   two new things at once, and one of them owns a teacher's only copy of their
   work. */

pub fn run() {
    tauri::Builder::default()
        // fs: the data file under Documents (phase 3). Registered now so the
        // capability file and the permission set are proven in phase 2 rather
        // than discovered to be wrong the first time something writes.
        .plugin(tauri_plugin_fs::init())
        // opener: "Show in Finder", and the external links the app already has.
        .plugin(tauri_plugin_opener::init())
        // dialog: the export save-panel, needed because blob-anchor downloads do
        // not work in WKWebView (§4).
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running Sage Stage");
}
