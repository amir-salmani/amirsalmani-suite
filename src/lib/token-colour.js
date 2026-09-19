/* amirsalmani/token-colour — a custom property, resolved.
 *
 * Canvas and WebGL take a colour string, not a var(). Every imported component
 * that paints rather than styles needs its brand colour as a concrete value at
 * the moment it paints, and needs it again when the theme changes underneath it
 * (decisions/0019).
 *
 * The fallback is not decoration: this runs during SSR with no document, and a
 * component that throws there takes the page with it.
 *
 * React-only, because everything that needs it is a React component.
 */

import { useState, useEffect } from 'react';

export function tokenColour(name, fallback = '#000') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/* React, and re-read on theme change. data-theme is an attribute swap, so
 * nothing re-renders on its own and a canvas painted once keeps yesterday's
 * palette until something else happens to touch it. */
export function useTokenColour(name, fallback = '#000') {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const read = () => setValue(tokenColour(name, fallback));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', read);
    return () => { mo.disconnect(); mq.removeEventListener('change', read); };
  }, [name, fallback]);
  return value;
}
