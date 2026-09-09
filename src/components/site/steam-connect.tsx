"use client";

import * as React from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RankMedalCard } from "@/components/site/rank-medal-card";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatCs2Rank } from "@/lib/cs2-rank";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_MESSAGES: Record<string, { text: string; error?: boolean }> = {
  connected: { text: "Steam connected — syncing your ranks." },
  invalid: { text: "Steam sign-in couldn't be verified. Try again.", error: true },
  taken: { text: "That Steam account is already linked to another profile.", error: true },
  error: { text: "Something went wrong connecting Steam. Try again.", error: true },
};

interface SteamConnectProps {
  connected: boolean;
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
  syncedAt: string | null;
  statusParam?: string;
}

export function SteamConnect({
  connected,
  dotaRankTier: initialDotaRankTier,
  dotaLeaderboardRank: initialDotaLeaderboardRank,
  cs2PremierRating: initialCs2PremierRating,
  cs2CompetitiveRank: initialCs2CompetitiveRank,
  syncedAt: initialSyncedAt,
  statusParam,
}: SteamConnectProps) {
  const [dotaRankTier, setDotaRankTier] = React.useState(initialDotaRankTier);
  const [dotaLeaderboardRank, setDotaLeaderboardRank] = React.useState(
    initialDotaLeaderboardRank,
  );
  const [cs2PremierRating, setCs2PremierRating] = React.useState(initialCs2PremierRating);
  const [cs2CompetitiveRank, setCs2CompetitiveRank] = React.useState(
    initialCs2CompetitiveRank,
  );
  const [syncedAt, setSyncedAt] = React.useState(initialSyncedAt);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const status = statusParam ? STATUS_MESSAGES[statusParam] : undefined;

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/steam/refresh-rank", { method: "POST" });
      const result = (await response.json()) as {
        error?: string;
        dotaRankTier?: number | null;
        dotaLeaderboardRank?: number | null;
        cs2PremierRating?: number | null;
        cs2CompetitiveRank?: number | null;
        syncedAt?: string;
      };
      if (result.error) {
        setError(result.error);
        return;
      }
      setDotaRankTier(result.dotaRankTier ?? null);
      setDotaLeaderboardRank(result.dotaLeaderboardRank ?? null);
      setCs2PremierRating(result.cs2PremierRating ?? null);
      setCs2CompetitiveRank(result.cs2CompetitiveRank ?? null);
      setSyncedAt(result.syncedAt ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Steam account</p>
          <p className="text-sm text-muted-foreground">
            Connect Steam to verify your Dota 2 and CS2 ranks — used on your
            listings and to qualify as a coach.
          </p>
        </div>
        {connected ? (
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <ShieldCheck className="size-4" /> Connected
          </div>
        ) : (
          <Button asChild size="sm">
            <a href="/api/auth/steam/login">Connect Steam</a>
          </Button>
        )}
      </div>

      {connected ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
          <div className="flex flex-wrap gap-3">
            <RankMedalCard
              game="Dota 2"
              rankLabel={formatDotaRank(dotaRankTier, dotaLeaderboardRank)}
              icon={<DotaRankIcon rankTier={dotaRankTier} className="size-10" />}
            />
            <RankMedalCard
              game="Counter-Strike 2"
              rankLabel={formatCs2Rank(cs2PremierRating, cs2CompetitiveRank)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{syncedAt ? `Synced ${formatRelativeTime(syncedAt)}` : "Not synced yet"}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Refresh ranks
            </Button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p
          className={`text-sm ${status.error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {status.text}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
