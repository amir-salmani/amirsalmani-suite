/* translateX places the cards along the track and has to stay. The rotation,
 * the vertical drift and the scroll-driven blur are the parts that make a
 * reader queasy, so those are what reduce removes.
 */
export default [
  ["import { motion, MotionValue, useScroll, useTransform } from 'motion/react';",
   "import { motion, MotionValue, useScroll, useTransform, useReducedMotion } from 'motion/react';"],
  ["    const translateX = useTransform(", "    const reduceMotion = useReducedMotion();\n    const translateX = useTransform("],
  ["                translateX,\n                filter,\n                translateY: useTransform(translateY, (value) => `${value - 400}px`),\n                perspective: 1000,",
   "                translateX,\n                filter: reduceMotion ? 'none' : filter,\n                translateY: useTransform(translateY, (value) => `${reduceMotion ? -400 : value - 400}px`),\n                perspective: reduceMotion ? 'none' : 1000,"],
  ["            <motion.div style={{ rotateY }}>", "            <motion.div style={{ rotateY: reduceMotion ? 0 : rotateY }}>"],
];
