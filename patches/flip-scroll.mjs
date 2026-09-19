/* translateX is layout — the cards are absolutely placed along a track, and
 * freezing it stacks them in one spot. What makes this uncomfortable is the
 * 3D flip, so that is what reduce removes: the carousel still tracks scroll,
 * the cards just stop turning.
 */
export default [
  ["import { motion, MotionValue, useScroll, useTransform } from 'motion/react';",
   "import { motion, MotionValue, useScroll, useTransform, useReducedMotion } from 'motion/react';"],
  ["            style={{ translateX, perspective: 1000, transformStyle: 'preserve-3d' }}",
   "            style={{ translateX, perspective: reduceMotion ? 'none' : 1000, transformStyle: 'preserve-3d' }}"],
  ["                style={{ rotateY: mode === 'normal' ? normalRotateY : alternateRotateY, transformStyle: 'preserve-3d' }}",
   "                style={{ rotateY: reduceMotion ? 0 : mode === 'normal' ? normalRotateY : alternateRotateY, transformStyle: 'preserve-3d' }}"],
  ["    const translateX = useTransform(", "    const reduceMotion = useReducedMotion();\n    const translateX = useTransform("],
];
