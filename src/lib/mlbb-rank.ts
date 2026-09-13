// MLBB's rank mechanics are two different shapes stitched into one ladder:
// Warrior through Legend each have sub-ranks numbered down from a tier-
// specific max to I (highest) — e.g. "Legend I" — but the count isn't the
// same for every tier: Warrior/Elite only go up to III, Master only up to
// IV, Grandmaster/Epic/Legend the full V (see MAX_SUB_RANK_BY_TIER).
// Mythic has no sub-rank numeral at all; it's a running star count from 1,
// and the *display name* changes based on that count alone, not on
// anything the admin picks separately: 1-49 stars "Mythic", 50-99
// "Mythical Glory", 100+ "Mythical Immortal".
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

export const MLBB_TIER_LABELS: Record<MlbbRankTier, string> = {
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

// Warrior/Elite top out at III, Master at IV, Grandmaster/Epic/Legend go
// the full V — 1 (I, highest) is always valid, so this is just the lowest
// division's numeral for that tier.
const MAX_SUB_RANK_BY_TIER: Partial<Record<MlbbRankTier, number>> = {
  warrior: 3,
  elite: 3,
  master: 4,
  grandmaster: 5,
  epic: 5,
  legend: 5,
};

// The valid sub-rank numbers for a tier, highest (1/I) first — used to
// build the admin's division picker so it never offers a division that
// tier doesn't actually have (e.g. "Warrior V").
export function mlbbSubRanksForTier(tier: MlbbRankTier | null): number[] {
  if (!tier || tier === "mythic") return [];
  const max = MAX_SUB_RANK_BY_TIER[tier] ?? 5;
  return Array.from({ length: max }, (_, index) => index + 1);
}

// The Mythic-bracket display name, derived purely from star count.
export function formatMlbbMythicLabel(highestStar: number | null): string {
  if (highestStar && highestStar >= 100) return "Mythical Immortal";
  if (highestStar && highestStar >= 50) return "Mythical Glory";
  return "Mythic";
}

// Plain-text version of the rank label — for contexts that can't render
// JSX (alt text, page metadata). On-screen display uses MlbbRankLabel
// instead, which renders the Mythic bracket's star count as an actual
// star icon rather than spelling out the word "stars".
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
  return numeral ? `${MLBB_TIER_LABELS[tier]} ${numeral}` : MLBB_TIER_LABELS[tier];
}

// Which badge asset to show. Non-mythic tiers map 1:1 to their own badge;
// the Mythic bracket further branches into 3 badge slugs by star count
// even though the admin only ever picks the single "mythic" tier value.
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
