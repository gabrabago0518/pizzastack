"use client";

import * as React from "react";

// Same fallback pattern as the other external-CDN icon components
// (DotaRankIcon, ValorantRankIcon, GamePosterImage) — falls back to a
// plain initial-letter circle on load failure (or when there's simply no
// icon URL yet) rather than a broken-image glyph.
export function MatchCharacterIcon({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [broken, setBroken] = React.useState(false);

  if (!src || broken) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
        {alt.slice(0, 1).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="size-10 shrink-0 rounded-full border border-border object-cover"
      onError={() => setBroken(true)}
    />
  );
}
