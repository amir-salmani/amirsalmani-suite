#!/usr/bin/env node
// Generate a shadcn-compatible registry from src/manifest.mjs. One JSON per
// item plus an index, exactly the shape microkit serves — no package to depend
// on, no version to track. The consumer owns the copied source.
//
//   node tools/build-registry.mjs   →  registry/r/*.json

import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS, byName } from '../src/manifest.mjs';
import { stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'registry', 'r');
const HOME = 'https://amirsalmani.com';
const NS = 'amirsalmani';
const AUTHOR = 'Amir Salmani <hi@amirsalmani.com>';

const read = p => readFile(path.join(ROOT, p), 'utf8');

async function svgs(dir) {
  const d = path.join(ROOT, 'src', dir);
  const names = (await readdir(d)).filter(f => f.endsWith('.svg')).sort();
  return Promise.all(names.map(async f => ({
    name: f.replace('.svg', ''),
    content: await readFile(path.join(d, f), 'utf8'),
  })));
}

/** The files one item installs, not counting its dependencies'.
 *
 * An imported item carries its own file list, because upstream decides how many
 * files it is and where they land. tools/import-obsidian.mjs writes those
 * entries; nothing here is hand-authored. */
async function filesFor(item) {
  if (item.files) return Promise.all(item.files.map(async f => ({
    path: f.path,
    type: f.type ?? 'registry:file',
    target: f.target,
    content: await read(path.join('src/imported', item.name, f.path)),
  })));

  if (item.css) return [{
    path: `styles/${item.css}`,
    type: 'registry:file',
    target: item.target ?? `styles/amirsalmani-${item.css}`,
    content: await read(`src/components/${item.css}`),
  }];

  if (item.js) return [{
    path: `lib/${item.js}`,
    type: 'registry:file',
    target: item.target ?? `lib/${item.js}`,
    content: await read(`src/${item.dir ?? 'motion'}/${item.js}`),
  }];

  if (item.special === 'made-by') return [
    { path: 'components/made-by.tsx', type: 'registry:component', target: 'components/made-by.tsx', content: await read('src/made-by/made-by.tsx') },
    { path: 'components/made-by.css', type: 'registry:file', target: 'components/made-by.css', content: await read('src/made-by/made-by.css') },
  ];

  if (item.special === 'svgdir') {
    const list = await svgs(item.dir);
    return list.map(m => ({
      path: `${item.dir}/${m.name}.svg`,
      type: 'registry:file',
      target: `public/${item.dir}/${m.name}.svg`,
      content: m.content,
    }));
  }

  return [];                                   // a bundle installs nothing itself
}

/** A bundle is expressed as registryDependencies, so the CLI resolves it.
 *
 * `all` means all of one tier, never both: the brand tier is framework-free CSS
 * and the component tier needs Tailwind and React. Sweeping them into one
 * command would hand a plain-CSS consumer a build step they did not ask for. */
function depsFor(item) {
  if (item.bundle === 'all') {
    const tier = item.tier ?? 'brand';
    return ITEMS.filter(i => !i.bundle && (i.tier ?? 'brand') === tier).map(i => i.name);
  }
  return [...new Set([...(item.deps ?? []), ...(item.bundle ?? [])])];
}

// Two tiers can name the same thing — `button` is authored here and imported
// from upstream. Last-write-wins produced a registry ten items short and said
// nothing, so this is fatal: retire one in src/manifest.mjs or rename it.
const dupes = Object.entries(ITEMS.reduce((m, i) => ((m[i.name] = (m[i.name] ?? 0) + 1), m), {}))
  .filter(([, n]) => n > 1).map(([n]) => n);
if (dupes.length) {
  console.error(`${dupes.length} name collision(s) across tiers:\n  ${dupes.join('\n  ')}`);
  process.exit(1);
}

await rm(path.join(ROOT, 'registry'), { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

/* A patch that rewrites an import has changed what the item depends on. Saying
 * so in the patch keeps the two facts in one file; deriving it from the source
 * would be a parser, and a wrong one. */
async function patchMeta(name) {
  const p = path.join(ROOT, 'patches', `${name}.mjs`);
  try { await stat(p); } catch { return {}; }
  return import(pathToFileURL(p).href);
}

const index = [];
for (const item of ITEMS) {
  const files = await filesFor(item);
  const { dropNpm = [], addRegistry = [] } = item.tier === 'component' ? await patchMeta(item.name) : {};
  const deps = [...new Set([...depsFor(item), ...addRegistry])];
  item.npm = (item.npm ?? []).filter(d => !dropNpm.includes(d));
  const body = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: item.name,
    type: item.type ?? 'registry:file',
    title: item.title,
    description: item.description,
    author: AUTHOR,
    categories: [item.category.toLowerCase()],
    ...(item.npm?.length ? { dependencies: item.npm } : {}),
    ...(deps.length ? { registryDependencies: deps } : {}),
    ...(files.length ? { files } : {}),
  };
  if (item.upstream) body.meta = { upstream: item.upstream };
  await writeFile(path.join(OUT, `${item.name}.json`), JSON.stringify(body, null, 2) + '\n');
  index.push({ name: item.name, type: body.type, title: item.title, description: item.description, categories: body.categories, tier: item.tier ?? 'brand' });
}

await writeFile(path.join(OUT, 'registry.json'), JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: NS,
  homepage: HOME,
  items: index,
}, null, 2) + '\n');

// A dependency naming a missing item resolves to a 404 at install time and
// nowhere earlier, which is the kind of thing a build should refuse to emit.
const broken = ITEMS.flatMap(i => depsFor(i).filter(d => !byName[d]).map(d => `${i.name} → ${d}`));
if (broken.length) {
  console.error('unresolved registry dependencies:\n  ' + broken.join('\n  '));
  process.exit(1);
}

console.log(`registry/r/ — ${index.length} items`);
