#!/usr/bin/env node
// Render every primitive on both grounds, then again under each accessibility
// preference. A component that only works on one ground, or that dies when
// transparency is off, is not finished.
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const css = async f => readFile(path.join(ROOT, 'src', f), 'utf8');
const [tokens, prims, madeby] = await Promise.all(
  [css('components/tokens.css'), css('components/primitives.css'), css('made-by/made-by.css')]);
const mark = await readFile(path.join(ROOT, 'src/marks/frame.svg'), 'utf8');
const heart = await readFile(path.join(ROOT, 'src/marks/heart.svg'), 'utf8');

const specimen = `
  <p class="as-label">Section 02 · Evidence</p>
  <div class="row">
    <button class="as-btn">Read the record</button>
    <button class="as-btn as-btn--solid">Start</button>
    <a class="as-link" href="#">an underlined link</a>
  </div>
  <div class="as-glass pad">
    <div class="as-figure">
      <span class="as-figure__value">11.82:1</span>
      <span class="as-figure__label">Foreground contrast, both grounds</span>
      <span class="as-figure__source">Measured · WCAG 2.1 relative luminance</span>
    </div>
  </div>
  <span class="made-by">${mark.replace('<svg','<svg class="made-by__mark"')}<span>Made with ${heart.replace('<svg','<svg class="made-by__glyph"')} and good tools by <a class="as-link" href="#">Amir Salmani</a></span></span>`;

const panel = (title, attrs) => `
  <section ${attrs}>
    <h3 class="as-label as-label--faint">${title}</h3>
    ${specimen}
  </section>`;

const html = `<!doctype html><meta charset=utf-8>
<style>${tokens}${prims}${madeby}
  body{margin:0;font-family:var(--sans)}
  section{background:var(--bg);color:var(--fg);padding:26px 30px 34px;display:flex;flex-direction:column;gap:16px;align-items:flex-start}
  .row{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  .pad{padding:20px 24px}
  h3{margin:0 0 4px}
</style>
${panel('Dark ground — the default', 'data-theme="dark"')}
${panel('Light ground', 'data-theme="light"')}
${panel('Light ground, inverted band (same element)', 'data-theme="light" class="band band--alt"')}
<div data-theme="light">${panel('Light ground, inverted band (nested — the normal case)', 'class="band band--alt"')}</div>`;

const tmp = path.join(ROOT, 'docs', '_c.html');
await writeFile(tmp, html);
const b = await chromium.launch({ args: ['--hide-scrollbars','--disable-gpu'] });
for (const [name, media] of [
  ['components', []],
  ['components-prefs', [['prefers-reduced-transparency','reduce'], ['prefers-contrast','more']]],
]) {
  const p = await b.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
  if (media.length) await p.emulateMedia({ forcedColors: 'none' });
  // Playwright cannot emulate these two, so force them by rewriting the query.
  const src = media.length
    ? html.replaceAll('@media (prefers-reduced-transparency: reduce)', '@media all')
          .replaceAll('@media (prefers-contrast: more)', '@media all')
    : html;
  await writeFile(tmp, src);
  await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await p.screenshot({ path: path.join(ROOT, `docs/${name}.png`), fullPage: true });
  await p.close();
  console.log(`docs/${name}.png`);
}
await b.close(); await rm(tmp, { force: true });
