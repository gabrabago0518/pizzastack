"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { createCoachProfile, type CoachFormState } from "@/app/coaches/actions";
import { getFormVerifiedRank } from "@/lib/verified-ranks";
import type { Game } from "@/lib/supabase/types";

export function CoachForm({
  games,
  dotaRankTier,
  dotaLeaderboardRank,
  cs2PremierRating,
  cs2CompetitiveRank,
}: {
  games: Game[];
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
}) {
  const [state, formAction, isPending] = useActionState<CoachFormState, FormData>(
    createCoachProfile,
    {},
  );
  const [selectedGameId, setSelectedGameId] = React.useState("");

  const selectedGame = games.find((game) => game.id === selectedGameId);
  const verifiedRank = getFormVerifiedRank(selectedGame?.slug, {
    dotaRankTier,
    dotaLeaderboardRank,
    cs2PremierRating,
    cs2CompetitiveRank,
  });
  const blockedByUnverifiedRank = verifiedRank !== null && !verifiedRank.available;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gameId">Game</Label>
        <SelectNative
          id="gameId"
          name="gameId"
          required
          value={selectedGameId}
          onChange={(event) => setSelectedGameId(event.target.value)}
        >
          <option value="" disabled>
            Select a game
          </option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </SelectNative>
      </div>

      {verifiedRank ? (
        <div className="flex flex-col gap-1.5">
          <Label>Verified rank</Label>
          <div className="flex h-9 items-center gap-1.5 rounded-lg border border-input bg-muted/40 px-3.5 text-sm">
            {verifiedRank.available ? (
              <>
                {selectedGame?.slug === "dota-2" ? (
                  <DotaRankIcon rankTier={dotaRankTier} className="size-5" />
                ) : null}
                {verifiedRank.label}
              </>
            ) : (
              <span className="text-muted-foreground">Not verified</span>
            )}
          </div>
          {blockedByUnverifiedRank ? (
            <p className="text-sm text-muted-foreground">
              Coaching for {selectedGame?.name} requires a Steam-verified rank.{" "}
              <Link
                href="/profile/settings"
                className="font-medium text-primary hover:underline"
              >
                Connect Steam
              </Link>{" "}
              and sync your rank first.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This is shown on your coach listing so players can see it&apos;s real.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          required
          placeholder="Ex-Radiant coach, 500+ VOD reviews"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">What you offer (optional)</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          placeholder="VOD reviews, aim training plans, IGL shotcalling, mental game..."
          className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateNote">Rate (optional)</Label>
          <Input id="rateNote" name="rateNote" placeholder="Free, $20/hr, DM for rates..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactMethod">Contact method</Label>
          <Input
            id="contactMethod"
            name="contactMethod"
            required
            placeholder="Discord: coach#1234"
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isPending || blockedByUnverifiedRank}
        className="mt-1 self-start"
      >
        {isPending ? <Loader2 className="animate-spin" /> : null}
        List me as a coach
      </Button>
    </form>
  );
}
