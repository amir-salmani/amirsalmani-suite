// made-by — the attribution lockup.
//
// Colours derive from the surrounding foreground, so it adapts inside an
// inverted band without a second set of rules. Never introduce a hex here.

type Variant = "full" | "short" | "minimal" | "stacked";

const Frame = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" strokeWidth="4.6"
       strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Amir Salmani" {...p}>
    <path d="M12 51 L32 13 L52 51" /><path d="M20.5 35 H43.5" />
    <g fill="currentColor" stroke="none">
      <circle cx="32" cy="13" r="3.8" /><circle cx="12" cy="51" r="3.8" /><circle cx="52" cy="51" r="3.8" />
    </g>
  </svg>
);

const Heart = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="6.2 6.2 51.6 51.6" fill="none" stroke="currentColor" strokeWidth="4.6"
       strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="love" {...p}>
    <path d="M32 50 L14.5 32.5 A12.375 12.375 0 0 1 32 15 A12.375 12.375 0 0 1 49.5 32.5 Z" />
  </svg>
);

export function MadeBy({
  variant = "full",
  href = "https://amirsalmani.com",
  className = "",
}: { variant?: Variant; href?: string; className?: string }) {
  const name = <a href={href} className="made-by__link">Amir Salmani</a>;
  const heart = <Heart className="made-by__glyph" />;

  return (
    <span className={`made-by${variant === "stacked" ? " made-by--stacked" : ""} ${className}`.trim()}>
      <Frame className="made-by__mark" />
      {variant === "minimal" ? name : (
        <span>
          Made with {heart}
          {variant === "full" || variant === "stacked" ? " and good tools" : ""} by {name}
        </span>
      )}
    </span>
  );
}

export default MadeBy;
