/* The dark/light switch predates the third ground; --fg and --bg answer it for
 * all three, so the prop stops deciding colour and the tokens do.
 */
export default [
  ['style={{ background: dark ? "#101010" : "#f5f4ef", color: dark ? "#fff" : "#111" }}',
   'style={{ background: "var(--bg)", color: "var(--fg)" }}'],
];
