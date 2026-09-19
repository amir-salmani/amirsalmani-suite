#!/usr/bin/env node
// Pull the component tier from ObsidianUI (decisions/0019). Re-runnable.
//
//   node tools/import-obsidian.mjs [--dry] [--only name,name]
//
// Writes src/imported/<name>/<file> and src/imported/manifest.generated.mjs.
// src/imported/ is wiped on every run and nothing in it is hand-edited: local
// changes belong in patches/<name>.patch, which tools/repoint.mjs applies on
// top, so a re-import cannot silently discard them. The one authored input is
// src/imported-categories.mjs, which lives outside the wiped directory for
// exactly that reason.
//
// Upstream has no tags and moves daily, so every item records the sha256 of
// what was imported and the date. tools/reconcile-upstream.mjs is what turns
// that into an answer about staleness.

import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMPORTED } from '../src/imported-categories.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'imported');
const REGISTRY = process.env.OBSIDIAN_REGISTRY ?? 'https://www.obsidianui.dev/r/registry.json';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const only = (() => {
  const i = args.indexOf('--only');
  return i === -1 ? null : new Set(args[i + 1].split(','));
})();

const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 12);

const HONOURS_RM = /useReducedMotion|prefers-reduced-motion/;

/* A factual line, not an authored one. The brand tier's blurbs are written;
 * these are derived, and say so by being dull. Authored copy is a catalogue
 * task, not an import task.
 *
 * The reduced-motion clause is here because it is the one fact about an
 * imported item that changes whether it may ship (decisions/0019), and burying
 * it in a report nobody reruns is how it stays unfixed. It reports a missing
 * *reference*, which is not the same as missing a guard — an item with no
 * motion needs neither. motion-proof draws that line. */
function blurb(item, honoursRm) {
  const kind = item.type === 'registry:ui' ? 'shadcn primitive' : 'React block';
  const npm = (item.dependencies ?? []).filter(d => !/^(clsx|tailwind-merge|class-variance-authority)$/.test(d));
  const needs = npm.length ? ` Needs ${npm.slice(0, 3).join(', ')}${npm.length > 3 ? ` +${npm.length - 3}` : ''}.` : '';
  return `${kind}, re-pointed onto the brand.${needs}`;
}

/* Upstream targets are shadcn path aliases — @ui/, @components/, @lib/, @hooks/.
 * The registry JSON we emit keeps them, because the consumer's components.json
 * is what resolves them. On disk they need a real directory. */
// Upstream documents @ui/ as src/components/ui/, and its own source reaches the
// same files through @/components/ui/. Staging @ui/ at a bare ui/ made those two
// paths different directories and the build could not find half the primitives.
const ALIAS = { '@ui/': 'components/ui/', '@components/': 'components/', '@lib/': 'lib/', '@hooks/': 'hooks/' };
const onDisk = target => {
  for (const [a, d] of Object.entries(ALIAS)) if (target.startsWith(a)) return d + target.slice(a.length);
  return target.replace(/^\/+/, '');
};

/* upstream/ holds the exact bytes this suite was built from, and is committed.
 * It makes the import reproducible without the network, survives upstream
 * moving or disappearing, and turns drift into a git diff. Re-importing is how
 * a staging or alias fix is applied, and that should not need obsidianui.dev to
 * be reachable — nor should a network blip leave src/imported/ half-written. */
const CACHE = path.join(ROOT, 'upstream', 'registry.json');
const upstream = await (async () => {
  if (!args.includes('--offline')) {
    try {
      const res = await fetch(REGISTRY);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      await writeFile(CACHE, body);
      return JSON.parse(body);
    } catch (e) {
      console.error(`registry fetch failed (${e.message}) — falling back to the cache`);
    }
  }
  try { return JSON.parse(await readFile(CACHE, 'utf8')); }
  catch { console.error('no cached registry either; nothing to import'); process.exit(1); }
})();
const today = new Date().toISOString().slice(0, 10);

const unknown = upstream.items.filter(i => !IMPORTED[i.name]).map(i => i.name);
if (unknown.length) {
  // A new upstream item with no category would land in the registry untitled
  // and uncategorised, which the catalogue cannot render. Fail rather than guess.
  console.error(`upstream has ${unknown.length} item(s) missing from src/imported-categories.mjs:\n  ${unknown.join('\n  ')}`);
  process.exit(1);
}

if (!DRY && !only) await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const entries = [];
const unguarded = [];
let written = 0;

for (const item of upstream.items) {
  if (only && !only.has(item.name)) continue;
  const [category, title] = IMPORTED[item.name];
  const files = [];

  for (const f of item.files ?? []) {
    const rel = onDisk(f.target ?? f.path);
    files.push({ path: rel, target: f.target ?? f.path, type: f.type });
    if (!DRY) {
      const dest = path.join(OUT, item.name, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, f.content);
      written++;
    }
  }

  const honoursRm = HONOURS_RM.test((item.files ?? []).map(f => f.content).join(' '));
  if (!honoursRm) unguarded.push(item.name);

  entries.push({
    name: item.name,
    category,
    title,
    blurb: blurb(item, honoursRm),
    description: blurb(item, honoursRm),
    reducedMotion: honoursRm,
    tier: 'component',
    type: item.type,
    npm: item.dependencies ?? [],
    deps: ['tokens', 'tokens-shadcn', ...(item.registryDependencies ?? [])],
    files,
    upstream: {
      source: REGISTRY,
      imported: today,
      sha: sha(JSON.stringify(item)),
    },
  });
}

if (DRY) {
  console.log(`${entries.length} items · ${entries.reduce((n, e) => n + e.files.length, 0)} files (dry run)`);
  process.exit(0);
}

const body = `/* Generated by tools/import-obsidian.mjs. Do not edit.
 *
 * Local changes to imported source live in patches/, never here and never in
 * src/imported/<name>/ — a re-import overwrites both.
 */

export const IMPORTED_ITEMS = ${JSON.stringify(entries, null, 2)};
`;
await writeFile(path.join(OUT, 'manifest.generated.mjs'), body);

console.log(`src/imported/ — ${entries.length} items · ${written} files`);
// Only a count of direct references. Whether an item *needs* one is a
// classification, not a grep — tools/motion-proof.mjs is the gate.
console.log(`reduced motion: ${entries.length - unguarded.length}/${entries.length} carry a direct reference · run motion-proof for the gap`);
