import type { ReactNode } from "react";
import Link from "next/link";

import { AvatarDisplay } from "@/components/site/avatar-display";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { ValorantRankIcon } from "@/components/site/valorant-rank-icon";
import { MlbbRankIcon } from "@/components/site/mlbb-rank-icon";
import { MlbbRankLabel } from "@/components/site/mlbb-rank-label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatCs2Rank } from "@/lib/cs2-rank";
import { formatValorantRank } from "@/lib/valorant-rank";
import type { MlbbRankTier } from "@/lib/mlbb-rank";

export interface PlayerMiniProfileData {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  dota_rank_tier: number | null;
  dota_leaderboard_rank: number | null;
  cs2_premier_rating: number | null;
  cs2_competitive_rank: number | null;
  valorant_tier: string | null;
  valorant_tier_icon: string | null;
  mlbb_rank_tier: MlbbRankTier | null;
  mlbb_sub_rank: number | null;
  mlbb_highest_star: number | null;
}

// Same game -> rank mapping as formatGameAccountId (lib/account-id.ts) —
// only the listing's own game is relevant here, since a rank in some other
// game the player happens to also have synced isn't what the person they're
// partying with in *this* listing cares about.
function getGameRank(gameSlug: string | null | undefined, profile: PlayerMiniProfileData) {
  switch (gameSlug) {
    case "dota-2":
      return profile.dota_rank_tier
        ? {
            game: "Dota 2",
            icon: <DotaRankIcon rankTier={profile.dota_rank_tier} className="size-6 shrink-0" />,
            rankLabel: formatDotaRank(profile.dota_rank_tier, profile.dota_leaderboard_rank),
          }
        : null;
    case "cs2":
      return profile.cs2_premier_rating || profile.cs2_competitive_rank
        ? {
            game: "Counter-Strike 2",
            icon: null,
            rankLabel: formatCs2Rank(profile.cs2_premier_rating, profile.cs2_competitive_rank),
          }
        : null;
    case "valorant":
      return profile.valorant_tier
        ? {
            game: "Valorant",
            icon: (
              <ValorantRankIcon iconUrl={profile.valorant_tier_icon} className="size-6 shrink-0" />
            ),
            rankLabel: formatValorantRank(profile.valorant_tier),
          }
        : null;
    case "mobile-legends":
      return profile.mlbb_rank_tier
        ? {
            game: "Mobile Legends",
            icon: (
              <MlbbRankIcon
                tier={profile.mlbb_rank_tier}
                highestStar={profile.mlbb_highest_star}
                className="size-6 shrink-0"
              />
            ),
            rankLabel: (
              <MlbbRankLabel
                tier={profile.mlbb_rank_tier}
                subRank={profile.mlbb_sub_rank}
                highestStar={profile.mlbb_highest_star}
              />
            ),
          }
        : null;
    default:
      return null;
  }
}

// A quick "who is this" on hover, without leaving the listing — avatar,
// display name/username, and their rank in the listing's own game (not
// every game they've synced — the game this party is actually for is the
// only rank relevant here), with a link through to their full profile for
// the rest.
export function PlayerMiniProfile({
  profile,
  gameSlug,
  children,
}: {
  profile: PlayerMiniProfileData;
  gameSlug?: string | null;
  children: ReactNode;
}) {
  const label = profile.display_name || profile.username;
  const rank = getGameRank(gameSlug, profile);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-center gap-3">
          <AvatarDisplay url={profile.avatar_url} label={label} className="size-10" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{label}</span>
            <span className="truncate text-sm text-muted-foreground">
              @{profile.username}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-sm">
          {rank ? (
            <>
              {rank.icon}
              <span className="text-muted-foreground">{rank.game}</span>
              <span className="ml-auto font-medium">{rank.rankLabel}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No rank in this game yet.</span>
          )}
        </div>

        <Link
          href={`/players/${profile.username}`}
          className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
        >
          View full profile
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}
