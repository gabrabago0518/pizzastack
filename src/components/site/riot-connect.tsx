"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { RankMedalCard } from "@/components/site/rank-medal-card";
import { ValorantRankIcon } from "@/components/site/valorant-rank-icon";
import { connectRiotAccount, type RiotFormState } from "@/app/profile/actions";
import { formatValorantRank, VALORANT_REGIONS } from "@/lib/valorant-rank";
import { formatRelativeTime } from "@/lib/utils";

interface RiotConnectProps {
  riotName: string | null;
  riotTag: string | null;
  riotRegion: string | null;
  valorantTier: string | null;
  valorantTierIcon: string | null;
  syncedAt: string | null;
}

export function RiotConnect({
  riotName,
  riotTag,
  riotRegion,
  valorantTier: initialTier,
  valorantTierIcon: initialTierIcon,
  syncedAt: initialSyncedAt,
}: RiotConnectProps) {
  const [state, formAction, isPending] = useActionState<RiotFormState, FormData>(
    connectRiotAccount,
    {},
  );
  const [tier, setTier] = React.useState(initialTier);
  const [tierIcon, setTierIcon] = React.useState(initialTierIcon);
  const [syncedAt, setSyncedAt] = React.useState(initialSyncedAt);
  const [refreshError, setRefreshError] = React.useState<string | null>(null);
  const [isRefreshing, startRefresh] = React.useTransition();

  const connected = Boolean(riotName && riotTag && riotRegion);

  function handleRefresh() {
    setRefreshError(null);
    startRefresh(async () => {
      const response = await fetch("/api/valorant/refresh-rank", { method: "POST" });
      const result = (await response.json()) as {
        error?: string;
        tier?: string | null;
        tierIcon?: string | null;
        syncedAt?: string;
      };
      if (result.error) {
        setRefreshError(result.error);
        return;
      }
      setTier(result.tier ?? null);
      setTierIcon(result.tierIcon ?? null);
      setSyncedAt(result.syncedAt ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Riot ID (Valorant)</p>
        <p className="text-sm text-muted-foreground">
          Enter your Riot ID to pull your real Valorant rank. Unlike Steam, we
          can&apos;t confirm this account is yours without a Riot login — the
          rank shown is real, but the identity isn&apos;t verified.
        </p>
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="riotName">Name</Label>
          <Input
            id="riotName"
            name="riotName"
            defaultValue={riotName ?? ""}
            placeholder="PlayerName"
            required
            className="w-36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="riotTag">Tag</Label>
          <Input
            id="riotTag"
            name="riotTag"
            defaultValue={riotTag ?? ""}
            placeholder="NA1"
            required
            className="w-24"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="riotRegion">Region</Label>
          <SelectNative
            id="riotRegion"
            name="riotRegion"
            defaultValue={riotRegion ?? ""}
            required
            className="w-40"
          >
            <option value="" disabled>
              Select
            </option>
            {VALORANT_REGIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectNative>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {connected ? "Update" : "Connect"}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      {connected ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
          <RankMedalCard
            game="Valorant"
            rankLabel={formatValorantRank(tier)}
            sourceLabel="Via Riot ID"
            icon={<ValorantRankIcon iconUrl={tierIcon} className="size-10" />}
          />
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{syncedAt ? `Synced ${formatRelativeTime(syncedAt)}` : "Not synced yet"}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Refresh rank
            </Button>
          </div>
        </div>
      ) : null}
      {refreshError ? <p className="text-sm text-destructive">{refreshError}</p> : null}
    </div>
  );
}
