#!/usr/bin/env node
// No colour literal below the token layer. The rule the brand tier has always
// held — "nothing below tokens.css has a hex" — applied to the 103 imported
// items that arrived without it (decisions/0019).
//
//   node tools/semantic-only.mjs [--list]
//
// A literal that genuinely cannot be a token is allowed, but only by naming
// itself and its reason in patches/<name>.mjs:
//
//   export const allow = [[/#ff5f00/g, 'demo artwork, not chrome']];
//
// An allowance with no reason is not an allowance, it is a hex someone lost
// an argument with.

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'imported');
/* The usage demos are generated from upstream's own Preview blocks and carry
 * upstream's palette — rope-cursor's passes bg-[#151714] and text-[#d0b88c].
 * Ungated, every recording made of them is a picture of their colour. */
const DEMOS = path.join(ROOT, 'verify', 'src', 'demos');
const PATCHES = path.join(ROOT, 'patches');
const LIST = process.argv.includes('--list');

/* Interpolated values are computed from props at runtime and are not literals
 * in any useful sense — rgba(${r}, ${g}, ${b}, ${a}) is a variable with
 * punctuation. What matters is whether the prop's *default* is a token, and
 * that is a patch rule like any other. */
const LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab)\((?![^)]*\$\{)[^)]*\)/g;

/* tokenColour('--fg', '#fff') — the second argument is the SSR fallback, and it
 * has to be a literal because there is no document to read a property from.
 * Library-wide, so it is stripped here rather than allowed 17 times. */
const FALLBACK = /tokenColour\([^)]*\)/g;

/* Tailwind's palette is a colour literal that happens to be spelled in words.
 * bg-zinc-800 is as much a hardcoded surface as #27272a, and the first version
 * of this gate could not see it — 359 of them across 40 items.
 *
 * transparent, current and inherit are not palette colours: they defer to
 * something else, which is the whole point of them. */
const PALETTE = '(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
const UTIL = '(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration|placeholder|divide|accent|caret)';
const TAILWIND = new RegExp(`\\b${UTIL}-(?:white|black|${PALETTE}-[0-9]{2,3})\\b`, 'g');

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (!/\.(json)$/.test(e.name)) yield p;
  }
}

const items = (await readdir(SRC, { withFileTypes: true }))
  .filter(e => e.isDirectory()).map(e => e.name).sort();

let demoOffences = 0;
try {
  for await (const f of walk(DEMOS)) {
    const text = (await readFile(f, 'utf8')).replace(FALLBACK, 'tokenColour()');
    const hits = [...(text.match(LITERAL) ?? []), ...(text.match(TAILWIND) ?? [])];
    if (hits.length) { demoOffences += hits.length; console.log(`  demo ${path.basename(f).padEnd(34)} ${hits.join('  ')}`); }
  }
} catch { /* demos not generated yet */ }

let offending = 0, allowed = 0;
const report = [];

for (const name of items) {
  let allow = [];
  try {
    await stat(path.join(PATCHES, `${name}.mjs`));
    allow = (await import(pathToFileURL(path.join(PATCHES, `${name}.mjs`)).href)).allow ?? [];
  } catch { /* none */ }

  const found = [];
  for await (const file of walk(path.join(SRC, name))) {
    const text = (await readFile(file, 'utf8')).replace(FALLBACK, 'tokenColour()');
    for (const m of [...(text.match(LITERAL) ?? []), ...(text.match(TAILWIND) ?? [])]) {
      if (allow.some(([re]) => new RegExp(re.source ?? re, re.flags?.replace('g', '') ?? '').test(m))) { allowed++; continue; }
      found.push(m);
    }
  }
  if (found.length) {
    offending += found.length;
    report.push([name, found]);
  }
}

if (LIST) {
  for (const [name, found] of report) {
    const counts = found.reduce((m, v) => ((m[v] = (m[v] ?? 0) + 1), m), {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([v, n]) => `${n}×${v}`).join('  ');
    console.log(`  ${name.padEnd(28)} ${String(found.length).padStart(3)}   ${top}`);
  }
  console.log();
}

console.log(`semantic-only — ${items.length} items · ${allowed} allowed with a reason · ${offending} unhandled in ${report.length} items · ${demoOffences} in demos`);
process.exit(offending + demoOffences ? 1 : 0);
