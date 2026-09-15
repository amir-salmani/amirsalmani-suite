#!/usr/bin/env node
// Build the catalogue and the served registry from src/manifest.mjs.
//
//   node tools/build-site.mjs [outdir]        default: dist/
//
// Writes:
//   <out>/r/*.json          the registry, so `npx shadcn add @amirsalmani/x` resolves
//   <out>/suite/index.html  the catalogue — one static file, no framework
//   <out>/suite/suite.css   every component, concatenated, in manifest order
//   <out>/suite/lib/motion.js
//
// The catalogue is static on purpose. opensourceui.in renders its 207-row index
// on the client and pays 2796ms to first paint for a page of links; this one is
// bytes on disk. See design-atelier/teardowns/opensourceui-in-components.md.

import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS, CATEGORIES, byName } from '../src/manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'dist'));
const read = p => readFile(path.join(ROOT, p), 'utf8');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => esc(s).replace(/"/g, '&quot;');

const bundles = ITEMS.filter(i => i.bundle);
const components = ITEMS.filter(i => !i.bundle);
const installable = ITEMS.filter(i => i.bundle !== 'all');
const az = [...ITEMS].sort((a, b) => a.title.localeCompare(b.title, 'en'));

// ── the demo for an SVG directory is the directory ──────────────────────────
async function svgDemo(dir) {
  const d = path.join(ROOT, 'src', dir);
  const names = (await readdir(d)).filter(f => f.endsWith('.svg') && !f.endsWith('-bold.svg')).sort();
  const cells = await Promise.all(names.map(async f => {
    const svg = (await readFile(path.join(d, f), 'utf8')).trim();
    return `  <figure class="glyph">${svg}<figcaption class="as-label as-label--faint">${esc(f.replace('.svg', ''))}</figcaption></figure>`;
  }));
  return `<div class="glyphs">\n${cells.join('\n')}\n</div>`;
}

async function demoFor(item) {
  if (!item.demo) return null;
  if (item.special === 'svgdir') return await svgDemo(item.dir);
  return (await read(`src/demos/${item.demo}.html`)).trimEnd();
}

// The page ships under `script-src 'self'`, so a demo's inline <script> would be
// blocked. It stays in the shown source, where it is the documentation, and the
// live preview gets its behaviour from catalogue.js instead.
const stripScript = s => s.replace(/\n?[ \t]*<script[\s\S]*?<\/script>/g, '');

// ── the CSS bundle, in manifest order so tokens land first ──────────────────
const cssParts = [];
for (const item of ITEMS) {
  if (item.css) cssParts.push(await read(`src/components/${item.css}`));
}
cssParts.push(await read('src/made-by/made-by.css'));

// ── page furniture ──────────────────────────────────────────────────────────
const counts = Object.fromEntries(CATEGORIES.map(([c]) => [c, ITEMS.filter(i => i.category === c).length]));

const rail = CATEGORIES.map(([cat, note]) => `
      <div class="rail__group">
        <a class="rail__cat" href="#cat-${cat.toLowerCase()}">${esc(cat)}<span class="rail__n">${counts[cat]}</span></a>
        <p class="rail__note">${esc(note)}</p>
        <ul class="rail__items">
${ITEMS.filter(i => i.category === cat).map(i => `          <li><a href="#${i.name}">${esc(i.title)}</a></li>`).join('\n')}
        </ul>
      </div>`).join('');

// The flat A–Z list: the category is a slash-suffix in a lighter weight, not a
// folder. A reader who knows what they want never touches the rail.
const flat = az.map(i => `
        <a class="row" href="#${i.name}" data-search="${attr((i.title + ' ' + i.category + ' ' + i.blurb).toLowerCase())}">
          <span class="row__ix" aria-hidden="true">${esc(i.title[0].toUpperCase())}</span>
          <span class="row__name">${esc(i.title)}</span>
          <span class="row__cat">/ ${esc(i.category)}</span>
          <span class="row__blurb">${esc(i.blurb)}</span>
          <span class="row__go" aria-hidden="true">&rsaquo;</span>
        </a>`).join('');

let sections = '';
let lastCat = null;
for (const item of ITEMS) {
  if (item.category !== lastCat) {
    lastCat = item.category;
    const note = CATEGORIES.find(([c]) => c === lastCat)[1];
    sections += `
      <div class="cat-head" id="cat-${lastCat.toLowerCase()}">
        <span class="as-label">${esc(lastCat)}</span>
        <p class="as-card__body">${esc(note)}</p>
      </div>`;
  }

  const demo = await demoFor(item);
  const deps = (item.deps ?? []).filter(d => byName[d]);
  const bundleOf = Array.isArray(item.bundle) ? item.bundle : item.bundle === 'all' ? installable.map(i => i.name) : null;

  sections += `
      <section class="item" id="${item.name}">
        <div class="item__head">
          <h2 class="item__title">${esc(item.title)}</h2>
          <span class="as-label as-label--faint">${esc(item.category)}</span>
          <span class="as-sec-head__rule"></span>
        </div>
        <p class="item__desc">${esc(item.description)}</p>
${deps.length ? `        <p class="item__deps"><span class="as-label as-label--faint">Needs</span> ${deps.map(d => `<a class="as-link" href="#${d}">${esc(byName[d].title)}</a>`).join(', ')}</p>\n` : ''}${bundleOf ? `        <p class="item__deps"><span class="as-label as-label--faint">Installs</span> ${bundleOf.map(d => `<a class="as-link" href="#${d}">${esc(byName[d].title)}</a>`).join(', ')}</p>\n` : ''}        <pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/${item.name}</code></pre>
${demo ? `        <div class="preview"><span class="as-label as-label--faint preview__tag">Live</span>
          <div class="preview__stage">
${stripScript(demo).split('\n').map(l => '            ' + l).join('\n')}
          </div>
        </div>
        <details class="src">
          <summary><span class="as-label">Markup</span></summary>
          <pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>${esc(demo)}</code></pre>
        </details>` : ''}
      </section>`;
}

const page = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The suite — ${components.length} components, drawn to one brand | Amir Salmani</title>
<meta name="description" content="${components.length} copy-in components across ${CATEGORIES.length} categories, served as a shadcn registry. Two grounds, no accent hue, MIT, no attribution required.">
<meta name="theme-color" content="#212842">
<link rel="canonical" href="https://amirsalmani.com/suite/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="/">
<link rel="stylesheet" href="suite.css">
<script src="theme.js"></script>
</head>
<body class="band">

<nav class="as-nav">
  <a class="as-nav__brand" href="/">
    <svg viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 51 L32 13 L52 51"/><path d="M20.5 35 H43.5"/><g fill="currentColor" stroke="none"><circle cx="32" cy="13" r="3.8"/><circle cx="12" cy="51" r="3.8"/><circle cx="52" cy="51" r="3.8"/></g></svg>
    Amir Salmani
  </a>
  <div class="as-nav__links">
    <a href="/aboutme/">About</a>
    <a href="/services/">Services</a>
    <a href="/projects/">Projects</a>
    <a href="/suite/" aria-current="page">Suite</a>
    <button class="as-switch" id="theme" role="switch" aria-checked="true" aria-label="Dark theme" data-spring></button>
  </div>
</nav>

<header class="as-section">
  <div class="as-section__inner">
    <div class="as-stack as-stack--s hero">
    <span class="as-label">Suite / Registry</span>
    <h1 class="as-headline">
      <span class="as-headline__setup">Every surface I build on,</span>
      in one command.
    </h1>
    <p class="as-lede">
      ${components.length} components and ${bundles.length} bundles across ${CATEGORIES.length} categories, served as a shadcn registry.
      The CLI copies the source into your project and you own it from then on —
      there is no package to depend on and no version to track.
    </p>
    <pre class="as-code hero__install"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/tokens
npx shadcn@latest add @amirsalmani/suite</code></pre>
    <div class="as-grid as-grid--narrow hero__figures">
      <div class="as-figure"><span class="as-figure__value">${ITEMS.length}</span><span class="as-figure__label">Items in the registry</span><span class="as-figure__source">src/manifest.mjs</span></div>
      <div class="as-figure"><span class="as-figure__value">0</span><span class="as-figure__label">Hex codes below the token layer</span><span class="as-figure__source">tools/contrast.mjs</span></div>
      <div class="as-figure"><span class="as-figure__value">MIT</span><span class="as-figure__label">No attribution required</span><span class="as-figure__source">LICENCE</span></div>
    </div>
  </div>
</header>

<div class="shell">
  <aside class="rail" aria-label="Components by category">
    <span class="as-label">By category</span>${rail}
    <div class="rail__licence">
      <p class="as-card__body">Free for personal and commercial use. No attribution required.
      <a class="as-link" href="https://github.com/amir-salmani/amirsalmani-suite/blob/main/LICENCE">MIT</a>,
      including the marks. They are also a signature, so use them to credit the
      suite rather than to identify yourself —
      <a class="as-link" href="https://github.com/amir-salmani/amirsalmani-suite/blob/main/docs/using-the-mark.md">using the mark</a>.</p>
    </div>
  </aside>

  <main class="main">
    <section class="index" id="index">
      <div class="as-sec-head">
        <h2 class="as-sec-head__title">All ${ITEMS.length} items</h2>
        <span class="as-sec-head__rule"></span>
      </div>
      <p class="as-lede index__note">
        Alphabetical, with the category as a suffix rather than a folder — so if
        you know what you want, you never have to guess where it lives.
      </p>
      <label class="as-field as-measure index__find" id="find" hidden>
        <span class="as-label">Find</span>
        <input class="as-input" type="search" id="q" placeholder="button, mono, no hue…" autocomplete="off">
      </label>
      <div class="rows">${flat}
      </div>
      <p class="as-label as-label--faint index__nohit" id="nohit" hidden>Nothing matches.</p>
    </section>
${sections}
  </main>
</div>

<footer class="as-colophon">
  <div class="as-colophon__inner">
    <span class="as-colophon__legal">&copy; 2026 Rhinocloud Ltd. &middot; MIT</span>
    <span class="made-by">
      <svg class="made-by__mark" viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Amir Salmani"><path d="M12 51 L32 13 L52 51"/><path d="M20.5 35 H43.5"/><g fill="currentColor" stroke="none"><circle cx="32" cy="13" r="3.8"/><circle cx="12" cy="51" r="3.8"/><circle cx="52" cy="51" r="3.8"/></g></svg>
      <span>Made with <svg class="made-by__glyph" viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="love"><path d="M32 50 L14.5 32.5 A12.375 12.375 0 0 1 32 15 A12.375 12.375 0 0 1 49.5 32.5 Z"/></svg> and good tools by <a href="https://amirsalmani.com" class="made-by__link">Amir Salmani</a></span>
    </span>
  </div>
</footer>

<script type="module" src="catalogue.js"></script>
</body>
</html>
`;

// Runs before first paint, from its own file because the CSP is `script-src
// 'self'` with no unsafe-inline. Classic script, not a module: a module is
// deferred and the flash is exactly what this exists to prevent.
const themeJs = `/* Theme before first paint. The attribute is authoritative; the system
   preference is only the default, and it keeps applying until a choice is made. */
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;

// ── the catalogue's own 40 lines of behaviour ───────────────────────────────
const js = `/* The catalogue's behaviour. Everything here is an enhancement: without it the
   list is complete, every anchor works and the code blocks are selectable. */
import { Spring, SPRING } from './lib/motion.js';

/* theme — the switch is authoritative, the system preference is the default */
const root = document.documentElement;
const sw = document.getElementById('theme');
if (sw) {
  const knob = new Spring(root.getAttribute('data-theme') === 'dark' ? 1 : 0,
    t => sw.style.setProperty('--t', t.toFixed(4)), SPRING.knob);
  const paint = () => {
    const dark = root.getAttribute('data-theme') !== 'light';
    sw.setAttribute('aria-checked', String(dark));
    knob.to(dark ? 1 : 0);
  };
  paint();
  sw.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paint();
  });
}

