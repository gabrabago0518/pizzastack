"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { completeOnboarding, type OnboardingFormState } from "@/app/onboarding/actions";
import type { Game } from "@/lib/supabase/types";

export function OnboardingGamesForm({ games }: { games: Game[] }) {
  const [state, formAction, isPending] = useActionState<OnboardingFormState, FormData>(
    completeOnboarding,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {games.map((game) => (
          <div key={game.id}>
            <input
              type="checkbox"
              id={`onboarding-game-${game.id}`}
              name="gameIds"
              value={game.id}
              className="peer sr-only"
            />
            <label
              htmlFor={`onboarding-game-${game.id}`}
              className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-150 select-none hover:scale-[1.04] hover:text-foreground active:scale-[0.97] peer-checked:border-transparent peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
            >
              {game.name}
            </label>
          </div>
        ))}
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="self-start">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        Continue
      </Button>
    </form>
  );
}
