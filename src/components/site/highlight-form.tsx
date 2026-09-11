"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { uploadHighlight, type HighlightFormState } from "@/app/highlights/actions";
import type { Game } from "@/lib/supabase/types";

export function HighlightForm({ games }: { games: Game[] }) {
  const [state, formAction, isPending] = useActionState<HighlightFormState, FormData>(
    uploadHighlight,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video">Video</Label>
        <Input id="video" name="video" type="file" accept="video/mp4,video/webm,video/quicktime" required />
        <p className="text-xs text-muted-foreground">MP4, WEBM, or MOV, up to 50MB.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={100} placeholder="Pentakill in ranked" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="game_id">Game (optional)</Label>
        <SelectNative id="game_id" name="game_id" defaultValue="">
          <option value="">No specific game</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </SelectNative>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What happened in this clip?"
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
        Submit for review
      </Button>
    </form>
  );
}
