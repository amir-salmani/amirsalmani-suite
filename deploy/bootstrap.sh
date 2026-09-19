#!/usr/bin/env bash
# One-time setup on the box. Everything after this is pull-only.
#
#   sudo deploy/bootstrap.sh
#
# CI cannot do this: the box drops port 22 and the only way in is Cloudflare
# Access, so the first placement of the unit, the timer and the route is a
# person's job. It is also the only step that handles a secret.
#
# Idempotent. Re-run it after changing service.env or a unit file.
set -euo pipefail

REPO_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO_DIR"
# shellcheck disable=SC1091
. deploy/service.env

BASE=${SERVICE_BASE:-/opt/$SERVICE}
TRAEFIK=${TRAEFIK_DYNAMIC:-/opt/traefik/dynamic}

[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }

# The rule. A service owning path prefixes shares its host with another service,
# so it must match on both and outrank the host's own catch-all.
if [ -n "${PATHS:-}" ]; then
	prefixes=$(printf '%s' "$PATHS" | tr ',' '\n' | sed 's/^/`/;s/$/`/' | paste -sd, -)
	RULE="Host(\`$HOST\`) && PathPrefix($prefixes)"
else
	RULE="Host(\`$HOST\`)"
fi

mkdir -p "$BASE"
echo "base:    $BASE"
echo "rule:    $RULE"

# The credential. A private key, never a token — see deploy/gh-app-token.sh.
if [ ! -f "$BASE/gh-app.pem" ] || [ ! -f "$BASE/app.env" ]; then
	cat >&2 <<MSG

  Missing the GitHub App credential. Place both, then re-run:

    $BASE/gh-app.pem   the app private key          (chmod 600, root)
    $BASE/app.env      APP_ID=... INSTALLATION_ID=... (chmod 600, root)

  The app needs read access to $OWNER and nothing else.
MSG
	exit 1
fi
chmod 600 "$BASE/gh-app.pem" "$BASE/app.env"

sub() { sed -e "s#__SERVICE__#$SERVICE#g" -e "s#__REPO__#$REPO_DIR#g" -e "s#__HOST__#$HOST#g" -e "s#__RULE__#$RULE#g" "$1"; }

sub deploy/systemd/reconcile.service > "/etc/systemd/system/$SERVICE-reconcile.service"
sub deploy/systemd/reconcile.timer   > "/etc/systemd/system/$SERVICE-reconcile.timer"

mkdir -p "$TRAEFIK"
sub deploy/traefik/route.yaml > "$TRAEFIK/$SERVICE.yaml"

# The shared edge network Traefik and every service sit on.
docker network inspect edge >/dev/null 2>&1 || docker network create edge

systemctl daemon-reload
systemctl enable --now "$SERVICE-reconcile.timer"

echo
echo "installed. first rotation happens within two minutes of a pin landing on main:"
echo "  journalctl -u $SERVICE-reconcile -f"
