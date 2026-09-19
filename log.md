---
type: Log
title: Suite log
description: Newest first, one bullet per change.
status: active
created: 2026-09-15
timestamp: 2026-09-15
---

# Log

## 2026-09-15 — the catalogue

- **Digested `opensourceui.in`, both pages**, into two teardowns. The
  transferable finding is the catalogue model: *two indexes over one set* — a
  category rail and a flat A–Z list with the category demoted to a suffix rather
  than a folder. Not taken: client-rendering a page of links (2796ms to first
  paint), the sponsor slot, their row density (210 undersized tap targets on a
  phone), and the display serif.
- **The suite went from 5 items to 30.** One CSS file per item, one demo per
  item, and `src/manifest.mjs` as the only place an item exists — the registry,
  the catalogue and both proof sheets read it and nothing else.
- **A demo is the preview and the snippet at once**, so what is on screen and
  what you copy cannot disagree.
- **The catalogue is static and lives at `amirsalmani.com/suite/`.** The registry
  is served from `/r/`, which is what makes `npx shadcn add @amirsalmani/…`
  resolve at all.
- **The CSP decided the markup.** `script-src 'self'; style-src 'self'` with no
  unsafe-inline means no `style=` attribute, no inline `<script>`, no `onclick`.
  `stack.css` exists because of it. `tools/catalogue-proof.mjs` now serves the
  real policy and was run in its failing direction.
- **Three bugs found by rendering, not by reading**: body prose fell back to the
  UA serif because nothing set a family on the root; the contrast gate was
  reading Chromium's `color(srgb …)` floats as bytes and measuring every washed
  ground as near-black; and the motion demo used `document.currentScript`, which
  is always null in a module.
- **Installed.** The lockup is in all six colophons on amirsalmani.com, `/suite/`
  is in the nav and the sitemap, and the site's own gates pass.
- **Public, MIT, no attribution required.** The marks are covered by the licence
  like everything else and are also a signature — `LICENCE` says which is which.

## 2026-09-15

- Bundle created. Scope: the attribution lockup first, the icon set second.
- **Promoted to Amir Salmani, not Rhinocloud.** Rhinocloud is the Iranian legal
  and tax identity products are operated under; it is not the maker. The entity
  goes in the legal line, the maker goes in the lockup.
- Three grammar rules added to the mark: an open node is a working end, a
  hexagon is the mechanical primitive, the heart is the frame inverted.
- Three shapes were changed by looking at the render rather than the source: the
  tool was a key, the lockup heart was too heavy beside a stroked `A`, and
  `stack` was a hamburger menu. A fourth, `link`, was dropped for saying
  nothing.
- **Components added**: `tokens` and five primitives — label, link, button,
  glass, figure — extracted from amirsalmani.com's stylesheet rather than
  invented. Nothing below the token layer contains a hex.
- **The inverted band was dark-on-dark** and nothing said so: the selector was
  descendant-only, so `class="band band--alt"` on the theme element itself
  silently failed. Found by rendering it. Fixed with `:where()` and now covered
  by `tools/contrast.mjs`, which was run in its failing direction before it was
  believed.
- Distribution follows `microkit.co` — a shadcn registry, one JSON per item,
  `npx shadcn@latest add @amirsalmani/made-by`. No package, no version to track.

## 2026-09-19 — the component tier

**The suite stopped authoring components.** Per
[decisions/0019](https://github.com/amir-salmani/codebase/blob/main/decisions/0019-one-source-of-components.md),
everything above the brand tier now comes from ObsidianUI: 103 items imported,
re-pointed onto the brand, and served from the same registry. Fifteen brand-tier
items retired to their upstream peers; their CSS stays because the catalogue is
built out of it.

- **A third ground.** `#000` with `#0f0f0f` and `#1a1a1a`, beside cream and
  indigo — the component tier was built against it and reads wrong on indigo.
  `contrast.mjs` went from 100 checks to 140.
- **Two of shadcn's token names meant the opposite of ours.** Its `--muted` and
  `--accent` are surfaces; ours were foregrounds. Ours were renamed to
  `--fg-muted` and `--fg-accent` rather than fight for the name, because the
  imported source cannot be asked to change and ours can.
- **The import is a script and the judgement is a patch.** `src/imported/` is
  wiped on every run; `patches/<name>.mjs` is re-applied on top. A rule that
  matches nothing fails the run — that is the whole staleness mechanism, and it
  fired three times for imports anchored differently than assumed.
- **Four gates, each written after something was already wrong.**
  `semantic-only` found 359 Tailwind palette utilities that a hex scan could not
  see. `stage` found five conflicting copies of one shared file — caused by a
  patch rule of ours that was too broad. `verify` found ten components that only
  render inside Next.js, and one that does not build against its own declared
  dependency. `motion-proof` found the reduced-motion gap was **six** items, not
  the seventy-four a grep had claimed: 47 have no motion and 24 animate only in
  CSS, which `tokens.css` already stops.
- **One page became three.** The landing surface is 7.3KB because it shows four
  of 118 and withholds the rest. The two indexes over one set moved to
  `/components`; every item gained a page. All three are still bytes on disk
  under `script-src 'self'`.
- **Forty recordings.** Filmed from upstream's own usage examples, which are the
  only written record of what props each component needs — and three of which do
  not run as published.
- **`upstream/` is committed.** The exact bytes imported, so the import is
  reproducible offline, survives upstream disappearing, and turns drift into a
  git diff. Upstream has no tags and gained an item during the afternoon this
  was written.
