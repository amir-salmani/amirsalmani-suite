#!/usr/bin/env node
// Render the lockup variants at real size on both grounds. Same discipline as the
// marks: do not ship type you have not looked at.
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const svg = n => readFile(path.join(ROOT, 'src/marks', n + '.svg'), 'utf8');
const css = await readFile(path.join(ROOT, 'src/made-by/made-by.css'), 'utf8');
const [frame, heart, tool, frameB, heartB, toolB] =
  await Promise.all(['frame','heart','tool','frame-bold','heart-bold','tool-bold'].map(svg));

const cls = (s, c) => s.replace('<svg', `<svg class="${c}"`);
const variants = {
  'full': `<span class="made-by">${cls(frame,'made-by__mark')}<span>Made with ${cls(heart,'made-by__glyph')} and good tools by <a href="https://amirsalmani.com">Amir Salmani</a></span></span>`,
  'full (bold marks, small sizes)': `<span class="made-by">${cls(frameB,'made-by__mark')}<span>Made with ${cls(heartB,'made-by__glyph')} and good tools by <a href="https://amirsalmani.com">Amir Salmani</a></span></span>`,
  'with the tool shown': `<span class="made-by">${cls(frame,'made-by__mark')}<span>Made with ${cls(heart,'made-by__glyph')} and ${cls(tool,'made-by__glyph')} by <a href="https://amirsalmani.com">Amir Salmani</a></span></span>`,
  'short': `<span class="made-by">${cls(frame,'made-by__mark')}<span>Made with ${cls(heart,'made-by__glyph')} by <a href="https://amirsalmani.com">Amir Salmani</a></span></span>`,
  'minimal': `<span class="made-by">${cls(frame,'made-by__mark')}<a href="https://amirsalmani.com">Amir Salmani</a></span>`,
  'stacked': `<span class="made-by made-by--stacked">${cls(frame,'made-by__mark')}<span>Made with ${cls(heart,'made-by__glyph')} and good tools by <a href="https://amirsalmani.com">Amir Salmani</a></span></span>`,
};

const ground = (name, bg, fg) => `
  <section style="--bg:${bg};--fg:${fg};--fg-faint:color-mix(in srgb, ${fg} 62%, ${bg});background:${bg};color:${fg}">
    <h3>${name}</h3>
    ${Object.entries(variants).map(([k,v]) => `<div class="row"><code>${k}</code>${v}</div>`).join('')}
  </section>`;

const html = `<!doctype html><meta charset=utf-8><style>
  @font-face{font-family:"IBM Plex Mono";src:local("IBM Plex Mono");}
  body{margin:0;background:#1a1a1a;font-family:system-ui}
  h1{color:#fff;font:600 13px/1 ui-monospace,monospace;margin:0;padding:18px 26px}
  section{padding:24px 26px 30px}
  h3{font:500 11px/1 ui-monospace,monospace;opacity:.5;margin:0 0 16px;letter-spacing:.1em;text-transform:uppercase}
  .row{display:flex;align-items:center;gap:22px;padding:9px 0}
  .row code{font:400 10px/1 ui-monospace,monospace;opacity:.35;width:210px;flex:none}
  ${css}
</style><h1>made-by — lockup variants, real size</h1>
${ground('Vanilla Cream ground','#F0E7D5','#212842')}
${ground('Midnight Indigo ground','#212842','#F0E7D5')}`;

const tmp = path.join(ROOT, 'docs', '_lockup.html');
await writeFile(tmp, html);
const b = await chromium.launch({ args: ['--hide-scrollbars','--disable-gpu'] });
const p = await b.newPage({ viewport: { width: 860, height: 700 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
await p.screenshot({ path: path.join(ROOT, 'docs/lockup.png'), fullPage: true });
await b.close(); await rm(tmp, { force: true });
console.log('docs/lockup.png');
