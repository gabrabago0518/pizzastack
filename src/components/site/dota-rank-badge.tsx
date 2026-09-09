import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
      <ShieldCheck /> {formatDotaRank(rankTier, leaderboardRank)} · Verified via Steam
    </Badge>
  );
}
