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

/** The files one item installs, not counting its dependencies'. */
async function filesFor(item) {
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
    content: await read(`src/motion/${item.js}`),
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

/** A bundle is expressed as registryDependencies, so the CLI resolves it. */
function depsFor(item) {
  if (item.bundle === 'all') {
    return ITEMS.filter(i => !i.bundle).map(i => i.name);
  }
  return [...new Set([...(item.deps ?? []), ...(item.bundle ?? [])])];
}

await rm(path.join(ROOT, 'registry'), { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const index = [];
for (const item of ITEMS) {
  const files = await filesFor(item);
  const deps = depsFor(item);
  const body = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: item.name,
    type: item.type ?? 'registry:file',
    title: item.title,
    description: item.description,
    author: AUTHOR,
    categories: [item.category.toLowerCase()],
    ...(deps.length ? { registryDependencies: deps } : {}),
    ...(files.length ? { files } : {}),
  };
  await writeFile(path.join(OUT, `${item.name}.json`), JSON.stringify(body, null, 2) + '\n');
  index.push({ name: item.name, type: body.type, title: item.title, description: item.description, categories: body.categories });
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
