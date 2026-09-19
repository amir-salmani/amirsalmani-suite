/* A mask, not a palette. In mask-image the channel that matters is alpha —
 * rgba(0,0,0,0.2) means 20% visible, and the black is doing no work at all.
 */
export default [];
export const allow = [[/rgba\(0,0,0,[\d.]+\)/, 'mask alpha ramp: the colour is ignored, only the alpha is read']];
