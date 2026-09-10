import { RankMedalCard } from "@/components/site/rank-medal-card";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatCs2Rank } from "@/lib/cs2-rank";

// A showcase strip of a player's verified ranks across games. Built as a
// list so adding the next game's rank later is just another entry here,
// not a redesign. Valorant isn't included here — see verified-ranks.ts
// for why.
export function RankBanner({
  dotaRankTier,
  dotaLeaderboardRank,
  cs2PremierRating,
  cs2CompetitiveRank,
}: {
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
}) {
  const hasCs2Rank = Boolean(cs2PremierRating || cs2CompetitiveRank);
  if (!dotaRankTier && !hasCs2Rank) return null;

  return (
    <div className="mb-10 flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Verified ranks
      </h2>
      <div className="flex flex-wrap gap-3">
        {dotaRankTier ? (
          <RankMedalCard
            game="Dota 2"
            rankLabel={formatDotaRank(dotaRankTier, dotaLeaderboardRank)}
            sourceLabel="Verified via Steam"
            icon={<DotaRankIcon rankTier={dotaRankTier} className="size-16 shrink-0 drop-shadow-md" />}
          />
        ) : null}
        {hasCs2Rank ? (
          <RankMedalCard
            game="Counter-Strike 2"
            rankLabel={formatCs2Rank(cs2PremierRating, cs2CompetitiveRank)}
            sourceLabel="Verified via Steam"
          />
        ) : null}
      </div>
    </div>
  );
}
