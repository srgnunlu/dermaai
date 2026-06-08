#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/dermaai-mobile"

cd "$ROOT_DIR"

echo "==> Root typecheck, tests, and production build"
pnpm check
pnpm test
pnpm build

echo "==> Mobile typecheck and dependency audit"
pnpm --dir dermaai-mobile check
pnpm --dir dermaai-mobile audit --audit-level moderate

echo "==> Expo health and iOS export"
(
  cd "$MOBILE_DIR"
  npx expo install --check
  npx expo-doctor
  npx expo export --platform ios --clear
)

echo "==> App Store asset checks"
test -f "$MOBILE_DIR/assets/images/icon.png"
test -f "$MOBILE_DIR/assets/images/splash-icon.png"
test -f "$MOBILE_DIR/assets/images/adaptive-icon.png"
test -f "$MOBILE_DIR/assets/images/notification-icon.png"
test -f "$MOBILE_DIR/eas.json"
test -f "$MOBILE_DIR/docs/APP_PRIVACY_MATRIX.md"
test -f "$MOBILE_DIR/docs/APP_STORE_METADATA.md"

icon_width="$(sips -g pixelWidth "$MOBILE_DIR/assets/images/icon.png" | awk '/pixelWidth/ { print $2 }')"
icon_height="$(sips -g pixelHeight "$MOBILE_DIR/assets/images/icon.png" | awk '/pixelHeight/ { print $2 }')"
icon_alpha="$(sips -g hasAlpha "$MOBILE_DIR/assets/images/icon.png" | awk '/hasAlpha/ { print $2 }')"
notification_alpha="$(sips -g hasAlpha "$MOBILE_DIR/assets/images/notification-icon.png" | awk '/hasAlpha/ { print $2 }')"

if [[ "$icon_width" != "1024" || "$icon_height" != "1024" || "$icon_alpha" != "no" ]]; then
  echo "App Store icon must be 1024x1024 and must not contain alpha."
  exit 1
fi

if [[ "$notification_alpha" != "yes" ]]; then
  echo "Android notification icon must use a transparent background."
  exit 1
fi

echo "==> Risky public claim scan"
if rg -n -i \
  "diagnosis system|clinical decision support|high accuracy|training and improving AI models|model eğitimi ve iyileştirilmesi|güven oranı|corium scan|dermassist ai|idXXXXXXXXXX|Firebase Analytics|AES-256|penetration testing|2FA support|ISO 27001|99\\.5%" \
  "$MOBILE_DIR/app" "$MOBILE_DIR/components" "$MOBILE_DIR/constants" "$MOBILE_DIR/utils" \
  "$ROOT_DIR/client/index.html" "$ROOT_DIR/client/src/pages" "$ROOT_DIR/client/src/components" \
  "$ROOT_DIR/server/openai.ts" "$ROOT_DIR/server/gemini.ts"; then
  echo "Risky or stale public claims found."
  exit 1
fi

echo "==> Hardcoded secret scan"
if git grep -n -E \
  '(sk-(proj-)?[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{25,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)' \
  -- ':!*.lock' ':!pnpm-lock.yaml' ':!dermaai-mobile/pnpm-lock.yaml'; then
  echo "Potential hardcoded secret found."
  exit 1
fi

echo "==> Public endpoint checks"
for url in \
  "https://www.corioscan.com/privacy-policy" \
  "https://www.corioscan.com/contact-support" \
  "https://www.corioscan.com/terms-of-service" \
  "https://dermaai-1d9i.onrender.com/api/health"; do
  status="$(curl -L -sS -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$status" != "200" ]]; then
    echo "Expected HTTP 200 from $url, received $status"
    exit 1
  fi
done

echo "Local App Store readiness checks passed."
