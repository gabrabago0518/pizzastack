import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchDotaRankFromOpenDota, fetchDotaMatches } from "@/lib/steam";
import { fetchCs2RankFromLeetify } from "@/lib/leetify";
import { fetchValorantRank, fetchValorantMatches } from "@/lib/henrikdev";
import { fetchValorantTierIcon, fetchValorantAgentIcon } from "@/lib/valorant-content";
import { fetchDotaHeroInfo } from "@/lib/dota-heroes";
import type { Database } from "@/lib/supabase/types";

const MATCH_HISTORY_LIMIT = 10;

type MatchHistoryInsert = Database["public"]["Tables"]["match_history"]["Insert"];

async function upsertMatchHistory(
  service: SupabaseClient<Database>,
  rows: MatchHistoryInsert[],
) {
  if (rows.length === 0) return;
  await service
    .from("match_history")
    .upsert(rows, { onConflict: "profile_id,game_slug,external_match_id" });
}

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

  // Recent match history — a separate OpenDota endpoint from the rank
  // fetch above, so it's wrapped independently: a failure here shouldn't
  // discard the rank data that already succeeded.
  try {
    const matches = await fetchDotaMatches(steamId64, MATCH_HISTORY_LIMIT);
    const rows = await Promise.all(
      matches.map(async (match): Promise<MatchHistoryInsert> => {
        const hero = await fetchDotaHeroInfo(match.heroId).catch(() => null);
        return {
          profile_id: userId,
          game_slug: "dota-2",
          external_match_id: match.matchId,
          played_at: new Date(match.startTime * 1000).toISOString(),
          won: match.won,
          character_name: hero?.name ?? null,
          character_icon_url: hero?.iconUrl ?? null,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          duration_seconds: match.duration,
        };
      }),
    );
    await upsertMatchHistory(service, rows);
  } catch (err) {
    console.error("[rank-sync] OpenDota match history fetch failed:", err);
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
  tierIcon: string | null;
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

  // Icon resolution is best-effort — a failure here shouldn't lose the
  // rank data itself, since the icon can simply be re-resolved next sync.
  let tierIcon: string | null = null;
  try {
    tierIcon = await fetchValorantTierIcon(rank.tierId);
  } catch (err) {
    console.error("[rank-sync] valorant-api.com icon fetch failed:", err);
  }

  const service = createServiceClient();
  await service
    .from("profiles")
    .update({
      valorant_tier: rank.tierName,
      valorant_tier_icon: tierIcon,
      valorant_rr: rank.rr,
      valorant_elo: rank.elo,
      valorant_rank_synced_at: syncedAt,
    })
    .eq("id", userId);

  // Recent match history, same best-effort treatment as the icon above —
  // a failure here shouldn't fail the whole "connect Riot ID" action.
  try {
    const matches = await fetchValorantMatches(name, tag, region, MATCH_HISTORY_LIMIT);
    const rows = await Promise.all(
      matches.map(async (match): Promise<MatchHistoryInsert> => ({
        profile_id: userId,
        game_slug: "valorant",
        external_match_id: match.matchId,
        played_at: match.playedAt,
        won: match.won,
        character_name: match.agentName,
        character_icon_url: await fetchValorantAgentIcon(match.agentName).catch(() => null),
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        map_name: match.mapName,
        mode: match.mode,
      })),
    );
    await upsertMatchHistory(service, rows);
  } catch (err) {
    console.error("[rank-sync] HenrikDev match history fetch failed:", err);
  }

  return { tier: rank.tierName, tierIcon, rr: rank.rr, elo: rank.elo, syncedAt };
}
