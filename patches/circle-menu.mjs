export default [
  ["bg-[#27272A]", "bg-[var(--bg-alt)]"],
  ["backgroundColor: '#27272A'", "backgroundColor: 'var(--bg-alt)'"],
  ['color-mix(in srgb, #27272A ${Math.max(100 - i * 10, 40)}%, white)',
   'color-mix(in srgb, var(--bg-alt) ${Math.max(100 - i * 10, 40)}%, var(--fg))'],
];
