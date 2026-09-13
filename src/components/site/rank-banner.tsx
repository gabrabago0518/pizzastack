import { RankMedalCard } from "@/components/site/rank-medal-card";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { ValorantRankIcon } from "@/components/site/valorant-rank-icon";
import { MlbbRankLabel } from "@/components/site/mlbb-rank-label";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatCs2Rank } from "@/lib/cs2-rank";
import { formatValorantRank } from "@/lib/valorant-rank";
import type { MlbbRankTier } from "@/lib/mlbb-rank";

// A showcase strip of a player's ranks across games. Built as a list so
// adding the next game's rank later is just another entry here, not a
// redesign. Valorant is included but each card states its own trust level
// via sourceLabel rather than the section claiming every entry is
// "verified" — Dota/CS2 are proven via Steam OpenID, Valorant's rank value
// is real (from HenrikDev) but its identity is a self-entered Riot ID, per
// verified-ranks.ts.
// Renders "1,234 matches · 567 hrs played" once both career-totals fields
// have synced. Either alone (a partial sync, or a very new account with
// 0 hours rounding down) still reads fine, so this degrades gracefully
// rather than requiring both.
function formatDotaStatLine(totalMatches: number | null, hoursPlayed: number | null): string | undefined {
  const parts: string[] = [];
  if (totalMatches !== null) parts.push(`${totalMatches.toLocaleString()} matches`);
  if (hoursPlayed !== null) parts.push(`${hoursPlayed.toLocaleString()} hrs played`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function RankBanner({
  dotaRankTier,
  dotaLeaderboardRank,
  dotaTotalMatches,
  dotaHoursPlayed,
  cs2PremierRating,
  cs2CompetitiveRank,
  valorantTier,
  valorantTierIcon,
  mlbbRankTier,
  mlbbSubRank,
  mlbbHighestStar,
}: {
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  dotaTotalMatches?: number | null;
  dotaHoursPlayed?: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
  valorantTier?: string | null;
  valorantTierIcon?: string | null;
  mlbbRankTier?: MlbbRankTier | null;
  mlbbSubRank?: number | null;
  mlbbHighestStar?: number | null;
}) {
  const hasCs2Rank = Boolean(cs2PremierRating || cs2CompetitiveRank);
  const hasValorantRank = Boolean(valorantTier);
  const hasMlbbRank = Boolean(mlbbRankTier);
  if (!dotaRankTier && !hasCs2Rank && !hasValorantRank && !hasMlbbRank) return null;

  return (
    <div className="mb-10 flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Ranks
      </h2>
      <div className="flex flex-wrap gap-3">
        {dotaRankTier ? (
          <RankMedalCard
            game="Dota 2"
            rankLabel={formatDotaRank(dotaRankTier, dotaLeaderboardRank)}
            sourceLabel="Verified via Steam"
            statLine={formatDotaStatLine(dotaTotalMatches ?? null, dotaHoursPlayed ?? null)}
            icon={<DotaRankIcon rankTier={dotaRankTier} className="size-16 shrink-0 drop-shadow-md" />}
          />
        ) : null}
        {hasCs2Rank ? (
          <RankMedalCard
            game="Counter-Strike 2"
            rankLabel={formatCs2Rank(cs2PremierRating, cs2CompetitiveRank)}
            sourceLabel="Verified via Steam"
            leetifyAttribution
          />
        ) : null}
        {hasValorantRank ? (
          <RankMedalCard
            game="Valorant"
            rankLabel={formatValorantRank(valorantTier ?? null)}
            sourceLabel="Via Riot ID"
            icon={<ValorantRankIcon iconUrl={valorantTierIcon ?? null} className="size-16 shrink-0 drop-shadow-md" />}
          />
        ) : null}
        {hasMlbbRank ? (
          <RankMedalCard
            game="Mobile Legends: Bang Bang"
            rankLabel={
              <MlbbRankLabel
                tier={mlbbRankTier ?? null}
                subRank={mlbbSubRank ?? null}
                highestStar={mlbbHighestStar ?? null}
              />
            }
            sourceLabel="Verified by admin"
          />
        ) : null}
      </div>
    </div>
  );
}
