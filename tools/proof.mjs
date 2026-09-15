#!/usr/bin/env node
// Render every mark and icon at the sizes they will actually be used at, on both
// grounds, and write one sheet. The brand standard says do not redraw the mark by
// eye; the same applies to drawing beside it.
//
//   node tools/proof.mjs [outfile.png]

import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = process.argv[2] || path.join(ROOT, 'docs/proof.png');
const SIZES = [16, 24, 32, 64];
const INDIGO = '#212842', CREAM = '#F0E7D5';

const load = async dir => {
  const d = path.join(ROOT, 'src', dir);
  const files = (await readdir(d).catch(() => [])).filter(f => f.endsWith('.svg')).sort();
  return Promise.all(files.map(async f => ({ name: f.replace('.svg', ''), svg: await readFile(path.join(d, f), 'utf8') })));
};

const cell = (m, size, ground) => `
  <figure class="c" style="--g:${ground === 'indigo' ? INDIGO : CREAM};--f:${ground === 'indigo' ? CREAM : INDIGO}">
    <div class="box" style="width:${size}px;height:${size}px">${m.svg.replace('<svg', `<svg width="${size}" height="${size}"`)}</div>
    <figcaption>${m.name} · ${size}px</figcaption>
  </figure>`;

const only = process.env.PROOF_ONLY;
const items = only ? await load(only) : [...await load('marks'), ...await load('icons')];
if (!items.length) { console.error('nothing to proof'); process.exit(1); }

const rows = items.map(m => `
  <section>
    <h2>${m.name}</h2>
    <div class="row">
      ${SIZES.map(s => cell(m, s, 'cream')).join('')}
      ${SIZES.map(s => cell(m, s, 'indigo')).join('')}
    </div>
  </section>`).join('');

const html = `<!doctype html><meta charset=utf-8><style>
  body{margin:24px;background:#1a1a1a;color:#888;font:12px/1.5 ui-monospace,monospace}
  h1{color:#fff;font-size:14px;margin:0 0 18px}
  h2{color:#ccc;font-size:12px;margin:18px 0 8px;font-weight:500}
  .row{display:flex;gap:10px;flex-wrap:wrap}
  .c{margin:0;text-align:center}
  .box{display:grid;place-items:center;background:var(--g);color:var(--f);padding:14px;border:1px solid #333;box-sizing:content-box}
  figcaption{padding-top:5px;font-size:10px;color:#777}
  svg{display:block}
</style><h1>amirsalmani-suite — proof · cream ground then indigo · 16/24/32/64px</h1>${rows}`;

const tmp = path.join(ROOT, 'docs', '_proof.html');
await writeFile(tmp, html);
const b = await chromium.launch({ args: ['--hide-scrollbars', '--disable-gpu'] });
const p = await b.newPage({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
await p.screenshot({ path: OUT, fullPage: true });
await b.close();
await rm(tmp, { force: true });
console.log(`${items.length} marks → ${path.relative(process.cwd(), OUT)}`);
