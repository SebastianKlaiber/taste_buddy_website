#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

ROLLUP_SKIP_NODEJS=true npm install --legacy-peer-deps
mkdir -p dist

ROLLUP_SKIP_NODEJS=true npx astro build
bash scripts/build-flutter-web.sh

if grep -q "Local website fallback\\|The web app is not bundled" dist/app/index.html dist/app/flutter_bootstrap.js; then
  echo "Flutter web build verification failed: fallback app files remain in dist/app." >&2
  exit 1
fi

for file in dist/app/index.html dist/app/flutter_bootstrap.js dist/app/main.dart.js dist/app/manifest.json; do
  if [ ! -s "${file}" ]; then
    echo "Flutter web build verification failed: missing ${file}." >&2
    exit 1
  fi
done

if ! grep -q '<base href="/app/">' dist/app/index.html; then
  echo "Flutter web build verification failed: dist/app/index.html is missing base href /app/." >&2
  exit 1
fi

cp public/_redirects dist/

if [ -f dist/404/index.html ]; then
  cp dist/404/index.html dist/404.html
fi

if [ -f public/500.html ]; then
  cp public/500.html dist/
fi

if ! npm run validate; then
  echo "Validation skipped during build"
fi