/* copy — the label is the feedback, so there is no toast for it */
for (const btn of document.querySelectorAll('.as-code__copy')) {
  btn.addEventListener('click', async () => {
    const code = btn.parentElement.querySelector('code');
    try { await navigator.clipboard.writeText(code.textContent); } catch (e) { return; }
    btn.textContent = 'Copied';
    btn.dataset.copied = '';
    setTimeout(() => { btn.textContent = 'Copy'; delete btn.dataset.copied; }, 1400);
  });
}

/* the demo switches, including the spring one whose own <script> the CSP drops */
for (const el of document.querySelectorAll('.preview .as-switch')) {
  const spring = el.hasAttribute('data-spring')
    ? new Spring(el.getAttribute('aria-checked') === 'true' ? 1 : 0,
                 t => el.style.setProperty('--t', t.toFixed(4)), SPRING.knob)
    : null;
  el.addEventListener('click', () => {
    const on = el.getAttribute('aria-checked') !== 'true';
    el.setAttribute('aria-checked', String(on));
    if (spring) spring.to(on ? 1 : 0);
  });
}

/* find — hidden until JS is here, because a search box that does nothing is a lie */
const find = document.getElementById('find');
const q = document.getElementById('q');
const nohit = document.getElementById('nohit');
if (find && q) {
  find.hidden = false;
  const rows = [...document.querySelectorAll('.row')];
  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    let hits = 0;
    for (const r of rows) {
      const on = !term || r.dataset.search.includes(term);
      r.hidden = !on;
      if (on) hits++;
    }
    nohit.hidden = hits > 0;
  });
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); q.focus(); q.select(); }
  });
}
`;

// ── the catalogue's own layout, which is not part of the suite ──────────────
const shellCss = `/* The catalogue's own shell. Not a suite component — it exists to show them,
   and it derives from the same tokens so it cannot drift from what it displays. */

