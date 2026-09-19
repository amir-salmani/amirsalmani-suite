/* Not colours being set — selectors. Recharts renders its own grid at #ccc and
 * its dots at #fff, and these attribute selectors exist to find that output and
 * restyle it to stroke-border. Re-pointing them would stop them matching.
 */
export default [];
export const allow = [[/#ccc|#fff/, "attribute selectors matching recharts' own defaults"]];
