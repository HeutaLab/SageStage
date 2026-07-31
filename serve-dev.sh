#!/bin/sh
# beforeDevCommand. Idempotent on purpose: this repo often already has a static
# server on 8642 from another session, and a second python trying to bind the
# same port would exit non-zero and take `tauri dev` down with it. If something
# is already serving, stand out of the way and stay alive so Tauri keeps waiting
# on devUrl rather than treating our exit as a failure.
set -eu
cd "$(dirname "$0")"
if lsof -nP -iTCP:8642 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "serve-dev: something is already serving 8642 — using it"
  exec tail -f /dev/null
fi
echo "serve-dev: starting python http.server on 8642"
exec python3 -m http.server 8642 -d .