.shell {
  display: grid;
  grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
  gap: var(--gap-xl);
  max-width: var(--maxw);
  margin-inline: auto;
  padding-inline: var(--pad-x);
  padding-bottom: var(--gap-xl);
  align-items: start;
}
@media (max-width: 62rem) { .shell { grid-template-columns: minmax(0, 1fr); } .rail { position: static; } }

.rail { position: sticky; top: 4.5rem; display: flex; flex-direction: column; gap: var(--gap-m); max-height: calc(100vh - 6rem); overflow-y: auto; padding-right: .5rem; }
.rail__group { display: flex; flex-direction: column; gap: .25rem; }
.rail__cat { display: flex; align-items: baseline; gap: .5rem; font-weight: 700; letter-spacing: -.015em; color: var(--fg); text-decoration: none; }
.rail__n { font-family: var(--mono); font-size: .66rem; color: var(--faint); }
.rail__note { margin: 0 0 .35rem; font-size: .8rem; line-height: 1.5; color: var(--faint); }
.rail__items { list-style: none; margin: 0; padding: 0 0 0 .1rem; display: flex; flex-direction: column; }
.rail__items a { display: block; padding: .28rem 0; font-size: .9rem; color: var(--muted); text-decoration: none; border-left: 1px solid var(--rule); padding-left: .7rem; transition: color var(--fast) var(--ease-out), border-color var(--fast) var(--ease-out); }
.rail__items a:hover, .rail__items a:focus-visible { color: var(--fg); border-color: var(--fg); }
.rail__licence { padding-top: var(--gap-s); border-top: 1px solid var(--rule); font-size: .85rem; }
.rail__licence .as-card__body { font-size: .85rem; }

