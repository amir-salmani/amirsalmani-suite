---
type: Guide
title: Using the lockup
description: Where the attribution goes, which variant, and the one rule that keeps it from becoming an advertisement.
status: active
created: 2026-09-15
timestamp: 2026-09-15
related:
  - geometry.md
  - ../index.md
---

# Using the lockup

**Made with ♥ and good tools by Amir Salmani.**

It goes in the footer or colophon of anything Amir builds — Lotusion products,
Rhinocloud products, client work, a one-page tool. One line, `--faint`, mono,
linking to `amirsalmani.com`.

## Which variant

| Variant | Use |
|---|---|
| `full` | The default. Footers, colophons, about pages |
| `short` | *"Made with ♥ by…"* — tight footers, mobile |
| `minimal` | Mark + name. A status bar, a CLI banner, a README badge |
| `stacked` | When the footer column is narrower than the line |

Below 24px the mark switches to the bold weight, exactly as
[brand.md §1](../../amirsalmani-com/docs/brand.md) requires.

## The rule that matters

**It is attribution, not advertisement.** It is the size of a copyright line and
sits where one sits. It never gets its own band, its own colour, an animation,
or a position above the fold.

The same reasoning as the `بیا اینور بازار` button in
[Bia Invare Bazar](../../biainvarebazar/docs/product/buyer-experience.md): across
many surfaces it is the cheapest distribution there is, **and it only works if
nobody resents it.**

## On the entities

The lockup says **Amir Salmani**, not the operating company.

`rhinocloud` is the Iranian legal and tax identity that certain products are
operated under — it exists because Zarinpal and eNamad need a registered
Iranian entity, not because it is a brand a reader should be introduced to.
Lotusion is the product family. Neither is the maker.

So: **the entity appears in the legal line; the maker appears in the lockup.**
A footer carries both, and they say different things.

```
© 2026 Rhinocloud Ltd.        ← who is liable
Ⓐ Made with ♥ and good tools by Amir Salmani   ← who built it
```

## Do not

- **Do not recolour it.** It inherits `currentColor` and `--faint`. If it looks
  wrong on a surface, the surface's tokens are wrong.
- **Do not animate it.** Nothing in the suite animates except the link
  underline, at 200ms.
- **Do not use the tool mark inline at text size.** It was measured at 1em and
  reads as a squiggle; the words *"good tools"* carry it. The tool is for 24px
  and above.
- **Do not put it in a container** — no pill, no card, no border.
- **Do not substitute an emoji heart.** [brand.md §7](../../amirsalmani-com/docs/brand.md)
  forbids emoji, and the point of the suite is that the heart is drawn in the
  mark's own geometry.
