/* A warm off-white ground with an orange marker. Both become tokens: the ground
 * is --bg, the marker is --fg, and the three tints of the ink are strengths of
 * --fg rather than three hardcoded alphas of one brown.
 */
export default [
  ['bg-[#f0ede6] text-[#1e1c18]', 'bg-[var(--bg)] text-[var(--fg)]'],
  ['rgba(30,28,24,0.6)', 'var(--fg-muted)'],
  ['rgba(30,28,24,0.06)', 'var(--rule)'],
  ['bg-[#e63000]', 'bg-[var(--fg-accent)]'],
  ['outline-[#e63000]', 'outline-[var(--fg-accent)]'],
  ['"#e63000"', '"var(--fg-accent)"'],
];
