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
    // Plain inline flow (not a flex row) so "Mythical Immortal" can still
    // wrap between its two words on a narrow screen — a flex row would
    // instead center the icon+number across both wrapped lines, floating
    // it oddly to the right. The icon+number stay glued together as their
    // own unit via whitespace-nowrap, dropping to the next line as a pair
    // if they don't fit rather than splitting the icon from its number.
    return (
      <>
        {label}{" "}
        <span className="inline-flex items-center gap-1 whitespace-nowrap align-middle">
          <Star className="size-4 shrink-0 fill-current text-secondary" />
          {highestStar}
        </span>
      </>
    );
  }

  const numeral = formatMlbbSubRank(subRank);
  return numeral ? `${MLBB_TIER_LABELS[tier]} ${numeral}` : MLBB_TIER_LABELS[tier];
}
