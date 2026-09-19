---
type: Index
title: The Amir Salmani suite
description: Thirty items drawn to one brand — two grounds, no accent hue — served as a shadcn registry with a static catalogue in front of it.
status: active
created: 2026-09-15
timestamp: 2026-09-15
format: Open Knowledge Format
tags: [brand, icons, components, design-system, registry, catalogue]
project:
  id: amirsalmani-suite
  owner: amir
  kind: tool
  lifecycle: active
  visibility: public
  hosting: cloudflare
  toolchain: node
---

# The Amir Salmani suite

**118 components, 3 bundles, 15 categories.** Three grounds, no accent hue, MIT.
Browse it at [amirsalmani.com/suite](https://amirsalmani.com/suite/); install any
of it with one command.

```bash
npx shadcn@latest add @amirsalmani/tokens        # first — everything derives from it
npx shadcn@latest add @amirsalmani/suite         # the brand tier: framework-free CSS
npx shadcn@latest add @amirsalmani/suite-react   # the component tier: React, Tailwind v4
```

## Two tiers

Per [decisions/0019](https://github.com/amir-salmani/codebase/blob/main/decisions/0019-one-source-of-components.md),
**nothing above the brand tier is authored here.**

| | | |
|---|---|---|
| **brand** | 15 items | tokens, type, layout, marks, the spring, the attribution lockup. Framework-free CSS, written here |
| **component** | 103 items | imported from [ObsidianUI](https://www.obsidianui.dev/) and re-pointed onto the brand. React, Tailwind v4 |

Fifteen brand-tier items retired when the component tier arrived — `button`,
`card`, `input` and the rest have an upstream peer. Their source stays in
`src/manifest.mjs` behind a `retiredBy` line, because retirement should be one
line to reverse rather than an exercise in archaeology, and because the
catalogue is still built out of that CSS.

| | |
|---|---|
| [docs/catalogue](docs/catalogue.md) | Why the catalogue is shaped this way, what it refused, and how to add an item |
| [docs/geometry](docs/geometry.md) | The three rules added to the mark, and the four shapes that were rejected |
| [docs/using-the-mark](docs/using-the-mark.md) | Where the lockup goes, which variant, and why it stays small |
| [../amirsalmani-com/docs/brand.md](../amirsalmani-com/docs/brand.md) | **The source of truth** — the mark, the palette, the type, the motion. Not restated here |

## What is here

```
src/manifest.mjs        the one dataset. The brand tier is written in it; the
                        component tier is appended from the generated file below
src/components/         one CSS file per brand item. Nothing below tokens.css has a hex
src/demos/              one HTML fragment per brand item — the live preview and the
                        copy-paste snippet are the same file, so they cannot disagree
src/lib/                token-colour: a custom property resolved, for canvas and WebGL
src/motion/             the spring, extracted from amirsalmani.com/app.js
src/marks/  src/icons/  the drawn set (+ bold weights)

src/imported-categories.mjs   authored: where each imported item lands, and its title
patches/<name>.mjs            authored: how each imported item is re-pointed, and why
upstream/                     committed: the exact bytes imported, so it is reproducible
src/imported/                 generated and wiped on every import — never edit
src/demos-video/              generated: one recording and one poster per documented item

registry/               generated: the shadcn registry served from amirsalmani.com/r/
dist/                   generated: the three surfaces
verify/                 not shipped: proves the component tier builds, and is the
                        stage the recordings are filmed on
```

## The pipeline

```bash
npm run import      # fetch upstream, write src/imported/, apply patches/
npm run verify      # build all 103 in a real bundler
npm run record      # film one demo per documented item
npm run build       # registry + the three surfaces
npm run proof       # every gate
npm run reconcile   # has upstream moved under us?
```

Each gate exists because something was wrong. `semantic-only` found 359 Tailwind
palette utilities a hex scan could not see. `stage` found five conflicting copies
of one shared file. `verify` found ten components that only work inside Next.js
and one that does not build against its own declared dependency. `motion-proof`
found that the reduced-motion gap was six items and not the seventy-four a grep
had claimed.

| Category | |
|---|---|
| **Foundation** 3 | fonts · tokens · motion |
| **Type** 3 | headline · label · figure |
| **Layout** 7 | section · stack · grid · card · glass · nav · footer |
| **Controls** 7 | link · button · field · input · select · checkbox · switch |
| **Feedback** 3 | status · empty · toast |
| **Data** 2 | kv · code |
| **Brand** 3 | made-by · marks · icons |
| **Bundles** 2 | primitives · suite |

Every colour derives from the local `--fg`/`--bg`, which is why one rule works on
cream, on indigo, and inside an inverted band. **There is no red in the error
state and no green in the status pill**, because there is no accent hue to spend
— state is carried by fill, weight and rules instead.

## Prove before you ship

```bash
node tools/contrast.mjs         # 100 checks; exits 1 on a failure
node tools/proof.mjs            # every mark at 16/24/32/64, both grounds
node tools/component-proof.mjs  # every item's demo, both grounds, and prefers-contrast
node tools/build-site.mjs && node tools/catalogue-proof.mjs
                                # the catalogue under the CSP the site actually serves
```

Three things in this suite exist because a render disagreed with the source:

- **The inverted band was silently dark-on-dark.** The selector was
  descendant-only, so `class="band band--alt"` on the theme element itself never
  matched. Fixed with `:where()`, now covered by the contrast gate.
- **Body prose fell back to the UA serif.** Nothing set a family on the root;
  every component that declared one looked fine and every component that
  inherited did not. `tokens.css` now sets it at zero specificity.
- **The contrast gate was measuring against near-black.** Chromium serialises
  `color-mix()` as `color(srgb 0.94 0.91 0.84 / 0.82)` — 0–1 channels — and the
  parser read them as bytes. Every washed and glass ground was wrong, in both
  directions, and every check still said `ok`.

**A contrast number you have not watched fail is not evidence.** Both gates are
run in their failing direction before a pass is believed.

## Distribution

A shadcn registry, taken from `microkit.co`
([teardown](https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/microkit-co.md)): one JSON per item, no
package to depend on, no version to track. The catalogue in front of it is taken
from `opensourceui.in/components`
([teardown](https://github.com/amir-salmani/codebase/blob/main/skills/atelier/library/teardowns/opensourceui-in-components.md)) — two
indexes over one set — and is static, because that page pays 2796ms to first
paint for a list of links.

## Who this says made it

**Amir Salmani.** Rhinocloud is the Iranian legal and tax identity that certain
products are operated under, because Zarinpal and eNamad require a registered
Iranian entity. It is not a brand a reader needs introducing to, and it is not
the maker. The entity belongs in the legal line; the maker belongs in the lockup.

## Not done

- **Nothing outside amirsalmani.com has it yet.** Vuhom and Lotusion.com are the
  next two footers, and both follow the Lotusion designbook — so the lockup
  transfers and the tokens do not.
- **Four icons is a start, not a set.** Add one when a product actually needs
  it, and proof it against the grammar first.
- **No form validation behaviour.** `field` styles an error; nothing decides
  there is one.
- **The React side is one component.** `made-by` is TSX; everything else is CSS
  a React project can import but not a component it can render.
