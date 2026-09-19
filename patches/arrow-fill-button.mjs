/* Emphasis by inversion: the button is the foreground, and the fill that sweeps
 * across it is the ground. Same argument button.css already makes.
 */
export default [
  ['bgColor = "#ff6b00"', 'bgColor = "var(--fg)"'],
  ['textColor = "#ffffff"', 'textColor = "var(--bg)"'],
  ['fillBgColor = "#ffffff"', 'fillBgColor = "var(--bg)"'],
  ['fillTextColor = "#ff6b00"', 'fillTextColor = "var(--fg)"'],
  ['hoverFillBgColor = "#ffffff"', 'hoverFillBgColor = "var(--bg)"'],
  ['hoverFillTextColor = "#ff6b00"', 'hoverFillTextColor = "var(--fg)"'],
];
