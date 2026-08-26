// beforeDevCommand. Node rather than sh + python3, for the same reason
// copy-dist is: this has to run on Windows, where neither `sh` nor `python3` is
// reliably on PATH, and Node already is (the Tauri CLI is invoked through npx).
//
// Idempotent on purpose: this repo often already has a static server on 8642
// from another session, and a second one trying to bind the same port would
// exit non-zero and take `tauri dev` down with it. If something is already
// serving, stand out of the way and stay alive so Tauri keeps waiting on devUrl
// rather than treating our exit as a failure.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8642;

// text/css is the one that actually matters: a stylesheet served with the wrong
// type is REFUSED in standards mode, so the app would render unstyled and the
// cause would be invisible. Classic scripts are lenient about theirs; fonts and
// images do not care. The rest are here to be correct rather than to be needed.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.icns': 'image/icns',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
};

const server = createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('bad request'); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';

  // Contain every request inside the repo. python's http.server did this for
  // us; a hand-rolled server that forgets it serves ~/.ssh to anything that
  // asks for enough ../.
  const target = resolve(ROOT, '.' + pathname);
  if (target !== ROOT && !target.startsWith(ROOT + sep)) { res.writeHead(403).end('forbidden'); return; }

  let st;
  try { st = statSync(target); } catch { res.writeHead(404).end('not found'); return; }
  if (st.isDirectory()) {
    try { st = statSync(join(target, 'index.html')); } catch { res.writeHead(404).end('not found'); return; }
    return send(res, join(target, 'index.html'), st);
  }
  send(res, target, st);
});

function send(res, file, st) {
  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'content-length': st.size,
    // The app ships ?v= cache-busters for production; in dev, never cache at
    // all, or an edit to app.js is invisible until a hard reload nobody thinks
    // to do.
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}

// 127.0.0.1, not 0.0.0.0 as python's default was: a dev server holding a
// teacher's lesson file has no business being reachable from the staff wifi.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`serve-dev: serving ${ROOT} on http://localhost:${PORT}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`serve-dev: something is already serving ${PORT} — using it`);
    setInterval(() => {}, 1 << 30);   // stay alive; Tauri waits on devUrl, not on us
    return;
  }
  console.error('serve-dev:', e.message);
  process.exit(1);
});
