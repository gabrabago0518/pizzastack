export function AvatarDisplay({
  url,
  label,
  className = "size-28",
  textClassName = "text-3xl",
}: {
  url: string | null;
  label: string;
  className?: string;
  textClassName?: string;
}) {
  const initial = label.charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted ${className}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span className={`font-display text-muted-foreground ${textClassName}`}>
          {initial}
        </span>
      )}
    </div>
  );
}
