/* The mask follows the pointer on a spring. Under reduce the spring is removed
 * rather than the mask: the effect still works, it simply stops overshooting.
 * Hiding it would take the component's whole purpose with it.
 */
export default [
  ["import { motion, useMotionValue, useSpring } from 'motion/react';",
   "import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';"],
  ["    const maskX = useSpring(useMotionValue(mousePosition.x - MASK_SIZE / 2), { stiffness: 500, damping: 50 });",
   "    const reduceMotion = useReducedMotion();\n    const spring = reduceMotion ? { stiffness: 10000, damping: 100 } : { stiffness: 500, damping: 50 };\n    const maskX = useSpring(useMotionValue(mousePosition.x - MASK_SIZE / 2), spring);"],
  ["const maskY = useSpring(useMotionValue(mousePosition.y - MASK_SIZE / 2), { stiffness: 500, damping: 50 });",
   "const maskY = useSpring(useMotionValue(mousePosition.y - MASK_SIZE / 2), spring);"],
  ["const maskSizeSpring = useSpring(useMotionValue(MASK_SIZE), { stiffness: 500, damping: 50 });",
   "const maskSizeSpring = useSpring(useMotionValue(MASK_SIZE), spring);"],
  ["backgroundColor = '#EA5A47'", "backgroundColor = 'var(--fg-accent)'"],
];

/* The usage demo overrides the colour we just re-pointed — the component's default is var(--fg-accent). */
export const demoRules = [
  [/\s*backgroundColor=['"]#EA5A47['"]/g, ''],
];
