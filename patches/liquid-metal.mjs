export default [
  ['colorBack = "#aaaaac"', 'colorBack = tokenColour("--bg", "#aaaaac")'],
  ['colorTint = "#ffffff"', 'colorTint = tokenColour("--fg", "#ffffff")'],
  ['colorBack={metalConfig?.colorBack ?? "#888888"}', 'colorBack={metalConfig?.colorBack ?? tokenColour("--bg-alt", "#888888")}'],
  ['colorTint={metalConfig?.colorTint ?? "#ffffff"}', 'colorTint={metalConfig?.colorTint ?? tokenColour("--fg", "#ffffff")}'],
  ['import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { tokenColour } from "@lib/token-colour";', /liquid\-metal\.(jsx|tsx)$/],
];
export const allow = [[/rgba\(0,\s*0,\s*0,\s*0\.\d+\)/, 'Tailwind arbitrary shadow: alpha over whatever is beneath']];
export const addRegistry = ['token-colour'];
