/* The chrome comes onto the brand. maskCtx is an offscreen mask canvas where
 * white means "show" — that one is alpha, not colour.
 */
export default [
  ['const backgroundColor = "#000000", gridColor = "#272727", hoverColor = "#ffffff"',
   'const backgroundColor = tokenColour("--bg", "#000"), gridColor = tokenColour("--rule", "#272727"), hoverColor = tokenColour("--fg", "#fff")'],
  ['border-[#232323] bg-[#0f0f0f]', 'border-[var(--rule)] bg-[var(--bg-alt)]'],
  ['border-[#2a2a2a] bg-[#141414]', 'border-[var(--rule)] bg-[var(--bg-alt)]'],
  ['"border-[#ff5f00] bg-[#ff5f00] text-black"', '"border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"'],
  ['text-[#bdbdbd] hover:bg-[#1f1f1f] hover:text-white', 'text-[var(--fg-muted)] hover:bg-[var(--glass)] hover:text-[var(--fg)]'],
  ['import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { tokenColour } from "@lib/token-colour";', /grid\-lift\.(jsx|tsx)$/],
  ['text-white outline-none focus:border-[#ff5f00]', 'text-[var(--fg)] outline-none focus:border-[var(--fg)]'],
  ['text-white hover:border-[#ff5f00] hover:bg-[#1f1f1f]', 'text-[var(--fg)] hover:border-[var(--fg)] hover:bg-[var(--glass)]'],
];
export const allow = [[/#ffffff/, 'offscreen mask canvas: white is alpha, not colour']];
export const addRegistry = ['token-colour'];
