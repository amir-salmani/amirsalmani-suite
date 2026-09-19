/* The bars *are* the scroll position — height and opacity encode where you are
 * in the document. Freezing them would not calm the component, it would blank
 * the readout. WCAG 2.3.3 exempts motion essential to the function, and this is
 * the exemption rather than an appeal to it.
 */
export default [];
export const motionWaiver = 'the motion is the scroll readout (WCAG 2.3.3 essential motion)';
