/* `fill` is a next/image prop and means nothing on a plain <img>. Rewriting
 * next/image away left it behind, so this image lost its sizing entirely —
 * found by tsc, not by looking. Next's fill is position:absolute + 100%/100%, so that is what
 * replaces it here. */
/* `fill` is a next/image prop and means nothing on a plain <img>. Rewriting
 * next/image away left it behind, so this image lost its sizing entirely —
 * found by tsc, not by looking. Next's fill is position:absolute + 100%/100%, so that is what
 * replaces it here. */
export default [
  /* Matched in upstream's <Image> form: item rules run before the global
   * next/image rewrite, so the tag is still <Image> at this point. */
  ['<Image src={imageUrl} alt={name} fill className="object-cover" />',
   '<Image src={imageUrl} alt={name} className="absolute inset-0 h-full w-full object-cover" />'],
];
