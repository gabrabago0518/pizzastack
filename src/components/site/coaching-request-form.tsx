"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { createCoachingRequest, type CoachingRequestFormState } from "@/app/coaches/actions";
import { REGIONS } from "@/lib/regions";
import { RANKS_BY_GAME, FALLBACK_RANKS } from "@/lib/ranks";
import { getFormVerifiedRank } from "@/lib/verified-ranks";
import type { Game } from "@/lib/supabase/types";

export function CoachingRequestForm({
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
  const [state, formAction, isPending] = useActionState<
    CoachingRequestFormState,
    FormData
  >(createCoachingRequest, {});
  const [selectedGameId, setSelectedGameId] = React.useState("");

  const selectedGame = games.find((game) => game.id === selectedGameId);
  const rankOptions = selectedGame
    ? (RANKS_BY_GAME[selectedGame.slug] ?? FALLBACK_RANKS)
    : [];
  // Dota 2/CS2 pull rank from the player's Steam-verified profile data
  // instead of a manual pick — same source as the LFG/coach forms. Unlike
  // those, this field is optional, so an unverified account just posts
  // without a rank rather than being blocked from submitting.
  const verifiedRank = getFormVerifiedRank(selectedGame?.slug, {
    dotaRankTier,
    dotaLeaderboardRank,
    cs2PremierRating,
    cs2CompetitiveRank,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rank">Your rank</Label>
          {verifiedRank ? (
            <div className="flex h-9 items-center gap-1.5 rounded-lg border border-input bg-muted/40 px-3.5 text-sm">
              {verifiedRank.available ? (
                <>
                  {selectedGame?.slug === "dota-2" ? (
                    <DotaRankIcon rankTier={dotaRankTier} className="size-5" />
                  ) : null}
                  {verifiedRank.label}
                </>
              ) : (
                <span className="text-muted-foreground">
                  Not verified — connect Steam to show it
                </span>
              )}
            </div>
          ) : (
            <SelectNative
              key={selectedGameId}
              id="rank"
              name="rank"
              disabled={!selectedGame}
              defaultValue=""
            >
              <option value="">
                {selectedGame ? "Prefer not to say" : "Select a game first"}
              </option>
              {rankOptions.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </SelectNative>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="region">Region (optional)</Label>
          <SelectNative id="region" name="region" defaultValue="">
            <option value="">Any region</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </SelectNative>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">
          Why do you need a coach, and what do you want to learn?
        </Label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="e.g. I keep losing my lane in the laning stage and don't know how to itemize against a counter-pick. Looking for someone who can review a few replays with me."
          className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="mt-1 self-start">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        Post listing
      </Button>
    </form>
  );
}
