"use client";

import * as React from "react";
import { mlbbRankIconSlug, type MlbbRankTier } from "@/lib/mlbb-rank";

// MLBB has no official asset CDN to hotlink (unlike OpenDota/Steam for
// Dota or valorant-api.com for Valorant), so this badge artwork is stored
// locally at public/mlbb-ranks/<slug>.png instead. Falls back to hiding
// quietly on load failure, same as DotaRankIcon/ValorantRankIcon — the
// rank text alongside it already carries the information.
export function MlbbRankIcon({
  tier,
  highestStar,
  className = "size-5",
}: {
  tier: MlbbRankTier | null;
  highestStar: number | null;
  className?: string;
}) {
  const slug = mlbbRankIconSlug(tier, highestStar);
  const [brokenSlug, setBrokenSlug] = React.useState<string | null>(null);

  if (!slug || slug === brokenSlug) return null;

  return (
    <img
      src={`/mlbb-ranks/${slug}.png`}
      alt=""
      className={className}
      onError={() => setBrokenSlug(slug)}
    />
  );
}
