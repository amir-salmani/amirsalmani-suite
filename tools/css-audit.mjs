#!/usr/bin/env node
// What the stylesheet says that the pages do not ask for, and what it says twice.
//
//   node tools/css-audit.mjs [--all]
//
// Three findings, in the order they cost time:
//
//   conflict   one selector given the same property in two places. This is the
//              stale-rule signature: a layout changes, the new rule is written,
//              the old one is never removed, and the old one keeps winning
//              because nothing says it is there. `.hero { max-width: 46rem }`
//              from a single-page layout held a two-column hero to two thirds
//              of its band, and the only way it was found was a person
//              reporting the symptom twice.
//
//   unused     a selector no built page matches. Usually a component that was
//              removed, or a class that was renamed on one side only.
//
//   measure    a max-width on a text element. Prose fills its container here;
//              a cap on a paragraph is a defect, not typography.
//
// Run against dist/, because that is what a reader gets — auditing the
// generator's template strings would miss anything the shell stylesheet adds.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist', 'suite');
const ALL = process.argv.includes('--all');

// The stylesheet is named for a hash of its bytes, so it is found rather than named.
const sheet = (await readdir(DIST)).find(f => /^suite\.[0-9a-f]{8}\.css$/.test(f));
if (!sheet) { console.error('no built stylesheet in dist/suite — run npm run build'); process.exit(1); }
const css = await readFile(path.join(DIST, sheet), 'utf8');

async function* pages(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* pages(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

/* Every class and id the built pages actually use. Attribute and pseudo
 * selectors are not resolved — this reports on classes, which is where the
 * drift happens. */
const used = new Set();
let pageCount = 0;
for await (const p of pages(DIST)) {
  const html = await readFile(p, 'utf8');
  for (const m of html.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) used.add(c);
  for (const m of html.matchAll(/id="([^"]+)"/g)) used.add('#' + m[1]);
  pageCount++;
}

/* Rules, flattened out of @media and @supports. A brace-counting split is
 * enough here and avoids a parser dependency for a file this size. */
const rules = [];
{
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0, buf = '', sel = '', atRule = '';
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    if (c === '{') {
      depth++;
      if (depth === 1) { sel = buf.trim(); buf = ''; if (sel.startsWith('@')) { atRule = sel; depth = 0; buf = ''; } }
      else buf += c;
    } else if (c === '}') {
      depth--;
      if (depth === 0) { rules.push({ sel, body: buf.trim(), atRule }); buf = ''; }
      else if (depth < 0) { depth = 0; atRule = ''; buf = ''; }
      else buf += c;
    } else buf += c;
  }
}

const props = body => new Map(
  body.split(';').map(d => d.split(':')).filter(p => p.length > 1)
    .map(([k, ...v]) => [k.trim(), v.join(':').trim()]),
);

/* conflict — the same selector given the same property in two separate rules.
 * Reported only when the values differ: repeating a value is noise, changing it
 * from two places is the bug. */
const byProp = new Map();
for (const r of rules) {
  for (const s of r.sel.split(',').map(x => x.trim())) {
    for (const [k, v] of props(r.body)) {
      const key = `${s}|${k}`;
      if (!byProp.has(key)) byProp.set(key, []);
      byProp.get(key).push({ v, atRule: r.atRule });
    }
  }
}
const conflicts = [...byProp.entries()]
  .filter(([, vs]) => new Set(vs.map(x => x.v)).size > 1)
  // A media query overriding a base rule is the mechanism working, not a defect.
  .filter(([, vs]) => vs.every(x => !x.atRule))
  .map(([key, vs]) => `${key.replace('|', ' { ')}: ${vs.map(x => x.v).join('  |  ')} }`);

/* unused — a class selector no page carries. */
const classes = new Set();
for (const r of rules) {
  for (const s of r.sel.split(',')) {
    for (const m of s.matchAll(/\.([A-Za-z][\w-]*)/g)) classes.add(m[1]);
  }
}
/* Two kinds, and only one is a defect — classified by where the rule is written,
 * not by its name. A class defined under src/ ships to consumers and the
 * catalogue is under no obligation to demonstrate it. A class defined only in
 * the generator is this site's own shell, and one no page carries is dead.
 *
 * An `as-` prefix looked like the same test and was not: `band--alt` and
 * `made-by--stacked` are shipped and carry no prefix. */
const shipped = new Set();
for (const dir of ['components', 'made-by', 'demos']) {
  try {
    for (const f of await readdir(path.join(ROOT, 'src', dir))) {
      if (!/\.(css|tsx|html)$/.test(f)) continue;
      const text = await readFile(path.join(ROOT, 'src', dir, f), 'utf8');
      for (const m of text.matchAll(/[.\s"'`]([a-z][\w-]*(?:--[\w-]+)?)\b/g)) shipped.add(m[1]);
    }
  } catch { /* directory may not exist */ }
}

const unusedAll = [...classes].filter(c => !used.has(c)).sort();
const unused = unusedAll.filter(c => !shipped.has(c));
const unusedLib = unusedAll.filter(c => shipped.has(c));

/* measure — a width cap on a text element. */
const TEXT = /(^|[\s,>])(p|li|figcaption|blockquote|\.as-lede|\.faq__a|\.doc__p|\.cat__note|\.row__blurb|\.rail__note|\.item__deps|\.as-card__body)\b/;
const measure = rules
  .filter(r => TEXT.test(r.sel) && /(^|;)\s*max-width\s*:/.test(r.body))
  .map(r => `${r.sel} { max-width: ${props(r.body).get('max-width')} }`);

const show = (label, list, cap = ALL ? Infinity : 12) => {
  if (!list.length) return;
  console.log(`\n${label} (${list.length})`);
  for (const l of list.slice(0, cap)) console.log(`  ${l}`);
  if (list.length > cap) console.log(`  … ${list.length - cap} more, --all to see them`);
};

show('conflict — one selector, one property, two values', conflicts);
show('measure — a width cap on text', measure);
show('unused — a shell class no built page carries', unused);
if (unusedLib.length) console.log(`\n${unusedLib.length} shipped classes are not demonstrated by the catalogue. That is allowed: they exist for consumers.`);

const total = conflicts.length + measure.length + unused.length;
console.log(`\ncss-audit — ${rules.length} rules over ${pageCount} pages · ${conflicts.length} conflicts · ${measure.length} measures · ${unused.length} dead shell classes`);
process.exit(total ? 1 : 0);
