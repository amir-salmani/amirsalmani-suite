/* The suite, as one dataset.
 *
 * The catalogue projects this twice — grouped by category in the rail, flat A–Z
 * in the body with the category demoted to a suffix. That is the whole finding
 * from opensourceui.in/components: one set, two indexes, and a reader who knows
 * what they want never has to guess which folder it is in.
 *
 * Everything downstream reads this file and nothing else: the registry JSON,
 * the catalogue page and the proof sheets. Add an item here or it does not
 * exist.
 */

export const CATEGORIES = [
  ['Foundation', 'The layer everything else derives from. Install tokens first.'],
  ['Type',       'What a human wrote, and what a machine would emit.'],
  ['Layout',     'Bands, grids and the chrome that floats over them.'],
  ['Controls',   'Things a reader operates. Every one has a 44px target.'],
  ['Feedback',   'What the interface says back.'],
  ['Data',       'Keys, values and text you are meant to copy.'],
  ['Brand',      'The mark, and the line that says who made it.'],
  ['Bundles',    'Several items in one command.'],
];

/** type: registry:file unless stated. deps are other item names. */
export const ITEMS = [
  // ── Foundation ────────────────────────────────────────────────────────────
  { name: 'fonts', category: 'Foundation',
    title: 'Fonts',
    blurb: 'Schibsted Grotesk and IBM Plex Mono, self-hosted. No CDN.',
    description: 'The @font-face block, subset by unicode-range. Not enough on its own: nothing is fetched from Google at runtime, so the four woff2 files have to be copied and served yourself.',
    css: 'fonts.css', demo: null },

  { name: 'tokens', category: 'Foundation',
    title: 'Tokens',
    blurb: 'Two grounds, no accent hue, both themes first-class with a no-JS fallback.',
    description: 'Two grounds, no accent hue, both themes first-class with a no-JS fallback. Every other item derives from these; nothing below this layer may contain a hex.',
    css: 'tokens.css', target: 'styles/amirsalmani-tokens.css', demo: 'tokens' },

  { name: 'motion', category: 'Foundation',
    title: 'Motion — the spring',
    blurb: 'A critically-damped spring in 40 lines, parameterised by damping and response.',
    description: 'A critically-damped spring, parameterised the way Apple parameterises it: damping ratio and response in seconds. Re-targeting keeps position and velocity, so a reversal blends instead of hitting a wall.',
    type: 'registry:lib',
    js: 'motion.js', target: 'lib/motion.js', demo: 'motion' },

  // ── Type ──────────────────────────────────────────────────────────────────
  { name: 'headline', category: 'Type',
    title: 'Headline',
    blurb: 'The tonal split: the setup recedes, the claim lands.',
    description: 'One sentence, two voices. The setup clause is muted at weight 500, the payoff is full strength at 800 — a typographic device, not decoration. Tracking is size-specific because one value is wrong somewhere.',
    css: 'headline.css', deps: ['tokens'], demo: 'headline' },

  { name: 'label', category: 'Type',
    title: 'Label',
    blurb: 'The eyebrow, section number, status key and source line.',
    description: 'Mono, uppercase, wide tracking. Mono is for what a machine would emit, so this and only this carries indices, keys and attributions.',
    css: 'label.css', deps: ['tokens'], demo: 'label' },

  { name: 'figure', category: 'Type',
    title: 'Figure',
    blurb: 'A number that carries its source, because one without a source is a claim.',
    description: 'Value, label, and a source line. The source is not optional decoration: it is what turns the number into evidence.',
    css: 'figure.css', deps: ['tokens'], demo: 'figure' },

  // ── Layout ────────────────────────────────────────────────────────────────
  { name: 'section', category: 'Layout',
    title: 'Section',
    blurb: 'The band rhythm and the section head, with a rule that takes the slack.',
    description: 'Fluid vertical rhythm and a heading row whose rule expands to fill whatever the title leaves. Sits inside a .band, which tokens.css owns.',
    css: 'section.css', deps: ['tokens'], demo: 'section' },

  { name: 'stack', category: 'Layout',
    title: 'Stack & row',
    blurb: 'A column and a row on the gap scale, so nothing needs an inline style.',
    description: 'Two classes instead of a style attribute on every block that needs its children spaced. The sites this is built for ship style-src self with no unsafe-inline, so an inline style is not a shortcut — it is silently dropped.',
    css: 'stack.css', deps: ['tokens'], demo: 'stack' },

  { name: 'grid', category: 'Layout',
    title: 'Grid',
    blurb: 'One auto-fit grid with a minimum-width knob. No breakpoints.',
    description: 'Set --as-grid-min and the column count follows from the space available. There are no media queries in this file and there do not need to be.',
    css: 'grid.css', deps: ['tokens'], demo: 'grid' },

  { name: 'card', category: 'Layout',
    title: 'Card',
    blurb: 'A rule and some padding. No shadow, no gradient, no glass.',
    description: 'Glass is reserved for things that float, and a card in a grid does not float. Works as a whole link, in which case the border goes full strength on hover.',
    css: 'card.css', deps: ['tokens'], demo: 'card' },

  { name: 'glass', category: 'Layout',
    title: 'Glass',
    blurb: 'A floating functional layer, never a mood. Never stack two.',
    description: 'Translucency used where Apple uses it — floating chrome and elevated surfaces. Carries a lit top edge, and turns solid under prefers-reduced-transparency.',
    css: 'glass.css', deps: ['tokens'], demo: 'glass' },

  { name: 'nav', category: 'Layout',
    title: 'Nav',
    blurb: 'Sticky chrome, mono labels, a full-strength bar under the current page.',
    description: 'A nav label is a key rather than prose, so it is mono. The active item is marked by a bar at full strength — emphasis without a hue.',
    css: 'nav.css', deps: ['tokens'], demo: 'nav' },

  { name: 'footer', category: 'Layout',
    title: 'Footer — the colophon',
    blurb: 'Two lines that are not the same claim: who is liable, and who built it.',
    description: 'The legal line names the entity that is liable. The maker line names the person. Keeping them apart is the point of the component.',
    css: 'footer.css', deps: ['tokens', 'made-by'], demo: 'footer' },

  // ── Controls ──────────────────────────────────────────────────────────────
  { name: 'link', category: 'Controls',
    title: 'Link',
    blurb: 'Underline at 40%, going solid. Never a colour change.',
    description: 'There is no accent hue to change to, so the underline carries the state. Goes solid on hover and on focus.',
    css: 'link.css', deps: ['tokens'], demo: 'link' },

  { name: 'button', category: 'Controls',
    title: 'Button',
    blurb: 'Emphasis by inversion. Responds on press, not on release.',
    description: 'Three weights — glass, solid and quiet — where solid is simply the foreground and background swapped. 44px minimum height on every viewport.',
    css: 'button.css', deps: ['tokens'], demo: 'button' },

  { name: 'field', category: 'Controls',
    title: 'Field',
    blurb: 'The wrapper every control shares. The error has no red in it.',
    description: 'A hint is prose and stays sans; an error is a machine verdict and goes mono. The error is carried by a full-strength bar and full-strength text, because there is no red to reach for.',
    css: 'field.css', deps: ['tokens', 'label'], demo: 'field' },

  { name: 'input', category: 'Controls',
    title: 'Input',
    blurb: 'A ruled well, not a box. Textarea and mono variants included.',
    description: 'The value is what the reader typed, so it is sans; a placeholder is a hint and sits at faint. Focus is a full-strength border plus the standard outline.',
    css: 'input.css', deps: ['tokens'], demo: 'input' },

  { name: 'select', category: 'Controls',
    title: 'Select',
    blurb: 'The native control, re-skinned. The chevron inherits currentColor.',
    description: 'Two straight strokes with the mark’s own geometry, drawn in gradients so they flip with the ground rather than shipping two images.',
    css: 'select.css', deps: ['tokens', 'input'], demo: 'select' },

  { name: 'checkbox', category: 'Controls',
    title: 'Checkbox & radio',
    blurb: 'The same control, rounded. The tick is the suite’s own check path.',
    description: 'Checked inverts rather than filling with a hue. The 44px target is on the label, not the 20px box, so the hit area is the whole row.',
    css: 'checkbox.css', deps: ['tokens'], demo: 'checkbox' },

  { name: 'switch', category: 'Controls',
    title: 'Switch',
    blurb: 'A physical switch, not an icon button. Drivable by the spring.',
    description: 'The knob position is a custom property from 0 to 1, so it can be handed to motion.js and re-targeted mid-flight. Without JS it falls back to a transition.',
    css: 'switch.css', deps: ['tokens'], demo: 'switch' },

  // ── Feedback ──────────────────────────────────────────────────────────────
  { name: 'status', category: 'Feedback',
    title: 'Status',
    blurb: 'A state, not a badge. No green-amber-red, because there is no hue.',
    description: 'State is carried by fill: live is inverted, idle is outlined, retired is faint and dashed. The dot marks live only, and it does not pulse.',
    css: 'status.css', deps: ['tokens'], demo: 'status' },

  { name: 'empty', category: 'Feedback',
    title: 'Empty state',
    blurb: 'Names what is missing and what to do. Does not apologise.',
    description: 'The glyph slot takes a mark from the suite at faint, so it reads as furniture rather than an illustration. There is no cartoon.',
    css: 'empty.css', deps: ['tokens'], demo: 'empty' },

  { name: 'toast', category: 'Feedback',
    title: 'Toast',
    blurb: 'Opacity and 6px of travel. Cross-fades in place under reduced motion.',
    description: 'Floating chrome, so it is the one place glass belongs. A notification that slides across the viewport is asking for attention it has not earned.',
    css: 'toast.css', deps: ['tokens', 'glass'], demo: 'toast' },

  // ── Data ──────────────────────────────────────────────────────────────────
  { name: 'kv', category: 'Data',
    title: 'Key–value table',
    blurb: 'Rules between rows, never zebra striping. Collapses to one column.',
    description: 'The key is mono because a machine would emit it. The value is sans if it is a word and mono if it is an identifier.',
    css: 'kv.css', deps: ['tokens'], demo: 'kv' },

  { name: 'code', category: 'Data',
    title: 'Code block',
    blurb: 'No syntax highlighting: that needs colour, and there is none to spend.',
    description: 'A copy control in the corner, mono uppercase so it reads as a key rather than a button competing with the code. Always visible on touch.',
    css: 'code.css', deps: ['tokens'], demo: 'code' },

  // ── Brand ─────────────────────────────────────────────────────────────────
  { name: 'made-by', category: 'Brand',
    title: 'Made by — the attribution lockup',
    blurb: 'Made with ♡ and good tools by Amir Salmani. Drawn, not typed.',
    description: 'Derives every colour from the surrounding foreground, so it adapts on either ground without a second rule. React and plain CSS, because not every site has a build step.',
    type: 'registry:component', special: 'made-by', deps: ['tokens'], demo: 'made-by' },

  { name: 'marks', category: 'Brand',
    title: 'Marks',
    blurb: 'The A-frame, the heart and the tool, in two weights.',
    description: 'One 64-unit grid, one stroke weight, round caps, currentColor. The heart is the frame inverted; the tool is a hexagonal ring spanner because a hexagon is straight lines.',
    special: 'svgdir', dir: 'marks', demo: 'marks' },

  { name: 'icons', category: 'Brand',
    title: 'Icons',
    blurb: 'Four, drawn in the mark’s own grammar. A start, not a set.',
    description: 'Straight strokes, round caps, filled nodes at termini, hexagons for anything mechanical. A filled node is a terminus; an open node is a working end.',
    special: 'svgdir', dir: 'icons', demo: 'icons' },

  // ── Bundles ───────────────────────────────────────────────────────────────
  { name: 'primitives', category: 'Bundles',
    title: 'Primitives',
    blurb: 'label · link · button · glass · figure in one command.',
    description: 'The five surfaces the brand is actually made of, installed together. Each is also available on its own.',
    bundle: ['label', 'link', 'button', 'glass', 'figure'], deps: ['tokens'] },

  { name: 'suite', category: 'Bundles',
    title: 'The whole suite',
    blurb: 'Every item above, in one command.',
    description: 'Tokens, type, layout, controls, feedback, data and brand. Roughly 30KB of CSS before compression, and you own all of it on copy.',
    bundle: 'all', deps: [] },
];

export const byName = Object.fromEntries(ITEMS.map(i => [i.name, i]));
