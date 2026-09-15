#!/usr/bin/env node
// Generate a shadcn-compatible registry from src/. One JSON per item plus an
// index, exactly the shape microkit serves — no package to depend on, no version
// to track. The consumer owns the copied source.
//
//   node tools/build-registry.mjs   →  registry/r/*.json

import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'registry', 'r');
const HOME = 'https://amirsalmani.com';
const NS = 'amirsalmani';

const read = p => readFile(path.join(ROOT, p), 'utf8');
const svgs = async dir => {
  const d = path.join(ROOT, 'src', dir);
  const files = (await readdir(d)).filter(f => f.endsWith('.svg')).sort();
  return Promise.all(files.map(async f => ({ name: f.replace('.svg', ''), content: await readFile(path.join(d, f), 'utf8') })));
};

await rm(path.join(ROOT, 'registry'), { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const items = [];
const add = async item => {
  items.push({ name: item.name, type: item.type, title: item.title, description: item.description });
  await writeFile(path.join(OUT, `${item.name}.json`),
    JSON.stringify({ $schema: 'https://ui.shadcn.com/schema/registry-item.json', ...item }, null, 2) + '\n');
};

// The lockup, both ways: React for a shadcn project, plain HTML/CSS for a site
// with no build step — which is what amirsalmani.com itself is.
await add({
  name: 'made-by',
  type: 'registry:component',
  title: 'Made by — attribution lockup',
  description: 'Made with ♥ and good tools by Amir Salmani. Derives every colour from the surrounding foreground, so it adapts on either ground without a second rule.',
  author: 'Amir Salmani <hi@amirsalmani.com>',
  files: [
    { path: 'components/made-by.tsx', type: 'registry:component', target: 'components/made-by.tsx', content: await read('src/made-by/made-by.tsx') },
    { path: 'components/made-by.css', type: 'registry:file', target: 'components/made-by.css', content: await read('src/made-by/made-by.css') },
  ],
});

const marks = await svgs('marks');
await add({
  name: 'marks',
  type: 'registry:file',
  title: 'Marks',
  description: 'The A-frame, the heart and the tool, in regular and bold weights. One 64-unit grid, one stroke weight, round caps, currentColor.',
  author: 'Amir Salmani <hi@amirsalmani.com>',
  files: marks.map(m => ({ path: `marks/${m.name}.svg`, type: 'registry:file', target: `public/marks/${m.name}.svg`, content: m.content })),
});

const icons = await svgs('icons');
await add({
  name: 'icons',
  type: 'registry:file',
  title: 'Icons',
  description: 'Drawn in the mark’s own grammar: straight strokes, round caps, filled nodes at termini, hexagons for anything mechanical.',
  author: 'Amir Salmani <hi@amirsalmani.com>',
  files: icons.map(m => ({ path: `icons/${m.name}.svg`, type: 'registry:file', target: `public/icons/${m.name}.svg`, content: m.content })),
});

await writeFile(path.join(OUT, 'registry.json'),
  JSON.stringify({
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: NS, homepage: HOME, items,
  }, null, 2) + '\n');

console.log(`registry/r/ — ${items.length} items, ${marks.length} marks, ${icons.length} icons`);
for (const i of items) console.log(`  npx shadcn@latest add @${NS}/${i.name}`);
