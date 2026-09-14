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

// A quick "who is this" on hover, without leaving the listing — same rank
// data as the full RankBanner on /players/[username], condensed to one
// line per game instead of a card grid, since this only has hover-card
// width to work with.
export function PlayerMiniProfile({
  profile,
  children,
}: {
  profile: PlayerMiniProfileData;
  children: ReactNode;
}) {
  const hasCs2Rank = Boolean(profile.cs2_premier_rating || profile.cs2_competitive_rank);
  const hasValorantRank = Boolean(profile.valorant_tier);
  const hasMlbbRank = Boolean(profile.mlbb_rank_tier);
  const hasAnyRank =
    Boolean(profile.dota_rank_tier) || hasCs2Rank || hasValorantRank || hasMlbbRank;
  const label = profile.display_name || profile.username;

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

        <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
          {hasAnyRank ? (
            <>
              {profile.dota_rank_tier ? (
                <div className="flex items-center gap-2 text-sm">
                  <DotaRankIcon rankTier={profile.dota_rank_tier} className="size-6 shrink-0" />
                  <span className="text-muted-foreground">Dota 2</span>
                  <span className="ml-auto font-medium">
                    {formatDotaRank(profile.dota_rank_tier, profile.dota_leaderboard_rank)}
                  </span>
                </div>
              ) : null}
              {hasCs2Rank ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Counter-Strike 2</span>
                  <span className="ml-auto font-medium">
                    {formatCs2Rank(profile.cs2_premier_rating, profile.cs2_competitive_rank)}
                  </span>
                </div>
              ) : null}
              {hasValorantRank ? (
                <div className="flex items-center gap-2 text-sm">
                  <ValorantRankIcon
                    iconUrl={profile.valorant_tier_icon}
                    className="size-6 shrink-0"
                  />
                  <span className="text-muted-foreground">Valorant</span>
                  <span className="ml-auto font-medium">
                    {formatValorantRank(profile.valorant_tier)}
                  </span>
                </div>
              ) : null}
              {hasMlbbRank ? (
                <div className="flex items-center gap-2 text-sm">
                  <MlbbRankIcon
                    tier={profile.mlbb_rank_tier}
                    highestStar={profile.mlbb_highest_star}
                    className="size-6 shrink-0"
                  />
                  <span className="text-muted-foreground">Mobile Legends</span>
                  <span className="ml-auto font-medium">
                    <MlbbRankLabel
                      tier={profile.mlbb_rank_tier}
                      subRank={profile.mlbb_sub_rank}
                      highestStar={profile.mlbb_highest_star}
                    />
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No ranks yet.</p>
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
