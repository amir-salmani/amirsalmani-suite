/* The rules that put upstream's colour onto the brand (decisions/0019).
 *
 * Shared, because they apply to two different things: the component source that
 * tools/repoint.mjs rewrites, and the usage demos that tools/build-demos.mjs
 * emits. A demo carrying upstream's own palette would put their colours into
 * every recording made of it.
 */

const PALETTE = '(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
const UTIL = '(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration|placeholder|divide|accent|caret)';

/* Tailwind's ramp steps, as their oklch lightness. Mapping a step to a mix
 * percentage of --fg into --bg keeps the *relationship* between two shades
 * exactly, on all three grounds — which flattening them to one token would not.
 * bg-zinc-800 beside bg-zinc-700 stays one step apart on cream, on indigo and
 * on black.
 *
 * Chromatic ramps go through the same table. The brand has no hue to spend, so
 * blue-600 and zinc-600 arrive at the same place, which is the intended answer
 * rather than a loss. */
const STEP = { 50: 98, 100: 97, 200: 92, 300: 87, 400: 71, 500: 55, 600: 45, 700: 37, 800: 28, 900: 21, 950: 14 };

/* Applied to every imported file. Kept small: a global rule is one that is true
 * of the whole library, not one that happens to work twice. */
export const GLOBAL = [
  // The only hardcoded family upstream ships, in hover-img's own stylesheet.
  [/"Raleway",\s*"Inter",\s*system-ui,\s*sans-serif/g, 'var(--sans)'],

  // white is the ink and black is the ground, because this library was built on
  // one dark page. Inversion falls out of it: bg-white becomes the foreground
  // used as a surface, which is how the brand already spells emphasis.
  [new RegExp(`\\b(${UTIL})-white\\b`, 'g'), (_, u) => `${u}-[var(--fg)]`],
  [new RegExp(`\\b(${UTIL})-black\\b`, 'g'), (_, u) => `${u}-[var(--bg)]`],

  [new RegExp(`\\b(${UTIL})-${PALETTE}-([0-9]{2,3})\\b`, 'g'),
   (m, u, n) => STEP[n] === undefined ? m : `${u}-[color-mix(in_srgb,var(--fg)_${STEP[n]}%,var(--bg))]`],
];

/* Arbitrary-value utilities — bg-[#151714], text-[#d0b88c]. Tailwind lets a hex
 * in directly, so these are palette literals that neither the ramp rule nor a
 * bare-hex scan of the source catches: they live in class strings, and in the
 * usage demos as much as in the components.
 *
 * Mapped by relative luminance onto the same --fg-into--bg scale the ramp uses,
 * so a dark container stays dark and light ink stays light on every ground. */
const srgb = c => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const luminance = hex => {
  const h = hex.length === 4 ? [...hex.slice(1)].map(c => c + c).join('') : hex.slice(1, 7);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};

GLOBAL.push([
  new RegExp(`\\b(${UTIL})-\\[(#[0-9a-fA-F]{3,6})\\]`, 'g'),
  (_, u, hex) => {
    const pct = Math.round(Math.max(0, Math.min(1, luminance(hex))) * 100);
    /* Ink snaps to one of the three foreground roles instead of taking an
     * arbitrary mix. A 50% mix of --fg into --bg is mid-grey on any ground,
     * which is a contrast failure waiting for a reader; --fg-muted and
     * --fg-faint are the two dimmer inks that were measured against every
     * surface by tools/contrast.mjs. */
    if (/^(text|fill|stroke|placeholder|caret|decoration)$/.test(u)) {
      return pct >= 60 ? `${u}-[var(--fg)]` : pct >= 35 ? `${u}-[var(--fg-muted)]` : `${u}-[var(--fg-faint)]`;
    }
    return pct >= 96 ? `${u}-[var(--fg)]`
         : pct <= 4 ? `${u}-[var(--bg)]`
         : `${u}-[color-mix(in_srgb,var(--fg)_${pct}%,var(--bg))]`;
  },
]);

/* next/image, in ten components. A registry that ships copy-in source should not
 * require a particular framework to render an image: on Vite, Remix or a static
 * page these throw React error #130 at render, which is how six of them failed
 * to record. <img> takes the same src/alt/width/height/className props.
 *
 * Safe library-wide: every file using <Image also imports next/image, and
 * lucide's icon is aliased to ImageIcon rather than Image. */
GLOBAL.push(
  [/import\s+Image\s+from\s+["']next\/image["'];?\n/g, ''],
  [/<Image\b/g, '<img'],
);

export const applyGlobal = text => GLOBAL.reduce((t, [from, to]) => t.replaceAll(from, to), text);
