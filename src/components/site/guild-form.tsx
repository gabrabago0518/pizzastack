"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { createGuild, type GuildFormState } from "@/app/guilds/actions";
import { REGIONS } from "@/lib/regions";
import type { Game } from "@/lib/supabase/types";

export function GuildForm({ games }: { games: Game[] }) {
  const [state, formAction, isPending] = useActionState<GuildFormState, FormData>(
    createGuild,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Guild name</Label>
          <Input id="name" name="name" required placeholder="Shadow Legion" maxLength={60} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag">Tag</Label>
          <Input id="tag" name="tag" required placeholder="SDLG" maxLength={6} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What's your guild about? Who are you looking for?"
          className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gameId">Main game (optional)</Label>
          <SelectNative id="gameId" name="gameId" defaultValue="">
            <option value="">General / any game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </SelectNative>
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

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="mt-1 self-start">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        Create guild
      </Button>
    </form>
  );
}
