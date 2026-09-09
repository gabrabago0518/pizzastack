import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatCs2Rank } from "@/lib/cs2-rank";
import { formatValorantRank } from "@/lib/valorant-rank";

export const VERIFIED_RANK_GAME_SLUGS = ["dota-2", "cs2", "valorant"] as const;

export type VerifiedRankResult =
  | { rank: string; rankTier: number | null }
  | { error: string };

// Looks up the signed-in user's verified rank for a game (from their
// server-fetched profile data — never trusting client input) and formats
// it. actionLabel completes the connect-first error message — e.g.
// "posting a Dota 2 listing" or "coaching CS2".
export async function resolveVerifiedRank(
  supabase: SupabaseClient<Database>,
  userId: string,
  gameSlug: string,
  actionLabel: string,
): Promise<VerifiedRankResult> {
  if (gameSlug === "dota-2") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("dota_rank_tier, dota_leaderboard_rank")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.dota_rank_tier) {
      return { error: `Connect your Steam account and sync your rank before ${actionLabel}.` };
    }
    return {
      rank: formatDotaRank(profile.dota_rank_tier, profile.dota_leaderboard_rank),
      rankTier: profile.dota_rank_tier,
    };
  }

  if (gameSlug === "cs2") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("cs2_premier_rating, cs2_competitive_rank")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.cs2_premier_rating && !profile?.cs2_competitive_rank) {
      return { error: `Connect your Steam account and sync your rank before ${actionLabel}.` };
    }
    return {
      rank: formatCs2Rank(profile.cs2_premier_rating, profile.cs2_competitive_rank),
      rankTier: null,
    };
  }

  if (gameSlug === "valorant") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("valorant_tier, valorant_rr")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.valorant_tier) {
      return { error: `Connect your Riot ID and sync your rank before ${actionLabel}.` };
    }
    return {
      rank: formatValorantRank(profile.valorant_tier, profile.valorant_rr),
      rankTier: null,
    };
  }

  return { error: "Unsupported game for verified rank." };
}

export interface FormVerifiedRankInputs {
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
  valorantTier: string | null;
  valorantRr: number | null;
}

export interface FormVerifiedRank {
  available: boolean;
  label: string;
}

// Client-side counterpart to resolveVerifiedRank, for the LFG/coach forms:
// given rank data already loaded for the page (no DB query here), decides
// what to show for the selected game. Returns null for a game with no
// verification source, so the caller falls back to manual entry.
export function getFormVerifiedRank(
  gameSlug: string | undefined,
  inputs: FormVerifiedRankInputs,
): FormVerifiedRank | null {
  if (gameSlug === "dota-2") {
    return {
      available: Boolean(inputs.dotaRankTier),
      label: formatDotaRank(inputs.dotaRankTier, inputs.dotaLeaderboardRank),
    };
  }
  if (gameSlug === "cs2") {
    return {
      available: Boolean(inputs.cs2PremierRating || inputs.cs2CompetitiveRank),
      label: formatCs2Rank(inputs.cs2PremierRating, inputs.cs2CompetitiveRank),
    };
  }
  if (gameSlug === "valorant") {
    return {
      available: Boolean(inputs.valorantTier),
      label: formatValorantRank(inputs.valorantTier, inputs.valorantRr),
    };
  }
  return null;
}
