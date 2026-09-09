import { createServiceClient } from "@/lib/supabase/service";
import { fetchDotaRankFromOpenDota } from "@/lib/steam";
import { fetchCs2RankFromLeetify } from "@/lib/leetify";
import { fetchValorantRank } from "@/lib/henrikdev";

export interface SyncedRanks {
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
}

// Fetches every verified-game rank (Dota 2 via OpenDota, CS2 via Leetify)
// for a connected Steam account and writes them via the service-role
// client. Each provider is independent and best-effort — one being down
// doesn't block the other, and this never throws: a sync failure just
// leaves that game "not synced yet", retryable from the settings page.
export async function syncRanksForSteamId(
  userId: string,
  steamId64: string,
): Promise<SyncedRanks> {
  const service = createServiceClient();
  const syncedAt = new Date().toISOString();

  let dotaRankTier: number | null = null;
  let dotaLeaderboardRank: number | null = null;
  try {
    const dota = await fetchDotaRankFromOpenDota(steamId64);
    dotaRankTier = dota.rankTier;
    dotaLeaderboardRank = dota.leaderboardRank;
    await service
      .from("profiles")
      .update({
        dota_rank_tier: dota.rankTier,
        dota_leaderboard_rank: dota.leaderboardRank,
        dota_rank_synced_at: syncedAt,
      })
      .eq("id", userId);
  } catch (err) {
    console.error("[rank-sync] OpenDota fetch failed:", err);
  }

  let cs2PremierRating: number | null = null;
  let cs2CompetitiveRank: number | null = null;
  try {
    const cs2 = await fetchCs2RankFromLeetify(steamId64);
    cs2PremierRating = cs2.premierRating;
    cs2CompetitiveRank = cs2.competitiveRank;
    await service
      .from("profiles")
      .update({
        cs2_premier_rating: cs2.premierRating,
        cs2_competitive_rank: cs2.competitiveRank,
        cs2_rank_synced_at: syncedAt,
      })
      .eq("id", userId);
  } catch (err) {
    console.error("[rank-sync] Leetify fetch failed:", err);
  }

  return { dotaRankTier, dotaLeaderboardRank, cs2PremierRating, cs2CompetitiveRank };
}

export interface SyncedValorantRank {
  tier: string | null;
  rr: number | null;
  elo: number | null;
  syncedAt: string;
}

// Valorant isn't tied to the Steam connection — a player enters their own
// Riot ID (see connectRiotAccount), so this is triggered separately, not
// as part of syncRanksForSteamId. Throws on failure (unlike the Steam-based
// sync above) since it's only ever called for one game at a time, so the
// caller can surface a real error instead of silently doing nothing.
export async function syncValorantRank(
  userId: string,
  name: string,
  tag: string,
  region: string,
): Promise<SyncedValorantRank> {
  const rank = await fetchValorantRank(name, tag, region);
  const syncedAt = new Date().toISOString();

  const service = createServiceClient();
  await service
    .from("profiles")
    .update({
      valorant_tier: rank.tier,
      valorant_rr: rank.rr,
      valorant_elo: rank.elo,
      valorant_rank_synced_at: syncedAt,
    })
    .eq("id", userId);

  return { ...rank, syncedAt };
}
