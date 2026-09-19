/* The gradient is the artwork the dither samples; the mask is alpha. */
export default [
  ['actx.fillStyle = "#fff";', 'actx.fillStyle = tokenColour("--fg", "#fff");'],
  ['linear-gradient(135deg, transparent 12%, #2563eb 35%, #0aa3e0 55%, #5c4af2 72%, transparent 90%)',
   'linear-gradient(135deg, transparent 12%, color-mix(in srgb, var(--fg) 85%, transparent) 35%, color-mix(in srgb, var(--fg) 55%, transparent) 55%, color-mix(in srgb, var(--fg) 30%, transparent) 72%, transparent 90%)'],
  ['import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { tokenColour } from "@lib/token-colour";', /dither\-canvas\.(jsx|tsx)$/],
];
export const allow = [[/#000\b/, 'mask-image stop: alpha, not colour']];
export const addRegistry = ['token-colour'];
