#!/usr/bin/env bash
# One-time setup on the box. Everything after this is pull-only.
#
#   sudo deploy/bootstrap.sh            units, timer, network, credential check
#   sudo deploy/bootstrap.sh --route    the Traefik route, once the container is up
#
# CI cannot do this: the box drops port 22 and the only way in is Cloudflare
# Access, so the first placement of the unit, the timer and the route is a
# person's job. It is also the only step that handles a secret.
#
# **Two phases, and the order matters.** A route pointing at a container that
# does not exist yet returns 502 — and for a service owning a path prefix, that
# path is usually already being served by something else. So the route goes in
# last, after the first image has landed and the container is healthy. Until
# then the old answer keeps working.
#
# Idempotent. Re-run either phase after changing service.env or a unit file.
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
# Traefik v3's PathPrefix takes exactly one argument — PathPrefix(`/a`,`/b`) is
# rejected as "unexpected number of parameters" — so several prefixes become an
# || group rather than a list.
if [ -n "${PATHS:-}" ]; then
	group=""
	for p in ${PATHS//,/ }; do
		group="${group:+$group || }PathPrefix(\`$p\`)"
	done
	RULE="Host(\`$HOST\`) && ($group)"
else
	RULE="Host(\`$HOST\`)"
fi

ROUTE_ONLY=0
[ "${1:-}" = "--route" ] && ROUTE_ONLY=1

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

# Bash, not sed — and with patsub_replacement off.
#
# A sed replacement treats & as "the whole match", so the rule's && expanded into
# two copies of the placeholder. Bash 5.2 added exactly the same behaviour to
# ${var//pat/repl}, on by default, so moving off sed reproduced the bug
# identically. Turning the shopt off is what actually fixes it.
shopt -u patsub_replacement 2>/dev/null || true
sub() {
	local t
	t=$(cat "$1")
	t=${t//__SERVICE__/$SERVICE}
	t=${t//__REPO__/$REPO_DIR}
	t=${t//__HOST__/$HOST}
	t=${t//__RULE__/$RULE}
	printf '%s\n' "$t"
}

if [ "$ROUTE_ONLY" = 1 ]; then
	# Refuse rather than take a working path down.
	health=$(docker inspect -f '{{.State.Health.Status}}' "$SERVICE" 2>/dev/null || echo absent)
	[ "$health" = healthy ] || { echo "container is '$health', not healthy — refusing to route to it"; exit 1; }
	mkdir -p "$TRAEFIK"
	sub deploy/traefik/route.yaml > "$TRAEFIK/$SERVICE.yaml"
	echo "routed: $RULE -> $SERVICE"
	exit 0
fi

sub deploy/systemd/reconcile.service > "/etc/systemd/system/$SERVICE-reconcile.service"
sub deploy/systemd/reconcile.timer   > "/etc/systemd/system/$SERVICE-reconcile.timer"

# The shared edge network Traefik and every service sit on.
docker network inspect edge >/dev/null 2>&1 || docker network create edge

systemctl daemon-reload
systemctl enable --now "$SERVICE-reconcile.timer"

echo
echo "installed, not yet routed. the timer rotates within two minutes of a pin"
echo "landing on main:"
echo "  journalctl -u $SERVICE-reconcile -f"
echo
echo "once the container is healthy, publish the route:"
echo "  sudo deploy/bootstrap.sh --route"
