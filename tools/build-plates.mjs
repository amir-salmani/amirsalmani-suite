#!/usr/bin/env node
// Demo artwork, drawn rather than borrowed.
//
//   node tools/build-plates.mjs
//
// Twelve of the imported usage examples want photographs. Four point at
// /images/one.jpg and friends, which exist in upstream's own app and nowhere
// else; the rest point at upstream's CDN. Both leave a recording that is either
// an empty frame or a picture of someone else's content, and upstream's own
// agent guide says to replace them.
//
// So: plates. The mark, at one stroke weight on a lightness ramp, in the
// grammar docs/geometry.md already sets out. They are not pretending to be
// photographs — a gallery of them reads as a gallery, which is all a demo of a
// masonry grid needs to show.

import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = [path.join(ROOT, 'verify', 'public', 'plates'), path.join(ROOT, 'src', 'plates')];

/* Filmed on the component tier's ground, so the ramp is white into black. The
 * plates are assets, not components: they cannot carry a var() through an
 * <img>, and a plate that changed with the theme would change under a recording
 * that was already made. */
const STEPS = [8, 13, 18, 24, 30, 37, 45, 54, 64, 74, 84, 92];
const ink = pct => `rgb(${Math.round(255 * pct / 100)},${Math.round(255 * pct / 100)},${Math.round(255 * pct / 100)})`;

const MARK = 'M12 51 L32 13 L52 51 M20.5 35 H43.5';
const NODES = [[32, 13], [12, 51], [52, 51]];

function plate(n) {
  const ground = ink(STEPS[n % STEPS.length]);
  const fg = ink(STEPS[(n + 6) % STEPS.length]);
  const rot = (n * 23) % 360;
  const scale = 0.55 + ((n * 7) % 5) * 0.11;
  const rules = Array.from({ length: 3 + (n % 4) }, (_, i) => {
    const y = 90 + i * (620 / (3 + (n % 4)));
    return `<path d="M60 ${y} H740" stroke="${fg}" stroke-width="1" opacity=".28"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="Plate ${n + 1}">
  <rect width="800" height="800" fill="${ground}"/>
  ${rules}
  <g transform="translate(400 400) rotate(${rot}) scale(${(scale * 9).toFixed(2)}) translate(-32 -32)"
     fill="none" stroke="${fg}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="${MARK}"/>
    ${NODES.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3.8" fill="${fg}" stroke="none"/>`).join('')}
  </g>
</svg>
`;
}

const COUNT = 12;
for (const dir of OUT) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (let n = 0; n < COUNT; n++) {
    await writeFile(path.join(dir, `${String(n + 1).padStart(2, '0')}.svg`), plate(n));
  }
}

console.log(`build-plates — ${COUNT} plates in ${OUT.length} places`);
