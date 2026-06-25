#!/usr/bin/env bash
# Build gate: runs before Claude executes a `git commit`.
# Blocks the commit (exit 2) if the project doesn't type-check / build.
# `npm run build` = `tsc -b && vite build`, so a pass means types are clean too.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

if [ ! -f package.json ]; then
  exit 0
fi

if npm run build >/tmp/hgm-precommit-build.log 2>&1; then
  exit 0
fi

echo "Build failed — commit blocked. Last lines:" >&2
tail -n 25 /tmp/hgm-precommit-build.log >&2
exit 2
