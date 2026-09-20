/* `fill` is a next/image prop and means nothing on a plain <img>. Rewriting
 * next/image away left it behind, so this image lost its sizing entirely —
 * found by tsc, not by looking. This one already carried
 * `absolute top-0 left-0 h-full w-full`, so the prop was only redundant. */
/* `fill` is a next/image prop and means nothing on a plain <img>. Rewriting
 * next/image away left it behind, so this image lost its sizing entirely —
 * found by tsc, not by looking. This one already carried
 * `absolute top-0 left-0 h-full w-full`, so the prop was only redundant. */
export default [
  ['                        fill\n', ''],
];
