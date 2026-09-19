#!/usr/bin/env node
// Serve dist/ and render the catalogue the way a visitor gets it — module
// scripts running, both grounds, and a phone. Reading the HTML is not the same
// as looking at it: the inverted band was dark-on-dark for a whole session and
// nothing in the source said so.
//
//   node tools/catalogue-proof.mjs   →  docs/catalogue-*.png

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// The policy amirsalmani.com actually serves (deploy/_headers.cloudflare and
// deploy/Caddyfile). Without it the proof passes on a page the real origin
// would strip every inline style and script out of.
const CSP = "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; "
  + "style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; "
  + "manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";

// The `fonts` item ships the @font-face block and says the four woff2 files are
// yours to serve — on amirsalmani.com they come from /fonts/, which is the other
// service's path. The proof cannot reach that, and pointing it at a sibling
// checkout worked here and failed the moment CI ran with only this repository
// cloned. So they are vendored: 108KB, and this repository can now prove itself
// alone. $SUITE_FONTS still overrides.
const FONTS = process.env.SUITE_FONTS ?? path.join(ROOT, 'src', 'fonts');

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const from = p.startsWith('/fonts/') ? path.join(FONTS, p.slice(7)) : path.join(DIST, p);
  try {
    const body = await readFile(from);
    res.writeHead(200, {
      'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream',
      'content-security-policy': CSP,
    });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/suite/`;

const browser = await chromium.launch();
const errors = [];

async function shot(file, { theme, url, ...opts }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${file}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${file}: ${m.text()}`); });
  await page.goto(url ?? base, { waitUntil: 'networkidle' });
  if (theme) await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ROOT, 'docs', file), fullPage: true });
  await ctx.close();
}

/* All three surfaces, not just one. The catalogue used to be the whole site; it
 * is now the middle of three, and a proof that only visited / would have said
 * nothing about the two pages most readers actually land on. */
const CATALOGUE = `${base}components/`;
const ITEM = `${base}docs/click-spark/`;

await shot('landing-dark.png', { theme: 'dark' });
await shot('landing-light.png', { theme: 'light' });
await shot('catalogue-dark.png', { theme: 'dark', url: CATALOGUE });
await shot('catalogue-light.png', { theme: 'light', url: CATALOGUE });
await shot('item-dark.png', { theme: 'dark', url: ITEM });
await shot('catalogue-mobile.png', { theme: 'dark', url: CATALOGUE, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await shot('landing-mobile.png', { theme: 'dark', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

// The top of each surface at real size, which the contact sheets shrink away.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(ROOT, 'docs', 'catalogue-hero.png') });
await page.goto(CATALOGUE, { waitUntil: 'networkidle' });
await page.locator('#index').scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
await page.screenshot({ path: path.join(ROOT, 'docs', 'catalogue-index.png') });
await ctx.close();

await browser.close();
server.close();

if (errors.length) {
  console.error('console errors:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('docs/{landing,catalogue,item}-*.png — three surfaces, no console errors');
