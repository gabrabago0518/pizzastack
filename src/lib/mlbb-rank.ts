// MLBB's rank mechanics are two different shapes stitched into one ladder:
// Warrior through Legend each have 5 sub-ranks numbered V (lowest) down to
// I (highest) — e.g. "Legend I". Mythic has no sub-rank numeral at all;
// it's a running star count from 1, and the *display name* changes based
// on that count alone, not on anything the admin picks separately:
// 1-49 stars "Mythic", 50-99 "Mythical Glory", 100+ "Mythical Immortal".
export type MlbbRankTier =
  | "warrior"
  | "elite"
  | "master"
  | "grandmaster"
  | "epic"
  | "legend"
  | "mythic";

export const MLBB_RANK_TIERS: { value: MlbbRankTier; label: string }[] = [
  { value: "warrior", label: "Warrior" },
  { value: "elite", label: "Elite" },
  { value: "master", label: "Master" },
  { value: "grandmaster", label: "Grandmaster" },
  { value: "epic", label: "Epic" },
  { value: "legend", label: "Legend" },
  { value: "mythic", label: "Mythic" },
];

const TIER_LABELS: Record<MlbbRankTier, string> = {
  warrior: "Warrior",
  elite: "Elite",
  master: "Master",
  grandmaster: "Grandmaster",
  epic: "Epic",
  legend: "Legend",
  mythic: "Mythic",
};

const SUB_RANK_NUMERALS = ["", "I", "II", "III", "IV", "V"];

export function formatMlbbSubRank(subRank: number | null): string {
  if (!subRank || subRank < 1 || subRank > 5) return "";
  return SUB_RANK_NUMERALS[subRank];
}

// The Mythic-bracket display name, derived purely from star count.
export function formatMlbbMythicLabel(highestStar: number | null): string {
  if (highestStar && highestStar >= 100) return "Mythical Immortal";
  if (highestStar && highestStar >= 50) return "Mythical Glory";
  return "Mythic";
}

export function formatMlbbRank(
  tier: MlbbRankTier | null,
  subRank: number | null,
  highestStar: number | null,
): string {
  if (!tier) return "Unranked";

  if (tier === "mythic") {
    const label = formatMlbbMythicLabel(highestStar);
    return highestStar
      ? `${label} (${highestStar} ${highestStar === 1 ? "star" : "stars"})`
      : label;
  }

  const numeral = formatMlbbSubRank(subRank);
  return numeral ? `${TIER_LABELS[tier]} ${numeral}` : TIER_LABELS[tier];
}

// Which badge asset to show. Non-mythic tiers map 1:1 to their own badge;
// the Mythic bracket further branches into up to 3 badge slugs by star
// count even though the admin only ever picks the single "mythic" tier
// value — see MlbbRankIcon, which resolves this slug to an actual file.
export function mlbbRankIconSlug(
  tier: MlbbRankTier | null,
  highestStar: number | null,
): string | null {
  if (!tier) return null;
  if (tier !== "mythic") return tier;
  if (highestStar && highestStar >= 100) return "mythical-immortal";
  if (highestStar && highestStar >= 50) return "mythical-glory";
  return "mythic";
}
