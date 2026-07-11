#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_REPO_URL="${TASTE_BUDDY_APP_REPO_URL:-https://github.com/SebastianKlaiber/taste_buddy.git}"
APP_REF="${TASTE_BUDDY_APP_REF:-main}"
FLUTTER_VERSION="${FLUTTER_VERSION:-3.41.7}"
APP_BASE_HREF="${TASTE_BUDDY_WEB_APP_BASE_HREF:-/app/}"
APP_LOCAL_PATH="${TASTE_BUDDY_APP_LOCAL_PATH:-}"
DART_DEFINE_FILE="${TASTE_BUDDY_DART_DEFINE_FILE:-config/config.env}"
BUILD_DIR="${ROOT_DIR}/.netlify/flutter-app"
FLUTTER_CACHE_DIR="${NETLIFY_CACHE_DIR:-${ROOT_DIR}/.netlify/cache}/flutter-${FLUTTER_VERSION}"

ensure_flutter() {
  if command -v flutter >/dev/null 2>&1; then
    flutter --version
    return
  fi

  if [ ! -x "${FLUTTER_CACHE_DIR}/bin/flutter" ]; then
    rm -rf "${FLUTTER_CACHE_DIR}"
    mkdir -p "$(dirname "${FLUTTER_CACHE_DIR}")"
    git clone --depth 1 --branch "${FLUTTER_VERSION}" https://github.com/flutter/flutter.git "${FLUTTER_CACHE_DIR}"
  fi

  export PATH="${FLUTTER_CACHE_DIR}/bin:${PATH}"
  flutter --version
}

resolve_app_repo() {
  if [ -n "${APP_LOCAL_PATH}" ]; then
    echo "${APP_LOCAL_PATH}"
    return
  fi

  if [ -d "${ROOT_DIR}/../taste_buddy/taste_buddy_flutter" ]; then
    echo "${ROOT_DIR}/../taste_buddy"
    return
  fi

  if [ -z "${TASTE_BUDDY_APP_REPO_TOKEN:-}" ]; then
    echo "Missing TASTE_BUDDY_APP_REPO_TOKEN for private app repo clone." >&2
    exit 1
  fi

  rm -rf "${BUILD_DIR}"
  mkdir -p "$(dirname "${BUILD_DIR}")"
  git clone --depth 1 --branch "${APP_REF}" "https://x-access-token:${TASTE_BUDDY_APP_REPO_TOKEN}@${APP_REPO_URL#https://}" "${BUILD_DIR}"
  echo "${BUILD_DIR}"
}

ensure_flutter

APP_REPO_DIR="$(resolve_app_repo)"
APP_DIR="${APP_REPO_DIR}/taste_buddy_flutter"

if [ ! -d "${APP_DIR}" ]; then
  echo "Flutter app directory not found: ${APP_DIR}" >&2
  exit 1
fi

if [ ! -f "${APP_DIR}/${DART_DEFINE_FILE}" ]; then
  echo "Dart define file not found: ${APP_DIR}/${DART_DEFINE_FILE}" >&2
  exit 1
fi

if ! grep -q '^SUPABASE_URL=' "${APP_DIR}/${DART_DEFINE_FILE}" || \
  ! grep -q '^SUPABASE_ANON_KEY=' "${APP_DIR}/${DART_DEFINE_FILE}" || \
  ! grep -q '^APP_CHECK_RECAPTCHA_SITE_KEY=' "${APP_DIR}/${DART_DEFINE_FILE}" || \
  ! grep -q '^USE_SUPABASE=true$' "${APP_DIR}/${DART_DEFINE_FILE}"; then
  echo "Dart define file is missing required production app keys: ${DART_DEFINE_FILE}" >&2
  exit 1
fi

mkdir -p "${ROOT_DIR}/dist/app"

(
  cd "${APP_DIR}"
  flutter config --enable-web
  flutter pub get
  echo "Building Flutter web with Dart defines from ${DART_DEFINE_FILE}"
  flutter build web \
    --release \
    --base-href="${APP_BASE_HREF}" \
    --no-wasm-dry-run \
    --no-web-resources-cdn \
    --dart-define-from-file="${DART_DEFINE_FILE}" \
    -o "${ROOT_DIR}/dist/app"
)
