#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BUNDLE_DIR="$SCRIPT_DIR/.bundle"
OUT_FILE="$SCRIPT_DIR/passwd.mcpb"

echo "Building TypeScript..."
npx tsc -b

echo "Preparing bundle directory..."
rm -rf "$BUNDLE_DIR" "$OUT_FILE"
mkdir -p "$BUNDLE_DIR/dist"

# Copy compiled server
cp -r dist/*.js dist/*.js.map "$BUNDLE_DIR/dist/"

# Copy manifest
cp manifest.json "$BUNDLE_DIR/"

# Install production dependencies into bundle
# Pin passwd-lib to latest published version (the real version may not be published yet),
# then overwrite with local build
cp package.json "$BUNDLE_DIR/"
cd "$BUNDLE_DIR"
node -e "
  const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
  if (pkg.dependencies?.['@passwd/passwd-lib']) {
    pkg.dependencies['@passwd/passwd-lib'] = 'latest';
  }
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
npm install --omit=dev --ignore-scripts 2>/dev/null
# Overwrite published @passwd/passwd-lib with local build
rm -rf node_modules/@passwd/passwd-lib/dist
cp -r "$SCRIPT_DIR/../passwd-lib/dist" node_modules/@passwd/passwd-lib/dist
# Keep a minimal package.json so Node.js knows this is an ESM project
echo '{"type":"module"}' > package.json
rm -f package-lock.json

# Pack as .mcpb (zip)
echo "Creating passwd.mcpb..."
cd "$BUNDLE_DIR"
zip -qr "$OUT_FILE" .

# Cleanup
rm -rf "$BUNDLE_DIR"

echo "Built: $OUT_FILE"
ls -lh "$OUT_FILE"
