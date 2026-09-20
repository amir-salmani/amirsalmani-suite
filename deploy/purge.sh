#!/usr/bin/env bash
# Tell the edge to forget this service's paths. Called by reconcile.sh after a
# rotation that came up healthy, because the box is the only thing that knows
# when that happened — CI writes a pin and cannot see what the box did with it.
#
# Optional, and silent when not configured. A service whose assets are named for
# a hash of their bytes does not need this: the Caddyfile holds those for a year
# and a change changes the URL. It exists for the rest — HTML under a stable
# path, a registry JSON, anything a build rewrites in place.
#
# The credential, if you want one:
#
#   /opt/<service>/cloudflare.env   CF_ZONE_ID=...  CF_PURGE_TOKEN=...
#                                   chmod 600, root
#
# Scope the token to Cache Purge on that one zone and nothing else. It is the
# second durable secret on a box whose whole story is having one, so it buys its
# place only if the service cannot hash its assets.
set -euo pipefail

BASE=${SERVICE_BASE:-/opt/${SERVICE:?set by reconcile.sh}}
ENV_FILE=$BASE/cloudflare.env
[ -f "$ENV_FILE" ] || exit 0

# shellcheck disable=SC1090
. "$ENV_FILE"
[ -n "${CF_ZONE_ID:-}" ] && [ -n "${CF_PURGE_TOKEN:-}" ] || { echo "cloudflare.env is incomplete — not purging"; exit 0; }

# The prefixes this service owns, which are the only ones it may purge.
prefixes=$(
  if [ -n "${PATHS:-}" ]; then
    printf '%s' "$PATHS" | tr ',' '\n' | sed "s|^|\"https://$HOST|;s|$|\"|" | paste -sd, -
  else
    printf '"https://%s/"' "$HOST"
  fi
)

# A failed purge is stale content, not a bad deploy. Report and carry on.
if curl -sf -m 30 -X POST \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_PURGE_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"prefixes\":[$prefixes]}" >/dev/null
then
  echo "purged: $prefixes"
else
  echo "PURGE FAILED — the rotation is live, the edge may serve stale content for its TTL"
fi
