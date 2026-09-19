#!/usr/bin/env bash
# Pull-only deploy. Git holds the desired state — an image and the sha256 of its
# bytes, written by CI to deploy/release.env — and this box reconciles to it.
#
# Nothing is ever pushed inward. Port 22 is dropped at the firewall and the only
# way to a shell here is Cloudflare Access, so CI cannot reach this box and does
# not need to: it writes a pin to a branch, and the timer finds it.
#
# Re-running is safe. It exits 0 and silent when the pinned image is already the
# running one, so a two-minute timer is cheap.
set -euo pipefail

REPO_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO_DIR"

# shellcheck disable=SC1091
. deploy/service.env
BASE=${SERVICE_BASE:-/opt/$SERVICE}
APPLIED=$BASE/applied

git fetch --quiet origin main
git reset --hard --quiet origin/main

# This script lives in the repository it has just updated, and bash reads a
# script as it executes it — so carrying on here can run a mixture of two
# versions. Re-exec the fresh copy from a stable path, exactly once.
if [ "${RECONCILE_FRESH:-}" != "1" ]; then
	install -m 700 deploy/reconcile.sh "/run/$SERVICE-reconcile.sh"
	RECONCILE_FRESH=1 exec "/run/$SERVICE-reconcile.sh" "$@"
fi

# shellcheck disable=SC1091
. deploy/release.env   # IMAGE, RELEASE, SHA256
[ -n "${IMAGE:-}" ] && [ -n "${SHA256:-}" ] || { echo "release.env is incomplete"; exit 1; }

previous=$(cat "$APPLIED" 2>/dev/null || true)
[ "$IMAGE" = "$previous" ] && exit 0

echo "rotating: ${previous:-<none>} -> $IMAGE"

# A token minted for this run, expired by GitHub within the hour. The box holds
# a private key, never a token.
token=$(GH_APP_BASE=$BASE deploy/gh-app-token.sh)
tar=$(mktemp "/tmp/$SERVICE-XXXXXX.tar.zst")
trap 'rm -f "$tar"' EXIT

asset=$(curl -sf -m 30 -H "Authorization: Bearer $token" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$OWNER/releases/tags/$RELEASE" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["assets"][0]["id"])')

curl -sfL -m 300 -H "Authorization: Bearer $token" -H "Accept: application/octet-stream" \
  "https://api.github.com/repos/$OWNER/releases/assets/$asset" -o "$tar"

# The pin. A tag can be moved and a download can be truncated; these bytes
# cannot be anything other than what CI built.
echo "$SHA256  $tar" | sha256sum -c - >/dev/null || { echo "sha256 mismatch — refusing to load"; exit 1; }

zstd -dc "$tar" | docker load >/dev/null

COMPOSE="docker compose -f $REPO_DIR/deploy/compose.yaml --project-name $SERVICE"
roll() { IMAGE="$1" SERVICE="$SERVICE" $COMPOSE up -d --wait --wait-timeout 60; }

if roll "$IMAGE"; then
	printf '%s\n' "$IMAGE" > "$APPLIED"
	docker image prune -f --filter 'until=168h' >/dev/null 2>&1 || true
	echo "live: $IMAGE"
else
	echo "FAILED to come up healthy on $IMAGE"
	# A rollback that cannot run is worse than none: the previous image may have
	# been pruned, so this checks before promising.
	if [ -n "$previous" ] && docker image inspect "$previous" >/dev/null 2>&1; then
		echo "rolling back to $previous"
		roll "$previous" && echo "rolled back" || echo "ROLLBACK ALSO FAILED — service is down"
	else
		echo "no previous image on disk — cannot roll back"
	fi
	exit 1
fi
