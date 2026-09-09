import { Badge } from "@/components/ui/badge";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { formatDotaRank } from "@/lib/dota-rank";

export function DotaRankBadge({
  rankTier,
  leaderboardRank,
}: {
  rankTier: number | null;
  leaderboardRank: number | null;
}) {
  if (!rankTier) return null;

  return (
    <Badge variant="secondary">
      <DotaRankIcon rankTier={rankTier} className="size-3.5" />
      {formatDotaRank(rankTier, leaderboardRank)} · Verified via Steam
    </Badge>
  );
}
