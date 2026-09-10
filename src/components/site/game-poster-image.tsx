"use client";

import * as React from "react";

// Sits on top of GamePosterCard's gradient fallback layer and simply
// disappears on load failure (blocked hotlinking, a transient CDN issue),
// revealing that gradient underneath instead of a broken-image glyph —
// same resilience pattern as DotaRankIcon/ValorantRankIcon.
export function GamePosterImage({ src }: { src: string }) {
  const [broken, setBroken] = React.useState(false);

  if (broken) return null;

  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setBroken(true)}
    />
  );
}
