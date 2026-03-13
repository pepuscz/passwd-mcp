#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 OLD_VERSION NEW_VERSION"
  echo "Example: $0 1.5.0 1.6.0"
  exit 1
fi

OLD="$1"
NEW="$2"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# All files that contain the version string (excluding node_modules, dist, lockfile)
FILES=(
  "$ROOT/packages/passwd-lib/package.json"
  "$ROOT/packages/passwd-mcp/package.json"
  "$ROOT/packages/passwd-mcp/src/index.ts"
  "$ROOT/packages/passwd-mcpb/package.json"
  "$ROOT/packages/passwd-mcpb/manifest.json"
  "$ROOT/packages/passwd-mcpb/src/index.ts"
  "$ROOT/packages/passwd-cli/package.json"
  "$ROOT/packages/passwd-cli/src/index.ts"
  "$ROOT/packages/passwd-agent-cli/package.json"
  "$ROOT/packages/passwd-agent-cli/src/index.ts"
  "$ROOT/README.md"
)

CHANGED=0
for f in "${FILES[@]}"; do
  if grep -q "$OLD" "$f"; then
    sed -i '' "s/$OLD/$NEW/g" "$f"
    CHANGED=$((CHANGED + 1))
    echo "  updated: ${f#$ROOT/}"
  else
    echo "  WARNING: $OLD not found in ${f#$ROOT/}"
  fi
done

echo ""
echo "Updated $CHANGED files: $OLD → $NEW"
echo ""
echo "Next steps:"
echo "  npm install          # regenerate lockfile"
echo "  npm run build        # verify it compiles"
echo "  npm test             # run unit tests"
echo ""

# Verify no old version remains
REMAINING=$(grep -rn "$OLD" --include="*.json" --include="*.ts" --include="*.md" "$ROOT" \
  | grep -v node_modules | grep -v package-lock | grep -v dist | grep -v '.tsbuildinfo' || true)

if [ -n "$REMAINING" ]; then
  echo "WARNING: Old version $OLD still found in:"
  echo "$REMAINING"
  exit 1
else
  echo "Verified: no remaining references to $OLD"
fi
