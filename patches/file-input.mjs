/* The upload beam is a five-stop blue gradient sweeping an SVG stroke. It
 * becomes five strengths of the foreground — the motion is what reads, not the
 * hue, and the hue is the only part that was never ours.
 */
export default [
  ['stroke="#3F3F47"', 'stroke="var(--rule)"'],
  ["stopColor={'#00bfff'}", "stopColor={'var(--fg)'}"],
  ["stopColor={'#0080ff'}", "stopColor={'var(--fg)'}"],
  ["stopColor={'#0066cc'}", "stopColor={'var(--fg)'}"],
  ["stopColor={'#004499'}", "stopColor={'var(--fg-muted)'}"],
  ["stopColor={'#002266'}", "stopColor={'var(--fg-faint)'}"],
  ["stopColor={'#001133'}", "stopColor={'var(--fg-faint)'}"],
  ["stopColor={'#ffffff'}", "stopColor={'var(--fg)'}"],
];
