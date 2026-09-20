/* The chrome the three surfaces share (decisions/0019).
 *
 * One page became three — a landing that sells, a catalogue that browses, and a
 * page per item that documents. They share a head, a nav and a colophon, and
 * nothing else; keeping them in one module is what stops the nav drifting
 * between them.
 *
 * The nav is obsidianui.dev's shape: a notched pill carrying the three
 * surfaces, then search, the theme switch and the repository. It carries no
 * attribution line — on amirsalmani.com, authorship is the domain.
 */

/* Asset names are placeholders until build-site writes them: each file is named
 * for a hash of its own bytes, which is only known once the bytes exist. That is
 * what lets them be cached for a year and never purged. */
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const attr = s => esc(s).replace(/"/g, '&quot;');

const MARK = `<svg viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 51 L32 13 L52 51"/><path d="M20.5 35 H43.5"/><g fill="currentColor" stroke="none"><circle cx="32" cy="13" r="3.8"/><circle cx="12" cy="51" r="3.8"/><circle cx="52" cy="51" r="3.8"/></g></svg>`;

/** `up` is how many levels the page sits below /suite/, for relative assets. */
export function head({ title, description, canonical, up = 0 }) {
  const base = '../'.repeat(up);
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="theme-color" content="#212842">
<link rel="canonical" href="https://amirsalmani.com${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}__ASSET_CSS__">
<script src="${base}__ASSET_THEME__"></script>
</head>
<body class="band">
`;
}

export function nav({ current, up = 0 }) {
  const base = '../'.repeat(up);
  const tab = (href, label, key) =>
    `<a class="tabs__tab${current === key ? ' tabs__tab--on' : ''}" href="${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `
<nav class="as-nav nav">
  <a class="as-nav__brand" href="/">${MARK} Amir Salmani</a>

  <div class="tabs" role="navigation" aria-label="Suite">
    ${tab(`${base}`, 'Home', 'home')}
    ${tab(`${base}components/`, 'Components', 'components')}
    ${tab(`${base}docs/`, 'Docs', 'docs')}
    <button class="tabs__find" id="open-find" type="button" aria-label="Find a component">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
    </button>
  </div>

  <div class="as-nav__links">
    <a href="https://github.com/amir-salmani/amirsalmani-suite">Source</a>
    <button class="as-switch" id="theme" role="switch" aria-checked="true" aria-label="Dark theme" data-spring></button>
  </div>
</nav>
`;
}

/* No heart glyph. amirsalmani.com retired it — tools/gates.py in that repo
 * fails any page carrying `made-by__glyph`, and /suite is a section of that
 * site rather than a site of its own. The colophon line is the site's. */
export function footer() {
  return `
<footer class="as-colophon">
  <div class="as-colophon__inner">
    <span class="as-colophon__legal">&copy; 2026 Rhinocloud Ltd. &middot; MIT</span>
    <span class="made-by">
      <svg class="made-by__mark" viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Amir Salmani"><path d="M12 51 L32 13 L52 51"/><path d="M20.5 35 H43.5"/><g fill="currentColor" stroke="none"><circle cx="32" cy="13" r="3.8"/><circle cx="12" cy="51" r="3.8"/><circle cx="52" cy="51" r="3.8"/></g></svg>
      <span>Made with <a href="/designbook/" class="made-by__link">passion</a> in-house, avoiding cookies too</span>
    </span>
  </div>
</footer>
`;
}

export function close({ up = 0 } = {}) {
  return `<script type="module" src="${'../'.repeat(up)}__ASSET_JS__"></script>
</body>
</html>
`;
}

/* The nav's own shape. Everything else the surfaces need is already a suite
 * component; this is the notch, and the notch is the only thing borrowed. */
export const NAV_CSS = `
.nav { display: flex; align-items: center; gap: var(--gap-m); }

/* The notched pill. The shoulder is a single conic gradient rather than a
   pseudo-element stack, so it inverts with the ground for free. */
.tabs {
  display: flex; align-items: center; gap: .25rem;
  padding: .3125rem; border-radius: 999px;
  background: var(--glass); border: 1px solid var(--rule);
}
.tabs__tab {
  padding: .4375rem .875rem; border-radius: 999px;
  font-size: .8125rem; line-height: 1; text-decoration: none;
  color: var(--fg-muted); white-space: nowrap;
  min-height: 44px; display: inline-flex; align-items: center;
  transition: color var(--fast) var(--ease-out), background var(--fast) var(--ease-out);
}
.tabs__tab:hover { color: var(--fg); }
.tabs__tab--on { background: var(--bg); color: var(--fg); box-shadow: var(--shadow); }
.tabs__find {
  display: inline-grid; place-items: center;
  width: 44px; min-height: 44px; border: 0; border-radius: 999px;
  background: transparent; color: var(--fg-muted); cursor: pointer;
}
.tabs__find:hover { color: var(--fg); }
.tabs__find svg { width: 1rem; height: 1rem; }

@media (max-width: 720px) { .tabs__tab { padding: .4375rem .625rem; } }
`;
