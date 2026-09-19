#!/usr/bin/env node
// Overlay every imported item into one tree, the way a consumer's project ends
// up after installing them all.
//
//   node tools/stage.mjs [--out DIR]
//
// The importer keeps each item in its own directory so a re-import can wipe one
// without touching the others. A real install has no such separation: all 103
// land in one src/, and files they share have to be identical. This is where
// that assumption is checked, and it is the only place it can be — the registry
// JSON cannot see a conflict it does not create.

import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS } from '../src/manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'imported');
const i = process.argv.indexOf('--out');
const OUT = path.resolve(i === -1 ? path.join(ROOT, 'verify', 'src', 'suite') : process.argv[i + 1]);

const imported = ITEMS.filter(x => x.tier === 'component' && x.files?.length);

/* Brand-tier libraries the component tier imports — token-colour today. A
 * consumer installs them into their own lib/, so staging them anywhere else
 * would verify a layout nobody gets. */
const shared = ITEMS.filter(x => x.type === 'registry:lib' && x.js);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const owner = new Map();       // relative path → [item, content]
const conflicts = [];
let files = 0;

for (const item of imported) {
  for (const f of item.files) {
    const content = await readFile(path.join(SRC, item.name, f.path), 'utf8');
    const prev = owner.get(f.path);
    if (prev && prev[1] !== content) {
      conflicts.push(`${f.path}\n      ${prev[0]} and ${item.name} ship different versions`);
      continue;
    }
    if (prev) continue;
    owner.set(f.path, [item.name, content]);
    const dest = path.join(OUT, f.path);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, content);
    files++;
  }
}

for (const item of shared) {
  const content = await readFile(path.join(ROOT, 'src', item.dir ?? 'motion', item.js), 'utf8');
  const rel = item.target ?? `lib/${item.js}`;
  const dest = path.join(OUT, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, content);
  files++;
}

if (conflicts.length) {
  console.error(`\n${conflicts.length} file(s) shipped in conflicting versions:\n    ${conflicts.join('\n    ')}`);
}

console.log(`stage — ${imported.length} imported + ${shared.length} shared · ${files} distinct files · ${conflicts.length} conflicts`);
process.exit(conflicts.length ? 1 : 0);
