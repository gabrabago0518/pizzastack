"use client";

import * as React from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RankMedalCard } from "@/components/site/rank-medal-card";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_MESSAGES: Record<string, { text: string; error?: boolean }> = {
  connected: { text: "Steam connected — your Dota 2 rank is synced." },
  invalid: { text: "Steam sign-in couldn't be verified. Try again.", error: true },
  taken: { text: "That Steam account is already linked to another profile.", error: true },
  error: { text: "Something went wrong connecting Steam. Try again.", error: true },
};

interface SteamConnectProps {
  connected: boolean;
  rankTier: number | null;
  leaderboardRank: number | null;
  syncedAt: string | null;
  statusParam?: string;
}

export function SteamConnect({
  connected,
  rankTier: initialRankTier,
  leaderboardRank: initialLeaderboardRank,
  syncedAt: initialSyncedAt,
  statusParam,
}: SteamConnectProps) {
  const [rankTier, setRankTier] = React.useState(initialRankTier);
  const [leaderboardRank, setLeaderboardRank] = React.useState(initialLeaderboardRank);
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
        rankTier?: number | null;
        leaderboardRank?: number | null;
        syncedAt?: string;
      };
      if (result.error) {
        setError(result.error);
        return;
      }
      setRankTier(result.rankTier ?? null);
      setLeaderboardRank(result.leaderboardRank ?? null);
      setSyncedAt(result.syncedAt ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Steam account</p>
          <p className="text-sm text-muted-foreground">
            Connect Steam to verify your Dota 2 rank — used on your listings and to
            qualify as a coach.
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
          <RankMedalCard
            game="Dota 2"
            rankTier={rankTier}
            rankLabel={formatDotaRank(rankTier, leaderboardRank)}
          />
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{syncedAt ? `Synced ${formatRelativeTime(syncedAt)}` : "Not synced yet"}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Refresh rank
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
