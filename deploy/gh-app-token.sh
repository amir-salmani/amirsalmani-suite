#!/usr/bin/env bash
# Print a short-lived GitHub installation token.
#
# The box holds a private key, never a token. This signs a 9-minute JWT, trades
# it for an installation token that GitHub expires in an hour and that can only
# read this one repository, and writes it to stdout. Revoking it is uninstalling
# the app in GitHub settings; the installation id is in app.env beside the key.
set -euo pipefail

BASE=${GH_APP_BASE:?set by reconcile.sh}
KEY=$BASE/gh-app.pem
# shellcheck disable=SC1091
. "$BASE/app.env"   # APP_ID, INSTALLATION_ID

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

now=$(date +%s)
header=$(printf '{"alg":"RS256","typ":"JWT"}' | b64url)
payload=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$((now - 60))" "$((now + 540))" "$APP_ID" | b64url)
signature=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -sign "$KEY" -binary | b64url)

curl -sf -m 20 -X POST \
  -H "Authorization: Bearer ${header}.${payload}.${signature}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/app/installations/${INSTALLATION_ID}/access_tokens" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])'
