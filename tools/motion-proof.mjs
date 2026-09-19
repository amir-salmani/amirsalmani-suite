#!/usr/bin/env node
// No item ships motion a reader cannot turn off (decisions/0019).
//
//   node tools/motion-proof.mjs [--list]
//
// Three outcomes per item, and the middle one is why this is a classifier and
// not a grep:
//
//   still      no motion at all
//   css        motion is CSS animation or transition, which tokens.css already
//              neutralises under prefers-reduced-motion for every descendant.
//              Every component-tier item depends on tokens, so this is covered
//              rather than unguarded
//   js         motion is driven from JavaScript — requestAnimationFrame, gsap,
//              motion/react, a three.js frame loop. A media query cannot stop a
//              loop, so these need a guard in the code and are what this gate is
//              actually for
//
// Upstream guards 29 of 103 directly and six more through its own shared
// useEffectReducedMotion helper, which a per-file scan misses because the helper
// lives in a file those items merely import.

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ITEMS } from '../src/manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'imported');
const PATCHES = path.join(ROOT, 'patches');
const LIST = process.argv.includes('--list');

const JS_MOTION = /requestAnimationFrame|useAnimationFrame|\bgsap\b|ScrollTrigger|useFrame\b|<Canvas|new Lenis|\banimate\(|useSpring|useTransform|setInterval\(/;
const GUARD = /useReducedMotion|useEffectReducedMotion|prefers-reduced-motion|matchMedia\([^)]*reduced/;
const CSS_MOTION = /animation(?:-name|-duration)?\s*:|transition\s*:|@keyframes|\banimate-[a-z]/;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (!/\.json$/.test(e.name)) yield p;
  }
}

const imported = ITEMS.filter(i => i.tier === 'component' && i.files?.length);
const rows = [];

for (const item of imported) {
  let text = '';
  for await (const f of walk(path.join(SRC, item.name))) text += await readFile(f, 'utf8') + '\n';

  // An item may declare its motion unstoppable-by-design and say why.
  let waive = null;
  try {
    await stat(path.join(PATCHES, `${item.name}.mjs`));
    waive = (await import(pathToFileURL(path.join(PATCHES, `${item.name}.mjs`)).href)).motionWaiver ?? null;
  } catch { /* none */ }

  const js = JS_MOTION.test(text);
  const css = CSS_MOTION.test(text);
  const guarded = GUARD.test(text);
  const kind = js ? 'js' : css ? 'css' : 'still';
  const ok = kind !== 'js' || guarded || !!waive;
  rows.push({ name: item.name, kind, guarded, waive, ok });
}

const bad = rows.filter(r => !r.ok);
const by = k => rows.filter(r => r.kind === k).length;

if (LIST) {
  for (const r of rows.filter(r => LIST && (!r.ok || r.kind === 'js'))) {
    console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.name.padEnd(28)} ${r.kind}${r.guarded ? ' · guarded' : ''}${r.waive ? ` · waived: ${r.waive}` : ''}`);
  }
  console.log();
}

if (bad.length) {
  console.error(`${bad.length} item(s) drive motion from JavaScript with no way to stop it:\n  ${bad.map(r => r.name).join('\n  ')}\n`);
}

console.log(`motion-proof — ${rows.length} items · ${by('still')} still · ${by('css')} css, covered by tokens · ${by('js')} js-driven · ${bad.length} unguarded`);
process.exit(bad.length ? 1 : 0);
