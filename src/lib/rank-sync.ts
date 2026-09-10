import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchDotaRankFromOpenDota, fetchDotaHeroStats } from "@/lib/steam";
import { fetchCs2RankFromLeetify } from "@/lib/leetify";
import { fetchValorantRank, fetchValorantMatches } from "@/lib/henrikdev";
import { fetchValorantTierIcon, fetchValorantAgentIcon } from "@/lib/valorant-content";
import { fetchDotaHeroInfo } from "@/lib/dota-heroes";
import type { Database } from "@/lib/supabase/types";

// How many of the player's most recent Valorant matches HenrikDev returns
// per sync — HenrikDev has no all-time per-agent aggregate endpoint or
// bulk history pull (unlike OpenDota's /heroes for Dota), so this batch
// gets appended to match_history each sync (see the Valorant block in
// syncValorantRank below) rather than treated as the whole picture.
const VALORANT_MATCH_FETCH_SIZE = 10;

type TopHeroStatsInsert = Database["public"]["Tables"]["top_hero_stats"]["Insert"];
type MatchHistoryInsert = Database["public"]["Tables"]["match_history"]["Insert"];

async function upsertTopHeroStat(
  service: SupabaseClient<Database>,
  row: TopHeroStatsInsert,
) {
  await service
    .from("top_hero_stats")
    .upsert(row, { onConflict: "profile_id,game_slug" });
}

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

  // Most-played hero — a separate OpenDota endpoint from the rank fetch
  // above, so it's wrapped independently: a failure here shouldn't discard
  // the rank data that already succeeded. Uses OpenDota's own all-time
  // per-hero totals rather than a sample of recent matches, so it stays
  // accurate for accounts with a long match history.
  try {
    const heroStats = await fetchDotaHeroStats(steamId64);
    const topHero = heroStats.reduce<(typeof heroStats)[number] | null>(
      (best, entry) => (!best || entry.games > best.games ? entry : best),
      null,
    );
    if (topHero && topHero.games > 0) {
      const hero = await fetchDotaHeroInfo(topHero.heroId).catch(() => null);
      if (hero) {
        await upsertTopHeroStat(service, {
          profile_id: userId,
          game_slug: "dota-2",
          character_name: hero.name,
          character_icon_url: hero.iconUrl,
          games_played: topHero.games,
          wins: topHero.wins,
          synced_at: syncedAt,
        });
      }
    }
  } catch (err) {
    console.error("[rank-sync] OpenDota hero stats fetch failed:", err);
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

  // Most-played agent, same best-effort treatment as the icon above — a
  // failure here shouldn't fail the whole "connect Riot ID" action.
  // HenrikDev has no all-time per-agent aggregate endpoint or bulk history
  // pull, so true "all acts" stats aren't available in one request. Instead,
  // each sync's batch of recent matches is appended to match_history
  // (deduped by external_match_id, so re-syncing the same matches is a
  // no-op) and the top agent is recomputed over everything accumulated so
  // far — the count converges toward real all-time stats the more often a
  // player refreshes, the same way a tracker site builds up its numbers
  // from repeated ingestion rather than a single bulk pull.
  try {
    const matches = await fetchValorantMatches(name, tag, region, VALORANT_MATCH_FETCH_SIZE);
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

    const { data: allMatches } = await service
      .from("match_history")
      .select("character_name, character_icon_url, won")
      .eq("profile_id", userId)
      .eq("game_slug", "valorant")
      .not("character_name", "is", null);

    const byAgent = new Map<
      string,
      { games: number; wins: number; iconUrl: string | null }
    >();
    for (const row of allMatches ?? []) {
      if (!row.character_name) continue;
      const entry = byAgent.get(row.character_name) ?? {
        games: 0,
        wins: 0,
        iconUrl: null,
      };
      entry.games += 1;
      if (row.won) entry.wins += 1;
      entry.iconUrl ??= row.character_icon_url;
      byAgent.set(row.character_name, entry);
    }

    let topAgent:
      | { name: string; games: number; wins: number; iconUrl: string | null }
      | null = null;
    for (const [agentName, stat] of byAgent) {
      if (!topAgent || stat.games > topAgent.games) {
        topAgent = { name: agentName, ...stat };
      }
    }

    if (topAgent) {
      await upsertTopHeroStat(service, {
        profile_id: userId,
        game_slug: "valorant",
        character_name: topAgent.name,
        character_icon_url: topAgent.iconUrl,
        games_played: topAgent.games,
        wins: topAgent.wins,
        synced_at: syncedAt,
      });
    }
  } catch (err) {
    console.error("[rank-sync] HenrikDev match history fetch failed:", err);
  }

  return { tier: rank.tierName, tierIcon, rr: rank.rr, elo: rank.elo, syncedAt };
}
