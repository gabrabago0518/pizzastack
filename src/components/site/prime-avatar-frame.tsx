// A slow-rotating gradient ring around a large avatar — the "animated
// avatar border" Prime perk advertised on /prime. Built as an oversized
// conic-gradient layer clipped by this wrapper's own rounded overflow
// (standard animated-border technique), with the avatar sitting on top
// covering everything but the ring itself. Deliberately not the earlier
// flame-SVG design (removed per explicit feedback) — a plain rotating
// gradient instead.
export function PrimeAvatarFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full p-[3px] ${className}`}
    >
      <div
        className="absolute inset-[-50%] animate-prime-spin"
        style={{
          background:
            "conic-gradient(from 0deg, var(--color-primary), var(--color-secondary), var(--color-primary))",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
