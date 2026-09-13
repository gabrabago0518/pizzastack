import { Star } from "lucide-react";

import {
  formatMlbbMythicLabel,
  formatMlbbSubRank,
  MLBB_TIER_LABELS,
  type MlbbRankTier,
} from "@/lib/mlbb-rank";

// The Mythic bracket's star count is shown as an actual star icon rather
// than the word "stars" — everything below Mythic has no star count at
// all (just a tier + Roman-numeral division), so this only ever renders
// the icon for the top bracket.
export function MlbbRankLabel({
  tier,
  subRank,
  highestStar,
}: {
  tier: MlbbRankTier | null;
  subRank: number | null;
  highestStar: number | null;
}) {
  if (!tier) return "Unranked";

  if (tier === "mythic") {
    const label = formatMlbbMythicLabel(highestStar);
    if (!highestStar) return label;
    return (
      <span className="inline-flex items-center gap-1">
        {label}
        <Star className="size-4 shrink-0 fill-current text-secondary" />
        {highestStar}
      </span>
    );
  }

  const numeral = formatMlbbSubRank(subRank);
  return numeral ? `${MLBB_TIER_LABELS[tier]} ${numeral}` : MLBB_TIER_LABELS[tier];
}
