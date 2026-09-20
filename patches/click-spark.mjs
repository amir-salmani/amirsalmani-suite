/* Canvas takes a string, so the spark colour is resolved rather than referenced.
 * next-themes told it dark-or-light; --fg tells it which of three grounds.
 */
export default [
  /* NodeJS.Timeout in a browser component: the namespace only exists with
   * @types/node installed, which a consumer has no reason to have. The return
   * of setTimeout is the same thing and needs nothing. */
  ['NodeJS.Timeout', 'ReturnType<typeof setTimeout>'],
  ['import { useTheme } from "next-themes";\n',
   'import { tokenColour } from "@lib/token-colour";\n', /click\-spark\.(jsx|tsx)$/],
  ['  const { resolvedTheme } = useTheme();\n', ''],
  ['const effectiveColor = sparkColor || (resolvedTheme === "dark" ? "#fff" : "#000");',
   'const effectiveColor = sparkColor || tokenColour("--fg", "#fff");'],
];

/* next-themes told it dark-or-light. --fg answers the same question across
 * three grounds, so the dependency goes with the code that needed it. */
export const dropNpm = ['next-themes'];
export const addRegistry = ['token-colour'];
