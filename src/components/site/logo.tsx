export function Logo({ id, className }: { id: string; className?: string }) {
  const filterId = `pinkGlow-${id}`;

  return (
    <svg
      viewBox="0 0 380 70"
      className={className}
      role="img"
      aria-label="Pizzastack.gg"
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <text
        x="5"
        y="48"
        className="font-display"
        fontWeight="900"
        fontSize="40"
        letterSpacing="-0.03em"
        fill="#FAFAFA"
      >
        PIZZA
      </text>

      <text
        x="142"
        y="48"
        className="font-display"
        fontWeight="900"
        fontSize="40"
        letterSpacing="-0.03em"
        fill="var(--primary)"
      >
        STACK
      </text>

      <rect
        x="295"
        y="16"
        width="76"
        height="34"
        rx="8"
        fill="var(--card)"
        stroke="var(--secondary)"
        strokeWidth="1.5"
      />
      <text
        x="333"
        y="39"
        textAnchor="middle"
        className="font-display"
        fontWeight="800"
        fontSize="20"
        letterSpacing="0.05em"
        fill="var(--secondary)"
        filter={`url(#${filterId})`}
      >
        .GG
      </text>
    </svg>
  );
}

// Compact "PS" mark — same two-tone treatment as the favicon (white P,
// pink S), for spots too narrow for the full wordmark, like the mobile
// header, where every pixel goes toward fitting the nav icons instead.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} role="img" aria-label="Pizzastack.gg">
      <text
        x="6"
        y="45"
        className="font-display"
        fontWeight="900"
        fontSize="42"
        letterSpacing="-0.02em"
        fill="#FAFAFA"
      >
        P
      </text>
      <text
        x="30"
        y="45"
        className="font-display"
        fontWeight="900"
        fontSize="42"
        letterSpacing="-0.02em"
        fill="var(--primary)"
      >
        S
      </text>
    </svg>
  );
}
