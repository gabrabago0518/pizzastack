"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { createScrimmage, type ScrimmageFormState } from "@/app/scrims/actions";
import { REGIONS } from "@/lib/regions";
import type { Game } from "@/lib/supabase/types";

export function ScrimmageForm({ games }: { games: Game[] }) {
  const [state, formAction, isPending] = useActionState<ScrimmageFormState, FormData>(
    createScrimmage,
    {},
  );
  // <input type="datetime-local"> has no timezone of its own — its value
  // only makes sense read back in the browser's own timezone, so the
  // ISO instant sent to the server is computed here (client-side, where
  // "local" correctly means the poster's timezone) rather than trusting
  // the server to guess what timezone a bare "2026-09-15T19:00" meant.
  const [scheduledLocal, setScheduledLocal] = React.useState("");
  const scheduledAtIso = scheduledLocal ? new Date(scheduledLocal).toISOString() : "";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gameId">Game</Label>
          <SelectNative id="gameId" name="gameId" required defaultValue="">
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
          <Label htmlFor="region">Region</Label>
          <SelectNative id="region" name="region" defaultValue="">
            <option value="">Any region</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </SelectNative>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scheduledAtLocal">When</Label>
          <Input
            id="scheduledAtLocal"
            type="datetime-local"
            required
            value={scheduledLocal}
            onChange={(event) => setScheduledLocal(event.target.value)}
          />
          <input type="hidden" name="scheduledAt" value={scheduledAtIso} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Your team/rank, format (Bo1/Bo3), server, Discord — anything the other team should know."
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
        Post scrim
      </Button>
    </form>
  );
}
