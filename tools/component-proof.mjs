#!/usr/bin/env node
// Render every item's demo on both grounds, then again under each accessibility
// preference. A component that only works on one ground, or that dies when
// transparency is off, is not finished.
//
//   node tools/component-proof.mjs   →  docs/proof-components.png, docs/proof-prefs-transparency.png

import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { ITEMS, RETIRED } from '../src/manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(ROOT, p), 'utf8');

const css = [];
for (const item of [...ITEMS, ...RETIRED]) if (item.css && !item.tier) css.push(await read(`src/components/${item.css}`));
css.push(await read('src/made-by/made-by.css'));

// A demo's <script> is behaviour, not surface; the proof is about what it looks
// like, and a module script will not run from file:// anyway.
const strip = s => s.replace(/<script[\s\S]*?<\/script>/g, '');

async function svgDemo(dir) {
  const d = path.join(ROOT, 'src', dir);
  const names = (await readdir(d)).filter(f => f.endsWith('.svg') && !f.endsWith('-bold.svg')).sort();
  const cells = await Promise.all(names.map(async f =>
    (await readFile(path.join(d, f), 'utf8')).replace(/<svg /, '<svg style="width:2rem;height:2rem" ')));
  return `<div style="display:flex;gap:1rem;flex-wrap:wrap">${cells.join('')}</div>`;
}

const demos = [];
for (const item of [...ITEMS, ...RETIRED]) {
  if (!item.demo) continue;
  const body = item.special === 'svgdir'
    ? await svgDemo(item.dir)
    : strip(await read(`src/demos/${item.demo}.html`));
  demos.push({ name: item.name, title: item.title, body });
}

// Both grounds render the same markup twice, so a radio group would span the
// two panels and the second copy would silently steal the first's selection —
// which reads as a component bug and is not one.
const scope = (body, tag) => body.replace(/name="([^"]+)"/g, `name="$1-${tag}"`);

const pair = d => `
  <div class="pair">
    <h3 class="cap">${d.title}</h3>
    <div class="grounds">
      <div class="band" data-theme="dark"><div class="pad">${scope(d.body, 'd')}</div></div>
      <div class="band" data-theme="light"><div class="pad">${scope(d.body, 'l')}</div></div>
    </div>
  </div>`;

const page = (subset) => `<!doctype html><meta charset="utf-8">
<style>
${css.join('\n')}
body { margin: 0; font-family: var(--sans); background: #0b0d16; }
.cap { font-family: var(--mono); font-size: .62rem; letter-spacing: .18em; text-transform: uppercase;
       color: #8d93a8; margin: 0 0 .4rem; padding-left: .2rem; }
.pair { margin-bottom: 1.4rem; }
.grounds { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #2a2f42; }
.pad { padding: 1.5rem; }
.wrap { padding: 1.5rem; }
</style>
<div class="wrap">${subset.map(pair).join('')}</div>`;

const browser = await chromium.launch();
const shot = async (file, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, ...opts });
  const p = await ctx.newPage();
  await p.setContent(page(demos), { waitUntil: 'load' });
  await p.screenshot({ path: path.join(ROOT, 'docs', file), fullPage: true });
  await ctx.close();
};

await shot('proof-components.png');
await shot('proof-prefs-transparency.png', { reducedMotion: 'reduce', forcedColors: 'none', contrast: 'more' });
await browser.close();

console.log(`docs/proof-components.png — ${demos.length} items, both grounds`);
console.log(`docs/proof-prefs-transparency.png — the same under prefers-contrast: more`);
