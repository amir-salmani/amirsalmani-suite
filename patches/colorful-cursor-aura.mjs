/* The aura's three hues become three strengths of the foreground. The name
 * keeps promising colour; the brand has none to spend, and a three-step
 * lightness ramp reads as depth just as well on all three grounds.
 */
export default [
  ['color1: "#7f7de4"', 'color1: "color-mix(in srgb, var(--fg) 100%, transparent)"'],
  ['color2: "#f79694"', 'color2: "color-mix(in srgb, var(--fg) 62%, transparent)"'],
  ['color3: "#f5dd94"', 'color3: "color-mix(in srgb, var(--fg) 34%, transparent)"'],
  ['textColor = "#000000"', 'textColor = "var(--fg)"'],
  ['bg-[#ececec]', 'bg-[var(--bg)]'],
];
