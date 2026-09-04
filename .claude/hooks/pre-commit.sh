#!/usr/bin/env bash
# Build gate: runs before Claude executes a `git commit`.
# Blocks the commit (exit 2) if the project doesn't type-check / build.
# `npm run build` = `tsc -b && vite build`, so a pass means types are clean too.
# When the build can't run at all (no package.json, no installed deps) the gate
# steps aside with a warning rather than blocking work it can't actually judge.
#
# Scoping is deliberately belt-and-braces. settings.json narrows the hook with
# the handler's `if` field, and the stdin check below re-reads the command so a
# mis-scoped matcher can never gate every Bash call (it did once: `if` sat on
# the matcher object, which rejects unknown keys, so the gate fired on `ls`).
# When the command can't be read, the gate runs — fail towards checking.
set -uo pipefail

payload=""
[ -t 0 ] || payload=$(cat)

if [ -n "$payload" ]; then
  if command -v jq >/dev/null 2>&1; then
    cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)
  else
    cmd="$payload"
  fi

  # Anything that isn't a commit has nothing to gate. Match `git` and `commit`
  # loosely rather than adjacently, so `git -C path commit` and `cd x && git
  # commit` are still caught; over-matching only costs an unnecessary build,
  # while under-matching would let an unverified commit through unnoticed.
  if [ -n "$cmd" ] && ! printf '%s' "$cmd" | grep -Eq '\bgit\b.*\bcommit\b'; then
    exit 0
  fi
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

if [ ! -f package.json ]; then
  exit 0
fi

# Without dependencies `npm run build` reports every import as a missing module,
# which buries the actual cause. Say it plainly instead. Test for the binaries
# the build actually shells out to (`tsc -b && vite build`) rather than for
# node_modules itself: an aborted install leaves the directory there holding
# nothing but a `.tmp`, which any existence or non-empty check would accept.
if [ ! -x node_modules/.bin/vite ] || [ ! -x node_modules/.bin/tsc ]; then
  echo "Build gate SKIPPED: dependencies aren't installed, so the build can't run." >&2
  echo "This commit is NOT type-checked. Run \`npm ci\` and build before trusting it." >&2
  echo "A fresh container needs UNTITLEDUI_PRO_TOKEN set, or npm ci 401s on @untitledui-pro." >&2
  exit 0
fi

if npm run build >/tmp/hgm-precommit-build.log 2>&1; then
  exit 0
fi

echo "Build failed — commit blocked. Last lines:" >&2
tail -n 25 /tmp/hgm-precommit-build.log >&2
exit 2
