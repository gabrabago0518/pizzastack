const FLAME_COUNT = 14;

// One flame lick pointing "up" (-y) from its own base at the origin —
// asymmetric on purpose so the ring doesn't read as a perfectly even
// gear when repeated. length/width vary per index (deterministic, not
// random, so server and client render identically).
function flamePath(length: number, width: number): string {
  return `M ${-width},0 C ${-width * 1.3},${-length * 0.35} ${-width * 0.4},${-length * 0.75} 0,${-length} C ${width * 0.5},${-length * 0.7} ${width * 1.2},${-length * 0.3} ${width},0 Z`;
}

// Decorative dark-flame ring around an avatar: embers glowing bright at
// the base (near the avatar edge) cooling to near-black smoke at each
// tip. Pure SVG/CSS, no image assets — sized as a percentage overlay so
// it scales with whatever size the avatar itself is rendered at.
function AvatarFlameFrame({ gradientId }: { gradientId: string }) {
  const flames = Array.from({ length: FLAME_COUNT }, (_, i) => {
    const angle = (360 / FLAME_COUNT) * i;
    const length = 15 + (i % 3) * 4.5;
    const width = 5 + (i % 2) * 1.5;
    return { angle, d: flamePath(length, width) };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute -inset-[24%] z-0"
      style={{ filter: "drop-shadow(0 0 5px rgba(210, 60, 12, 0.45))" }}
      aria-hidden="true"
    >
      <defs>
        {/* userSpaceOnUse, not the default objectBoundingBox: each flame's
            own local y runs from 0 (base) to -length (tip), and this maps
            that range directly — objectBoundingBox instead normalizes by
            each path's bounding box top/bottom, which (combined with the
            negative-y coordinates here) puts the stops in the opposite
            order from what they look like below. */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="-24"
        >
          <stop offset="0%" stopColor="#ff8a2b" />
          <stop offset="14%" stopColor="#8a2410" />
          <stop offset="32%" stopColor="#1c0806" />
          <stop offset="100%" stopColor="#080402" />
        </linearGradient>
      </defs>
      {flames.map((flame, i) => (
        <path
          key={i}
          d={flame.d}
          fill={`url(#${gradientId})`}
          transform={`translate(50 50) rotate(${flame.angle}) translate(0 -37)`}
        />
      ))}
    </svg>
  );
}

export function AvatarDisplay({
  url,
  label,
  className = "size-28",
  textClassName = "text-3xl",
  frame,
}: {
  url: string | null;
  label: string;
  className?: string;
  textClassName?: string;
  frame?: "flame";
}) {
  const initial = label.charAt(0).toUpperCase() || "?";
  const gradientId = `avatarFlameGradient-${label.replace(/[^a-zA-Z0-9]/g, "") || "x"}`;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {frame === "flame" ? <AvatarFlameFrame gradientId={gradientId} /> : null}
      <div className="relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className={`font-display text-muted-foreground ${textClassName}`}>
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}
