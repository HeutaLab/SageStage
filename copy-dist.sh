#!/bin/sh
# Assemble dist/ for `tauri build`.
#
# frontendDist is a DIRECTORY and Tauri embeds it whole and recursively, so it
# cannot be the repo root: that would swallow src-tauri/target (multi-GB after
# one build) and .git, and would thrash tauri-build's rebuild detection because
# target/ changes on every build. Hence a copy step. Dev does not need it —
# devUrl serves straight from the repo.
#
# THE FILE LIST IS DERIVED FROM index.html, NEVER HAND-MAINTAINED. The plan's
# §7 listed eight files; index.html actually loads seventeen scripts, so a
# hand-kept list had already rotted before it was used once, and the failure
# mode is a desktop build that boots to a blank screen because english-text.js
# was not copied. Parse the document that is the authority and the list cannot
# drift again.
set -eu
cd "$(dirname "$0")"

OUT=dist
rm -rf "$OUT"
mkdir -p "$OUT"

cp index.html "$OUT/"

# every local src="..." and href="..." in index.html, minus data: and absolute URLs,
# with any ?v= cache-buster stripped
# grep -oE, not sed with \| — BSD sed has no alternation in basic regex and
# returned an empty list silently, which is the exact failure this whole
# derive-don't-hardcode approach exists to avoid. grep -o also handles more than
# one attribute on a line, which a greedy sed would have collapsed to the last.
ASSETS=$(grep -oE '(src|href)="[^"]*"' index.html \
  | sed -E 's/^[a-z]+="//; s/"$//' \
  | grep -v '^data:' | grep -v '^https\?://' | grep -v '^//' | grep -v '^#' \
  | sed 's/?.*$//' | sort -u)

MISSING=0
for f in $ASSETS; do
  if [ -f "$f" ]; then
    mkdir -p "$OUT/$(dirname "$f")"
    cp "$f" "$OUT/$f"
  else
    echo "copy-dist: referenced by index.html but not on disk: $f" >&2
    MISSING=1
  fi
done
[ "$MISSING" -eq 0 ] || { echo "copy-dist: refusing to build a broken dist" >&2; exit 1; }

# Directories fetched at RUNTIME by relative path — invisible to the
# index.html parse above, which only sees load-time script/link tags:
#   community/  — bundled templates (fetch of community/index.json)
#   vendor/     — fonts.css pulls .woff2 via CSS url(), and export/print/pptx
#                 lazily loadScript() jszip / jspdf / html2canvas / pptxgen.
# Missing vendor/ shipped a desktop build where every export died as a 404 and
# the bundled typefaces fell back to system fonts (found in the 2026-07-31
# click assessment). If another runtime-fetched directory ever appears, it
# must be added here — the index.html derivation cannot see it.
[ -d community ] && cp -R community "$OUT/"
[ -d vendor ] && { rm -rf "$OUT/vendor"; cp -R vendor "$OUT/"; }

echo "copy-dist: $(find "$OUT" -type f | wc -l | tr -d ' ') files into $OUT/"
