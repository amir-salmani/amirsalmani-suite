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
import { ITEMS, RETIRED, CATEGORIES, byName } from '../src/manifest.mjs';
import { head, nav, footer, close, NAV_CSS, esc as escape, attr as attribute } from './lib/shell.mjs';

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
    return `  <figure class="glyph">${svg}<figcaption class="as-label as-label--fg-faint">${esc(f.replace('.svg', ''))}</figcaption></figure>`;
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
//
// RETIRED is included. Those fifteen no longer ship as registry items
// (decisions/0019), but this page is still built out of them — its nav, its
// buttons and its fields are that CSS. Dropping them here left every link at
// the UA default blue, which tools/contrast.mjs caught at 1.54:1.
const cssParts = [];
for (const item of [...ITEMS, ...RETIRED]) {
  if (item.css && !item.tier) cssParts.push(await read(`src/components/${item.css}`));
}
cssParts.push(await read('src/made-by/made-by.css'));

// ── page furniture ──────────────────────────────────────────────────────────
const counts = Object.fromEntries(CATEGORIES.map(([c]) => [c, ITEMS.filter(i => i.category === c).length]));

const rail = CATEGORIES.map(([cat, note]) => `
      <div class="rail__group" id="cat-${cat.toLowerCase()}">
        <span class="rail__cat">${esc(cat)}<span class="rail__n">${counts[cat]}</span></span>
        <p class="rail__note">${esc(note)}</p>
        <ul class="rail__items">
${ITEMS.filter(i => i.category === cat).map(i => `          <li><a href="../docs/${i.name}/">${esc(i.title)}</a></li>`).join('\n')}
        </ul>
      </div>`).join('');

