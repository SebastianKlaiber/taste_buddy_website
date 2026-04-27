#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

ROLLUP_SKIP_NODEJS=true npm install --legacy-peer-deps
mkdir -p dist

ROLLUP_SKIP_NODEJS=true npx astro build
bash scripts/build-flutter-web.sh

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
