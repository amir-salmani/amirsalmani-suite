#!/usr/bin/env node
// Film each demo once, so the catalogue can show 40 animated components without
// instantiating 40 animated components.
//
//   node tools/record-demos.mjs [--only name,name]
//
// The mechanism is obsidianui.dev's, measured rather than guessed: its index
// plays muted looping recordings from a CDN and runs none of its own library,
// which is how a 103-item page costs 802KB at CLS 0. See the teardown.
//
// **webm, not mp4.** Playwright ships an ffmpeg with libvpx and no H.264, so
// there is no encoder here that can make an mp4. Every demo also gets a poster
// PNG, which the grid needs anyway and which covers any browser that will not
// play webm. Transcoding is a deploy concern, not a recording one.
//
// Interaction is driven by category because a cursor effect filmed without a
// cursor is a still, and so is a scroll effect filmed without a scroll.

import { createServer } from 'node:http';
import { readFile, mkdir, rename, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { byName } from '../src/manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'verify', 'dist');
const OUT = path.join(ROOT, 'src', 'demos-video');
const TMP = path.join(ROOT, '.record-tmp');

const i = process.argv.indexOf('--only');
const only = i === -1 ? null : new Set(process.argv[i + 1].split(','));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(path.join(DIST, p));
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const { DEMO_NAMES } = await import(path.join(ROOT, 'verify', 'src', 'demos.generated.ts')).catch(async () => ({
  DEMO_NAMES: Object.keys(JSON.parse(await readFile(path.join(ROOT, 'upstream', 'docs.json'), 'utf8'))),
}));

const names = DEMO_NAMES.filter(n => !only || only.has(n));
await rm(TMP, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const W = 1280, H = 800;
let done = 0;
const failed = [];

for (const name of names) {
  const category = byName[name]?.category ?? '';
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: TMP, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(`${base}?demo=${name}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('body[data-state="ready"]', { timeout: 20000 });

    /* The poster is taken mid-interaction, not before it and not after. A trail
     * cursor at rest is a blank frame, and so is one photographed a second
     * after the pointer stopped — the trail has already decayed. */
    const poster = () => page.screenshot({ path: path.join(OUT, `${name}.png`) });

    if (category === 'Cursor') {
      /* Inside the demo's own box, not the viewport. Several of these render a
       * 400px-tall stage near the top, and a pointer path spanning the full
       * viewport spends most of its time outside the element that is listening
       * — which films as an empty stage. */
      const box = await page.locator('[data-demo] > *').first().boundingBox()
        ?? { x: 0, y: 0, width: W, height: H };
      const move = async (from, to) => {
        for (let s = from; s <= to; s++) {
          const t = s / 48;
          await page.mouse.move(
            box.x + box.width * t,
            box.y + box.height * (0.5 + 0.35 * Math.sin(s / 5)),
            { steps: 2 },
          );
        }
      };
      await move(0, 30);
      await poster();
      await move(31, 48);
    } else if (category === 'Scroll' || category === 'Dimensional') {
      for (let s = 1; s <= 16; s++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
      await poster();
      for (let s = 1; s <= 16; s++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
    } else {
      await page.mouse.move(W / 2, H / 2, { steps: 20 });
      await page.waitForTimeout(1200);
      await poster();
      await page.waitForTimeout(1200);
    }
  } catch (e) {
    failed.push(`${name}: ${e.message.split('\n')[0]}`);
  }

  if (errors.length) failed.push(`${name}: ${errors[0]}`);

  const video = page.video();
  await ctx.close();                    // the video is only written on close
  if (video) await rename(await video.path(), path.join(OUT, `${name}.webm`)).catch(() => {});
  done++;
  process.stdout.write(`\r  ${done}/${names.length} ${name.padEnd(30)}`);
}

await browser.close();
server.close();
await rm(TMP, { recursive: true, force: true });

const files = (await readdir(OUT)).filter(f => f.endsWith('.webm'));
console.log(`\nrecord-demos — ${files.length} recordings + posters in src/demos-video/`);
if (failed.length) {
  console.error(`\n${failed.length} problem(s):\n  ${failed.join('\n  ')}`);
  process.exit(1);
}
