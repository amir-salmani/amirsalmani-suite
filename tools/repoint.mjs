#!/usr/bin/env node
// Re-point imported source onto the brand (decisions/0019). Run after import,
// before build. Idempotent by construction: it rewrites files that the importer
// has just restored from upstream.
//
//   node tools/repoint.mjs [--only name,name]
//
// Always run it through `npm run import`, which imports first. On its own,
// against source it has already patched, every rule correctly matches nothing.
//
// Rules live in patches/<name>.mjs, never in src/imported/ — a re-import wipes
// that directory, so an edit made there is an edit that will be lost silently.
//
// A rule is [from, to] or [from, to, fileMatcher]. Without a matcher it applies
// to every file the item ships — including files it *shares* with other items.
// Inserting an import that way put five conflicting copies of
// lib/effects/shared/webgl-surface.jsx into one tree, which tools/stage.mjs
// caught and nothing else would have. Scope anything structural.
//
// **Every rule must match at least once.** A rule that matches nothing means
// upstream changed the code the rule was written against, and the re-pointing
// it was doing is no longer happening. That is the whole staleness mechanism:
// silence would be indistinguishable from success.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'imported');
const PATCHES = path.join(ROOT, 'patches');

const args = process.argv.slice(2);
const only = (() => {
  const i = args.indexOf('--only');
  return i === -1 ? null : new Set(args[i + 1].split(','));
})();

import { GLOBAL } from './lib/brand-rules.mjs';


async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (!/\.(mjs|json)$/.test(e.name) || !p.startsWith(path.join(SRC, 'manifest'))) yield p;
  }
}

const items = (await readdir(SRC, { withFileTypes: true }))
  .filter(e => e.isDirectory() && (!only || only.has(e.name)))
  .map(e => e.name).sort();

let changed = 0, applied = 0;
const dead = [], missing = [];

for (const name of items) {
  const patchFile = path.join(PATCHES, `${name}.mjs`);
  let rules = [];
  try {
    await stat(patchFile);
    rules = (await import(pathToFileURL(patchFile).href)).default;
  } catch { /* no patch for this item is normal — most need none */ }

  const hits = new Array(rules.length).fill(0);

  for await (const file of walk(path.join(SRC, name))) {
    const before = await readFile(file, 'utf8');
    let after = before;

    // Item rules first: a global rule that rewrote `text-white` before the
    // item's own rule ran left that rule matching nothing and reporting the
    // item as stale. Specific beats general.
    rules.forEach(([from, to, scope], i) => {
      if (scope && !scope.test(file)) return;
      const next = after.replaceAll(from, to);
      if (next !== after) { hits[i]++; after = next; }
    });

    for (const [from, to] of GLOBAL) after = after.replaceAll(from, to);

    if (after !== before) {
      await writeFile(file, after);
      changed++;
    }
  }

  rules.forEach(([from], i) => {
    if (hits[i] === 0) dead.push(`${name}: ${String(from).slice(0, 60)}`);
    else applied += hits[i];
  });
}

if (dead.length) {
  console.error(`\n${dead.length} rule(s) matched nothing — upstream moved under them:\n  ${dead.join('\n  ')}`);
}

console.log(`repoint — ${items.length} items · ${applied} substitutions in ${changed} files`);
process.exit(dead.length ? 1 : 0);
