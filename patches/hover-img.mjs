/* It already had a local variable layer with a light block and a .dark override.
 * Pointing the layer at the tokens deletes the override: the tokens answer for
 * three grounds, and a .dark class answers for two.
 *
 * The thumbnail chases the cursor on a gsap quickTo. Under reduce the chase is
 * skipped and the thumbnail is placed, which is the same information without
 * the travel.
 */
export default [
  ['  --hi-bg: #f2f2f2;\n  --hi-text: #000000;\n  --hi-text-muted: #666666;\n  --hi-border: rgba(0, 0, 0, 0.15);',
   '  --hi-bg: var(--bg);\n  --hi-text: var(--fg);\n  --hi-text-muted: var(--fg-muted);\n  --hi-border: var(--rule);'],
  ['/* Dark mode support */\n.dark .hover-img-container,\n:root[class~="dark"] .hover-img-container {\n  --hi-bg: #0a0a0a;\n  --hi-text: #ffffff;\n  --hi-text-muted: #999999;\n  --hi-border: rgba(255, 255, 255, 0.2);\n}\n\n', ''],
  ['rgba(0, 0, 0, 0.3)', 'color-mix(in srgb, var(--fg) 30%, transparent)'],
  ['rgba(0, 0, 0, 0.2)', 'color-mix(in srgb, var(--fg) 20%, transparent)'],
  ['import React, { useRef, useEffect } from "react";',
   'import React, { useRef, useEffect } from "react";\nimport { useReducedMotion } from "motion/react";'],
  ['    useEffect(() => {', '    const reduceMotion = useReducedMotion();\n\n    useEffect(() => {'],
  /* Replace the duration rather than prepend one. The first version inserted a
   * second `duration:` above the existing `duration: 0.4`, so the later key won
   * and the guard did nothing — a reduced-motion path that was never taken, and
   * motion-proof could not see it because the file still said useReducedMotion.
   * tsc caught it as a duplicate object key. */
  ['            duration: 0.4,\n            ease: "power3.out",',
   '            duration: reduceMotion ? 0 : 0.4,\n            ease: "power3.out",'],
];
