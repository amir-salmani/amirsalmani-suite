export default [
  ['borderColor: "rgba(255, 255, 255, 0.15)"', 'borderColor: "color-mix(in srgb, var(--fg) 15%, transparent)"'],
  ['backgroundColor: "rgba(0, 0, 0, 1)"', 'backgroundColor: "var(--bg)"'],
  ['textColor: "rgba(128, 128, 128, 1)"', 'textColor: "var(--fg-muted)"'],
  ['hoverColor: "rgba(255, 255, 255, 0)"', 'hoverColor: "transparent"'],
  ['ctx.fillStyle = "#111";', 'ctx.fillStyle = tokenColour("--bg", "#111");'],
  ['import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { tokenColour } from "@lib/token-colour";', /art\-gallery\.(jsx|tsx)$/],
];
export const addRegistry = ['token-colour'];
