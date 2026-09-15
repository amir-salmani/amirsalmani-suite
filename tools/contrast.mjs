#!/usr/bin/env node
// Every foreground role against its own ground, on every surface the tokens can
// produce. Exits non-zero on a failure, so it can gate a commit.
//
// Run it in its failing direction first: break a token and watch this fail
// before you believe a pass.

import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const css = f => readFile(path.join(ROOT, 'src', f), 'utf8');
const [tokens, prims] = await Promise.all([css('components/tokens.css'), css('components/primitives.css')]);

const SURFACES = [
  ['dark',                     '<div data-theme="dark" class="band">'],
  ['light',                    '<div data-theme="light" class="band">'],
  ['light · alt band, nested', '<div data-theme="light"><div class="band band--alt">'],
  ['light · alt band, self',   '<div data-theme="light" class="band band--alt">'],
  ['dark · alt band',          '<div data-theme="dark" class="band band--alt">'],
];
const ROLES = [['--fg', 4.5], ['--muted', 4.5], ['--faint', 4.5]];

const body = SURFACES.map(([name, open], i) =>
  `${open}<i id="s${i}" data-name="${name}">${ROLES.map(([r], j) =>
    `<b id="s${i}r${j}" style="color:var(${r})">x</b>`).join('')}</i></div>${open.includes('</div>') ? '' : ''}${name.includes('nested') ? '</div>' : ''}`).join('');

const html = `<!doctype html><meta charset=utf-8><style>${tokens}${prims}</style>${body}`;
const tmp = path.join(ROOT, 'docs', '_contrast.html');
await writeFile(tmp, html);

const b = await chromium.launch({ args: ['--disable-gpu'] });
const p = await b.newPage();
await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });

const lum = c => {
  const [r, g, bl] = c.match(/\d+/g).slice(0, 3).map(Number)
    .map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
};
const ground = el => { // walk up to the first element with a real background
  let n = el;
  while (n && n !== document.documentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    n = n.parentElement;
  }
  return 'rgb(255,255,255)';
};

const rows = await p.evaluate(({ surfaces, roles, groundSrc }) => {
  const groundFn = new Function('el', 'document', `return (${groundSrc})(el)`);
  const out = [];
  surfaces.forEach((s, i) => {
    roles.forEach(([role], j) => {
      const el = document.getElementById(`s${i}r${j}`);
      out.push({ surface: s, role, fg: getComputedStyle(el).color, bg: groundFn(el, document) });
    });
  });
  return out;
}, { surfaces: SURFACES.map(s => s[0]), roles: ROLES, groundSrc: ground.toString() });

await b.close(); await rm(tmp, { force: true });

let fails = 0;
for (const r of rows) {
  const L1 = lum(r.fg), L2 = lum(r.bg);
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  const min = ROLES.find(x => x[0] === r.role)[1];
  const ok = ratio >= min;
  if (!ok) fails++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${r.surface.padEnd(26)} ${r.role.padEnd(8)} ${ratio.toFixed(2)}:1  (min ${min})`);
}
console.log(`\n${rows.length} checks · ${fails} failed`);
process.exit(fails ? 1 : 0);
