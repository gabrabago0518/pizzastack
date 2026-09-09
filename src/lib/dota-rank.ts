// OpenDota's rank_tier is a two-digit number: tens digit = medal (1-8),
// ones digit = stars (1-5). Immortal (8) has no stars — standing is instead
// a numeric leaderboard position.
const DOTA_MEDALS = [
  "",
  "Herald",
  "Guardian",
  "Crusader",
  "Archon",
  "Legend",
  "Ancient",
  "Divine",
  "Immortal",
];

export function formatDotaRank(
  rankTier: number | null,
  leaderboardRank: number | null,
): string {
  if (!rankTier) return "Uncalibrated";

  const medal = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const medalName = DOTA_MEDALS[medal] ?? "Unknown";

  if (medal === 8) {
    return leaderboardRank ? `Immortal (Rank ${leaderboardRank.toLocaleString()})` : "Immortal";
  }
  return stars ? `${medalName} ${stars}` : medalName;
}

// Dota 2's 32-bit account_id is a SteamID64 minus Valve's fixed base offset.
const STEAM_ID_64_BASE = BigInt("76561197960265728");

export function steamId64ToDotaAccountId(steamId64: string): string {
  return (BigInt(steamId64) - STEAM_ID_64_BASE).toString();
}
