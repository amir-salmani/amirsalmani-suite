/* Six pastel cards in the usage demo, three light and three dark, paired so the
 * stack reads as depth. Mapped to six steps of the foreground: the depth
 * survives, the hues do not.
 */
export default [];
export const demoRules = [
  ['#e6d5f7', 'color-mix(in srgb, var(--fg) 88%, var(--bg))'],
  ['#30233c', 'color-mix(in srgb, var(--fg) 22%, var(--bg))'],
  ['#d5e8b5', 'color-mix(in srgb, var(--fg) 86%, var(--bg))'],
  ['#24351c', 'color-mix(in srgb, var(--fg) 18%, var(--bg))'],
  ['#f7c698', 'color-mix(in srgb, var(--fg) 80%, var(--bg))'],
  ['#432d1c', 'color-mix(in srgb, var(--fg) 26%, var(--bg))'],
];
