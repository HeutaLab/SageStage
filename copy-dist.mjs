// Assemble dist/ for `tauri build`. Node, not sh, because this runs as
// beforeBuildCommand and therefore has to work on Windows — where the shell
// version needed sh plus grep/sed/sort/find/cp/tr/wc, none of which are on PATH
// unless Git for Windows' usr/bin happens to have been added to it. Node is
// already a hard dependency of the build (the CLI is invoked through npx), so
// this costs nothing and removes the shell entirely.
//
// frontendDist is a DIRECTORY and Tauri embeds it whole and recursively, so it
// cannot be the repo root: that would swallow src-tauri/target (multi-GB after
// one build) and .git, and would thrash tauri-build's rebuild detection because
// target/ changes on every build. Hence a copy step. Dev does not need it —
// devUrl serves straight from the repo.
//
// THE FILE LIST IS DERIVED FROM index.html, NEVER HAND-MAINTAINED. The plan's
// §7 listed eight files; index.html actually loads seventeen scripts, so a
// hand-kept list had already rotted before it was used once, and the failure
// mode is a desktop build that boots to a blank screen because english-text.js
// was not copied. Parse the document that is the authority and the list cannot
// drift again.
import { existsSync, mkdirSync, rmSync, cpSync, copyFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'dist');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
copyFileSync(join(ROOT, 'index.html'), join(OUT, 'index.html'));

// every local src="..." and href="..." in index.html, minus data: and absolute
// URLs, with any ?v= cache-buster stripped. Sorted and de-duplicated so the
// output is stable and comparable between runs.
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const assets = [...new Set(
  [...html.matchAll(/(?:src|href)="([^"]*)"/g)]
    .map((m) => m[1])
    .filter((u) => !/^(data:|https?:\/\/|\/\/|#)/.test(u))
    .map((u) => u.replace(/\?.*$/, ''))
    .filter(Boolean),
)].sort();

let missing = 0;
for (const rel of assets) {
  const src = join(ROOT, rel);
  if (existsSync(src)) {
    mkdirSync(join(OUT, dirname(rel)), { recursive: true });
    copyFileSync(src, join(OUT, rel));
  } else {
    console.error(`copy-dist: referenced by index.html but not on disk: ${rel}`);
    missing = 1;
  }
}
if (missing) {
  console.error('copy-dist: refusing to build a broken dist');
  process.exit(1);
}

// Directories fetched at RUNTIME by relative path — invisible to the
// index.html parse above, which only sees load-time script/link tags:
//   community/  — bundled templates (fetch of community/index.json)
//   vendor/     — fonts.css pulls .woff2 via CSS url(), and export/print/pptx
//                 lazily loadScript() jszip / jspdf / html2canvas / pptxgen.
// Missing vendor/ shipped a desktop build where every export died as a 404 and
// the bundled typefaces fell back to system fonts (found in the 2026-07-31
// click assessment). If another runtime-fetched directory ever appears, it
// must be added here — the index.html derivation cannot see it.
for (const dir of ['community', 'vendor']) {
  if (existsSync(join(ROOT, dir))) {
    rmSync(join(OUT, dir), { recursive: true, force: true });
    cpSync(join(ROOT, dir), join(OUT, dir), { recursive: true });
  }
}

const count = (function walk(d) {
  let n = 0;
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    n += statSync(p).isDirectory() ? walk(p) : 1;
  }
  return n;
})(OUT);
console.log(`copy-dist: ${count} files into dist/`);
