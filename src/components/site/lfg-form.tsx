"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { createLfgPost, type LfgFormState } from "@/app/teammates/actions";
import { REGIONS } from "@/lib/regions";
import { RANKS_BY_GAME, FALLBACK_RANKS, PLAYERS_NEEDED_OPTIONS } from "@/lib/ranks";
import type { Game } from "@/lib/supabase/types";

export function LfgForm({ games }: { games: Game[] }) {
  const [state, formAction, isPending] = useActionState<LfgFormState, FormData>(
    createLfgPost,
    {},
  );
  const [selectedGameId, setSelectedGameId] = React.useState("");

  const selectedGame = games.find((game) => game.id === selectedGameId);
  const rankOptions = selectedGame
    ? (RANKS_BY_GAME[selectedGame.slug] ?? FALLBACK_RANKS)
    : [];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="rank">Rank</Label>
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
        </div>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rolesNeeded">Roles needed (optional)</Label>
          <Input
            id="rolesNeeded"
            name="rolesNeeded"
            placeholder="Support, IGL, Flex (comma separated)"
          />
        </div>
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="region">Region (optional)</Label>
        <SelectNative id="region" name="region" defaultValue="">
          <option value="">Select a region</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </SelectNative>
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
