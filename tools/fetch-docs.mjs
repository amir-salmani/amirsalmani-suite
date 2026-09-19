#!/usr/bin/env node
// Pull upstream's per-item documentation: the one-line description and the
// runnable Demo from its Preview block.
//
//   node tools/fetch-docs.mjs [--offline]
//
// The registry carries no title, no description and no usage for any item — but
// the docs pages do, behind an Accept: text/markdown header. Forty of the 103
// are documented; the rest are shadcn primitives whose usage is shadcn's.
//
// The Demo block is what makes a recording possible at all. A component cannot
// be filmed without knowing what props it needs, and guessing that for 103
// items is how you get 103 blank frames.

import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMPORTED_ITEMS } from '../src/imported/manifest.generated.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'upstream', 'docs.json');
const BASE = process.env.OBSIDIAN_DOCS ?? 'https://www.obsidianui.dev/docs';
const OFFLINE = process.argv.includes('--offline');

const existing = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => ({}));
if (OFFLINE) { console.log(`fetch-docs — offline, ${Object.keys(existing).length} cached`); process.exit(0); }

const docs = { ...existing };
let fetched = 0, undocumented = 0;

for (const item of IMPORTED_ITEMS) {
  let md;
  try {
    const res = await fetch(`${BASE}/${item.name}`, { headers: { Accept: 'text/markdown' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    md = await res.text();
  } catch (e) {
    console.error(`  ${item.name}: ${e.message}`);
    continue;
  }

  if (/^# Page not found/m.test(md)) { undocumented++; delete docs[item.name]; continue; }

  // The paragraph under the title, before the first heading.
  const description = md.split('\n').slice(1).find(l => l.trim() && !l.startsWith('#') && !l.startsWith('['))?.trim();

  /* The first fenced block that declares a component — the Preview demo.
   * Upstream writes it three ways: `export default function Demo`,
   * `export function Demo`, and `const Demo = () =>`. Normalised to a default
   * export here so the generator downstream has one shape to emit. */
  let demo = [...md.matchAll(/```(?:tsx|jsx)\n([\s\S]*?)```/g)]
    .map(m => m[1])
    .find(code => /export\s+(?:default\s+)?function\s+Demo|const\s+Demo\s*=/.test(code));
  if (demo && !/export\s+default/.test(demo)) {
    demo = demo.replace(/export\s+function\s+Demo/, 'export default function Demo')
               .replace(/const\s+Demo\s*=/, 'export default const Demo =');
  }

  docs[item.name] = { description, demo: demo ?? null };
  fetched++;
}

await writeFile(OUT, JSON.stringify(docs, null, 2) + '\n');

const withDemo = Object.values(docs).filter(d => d.demo).length;
console.log(`fetch-docs — ${fetched} documented · ${withDemo} with a runnable demo · ${undocumented} undocumented`);
