"use client";

import * as React from "react";
import { dotaRankIconUrls } from "@/lib/dota-rank";

// Renders Valve's medal artwork for a rank_tier. Tries each candidate host
// in order (see dotaRankIconUrls) and falls through to the next on load
// failure; if all fail it just disappears rather than showing a
// broken-image glyph — callers already show the rank as text alongside
// this, so nothing is lost.
export function DotaRankIcon({
  rankTier,
  className = "size-5",
}: {
  rankTier: number | null;
  className?: string;
}) {
  const urls = React.useMemo(() => dotaRankIconUrls(rankTier), [rankTier]);
  const [index, setIndex] = React.useState(0);
  const [urlsForIndex, setUrlsForIndex] = React.useState(urls);

  // Reset the fallback position when rankTier changes, without an effect —
  // adjusting state during render (guarded by this comparison) is React's
  // recommended way to derive state from a prop change.
  if (urlsForIndex !== urls) {
    setUrlsForIndex(urls);
    setIndex(0);
  }

  const src = urls[index];
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}
