// Writes latest.json — the file every installed Sage Stage reads to learn
// whether a newer version exists (docs/updater-design.md). Run by the
// `manifest` job in .github/workflows/release.yml once both platform builds
// are in; nothing here runs on a teacher's machine.
//
//   node release-manifest.mjs <dir of built bundles> <out file>
//
// The URLs point at the release assets GitHub will serve once the draft is
// published. GitHub renames an asset on upload — a space becomes a dot — so
// the names here are the renamed ones, not the bundler's.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const [dir, out] = process.argv.slice(2);
if (!dir || !out) {
  console.error('usage: node release-manifest.mjs <bundles dir> <out file>');
  process.exit(2);
}

const tag = process.env.GITHUB_REF_NAME;
const repo = process.env.GITHUB_REPOSITORY || 'HeutaLab/SageStage';
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) fail(`GITHUB_REF_NAME must be a tag like v0.3.0, got ${JSON.stringify(tag)}`);
const version = tag.slice(1);

// The app compares the manifest's version with its own, so a tag that
// disagrees with tauri.conf.json would either move nobody or move everyone
// again on every check. Refuse to write one.
const conf = JSON.parse(readFileSync(new URL('./src-tauri/tauri.conf.json', import.meta.url), 'utf8'));
if (conf.version !== version) fail(`tag ${tag} but src-tauri/tauri.conf.json says ${conf.version} — bump it before tagging`);

const files = walk(dir);
const one = (re, what) => {
  const hits = files.filter((f) => re.test(basename(f)));
  if (hits.length !== 1) fail(`expected exactly one ${what}, found ${hits.length}${hits.length ? ': ' + hits.map((h) => basename(h)).join(', ') : ''}`);
  return hits[0];
};
const entry = (file) => ({
  url: `https://github.com/${repo}/releases/download/${tag}/${basename(file).replace(/ /g, '.')}`,
  signature: readFileSync(file + '.sig', 'utf8').trim(),
});

const mac = entry(one(/\.app\.tar\.gz$/, 'macOS .app.tar.gz'));
const nsis = entry(one(/-setup\.exe$/, 'Windows setup.exe'));

// The keys are what the plugin looks up: {os}-{arch}-{installer} first, then
// {os}-{arch}. The universal Mac build serves both architectures. The MSI is
// deliberately absent: it installs per machine, so updating it would want an
// administrator at the moment the teacher quits — IT deploys those and updates
// them itself (licensing-design.md §9.3). An MSI-installed app finds no entry
// here and does nothing.
const manifest = {
  version,
  pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  notes: `Sage Stage ${version}`,
  platforms: {
    'darwin-aarch64': mac,
    'darwin-x86_64': mac,
    'windows-x86_64-nsis': nsis,
  },
};
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(readFileSync(out, 'utf8'));

function walk(d) {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
function fail(msg) {
  console.error('release-manifest: ' + msg);
  process.exit(1);
}
