#!/usr/bin/env node
// Every foreground role against the ground it actually lands on, on every
// surface the tokens can produce. Exits non-zero on a failure, so it can gate a
// commit.
//
// Run it in its failing direction first: break a token and watch this fail
// before you believe a pass.
//
// The backgrounds here are mostly semi-transparent — --wash and --glass are
// color-mix(... transparent) — so a naive "first non-transparent ancestor"
// reading measures against a colour nothing is drawn on. This composites the
// whole alpha chain down to the opaque band instead.

import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { ITEMS } from '../src/manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = [];
for (const item of ITEMS) if (item.css && item.name !== 'fonts') css.push(await readFile(path.join(ROOT, 'src/components', item.css), 'utf8'));

const SURFACES = [
  ['dark',                     'data-theme="dark" class="band"'],
  ['light',                    'data-theme="light" class="band"'],
  ['light · alt band, self',   'data-theme="light" class="band band--alt"'],
  ['dark · alt band',          'data-theme="dark" class="band band--alt"'],
];
const NESTED = ['light · alt band, nested', 'data-theme="light"', 'class="band band--alt"'];

// Each probe is rendered on every surface and measured where it lands. 4.5 is
// AA for body text; 3.0 is AA for a ≥24px or bold-≥18.66px figure.
const PROBES = [
  ['--fg plain',        4.5, '<p style="color:var(--fg)">x</p>'],
  ['--muted plain',     4.5, '<p style="color:var(--muted)">x</p>'],
  ['--faint plain',     4.5, '<p style="color:var(--faint)">x</p>'],
  ['label on band',     4.5, '<span class="as-label">x</span>'],
  ['label faint',       4.5, '<span class="as-label as-label--faint">x</span>'],
  ['btn on glass',      4.5, '<button class="as-btn">x</button>'],
  ['btn solid',         4.5, '<button class="as-btn as-btn--solid">x</button>'],
  ['btn quiet',         4.5, '<button class="as-btn as-btn--quiet">x</button>'],
  ['input value',       4.5, '<input class="as-input" value="x">'],
  ['code on wash',      4.5, '<pre class="as-code"><code>x</code></pre>'],
  ['status live',       4.5, '<span class="as-status as-status--live">x</span>'],
  ['status idle',       4.5, '<span class="as-status as-status--idle">x</span>'],
  ['status retired',    4.5, '<span class="as-status as-status--retired">x</span>'],
  ['kv key on band',    4.5, '<dl class="as-kv"><dt class="as-kv__k">x</dt><dd class="as-kv__v">y</dd></dl>'],
  ['card body in wash', 4.5, '<div class="as-card as-card--wash"><p class="as-card__body">x</p></div>'],
  ['figure value',      3.0, '<span class="as-figure__value">9</span>'],
  ['figure source',     4.5, '<span class="as-figure__source">x</span>'],
  ['field hint',        4.5, '<span class="as-field__hint">x</span>'],
  ['toast on glass',    4.5, '<div class="as-toast as-glass"><div class="as-toast__body">x</div></div>'],
  ['nav link',          4.5, '<nav class="as-nav"><div class="as-nav__links"><a href="#">x</a></div></nav>'],
];

// The element whose colour is the one that matters, per probe.
const TARGET = 'p, span, button, input, code, dt, a, .as-toast__body';

const panels = [];
SURFACES.forEach(([name, open], i) => {
  panels.push(`<div ${open}>${PROBES.map(([, , html], j) =>
    `<div id="p${i}_${j}">${html}</div>`).join('')}</div>`);
});
panels.push(`<div ${NESTED[1]}><div ${NESTED[2]}>${PROBES.map(([, , html], j) =>
  `<div id="p${SURFACES.length}_${j}">${html}</div>`).join('')}</div></div>`);
const NAMES = [...SURFACES.map(s => s[0]), NESTED[0]];

const html = `<!doctype html><meta charset="utf-8"><style>${css.join('\n')}</style>${panels.join('')}`;
const tmp = path.join(ROOT, 'docs', '_contrast.html');
await writeFile(tmp, html);

const b = await chromium.launch({ args: ['--disable-gpu'] });
const p = await b.newPage();
await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });

const rows = await p.evaluate(({ names, probes, targetSel }) => {
  // Chromium serialises color-mix() as `color(srgb 0.94 0.91 0.84 / 0.82)` —
  // 0–1 channels, not 0–255. Reading those as bytes makes every washed or
  // glass ground measure as near-black, which silently inverts the verdict for
  // half the suite. The unit has to be taken from the function name.
  const parse = c => {
    const n = c.match(/[\d.]+/g).map(Number);
    const scale = c.startsWith('color(') ? 255 : 1;
    return { r: n[0] * scale, g: n[1] * scale, b: n[2] * scale, a: n.length > 3 ? n[3] : 1 };
  };
  // Composite the whole ancestor chain: every layer is painted over the one
  // behind it, so a 9%-alpha wash is 9% of the fg over the band, not a colour
  // in its own right.
  // Start at the element itself: an inverted button paints its own background,
  // and measuring it against the band behind it reports 1.00:1 for a surface
  // that is in fact the highest-contrast one on the page.
  const groundOf = el => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a > 0) { layers.push(c); if (c.a === 1) break; }
    }
    if (!layers.length || layers[layers.length - 1].a < 1) layers.push({ r: 255, g: 255, b: 255, a: 1 });
    let out = layers.pop();
    while (layers.length) {
      const top = layers.pop();
      out = {
        r: top.r * top.a + out.r * (1 - top.a),
        g: top.g * top.a + out.g * (1 - top.a),
        b: top.b * top.a + out.b * (1 - top.a),
        a: 1,
      };
    }
    return out;
  };

  const out = [];
  names.forEach((surface, i) => {
    probes.forEach(([label, min], j) => {
      const host = document.getElementById(`p${i}_${j}`);
      const el = host.querySelector(targetSel) ?? host;
      const fg = parse(getComputedStyle(el).color);
      const bg = groundOf(el);
      out.push({ surface, label, min, fg, bg });
    });
  });
  return out;
}, { names: NAMES, probes: PROBES.map(([l, m]) => [l, m]), targetSel: TARGET });

await b.close();
await rm(tmp, { force: true });

const lum = ({ r, g, b }) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

let fails = 0;
for (const r of rows) {
  const L1 = lum(r.fg), L2 = lum(r.bg);
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  const ok = ratio >= r.min;
  if (!ok) fails++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${r.surface.padEnd(26)} ${r.label.padEnd(18)} ${ratio.toFixed(2)}:1  (min ${r.min})${ok ? '' : `   fg ${JSON.stringify(r.fg)} bg ${JSON.stringify(r.bg)}`}`);
}
console.log(`\n${rows.length} checks · ${fails} failed`);
process.exit(fails ? 1 : 0);
