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
