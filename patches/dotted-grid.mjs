export default [
  ['ctx.fillStyle = "#000000";', 'ctx.fillStyle = tokenColour("--bg", "#000");'],
  ['import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { tokenColour } from "@lib/token-colour";', /dotted\-grid\.(jsx|tsx)$/],
];
export const addRegistry = ['token-colour'];
