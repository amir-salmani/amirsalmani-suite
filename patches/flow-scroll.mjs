/* The drop shadow is drawn from the foreground so it reads on all three
 * grounds; a black shadow on black is a shadow nobody sees.
 *
 * x is layout. scale and rotate are the flourish, and they are what reduce
 * drops — the row still flows, the cards stop breathing and tilting.
 */
export default [
  ['rgba(0, 0, 0, 0.1)', 'color-mix(in srgb, var(--fg) 10%, transparent)'],
  ["import { motion, MotionValue, useScroll, useTransform } from 'motion/react';",
   "import { motion, MotionValue, useScroll, useTransform, useReducedMotion } from 'motion/react';"],
  ["    const scale = useTransform(", "    const reduceMotion = useReducedMotion();\n    const scale = useTransform("],
  ["                scale,\n                x: xTransform,\n                rotate,",
   "                scale: reduceMotion ? 1 : scale,\n                x: xTransform,\n                rotate: reduceMotion ? 0 : rotate,"],
];
