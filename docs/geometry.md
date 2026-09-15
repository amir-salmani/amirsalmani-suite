---
type: Standard
title: The grammar, extended
description: Three rules added to the mark's geometry so that a heart, a tool and an icon set can be drawn beside it without importing a second visual language.
status: active
created: 2026-09-15
timestamp: 2026-09-15
related:
  - using-the-mark.md
  - ../index.md
---

# The grammar, extended

**The mark and its canonical numbers live in
[`amirsalmani-com/docs/brand.md`](../../amirsalmani-com/docs/brand.md) §1.**
That file is the source of truth and nothing here restates it. This document
adds only what a *second* shape needs in order to sit beside the first.

## What the mark already establishes

Seven numbers, and a vocabulary of two things: **straight strokes** and
**filled circles at termini**. Round caps, round joins, one colour,
`currentColor`, no container, no gradient.

## The three rules added here

### 1 · A filled node is a terminus. An **open** node is a working end.

The mark's circles are filled and mark where a structure ends. Draw the same
circle **unfilled, at the stroke weight**, and it becomes something that grips —
a ring, a socket, an opening.

That single inversion is what makes the tool a tool rather than a decoration,
and it costs no new geometry.

### 2 · A hexagon is the mechanical primitive.

Six straight strokes, round joins, same weight. It is the only closed figure
admitted beyond the circle, and it is admitted because it is **still pure
straight lines** — consistent with a mark that has no authored curves.

It carries the brand's own stated reading (*"close to the metal"*) without a
literal server, cog or wrench silhouette.

Used in: `tool` (as the ring end of a spanner), `hex` (standing alone, a
fastener).

### 3 · The heart is the frame inverted.

The mark is an apex with two feet. Turn that over and you have a point with two
lobes. The heart is drawn at **the same stroke weight as everything else** so it
carries the same visual mass in a line of text — a filled heart beside a
4.6-stroke `A` reads as two different systems.

`heart-solid` exists for standalone use where a filled shape is conventional.
**It is never used in the lockup.**

## Weights

Exactly as the mark: two, and the switch happens at the same place.

| | Regular | Bold |
|---|---|---|
| Use | ≥ 24 px | < 24 px |
| `viewBox` | `6.2 6.2 51.6 51.6` | `5.9 5.9 52.2 52.2` |
| Stroke | `4.6` | `6.4` |
| Node radius | `3.8` | `4.6` |

Bold weights are **generated** from the regular ones by
`tools/build-registry.mjs`'s sibling transform, not drawn twice. If you edit a
regular mark, regenerate.

## Rules that carry over unchanged

One colour ever · no container · `currentColor` when inlined · clearspace of
half the height · no gradient · no two-tone · **no emoji and no stock icons**
([brand.md §7](../../amirsalmani-com/docs/brand.md)).

## What was tried and rejected

Kept so it is not quietly reintroduced.

- **A wrench as a stroke with a plain circular ring.** Rendered at 16–64px it
  reads as a **key or a magnifying glass**, not a tool. The hexagonal ring is
  what makes it legible as a spanner. *(`docs/proof.png`, first pass.)*
- **A solid heart in the lockup.** Correct as a standalone glyph, far too heavy
  beside a stroked `A` at text size.
- **`stack` as three equal horizontal strokes.** Reads as a hamburger menu at
  every size. Tapering the widths upward makes it a stack seen in elevation.
- **`link` as two nodes joined by a stroke.** Legible, but says nothing the
  other icons do not — dropped rather than kept for the count.

## Proof before shipping

```bash
node tools/proof.mjs                 # every mark, 16/24/32/64px, both grounds
PROOF_ONLY=icons node tools/proof.mjs docs/proof-icons.png
node tools/lockup-proof.mjs          # the lockup variants at real size
```

The brand standard says **do not redraw the mark by eye**. The same applies to
drawing beside it: every shape in this suite was rendered and looked at before
it was kept, and three of them were changed because of what the render showed.
