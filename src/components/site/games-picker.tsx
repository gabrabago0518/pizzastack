"use client";

import * as React from "react";

import { toggleProfileGame } from "@/app/profile/actions";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/supabase/types";

export function GamesPicker({
  allGames,
  initialSelectedIds,
}: {
  allGames: Game[];
  initialSelectedIds: string[];
}) {
  const [selectedIds, setSelectedIds] = React.useState(
    () => new Set(initialSelectedIds),
  );
  const [isPending, startTransition] = React.useTransition();

  function handleToggle(gameId: string) {
    const willSelect = !selectedIds.has(gameId);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (willSelect) next.add(gameId);
      else next.delete(gameId);
      return next;
    });

    startTransition(async () => {
      const result = await toggleProfileGame(gameId, willSelect);
      if (result.error) {
        // revert on failure
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (willSelect) next.delete(gameId);
          else next.add(gameId);
          return next;
        });
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allGames.map((game) => {
        const active = selectedIds.has(game.id);
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => handleToggle(game.id)}
            disabled={isPending}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {game.name}
          </button>
        );
      })}
    </div>
  );
}
