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

// Valve's official medal artwork, keyed by medal grade (1 Herald - 8
// Immortal) — the same shield art shown in the Dota 2 client. Doesn't bake
// in the star count (Valve renders those as separate small pips in-game),
// so the star number is still conveyed via formatDotaRank's text alongside it.
//
// Two candidate hosts, tried in order (DotaRankIcon falls through the list
// on load failure): OpenDota's own asset path (confirmed from their open-
// source frontend, src/components/Heroes/rankColumns.ts) as primary, and
// Valve's Cloudflare-fronted CDN as a fallback in case OpenDota is down or
// rate-limits hotlinking.
export function dotaRankIconUrls(rankTier: number | null): string[] {
  if (!rankTier) return [];
  const medal = Math.floor(rankTier / 10);
  if (medal < 1 || medal > 8) return [];
  return [
    `https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_${medal}.png`,
    `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/rank_icons/rank_icon_${medal}.png`,
  ];
}

// Dota 2's 32-bit account_id is a SteamID64 minus Valve's fixed base offset.
const STEAM_ID_64_BASE = BigInt("76561197960265728");

export function steamId64ToDotaAccountId(steamId64: string): string {
  return (BigInt(steamId64) - STEAM_ID_64_BASE).toString();
}
