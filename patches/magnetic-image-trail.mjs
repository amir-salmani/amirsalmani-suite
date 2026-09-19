export default [
  ['background = "#EDEBE6"', 'background = "var(--bg)"'],
  ['textColor = "#111"', 'textColor = "var(--fg)"'],
  ['ctx.shadowColor = "rgba(0,0,0,0.14)";', 'ctx.shadowColor = tokenColour("--rule", "rgba(0,0,0,0.14)");'],
  ['import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { tokenColour } from "@lib/token-colour";', /magnetic\-image\-trail\.(jsx|tsx)$/],
];
export const addRegistry = ['token-colour'];
