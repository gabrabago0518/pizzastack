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
import { createLfgPost, type LfgFormState } from "@/app/teammates/actions";
import { REGIONS } from "@/lib/regions";
import { RANKS_BY_GAME, FALLBACK_RANKS, PLAYERS_NEEDED_OPTIONS } from "@/lib/ranks";
import { ROLES_BY_GAME, FALLBACK_ROLES } from "@/lib/roles";
import { MODES_BY_GAME, FALLBACK_MODES } from "@/lib/modes";
import { getFormVerifiedRank } from "@/lib/verified-ranks";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/supabase/types";

function RolesPicker({ options, disabled }: { options: string[]; disabled: boolean }) {
  const [selected, setSelected] = React.useState<string[]>([]);

  function toggleRole(role: string) {
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name="rolesNeeded" value={selected.join(",")} />
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">Select a game first</p>
      ) : (
        options.map((role) => {
          const active = selected.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              disabled={disabled}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {role}
            </button>
          );
        })
      )}
    </div>
  );
}

export function LfgForm({
  games,
  dotaRankTier,
  dotaLeaderboardRank,
  cs2PremierRating,
  cs2CompetitiveRank,
  valorantTier,
  valorantRr,
}: {
  games: Game[];
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
  valorantTier: string | null;
  valorantRr: number | null;
}) {
  const [state, formAction, isPending] = useActionState<LfgFormState, FormData>(
    createLfgPost,
    {},
  );
  const [selectedGameId, setSelectedGameId] = React.useState("");

  const selectedGame = games.find((game) => game.id === selectedGameId);
  const verifiedRank = getFormVerifiedRank(selectedGame?.slug, {
    dotaRankTier,
    dotaLeaderboardRank,
    cs2PremierRating,
    cs2CompetitiveRank,
    valorantTier,
    valorantRr,
  });
  const modeOptions = selectedGame
    ? (MODES_BY_GAME[selectedGame.slug] ?? FALLBACK_MODES)
    : [];
  const rankOptions = selectedGame
    ? (RANKS_BY_GAME[selectedGame.slug] ?? FALLBACK_RANKS)
    : [];
  const roleOptions = selectedGame
    ? (ROLES_BY_GAME[selectedGame.slug] ?? FALLBACK_ROLES)
    : [];
  const blockedByUnverifiedRank = verifiedRank !== null && !verifiedRank.available;

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
          <Label htmlFor="mode">Mode</Label>
          <SelectNative
            key={selectedGameId}
            id="mode"
            name="mode"
            required
            disabled={!selectedGame}
            defaultValue=""
          >
            <option value="" disabled>
              {selectedGame ? "Select a mode" : "Select a game first"}
            </option>
            {modeOptions.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </SelectNative>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rank">Rank</Label>
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
                <span className="text-muted-foreground">Not verified</span>
              )}
            </div>
          ) : (
            <SelectNative
              key={selectedGameId}
              id="rank"
              name="rank"
              required
              disabled={!selectedGame}
              defaultValue=""
            >
              <option value="" disabled>
                {selectedGame ? "Select a rank" : "Select a game first"}
              </option>
              {rankOptions.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </SelectNative>
          )}
        </div>
      </div>

      {blockedByUnverifiedRank ? (
        <p className="rounded-lg bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
          {selectedGame?.name} rank is pulled from your{" "}
          {selectedGame?.slug === "valorant" ? "connected Riot ID" : "connected Steam account"}.{" "}
          <Link href="/profile/settings" className="font-medium text-primary hover:underline">
            {selectedGame?.slug === "valorant" ? "Connect your Riot ID" : "Connect Steam"}
          </Link>{" "}
          and sync your rank before posting.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Need a 5th for ranked grind tonight"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What are you looking for? Playstyle, availability, voice chat, etc."
          className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Roles needed (optional)</Label>
        <RolesPicker key={selectedGameId} options={roleOptions} disabled={!selectedGame} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="playersNeeded">Players needed</Label>
          <SelectNative id="playersNeeded" name="playersNeeded" required defaultValue="">
            <option value="" disabled>
              How many?
            </option>
            {PLAYERS_NEEDED_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </SelectNative>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="region">Region</Label>
          <SelectNative id="region" name="region" required defaultValue="">
            <option value="" disabled>
              Select a region
            </option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </SelectNative>
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
        Post listing
      </Button>
    </form>
  );
}
