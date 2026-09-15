---
type: Log
title: Suite log
description: Newest first, one bullet per change.
status: active
created: 2026-09-15
timestamp: 2026-09-15
---

# Log

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
