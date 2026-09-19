---
type: Guide
title: The catalogue
description: Two indexes over one set, served static — what the shape was taken from, what was refused, and the constraint that decided the markup.
status: active
created: 2026-09-15
timestamp: 2026-09-15
related:
  - ../index.md
  - geometry.md
  - https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/opensourceui-in-components.md
  - https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/microkit-co.md
---

# The catalogue

**Three static surfaces**, built 2026-09-19 per
[decisions/0019](https://github.com/amir-salmani/codebase/blob/main/decisions/0019-one-source-of-components.md):

| | | |
|---|---|---|
| `/suite/` | **sells** | hero, four recordings, FAQ. 7.3KB, because it withholds the other 114 |
| `/suite/components/` | **browses** | the two indexes over one set, finally on their own page |
| `/suite/docs/<name>/` | **documents** | 121 pages: the recording, the install command, the dependencies, the upstream sha, the usage |

One page used to do all three. That was dense at thirty items and unusable at
120, and it never told a reader which of the three they had arrived at.

**The shape is obsidianui.dev's; the delivery is not.** Theirs is Next.js with 37
scripts and first paint gated on its bundle — the pattern that cost
opensourceui.in 2796ms, and the first of the four refusals below. These are bytes
on disk under `script-src 'self'`, and every refusal survived the rebuild.

## Where the shape came from

Three teardowns now, and they supply different parts:

| | |
|---|---|
| [microkit.co](https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/microkit-co.md) | **Distribution.** A shadcn registry: one JSON per item, no package, no version, the consumer owns the copy |
| [opensourceui.in/components](https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/opensourceui-in-components.md) | **The catalogue in front of it.** Two indexes over one set |

| [obsidianui.dev](https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/obsidianui-dev.md) | **The split, and the recordings.** A landing that shows four of 102, and demos played rather than instantiated — which is how a 102-item page costs 802KB at CLS 0 |

The opensourceui one is still load-bearing, and it is worth stating plainly:

> A left rail groups the items **by category**, with counts. The body lists the
> same items **flat and alphabetical**, with the category demoted to a
> lighter-weight slash-suffix — `Button / Controls` — rather than a folder.

One dataset, two projections. A reader who knows what they want scans the A–Z
and never touches the rail; a reader who does not browses the rail and never has
to guess which of eight categories a "Stack & row" lives in. It costs one extra
loop over `src/manifest.mjs`.

## One dataset, or it drifts

`src/manifest.mjs` is the only place an item exists. The registry JSON, the
catalogue page and both proof sheets read it and nothing else. A demo in
`src/demos/` is **both** the live preview and the shown source, so the thing on
screen and the thing you copy cannot disagree — they are one file.

## What was refused

- **Client-side rendering.** opensourceui pays **2796ms to first paint** for a
  page whose whole content is 207 links; FCP and LCP are the same number, which
  means it shows nothing until the bundle has run. obsidianui.dev does the same.
  These pages are bytes on disk — **the component tier ships React, and the site
  that sells it runs none.**
- **The sponsor slot.** A legitimate way to fund a free library. Not something a
  personal suite has any use for.
- **Their row density.** Right on a desktop, and **210 undersized tap targets**
  on a 390px phone. The rows here are `min-height: 44px`.
- **Instrument Serif and the hand-drawn accent underline.** The site's entire
  personality, and theirs. `brand.md` §7 has no display serif and no accent hue.

## The constraint that decided the markup

amirsalmani.com serves **`script-src 'self'; style-src 'self'`** with no
`unsafe-inline` — `deploy/_headers.cloudflare` and `deploy/Caddyfile`, enforced
by `tools/gates.py`. That means:

- **No `style="…"` anywhere.** Every spacing decision that would have been an
  inline style is a class, which is why `stack.css` exists.
- **No inline `<script>`.** The pre-paint theme script is `suite/theme.js`, a
  classic script in `<head>` — not a module, because a module is deferred and
  the flash is the thing it exists to prevent.
- **No inline event handlers.** `catalogue.js` binds everything.
- **A demo's own `<script>` is documentation, not behaviour.** It is stripped
  before the preview is injected and shown only in the source block;
  `catalogue.js` supplies the live behaviour instead.

`tools/catalogue-proof.mjs` serves the real policy and fails on any console
error, so this is checked rather than remembered.

## Recordings, not instances

Forty items carry a `.webm` and a poster in `src/demos-video/`, filmed by
`tools/record-demos.mjs` from upstream's own published usage examples — the only
place the props each component needs are written down.

**webm, not mp4**: Playwright ships an ffmpeg with libvpx and no H.264. The
poster covers any browser that will not play webm, and the grid needs one
anyway. Under `prefers-reduced-motion: reduce` the video is hidden and the
poster stands in — a catalogue of motion that could not be calmed would be a
poor advertisement for a gate that refuses exactly that in the components.

The recordings are filmed on the component tier's own ground, `#000`, so each
tile declares that ground rather than letting a dark recording read as an empty
box on indigo.

## Adding an item

1. Write `src/components/<name>.css`. Derive every colour from the local
   `--fg`/`--bg`. No hex.
2. Write `src/demos/<name>.html`. No inline style, no inline script — it is a
   copy-paste snippet and it has to work where it lands.
3. Add the entry to `src/manifest.mjs`.
4. `node tools/build-registry.mjs && node tools/build-site.mjs`
5. `node tools/contrast.mjs && node tools/component-proof.mjs && node tools/catalogue-proof.mjs`
6. Look at the proof sheets. Three shapes in this suite changed because of what
   a render showed and not because of what the source said.

## Deploying it

```bash
node tools/build-registry.mjs
node tools/build-site.mjs
cp -r dist/r dist/suite ../amirsalmani-com/site/
cd ../amirsalmani-com && python3 tools/gates.py
```

Until that is deployed, `npx shadcn@latest add @amirsalmani/…` does not resolve
for anyone — the registry has to be *served*, not merely built.