.main { display: flex; flex-direction: column; gap: var(--gap-xl); min-width: 0; }

/* the flat A–Z list */
.rows { display: flex; flex-direction: column; }
.row {
  display: grid;
  grid-template-columns: 1.5rem max-content max-content 1fr 1rem;
  align-items: baseline;
  gap: .55rem;
  min-height: 44px;                 /* the density opensourceui gets wrong on a phone */
  padding: .55rem .5rem;
  border-top: 1px solid var(--rule);
  color: var(--fg);
  text-decoration: none;
  transition: background var(--fast) var(--ease-out);
}
.row:last-child { border-bottom: 1px solid var(--rule); }
.row:hover, .row:focus-visible { background: var(--wash); }
.row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.row__ix { font-family: var(--mono); font-size: .64rem; font-weight: 500; color: var(--faint); text-align: center; }
.row__name { font-weight: 700; letter-spacing: -.012em; }
.row__cat { color: var(--faint); font-size: .9rem; }
.row__blurb { color: var(--muted); font-size: .88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row__go { color: var(--faint); justify-self: end; }
@media (max-width: 52rem) {
  .row { grid-template-columns: 1.5rem 1fr 1rem; row-gap: .1rem; }
  .row__cat { grid-column: 2; }
  .row__blurb { grid-column: 2; white-space: normal; }
}

.cat-head { padding-top: var(--gap-m); border-top: 1px solid var(--rule); }
.cat-head .as-card__body { margin: .35rem 0 0; }

.item { display: flex; flex-direction: column; gap: var(--gap-s); scroll-margin-top: 5rem; }
.index, .cat-head { scroll-margin-top: 5rem; }
.item__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--gap-s); }
.item__title { font-family: var(--sans); font-size: clamp(1.3rem, 2.4vw, 1.75rem); font-weight: 700; letter-spacing: -.022em; margin: 0; color: var(--fg); }
.item__desc { margin: 0; max-width: 62ch; line-height: 1.7; color: var(--muted); }
.item__deps { margin: 0; font-size: .9rem; color: var(--muted); display: flex; flex-wrap: wrap; gap: .4rem; align-items: baseline; }