// The flat A–Z list: the category is a slash-suffix in a lighter weight, not a
// folder. A reader who knows what they want never touches the rail.
const flat = az.map(i => `
        <a class="row" href="../docs/${i.name}/" data-search="${attr((i.title + ' ' + i.category + ' ' + i.blurb).toLowerCase())}">
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
          <span class="as-label as-label--fg-faint">${esc(item.category)}</span>
          <span class="as-sec-head__rule"></span>
        </div>
        <p class="item__desc">${esc(item.description)}</p>
${deps.length ? `        <p class="item__deps"><span class="as-label as-label--fg-faint">Needs</span> ${deps.map(d => `<a class="as-link" href="#${d}">${esc(byName[d].title)}</a>`).join(', ')}</p>\n` : ''}${bundleOf ? `        <p class="item__deps"><span class="as-label as-label--fg-faint">Installs</span> ${bundleOf.map(d => `<a class="as-link" href="#${d}">${esc(byName[d].title)}</a>`).join(', ')}</p>\n` : ''}        <pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/${item.name}</code></pre>
${demo ? `        <div class="preview"><span class="as-label as-label--fg-faint preview__tag">Live</span>
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

/* ── the three surfaces ─────────────────────────────────────────────────────
 *
 * A landing that sells, a catalogue that browses, and a page per item that
 * documents (decisions/0019). One page doing all three was dense at thirty
 * items and unusable at 120, and it never told a reader which of the three
 * they had arrived at.
 */

const depsOf = item => item.bundle === 'all'
  ? ITEMS.filter(i => !i.bundle && (i.tier ?? 'brand') === (item.tier ?? 'brand')).map(i => i.name)
  : [...new Set([...(item.deps ?? []), ...(item.bundle ?? [])])];

const recorded = new Set(await readdir(path.join(ROOT, 'src', 'demos-video')).then(
  f => f.filter(n => n.endsWith('.webm')).map(n => n.replace('.webm', '')), () => []));

/* No showcase grid.
 *
 * Four recordings were tried and the honest result was four black rectangles:
 * most of these components are a small control on a large ground, and the
 * shader pieces are greyscale on #000 by the brand's own rule — fractal-glass
 * films as a white line on black. Choosing four better ones only moves the
 * problem, because the thin ones are thin by construction.
 *
 * So the landing shows what it can state plainly: what kinds of thing are here,
 * and how many. Recordings live on the item pages, where they are large and in
 * context. */
const catTile = ([cat, note]) => `
        <a class="cat" href="components/#cat-${cat.toLowerCase()}">
          <span class="cat__head">
            <span class="cat__name">${esc(cat)}</span>
            <span class="cat__n">${counts[cat]}</span>
          </span>
          <span class="cat__note">${esc(note)}</span>
        </a>`;

const FAQ = [
  ['Is the suite free?', 'MIT, including the marks. No attribution required — though the marks are a signature, so use them to credit the suite rather than to identify yourself.'],
  ['Where do the components come from?', 'The component tier is imported from ObsidianUI and re-pointed onto the brand: no colour below the token layer, and nothing shipping motion a reader cannot stop. The brand tier — tokens, type, layout, the marks — is written here.'],
  ['Do I need a framework?', 'For the brand tier, no: it is CSS and HTML, and it works on a static page. The component tier is React and needs Tailwind v4.'],
  ['What am I depending on?', 'Nothing. The CLI copies source into your project and you own it from then on. There is no package and no version to track.'],
];

const landing = `${head({
  title: `The suite — ${components.length} components, drawn to one brand | Amir Salmani`,
  description: `${components.length} copy-in components across ${CATEGORIES.length} categories, served as a shadcn registry. Two grounds, no accent hue, MIT.`,
  canonical: '/suite/',
})}${nav({ current: 'home' })}
<header class="as-section">
  <div class="as-section__inner">
    <div class="hero">
      <div class="hero__say">
        <span class="as-label">Suite / Registry</span>
        <h1 class="as-headline">
          <span class="as-headline__setup">Every surface I build on,</span>
          in one command.
        </h1>
      </div>
      <div class="hero__do">
        <p class="as-lede">
          ${components.length} components across ${CATEGORIES.length} categories, served as a shadcn
          registry. The CLI copies the source into your project and you own it
          from then on — there is no package to depend on and no version to
          track.
        </p>
        <p class="hero__actions">
          <a class="as-btn as-btn--solid" href="components/">Browse components</a>
          <a class="as-btn" href="docs/">Read the docs</a>
        </p>
      </div>
      <pre class="as-code hero__install"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/tokens
npx shadcn@latest add @amirsalmani/suite</code></pre>
    </div>
</header>

<section class="as-section">
  <div class="as-section__inner">
    <div class="as-sec-head">
      <h2 class="as-sec-head__title">What is in it</h2>
      <span class="as-sec-head__rule"></span>
    </div>
    <p class="as-lede">
      ${components.length} items across ${CATEGORIES.length} categories. Every one has
      <a class="as-link" href="docs/">its own page</a>, with a live specimen or a
      recording of it moving.
    </p>
    <div class="cats">${CATEGORIES.filter(([c]) => c !== 'Bundles' && counts[c]).map(catTile).join('')}
    </div>
  </div>
</section>

<section class="as-section">
  <div class="as-section__inner">
    <div class="as-sec-head">
      <h2 class="as-sec-head__title">Questions</h2>
      <span class="as-sec-head__rule"></span>
    </div>
    <div class="faq">${FAQ.map(([q, a], i) => `
      <details class="faq__item"${i === 0 ? ' open' : ''}>
        <summary class="faq__q">${esc(q)}</summary>
        <p class="as-card__body faq__a">${esc(a)}</p>
      </details>`).join('')}
    </div>
  </div>
</section>
${footer()}${close({})}`;

const catalogue = `${head({
  title: `Components — the suite | Amir Salmani`,
  description: `All ${ITEMS.length} items, by category and A–Z.`,
  canonical: '/suite/components/', up: 1,
})}${nav({ current: 'components', up: 1 })}
<div class="shell">
  <aside class="rail" aria-label="Components by category">
    <span class="as-label">By category</span>${rail}
    <div class="rail__licence">
      <p class="as-card__body">Free for personal and commercial use. No attribution required.
      <a class="as-link" href="https://github.com/amir-salmani/amirsalmani-suite/blob/main/LICENCE">MIT</a>.</p>
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
      <p class="as-label as-label--fg-faint index__nohit" id="nohit" hidden>Nothing matches.</p>
    </section>
  </main>
</div>
${footer()}${close({ up: 1 })}`;

/* Not a second catalogue. /components browses the items; this is how you get
 * them working — installation, the two tiers, the grounds. Duplicating the item
 * list here was the first thing a reader noticed was wrong. */
const DOC_SECTIONS = [
  ['Install', `Tokens first: every other item derives from them, and nothing below that layer contains a colour.

<pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/tokens
npx shadcn@latest add @amirsalmani/button</code></pre>

The CLI copies the source into your project and you own it from then on. There is no package to depend on and no version to track, so nothing here can break you on a Tuesday.`],

  ['The two tiers', `The <strong>brand tier</strong> — tokens, type, layout, the marks, the spring — is written here and is framework-free CSS. It works on a static page with no build step.

<pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/suite</code></pre>

The <strong>component tier</strong> is imported from <a class="as-link" href="https://www.obsidianui.dev/">ObsidianUI</a> and re-pointed onto the brand. It is React and needs Tailwind v4.

<pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/tokens-shadcn
npx shadcn@latest add @amirsalmani/suite-react</code></pre>

<code>tokens-shadcn</code> is the bridge: it maps shadcn's semantic names onto the brand, so an imported component arrives on your ground rather than its own. Install it before anything from that tier.`],

  ['Three grounds', `<code>cream</code> and <code>indigo</code> are the brand's two. <code>obsidian</code> — <code>#000</code> with two lift steps — is the component tier's, because those components were built against it and read wrong on indigo.

<pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>&lt;html data-theme="cream"&gt;     &lt;!-- light --&gt;
&lt;html data-theme="dark"&gt;      &lt;!-- indigo --&gt;
&lt;html data-theme="obsidian"&gt;  &lt;!-- black --&gt;</code></pre>

There is no accent hue on any of them. Emphasis is inversion, and every foreground role is measured against every ground it can land on — 140 checks, and the build fails on any that drops below 4.5:1.`],

  ['Motion', `Nothing here ships motion a reader cannot stop. A component animating from JavaScript carries a reduced-motion path or it does not enter the registry; CSS animation is neutralised by <code>tokens.css</code> for everything beneath it.

One item is exempt and says so: a scroll indicator whose bars <em>are</em> the position readout. Freezing it would blank the readout rather than calm it.`],

  ['Canvas and WebGL', `A canvas takes a colour string, not a <code>var()</code>. <code>token-colour</code> resolves a custom property to a value and re-reads it when the theme changes — <code>data-theme</code> is an attribute swap, so nothing re-renders on its own and a canvas otherwise keeps yesterday's palette.

<pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/token-colour</code></pre>`],
];

const docsIndex = `${head({
  title: 'Docs — the suite | Amir Salmani',
  description: 'Install it, the two tiers, the three grounds, and what the gates guarantee.',
  canonical: '/suite/docs/', up: 1,
})}${nav({ current: 'docs', up: 1 })}
<main class="page">
  <div class="page__inner as-measure">
    <span class="as-label">Suite / Docs</span>
    <h1 class="as-headline">Getting it working.</h1>
    <p class="as-lede">
      Install, the two tiers and the grounds they sit on. Every item has
      <a class="as-link" href="../components/">its own page</a> with a recording
      and its usage.
    </p>
${DOC_SECTIONS.map(([t, body]) => `
    <section class="doc">
      <div class="as-sec-head"><h2 class="as-sec-head__title">${esc(t)}</h2><span class="as-sec-head__rule"></span></div>
      ${body.split('\n\n').map(par => par.trim().startsWith('<pre') ? par : `<p class="doc__p">${par}</p>`).join('\n      ')}
    </section>`).join('')}
  </div>
</main>
${footer()}${close({ up: 1 })}`;

/* Every item page shows something. A brand-tier item has a live demo — the same
 * fragment that is its copy-paste snippet, so the thing on screen and the thing
 * you copy cannot disagree. An imported item shows its recording, or failing
 * that the files it installs, because a page that is a title and an install line
 * is not documentation. */
/* What an item puts in your project: file targets for a component, the items it
 * resolves to for a bundle. Five pages were a title and an install line before
 * this — the bundles, and the two foundation items with no demo. */
const installs = item => item.bundle
  ? depsOf(item)
  : item.files?.length ? item.files.map(f => f.target)
  : item.css ? [item.target ?? `styles/amirsalmani-${item.css}`]
  : item.js ? [item.target ?? `lib/${item.js}`]
  : [];

const itemPage = (item, demo, preview) => `${head({
  title: `${item.title} — the suite | Amir Salmani`,
  description: item.blurb ?? item.description ?? item.title,
  canonical: `/suite/docs/${item.name}/`, up: 2,
})}${nav({ current: 'docs', up: 2 })}
<main class="page">
  <div class="page__inner">
    <p class="item__back"><a class="as-link" href="../../components/">&lsaquo; All ${ITEMS.length} components</a></p>
    <div class="item__head">
      <span class="as-label">${esc(item.category)}</span>
      <h1 class="as-headline">${esc(item.title)}</h1>
      <p class="as-lede">${esc(item.description ?? item.blurb ?? '')}</p>
      <pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>npx shadcn@latest add @amirsalmani/${item.name}</code></pre>
      <div class="item__facts">
${item.npm?.length ? `        <p class="item__deps"><span class="as-label as-label--fg-faint">Needs</span> ${item.npm.map(d => `<code>${esc(d)}</code>`).join('<span class="item__sep">,</span> ')}</p>` : ''}
${item.upstream ? `        <p class="as-label as-label--fg-faint">Imported from ObsidianUI on ${esc(item.upstream.imported)} · ${esc(item.upstream.sha)}</p>` : ''}
      </div>
    </div>

    ${preview ? `<div class="item__preview"><span class="as-label as-label--fg-faint item__tag">Live</span>
${stripScript(preview)}
    </div>` : ''}
    ${recorded.has(item.name) ? `<div class="item__media">
      <video src="../../demos/${item.name}.webm" poster="../../demos/${item.name}.png"
             muted loop autoplay playsinline preload="none" aria-label="${attr(item.title)} in motion"></video>
    </div>` : ''}


    ${demo ? `<section class="item__sec"><div class="as-sec-head"><h2 class="as-sec-head__title">Usage</h2><span class="as-sec-head__rule"></span></div>
    <pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>${esc(demo)}</code></pre></section>` : ''}

    ${preview ? `<section class="item__sec"><div class="as-sec-head"><h2 class="as-sec-head__title">Markup</h2><span class="as-sec-head__rule"></span></div>
    <pre class="as-code"><button class="as-code__copy" type="button">Copy</button><code>${esc(preview)}</code></pre></section>` : ''}

    ${!demo && !preview && installs(item).length ? `<section class="item__sec"><div class="as-sec-head"><h2 class="as-sec-head__title">${item.bundle ? 'Installs' : 'Files'}</h2><span class="as-sec-head__rule"></span></div>
    <p class="doc__p">${item.bundle
      ? `One command, ${installs(item).length} items. Each is also available on its own.`
      : 'Copied into your project at these paths, resolved through your <code>components.json</code>:'}</p>
    <ul class="item__files">${installs(item).map(f => item.bundle
      ? `<li><a class="as-link" href="../${f}/">${esc(byName[f]?.title ?? f)}</a></li>`
      : `<li><code>${esc(f)}</code></li>`).join('')}</ul></section>` : ''}
  </div>
</main>
${footer()}${close({ up: 2 })}`;

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
/* The three surfaces' own layout. Not suite components — they exist to show
 * them. The tile is the one borrowed shape: a two-column grid of recordings,
 * which is how a catalogue shows 120 animated components without running one. */
const SURFACE_CSS = `
body > .as-section:first-of-type, body > header.as-section { padding-block-start: var(--band-y); }

/* Two columns: the claim on the left, what to do about it on the right. Stacked
   in one column the headline left two thirds of the band empty and the page
   read as unfinished rather than spare. */
.hero { display: grid; gap: var(--gap-l) var(--gap-xl); align-items: start; }
@media (min-width: 64rem) { .hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.hero__say, .hero__do { display: flex; flex-direction: column; gap: var(--gap-m); min-width: 0; }

/* Inside the hero the column is already the measure. A second max-width on the
   lede made it break every six words. */
.hero .as-lede { max-width: none; }

/* The install line spans both columns. Inside a half-width one it was cut
   mid-package-name behind a scrollbar, which is the worst way to show a command
   somebody is meant to copy. */
.hero__install { grid-column: 1 / -1; overflow-x: auto; }
.hero__install code { white-space: pre; }
.hero__actions { display: flex; flex-wrap: nowrap; align-items: center; gap: var(--gap-m); margin-top: var(--gap-l); }
@media (max-width: 30rem) { .hero__actions { flex-wrap: wrap; } }

/* One measure for prose across all three surfaces. Ragged lines at different
   widths on each page is what made the FAQ read as unfinished. */
.as-lede, .faq__a, .doc__p { max-width: 68ch; }

.cats { display: grid; gap: var(--gap-s); grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); margin-top: var(--gap-l); }
.cat {
  display: grid; gap: .3rem; align-content: start; text-decoration: none; color: inherit;
  padding: .875rem 1rem; border: 1px solid var(--rule); border-radius: var(--radius);
  transition: border-color var(--fast) var(--ease-out), background var(--fast) var(--ease-out);
}
.cat:hover { border-color: var(--glass-top); background: var(--glass); }
.cat__head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--gap-s); }
.cat__name { font-weight: 600; }
.cat__n { font-family: var(--mono); font-size: .75rem; color: var(--fg-faint); }
.cat__note { color: var(--fg-muted); font-size: .8125rem; line-height: 1.5; }

.faq { display: grid; gap: 0; margin-top: var(--gap-m); border-top: 1px solid var(--rule); }
.faq__item { border-bottom: 1px solid var(--rule); }
.faq__q { cursor: pointer; padding: 1.125rem 0; min-height: 44px; display: flex; align-items: center; gap: var(--gap-s); font-weight: 500; }
.faq__q::marker, .faq__q::-webkit-details-marker { content: ''; }
.faq__q::after { content: '+'; margin-left: auto; font-family: var(--mono); color: var(--fg-faint); }
.faq__item[open] .faq__q::after { content: '\\2212'; }
.faq__a { padding: 0 0 1.25rem; color: var(--fg-muted); }

/* The head is one block — label, title, lede, the command, the facts — so they
   read as one statement. The page's own gap separates sections, not sentences. */
.item__head { display: flex; flex-direction: column; gap: var(--gap-s); }
.item__head .as-headline { margin-block: .25rem; }
.item__head .as-code { margin-top: var(--gap-s); }
.item__facts { display: flex; flex-direction: column; gap: .25rem; }
.item__back { margin-bottom: 0; }
.item__sec { display: flex; flex-direction: column; gap: var(--gap-s); }
.item__preview {
  position: relative; margin: var(--gap-m) 0; padding: var(--gap-l) var(--gap-m) var(--gap-m);
  border: 1px solid var(--rule); border-radius: var(--radius); background: var(--wash);
}
.item__tag { position: absolute; top: .625rem; right: .875rem; }
.item__files { display: flex; flex-direction: column; gap: .25rem; list-style: none; padding: 0; }
.item__files code { font-family: var(--mono); font-size: .8125rem; color: var(--fg-muted); }
.item__deps { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; color: var(--fg-muted); }
.item__sep { margin-left: -.4rem; }
.item__media { margin: var(--gap-m) 0; border: 1px solid var(--rule); border-radius: var(--radius); overflow: hidden; background: var(--bg-alt); }
.item__media video { width: 100%; display: block; }
.item__deps code { font-family: var(--mono); font-size: .8125rem; }

/* A recording is motion. Under reduce the poster stands in for it, which is the
   same information without the loop. */
@media (prefers-reduced-motion: reduce) {
  .tile__video, .item__media video { display: none; }
  .tile__media { background-image: var(--poster); background-size: cover; }
}
`;

const shellCss = `/* The catalogue's own shell. Not a suite component — it exists to show them,
   and it derives from the same tokens so it cannot drift from what it displays. */

/* The nav is sticky, so every surface needs its own clearance beneath it —
   without this the first heading sits against the pill and the page reads as
   cramped from the first glance. */
.shell, .page__inner {
  max-width: var(--maxw);
  margin-inline: auto;
  padding-inline: var(--pad-x);
  padding-block: var(--band-y) var(--gap-xl);
}
.shell {
  display: grid;
  grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
  gap: var(--gap-xl);
  align-items: start;
}
.page__inner { display: flex; flex-direction: column; gap: var(--gap-l); }
.doc { display: flex; flex-direction: column; gap: var(--gap-s); }
.doc__p { color: var(--fg-muted); max-width: 68ch; }
.doc__p code, .item__deps code { font-family: var(--mono); font-size: .8125rem; }
@media (max-width: 62rem) { .shell { grid-template-columns: minmax(0, 1fr); } .rail { position: static; } }

.rail { position: sticky; top: 4.5rem; display: flex; flex-direction: column; gap: var(--gap-m); max-height: calc(100vh - 6rem); overflow-y: auto; padding-right: .5rem; }
.rail__group { display: flex; flex-direction: column; gap: .25rem; }
.rail__cat { display: flex; align-items: baseline; gap: .5rem; font-weight: 700; letter-spacing: -.015em; color: var(--fg); text-decoration: none; }
.rail__n { font-family: var(--mono); font-size: .66rem; color: var(--fg-faint); }
.rail__note { margin: 0 0 .35rem; font-size: .8rem; line-height: 1.5; color: var(--fg-faint); }
.rail__items { list-style: none; margin: 0; padding: 0 0 0 .1rem; display: flex; flex-direction: column; }
.rail__items a { display: block; padding: .28rem 0; font-size: .9rem; color: var(--fg-muted); text-decoration: none; border-left: 1px solid var(--rule); padding-left: .7rem; transition: color var(--fast) var(--ease-out), border-color var(--fast) var(--ease-out); }
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
.row:focus-visible { outline: 2px solid var(--fg-accent); outline-offset: -2px; }
.row__ix { font-family: var(--mono); font-size: .64rem; font-weight: 500; color: var(--fg-faint); text-align: center; }
.row__name { font-weight: 700; letter-spacing: -.012em; }
.row__cat { color: var(--fg-faint); font-size: .9rem; }
.row__blurb { color: var(--fg-muted); font-size: .88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row__go { color: var(--fg-faint); justify-self: end; }
@media (max-width: 52rem) {
  .row { grid-template-columns: 1.5rem 1fr 1rem; row-gap: .1rem; }
  .row__cat { grid-column: 2; }
  .row__blurb { grid-column: 2; white-space: normal; }
}

.cat-head { padding-top: var(--gap-m); border-top: 1px solid var(--rule); }
.cat-head .as-card__body { margin: .35rem 0 0; }

.item { display: flex; flex-direction: column; gap: var(--gap-s); scroll-margin-top: 5rem; }
.index, .cat-head, .rail__group { scroll-margin-top: 6rem; }
.item__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--gap-s); }
.item__title { font-family: var(--sans); font-size: clamp(1.3rem, 2.4vw, 1.75rem); font-weight: 700; letter-spacing: -.022em; margin: 0; color: var(--fg); }
.item__desc { margin: 0; max-width: 62ch; line-height: 1.7; color: var(--fg-muted); }
.item__deps { margin: 0; font-size: .9rem; color: var(--fg-muted); display: flex; flex-wrap: wrap; gap: .4rem; align-items: baseline; }

.preview { position: relative; border: 1px solid var(--rule); border-radius: var(--radius); }
.preview__tag { position: absolute; top: .55rem; right: .75rem; }
.preview__stage { padding: clamp(1.25rem, 3vw, 2.25rem); display: flex; flex-direction: column; gap: var(--gap-m); }
.preview__stage > * { max-width: 100%; }

.src summary { cursor: pointer; padding: .35rem 0; list-style: none; }
.src summary::-webkit-details-marker { display: none; }
.src summary .as-label { border-bottom: 1px dashed var(--rule); padding-bottom: .15rem; }
.src summary:focus-visible { outline: 2px solid var(--fg-accent); outline-offset: 3px; }
.src[open] summary { margin-bottom: .5rem; }

.glyphs { display: flex; flex-wrap: wrap; gap: var(--gap-m); }
.glyph { display: flex; flex-direction: column; align-items: center; gap: .5rem; margin: 0; color: var(--fg); }
.glyph svg { width: 2rem; height: 2rem; }

/* The single-page hero's caps used to live here — max-width 46rem on .hero and
   42rem on the install line. Against the two-column hero they held it to two
   thirds of the band and left the last third empty, which read as a layout
   mistake because it was one. The columns are the measure now. */
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
await writeFile(path.join(OUT, 'suite', 'index.html'), landing);
await mkdir(path.join(OUT, 'suite', 'components'), { recursive: true });
await writeFile(path.join(OUT, 'suite', 'components', 'index.html'), catalogue);
await mkdir(path.join(OUT, 'suite', 'docs'), { recursive: true });
await writeFile(path.join(OUT, 'suite', 'docs', 'index.html'), docsIndex);

/* The re-pointed usage, not upstream's original. Reading upstream/docs.json
 * here showed every item an example in upstream's colours, with links to
 * upstream's paths — which tools/gates.py in amirsalmani-com caught as two dead
 * references. */
const usage = await readFile(path.join(ROOT, 'src', 'demos-usage.json'), 'utf8').then(JSON.parse).catch(() => ({}));
for (const item of ITEMS) {
  await mkdir(path.join(OUT, 'suite', 'docs', item.name), { recursive: true });
  await writeFile(path.join(OUT, 'suite', 'docs', item.name, 'index.html'),
    itemPage(item, usage[item.name], await demoFor(item)));
}

// The plates the demos draw, and the recordings, beside the pages that use them.
await cp(path.join(ROOT, 'src', 'plates'), path.join(OUT, 'suite', 'plates'), { recursive: true }).catch(() => {});

await cp(path.join(ROOT, 'src', 'demos-video'), path.join(OUT, 'suite', 'demos'), { recursive: true }).catch(() => {});
await writeFile(path.join(OUT, 'suite', 'suite.css'), cssParts.join('\n') + '\n' + shellCss + NAV_CSS + SURFACE_CSS);
await writeFile(path.join(OUT, 'suite', 'catalogue.js'), js);
await writeFile(path.join(OUT, 'suite', 'theme.js'), themeJs);
await cp(path.join(ROOT, 'src', 'motion', 'motion.js'), path.join(OUT, 'suite', 'lib', 'motion.js'));

const kb = n => (n / 1024).toFixed(1) + 'KB';
console.log(`${path.relative(ROOT, OUT)}/`);
console.log(`  suite/index.html            ${kb(landing.length)}  · ${CATEGORIES.length - 1} categories, ${components.length} items`);
console.log(`  suite/components/index.html ${kb(catalogue.length)}  · ${ITEMS.length} items, ${CATEGORIES.length} categories`);
console.log(`  suite/docs/                 ${ITEMS.length + 1} pages · ${recorded.size} with a recording`);
console.log(`  suite/suite.css   ${kb(cssParts.join('').length + shellCss.length)}`);
console.log(`  suite/catalogue.js ${kb(js.length)}`);
console.log(`  r/                ${(await readdir(path.join(OUT, 'r'))).length} JSON`);
