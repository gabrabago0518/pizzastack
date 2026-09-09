// CS2's classic Competitive skill groups (1-18), unchanged from CS:GO. Used
// as a fallback when a player has no Premier rating yet — Premier is the
// primary mode most players report their rank in today.
const CS2_COMPETITIVE_RANKS = [
  "",
  "Silver I",
  "Silver II",
  "Silver III",
  "Silver IV",
  "Silver Elite",
  "Silver Elite Master",
  "Gold Nova I",
  "Gold Nova II",
  "Gold Nova III",
  "Gold Nova Master",
  "Master Guardian I",
  "Master Guardian II",
  "Master Guardian Elite",
  "Distinguished Master Guardian",
  "Legendary Eagle",
  "Legendary Eagle Master",
  "Supreme Master First Class",
  "Global Elite",
];

export function formatCs2Rank(
  premierRating: number | null,
  competitiveRank: number | null,
): string {
  if (premierRating) return `CS Rating: ${premierRating.toLocaleString()}`;
  if (competitiveRank) return CS2_COMPETITIVE_RANKS[competitiveRank] ?? "Unranked";
  return "Uncalibrated";
}