.preview { position: relative; border: 1px solid var(--rule); border-radius: var(--radius); }
.preview__tag { position: absolute; top: .55rem; right: .75rem; }
.preview__stage { padding: clamp(1.25rem, 3vw, 2.25rem); display: flex; flex-direction: column; gap: var(--gap-m); }
.preview__stage > * { max-width: 100%; }

.src summary { cursor: pointer; padding: .35rem 0; list-style: none; }
.src summary::-webkit-details-marker { display: none; }
.src summary .as-label { border-bottom: 1px dashed var(--rule); padding-bottom: .15rem; }
.src summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.src[open] summary { margin-bottom: .5rem; }

.glyphs { display: flex; flex-wrap: wrap; gap: var(--gap-m); }
.glyph { display: flex; flex-direction: column; align-items: center; gap: .5rem; margin: 0; color: var(--fg); }
.glyph svg { width: 2rem; height: 2rem; }

.hero { max-width: 46rem; }
.hero__install { max-width: 42rem; margin-top: var(--gap-s); }
.hero__figures { margin-top: var(--gap-l); }
.index__note { margin-bottom: var(--gap-l); }
.index__find { margin-bottom: var(--gap-m); }
.index__nohit { margin-top: var(--gap-m); }

/* The page sets its own ground rather than inheriting the site's shell. */
body.band { background: var(--bg); color: var(--fg); min-height: 100vh; margin: 0; font-family: var(--sans); }
`;

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'suite', 'lib'), { recursive: true });
await cp(path.join(ROOT, 'registry', 'r'), path.join(OUT, 'r'), { recursive: true });
await writeFile(path.join(OUT, 'suite', 'index.html'), page);
await writeFile(path.join(OUT, 'suite', 'suite.css'), cssParts.join('\n') + '\n' + shellCss);
await writeFile(path.join(OUT, 'suite', 'catalogue.js'), js);
await writeFile(path.join(OUT, 'suite', 'theme.js'), themeJs);
await cp(path.join(ROOT, 'src', 'motion', 'motion.js'), path.join(OUT, 'suite', 'lib', 'motion.js'));

const kb = n => (n / 1024).toFixed(1) + 'KB';
console.log(`${path.relative(ROOT, OUT)}/`);
console.log(`  suite/index.html  ${kb(page.length)}  · ${ITEMS.length} items, ${CATEGORIES.length} categories`);
console.log(`  suite/suite.css   ${kb(cssParts.join('').length + shellCss.length)}`);
console.log(`  suite/catalogue.js ${kb(js.length)}`);
console.log(`  r/                ${(await readdir(path.join(OUT, 'r'))).length} JSON`);
