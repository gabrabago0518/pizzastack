import { RankMedalCard } from "@/components/site/rank-medal-card";
import { formatDotaRank } from "@/lib/dota-rank";

// A showcase strip of a player's verified ranks across games. Only Dota 2
// has a verification source today, so this renders at most one card — but
// it's built as a list so adding the next game (League, Valorant, ...) is
// just another entry, not a redesign.
export function RankBanner({
  dotaRankTier,
  dotaLeaderboardRank,
}: {
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
}) {
  if (!dotaRankTier) return null;

  return (
    <div className="mb-10 flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Verified ranks
      </h2>
      <div className="flex flex-wrap gap-3">
        <RankMedalCard
          game="Dota 2"
          rankTier={dotaRankTier}
          rankLabel={formatDotaRank(dotaRankTier, dotaLeaderboardRank)}
        />
      </div>
    </div>
  );
}
