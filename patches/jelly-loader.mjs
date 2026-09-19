/* Eight steps of pink become eight steps of foreground. A loader is chrome —
 * it appears inside someone else's interface, and it has to be the brand's.
 */
export default [
  ["colors = ['#FFE4E1', '#FFB6C1', '#FF8A95', '#FF6B8A', '#E91E63', '#C2185B', '#AD1457', '#880E4F']",
   "colors = [\n      'color-mix(in srgb, var(--fg) 18%, transparent)',\n      'color-mix(in srgb, var(--fg) 30%, transparent)',\n      'color-mix(in srgb, var(--fg) 42%, transparent)',\n      'color-mix(in srgb, var(--fg) 54%, transparent)',\n      'color-mix(in srgb, var(--fg) 66%, transparent)',\n      'color-mix(in srgb, var(--fg) 78%, transparent)',\n      'color-mix(in srgb, var(--fg) 90%, transparent)',\n      'var(--fg)',\n    ]"],
];
