/* Canvas stroke — resolved, not referenced. */
export default [
  ["import { cn } from '@/lib/utils'", "import { cn } from '@/lib/utils'\nimport { tokenColour } from '@lib/token-colour'", /rope\-cursor\.(jsx|tsx)$/],
  ["ropeColor = '#bda985',", "ropeColor = tokenColour('--fg', '#fff'),"],
];
export const addRegistry = ['token-colour'];

/* The usage demo overrides the colour we just re-pointed — the component's default is tokenColour('--fg'). */
export const demoRules = [
  ['ropeColor="#d0b88c"', ''],
];
