/* Six page spreads and two cover stocks, originally a full chromatic set.
 *
 * The first pass allowed them as artwork. Rendering it showed why that was
 * wrong: a navy book on the obsidian ground is the accent hue arriving through
 * the back door, on a component that ships in the catalogue. The pages keep
 * their separation — six steps of the lightness ramp, so a reader still sees
 * distinct pages turning — and lose their colour.
 */
export default [
  /* The environment map is a private path on upstream's CDN that 404s for
   * anyone else — it is what made this the one recording that failed. A
   * registry shipping copy-in source should not need someone else's host to
   * light a scene, and drei's presets only move the dependency. Ambient plus
   * the directional light already in the scene is enough for paper. */
  ['<Environment files="/cdn/effects/book-flip/studio.hdr?v=3" />',
   '<ambientLight intensity={1.4} />'],

  ['#7c3aed', '#8a8a8a'],
  ['#0ea5e9', '#a6a6a6'],
  ['#10b981', '#9b9b9b'],
  ['#f59e0b', '#c4c4c4'],
  ['#ef4444', '#7a7a7a'],
  ['#ec4899', '#8f8f8f'],
  ['#1e1b4b', '#1a1a1a'],
  ['#0f172a', '#0f0f0f'],
];
/* These are three.js material colours, set on a mesh rather than in CSS, so
 * they cannot be a var() and cannot be a color-mix. They are hexes on the same
 * neutral ramp everything else was mapped to — r == g == b, by construction. */
export const allow = [[/^#(?:([0-9a-f]{2})\1\1|([0-9a-f])\2\2)$/i, 'three.js material colour, grey by construction (r == g == b)']];
