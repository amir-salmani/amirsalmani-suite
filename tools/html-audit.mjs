#!/usr/bin/env node
// What the built pages get wrong that a browser will not complain about.
//
//   node tools/html-audit.mjs
//
// catalogue-proof already fails on a console error, which catches a page that
// breaks. This catches a page that works and is still wrong: no heading to
// land on, two of them, an image nobody can hear, a link that goes nowhere.
//
// Both of the first two existed when this was written. The catalogue had no h1
// at all, and the `headline` item page had two — its live demo ships an <h1>,
// which is correct inside a specimen and wrong once it is injected into a page
// that already has one.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist', 'suite');

async function* pages(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* pages(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const fails = [];
let count = 0;

for await (const file of pages(DIST)) {
  const rel = path.relative(DIST, file);
  const html = await readFile(file, 'utf8');
  count++;

  const h1 = (html.match(/<h1\b/g) ?? []).length;
  if (h1 !== 1) fails.push(`${rel}: ${h1} h1`);

  for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\balt=/.test(img)) fails.push(`${rel}: img without alt`);
  }
  for (const v of html.match(/<video\b[^>]*>/g) ?? []) {
    if (!/aria-label=|aria-hidden=/.test(v)) fails.push(`${rel}: video with no label and not hidden`);
  }

  // Relative links, resolved against the built tree. A dead href is the defect
  // that split this site into three surfaces and left every rail link pointing
  // at an anchor that no longer existed.
  for (const m of html.matchAll(/href="(?!https?:|mailto:|#)([^"]+)"/g)) {
    const href = m[1].split('#')[0];
    if (!href) continue;
    const target = path.resolve(path.dirname(file), href);
    const candidates = href.endsWith('/') ? [path.join(target, 'index.html')] : [target, path.join(target, 'index.html')];
    let ok = false;
    for (const c of candidates) { try { await stat(c); ok = true; break; } catch { /* next */ } }
    // Anything outside this service belongs to the site it is a section of.
    if (!ok && !target.startsWith(DIST)) ok = true;
    if (!ok) fails.push(`${rel}: dead link ${m[1]}`);
  }
}

const uniq = [...new Set(fails)];
if (uniq.length) {
  console.error(`\n${uniq.length} problem(s):`);
  for (const f of uniq.slice(0, 20)) console.error(`  ${f}`);
  if (uniq.length > 20) console.error(`  … ${uniq.length - 20} more`);
}

console.log(`html-audit — ${count} pages · ${uniq.length} problems`);
process.exit(uniq.length ? 1 : 0);
