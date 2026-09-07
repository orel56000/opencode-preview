#!/usr/bin/env bash
# Rebuild the preview-enabled OpenCode Desktop app on top of the latest upstream.
#
# Run this after each official OpenCode release to keep the Preview button
# working with updates:
#
#   ./scripts/rebuild-desktop.sh
#
# Env overrides:
#   OPENCODE_SRC   existing opencode checkout (default: /tmp/opencode-desktop-src)
#   UPSTREAM_REF   upstream ref to build on (default: origin/dev)
#   SKIP_INSTALL   set to 1 to skip `bun install`
#
# Result: $OPENCODE_SRC/packages/desktop/dist/mac-arm64/OpenCode Dev.app
set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${OPENCODE_SRC:-/tmp/opencode-desktop-src}"
REF="${UPSTREAM_REF:-origin/dev}"
PATCH_DIR="$PLUGIN_ROOT/desktop-patch/upstream-commits"

export PATH="$HOME/.bun/bin:$PATH"
command -v bun >/dev/null || { echo "bun is required (https://bun.sh)"; exit 1; }

if [ ! -d "$SRC/.git" ]; then
  echo "Cloning upstream opencode into $SRC ..."
  git clone --depth 100 https://github.com/sst/opencode.git "$SRC"
fi

cd "$SRC"
git fetch origin
git checkout -B preview-desktop-slot "$REF"

echo "Applying preview patches ..."
if ! git am "$PATCH_DIR"/0001-*.patch "$PATCH_DIR"/0002-*.patch; then
  echo "git am failed, aborting (resolve manually in $SRC)"
  git am --abort
  exit 1
fi

echo "Pointing file: dependency at this checkout ..."
python3 - "$PLUGIN_ROOT" <<'EOF'
import json, sys
plugin_root = sys.argv[1]
p = "packages/desktop/package.json"
d = json.load(open(p))
d["dependencies"]["@orel56000/opencode-preview"] = f"file:{plugin_root}"
json.dump(d, open(p, "w"), indent=2)
open(p, "a").write("\n")
EOF

if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  echo "Installing dependencies (bun) ..."
  bun install
fi

echo "Building desktop ..."
(cd packages/desktop && bun run build)

echo "Packaging macOS app (unsigned) ..."
(cd packages/desktop && CSC_IDENTITY_AUTO_DISCOVERY=false bun run package:mac)

APP="$SRC/packages/desktop/dist/mac-arm64/OpenCode Dev.app"
echo ""
echo "Done: $APP"
echo "Launch it any time with: open \"$APP\""
