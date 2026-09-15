/* amirsalmani/motion — a critically-damped spring in ~40 lines.
 *
 * Extracted from amirsalmani.com/app.js, which remains the source of truth
 * (brand.md §4). Parameterised the way Apple parameterises it — damping ratio
 * and response in seconds, not mass and stiffness — because those are the two
 * knobs a designer can actually reason about.
 *
 *   x'' = -w0^2 (x - target) - 2 z w0 x'      w0 = 2pi / response
 *
 * Semi-implicit Euler at a fixed 1/240 s sub-step, so behaviour does not change
 * with frame rate. Re-targeting keeps x and v, which is what makes a reversal
 * blend instead of hitting a velocity brick wall — and is the whole reason this
 * exists rather than a CSS transition.
 *
 *   const s = new Spring(0, t => el.style.setProperty('--t', t.toFixed(4)), SPRING.knob);
 *   s.to(1);
 *
 * Under prefers-reduced-motion the spring snaps to target. It reads the query
 * live, so a visitor changing the setting mid-session is honoured without a
 * reload.
 */

const calmQuery = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

export class Spring {
  constructor(value, apply, opts = {}) {
    this.x = value;
    this.v = 0;
    this.target = value;
    this.apply = apply;
    this.zeta = opts.damping == null ? 1 : opts.damping;
    this.w0 = (2 * Math.PI) / (opts.response == null ? 0.4 : opts.response);
    this.raf = 0;
    this.last = 0;
    this.apply(this.x);
  }

  to(target, velocity) {
    this.target = target;
    if (velocity != null) this.v = velocity;
    if (calmQuery.matches) { this.x = target; this.v = 0; this.apply(this.x); return; }
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  }

  tick = (now) => {
    const dt = Math.min((now - this.last) / 1000, 0.064);
    this.last = now;

    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = -this.w0 * this.w0 * (this.x - this.target) - 2 * this.zeta * this.w0 * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    this.apply(this.x);

    if (Math.abs(this.x - this.target) < 0.002 && Math.abs(this.v) < 0.02) {
      this.x = this.target; this.v = 0; this.apply(this.x); this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
}

/* The three settings in use on amirsalmani.com. Bounce (damping ~0.8) is
   reserved for momentum-driven interactions — a flick or a drag release. There
   are none yet, so nothing bounces. */
export const SPRING = {
  knob:     { damping: 1, response: 0.32 },  /* a switch — snappy, no momentum in */
  lift:     { damping: 1, response: 0.42 },  /* a plate rising under the pointer */
  settle:   { damping: 1, response: 0.5  },  /* parallax returning home on leave */
};

export default Spring;
