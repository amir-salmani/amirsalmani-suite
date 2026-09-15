---
type: Index
title: The Amir Salmani suite
description: The attribution lockup that goes under everything Amir builds, and an icon set drawn in the mark's own geometry.
status: active
created: 2026-09-15
timestamp: 2026-09-15
format: Open Knowledge Format
tags: [brand, icons, design-system, registry]
project:
  id: amirsalmani-suite
  owner: amir
  kind: tool
  lifecycle: active
  visibility: private
  hosting: none
  toolchain: node
---

# The Amir Salmani suite

**Made with ♥ and good tools by Amir Salmani** — drawn, not typed. The heart and
the tool are built from the mark's own geometry, because
[brand.md §7](../amirsalmani-com/docs/brand.md) forbids emoji and stock icons,
and because a borrowed glyph beside a hand-drawn monogram looks exactly like
what it is.

| | |
|---|---|
| [docs/geometry](docs/geometry.md) | The three rules added to the mark, and the four shapes that were rejected |
| [docs/using-the-mark](docs/using-the-mark.md) | Where the lockup goes, which variant, and why it stays small |
| [../amirsalmani-com/docs/brand.md](../amirsalmani-com/docs/brand.md) | **The source of truth** — the mark, the palette, the type, the motion. Not restated here |

## What is here

```
src/marks/   frame · heart · heart-solid · tool      (+ bold weights)
src/icons/   node · stack · hex · check              (+ bold weights)
src/made-by/ the lockup — React, and plain CSS for a site with no build step
registry/    generated: the shadcn registry served from amirsalmani.com/r/
```

## Install

```bash
npx shadcn@latest add @amirsalmani/made-by
npx shadcn@latest add @amirsalmani/icons
npx shadcn@latest add @amirsalmani/marks
```

The registry pattern is taken from `microkit.co`
([teardown](../design-atelier/teardowns/microkit-co.md)): one JSON per item, no
package to depend on, no version to track. The CLI copies source in and the
consumer owns the result — which suits a suite that has to survive its author
being unavailable.

## Who this says made it

**Amir Salmani.** Rhinocloud is the Iranian legal and tax identity that certain
products are operated under, because Zarinpal and eNamad require a registered
Iranian entity. It is not a brand a reader needs introducing to, and it is not
the maker. The entity belongs in the legal line; the maker belongs in the
lockup.

## Prove before you ship

```bash
node tools/proof.mjs           # every mark at 16/24/32/64, both grounds
node tools/lockup-proof.mjs    # the lockup variants at real size
node tools/build-registry.mjs  # regenerate the registry
```

Three of the shapes here changed because of what a render showed and not because
of what the source said. The brand standard's *"do not redraw the mark by eye"*
applies just as much to drawing beside it.

## Not done

- **The registry is not served yet.** `registry/r/` has to be copied into
  `amirsalmani-com` and deployed before `npx shadcn add @amirsalmani/…`
  resolves. Until then the files are local only.
- **Four icons is a start, not a set.** Add one when a product actually needs
  it, and proof it against the grammar first.
- **No `made-by` is installed anywhere yet.** Vuhom, Lotusion.com and
  amirsalmani.com itself are the first three footers.
