"use client";

import * as React from "react";
import { dotaRankIconUrl } from "@/lib/dota-rank";

// Renders Valve's medal artwork for a rank_tier. If the image fails to
// load (e.g. Valve moves the asset), it just disappears rather than
// showing a broken-image glyph — callers already show the rank as text
// alongside this, so nothing is lost.
export function DotaRankIcon({
  rankTier,
  className = "size-5",
}: {
  rankTier: number | null;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  const src = dotaRankIconUrl(rankTier);

  if (!src || broken) return null;

  return <img src={src} alt="" className={className} onError={() => setBroken(true)} />;
}
