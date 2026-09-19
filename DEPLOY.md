---
type: Guide
title: Deploying the suite
description: amirsalmani.com/suite is its own container on rhinocloud-de-1. Merge to main; the box pulls within two minutes.
status: active
created: 2026-09-19
timestamp: 2026-09-19
tags: [deploy, ci]
---

# Deploying the suite

**Merge to `main`.** That is the whole procedure.

The pipeline is [the estate's deploy template](https://github.com/amir-salmani/codebase/blob/main/templates/deploy/README.md),
and the suite is its first consumer. `deploy/service.env` is the only part that
is ours:

```sh
SERVICE=amirsalmani-suite
OWNER=amir-salmani/amirsalmani-suite
HOST=amirsalmani.com
PATHS=/suite,/r
BUILD=npm run ci
OUTDIR=dist
```

## Its own container, sharing a domain

`amirsalmani.com/suite` and `amirsalmani.com/r` reach **this** service;
everything else on the domain reaches amirsalmani-com, which does not know this
exists. Traefik matches on host *and* path prefix at priority 100, so the suite
wins those two prefixes against that site's catch-all router.

`/r` is here rather than there because it is the registry —
`npx shadcn@latest add @amirsalmani/button` resolves against
`amirsalmani.com/r/`, and the registry is the suite's output.

## What `npm run ci` does

Import, re-point, plates, demos, verify, record, registry, the three surfaces,
then every gate. About three minutes.

**The import runs `--offline`**, against the bytes committed in `upstream/`. A
build should not depend on obsidianui.dev being reachable, and a deploy that
changes because someone else pushed is not reproducible. Refreshing upstream is
`npm run import` locally, reviewed, and committed.

**The recordings are built, not committed.** 2.6MB of binaries were being
rewritten into history on every re-record; CI produces them and bakes them into
the image instead. `src/demos-video/`, `src/plates/` and `src/demos-usage.json`
are gitignored for that reason.

## Watching one land

```sh
gh run watch
ssh de1 journalctl -u amirsalmani-suite-reconcile -f
ssh de1 cat /opt/amirsalmani-suite/applied
curl -sI https://amirsalmani.com/suite/ | head -1
```

A green run is a pin, not yet a deploy. The rotation follows within two minutes.
