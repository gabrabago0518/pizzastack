"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/supabase/actions";
import type { Game } from "@/lib/supabase/types";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  games?: Game[];
}

export function AuthForm({ mode, action, games }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mode === "signup" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={20}
            placeholder="frag_master"
            autoComplete="username"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>

      {mode === "signup" && games && games.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Label>Games you play (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {games.map((game) => (
              <div key={game.id}>
                <input
                  type="checkbox"
                  id={`signup-game-${game.id}`}
                  name="gameIds"
                  value={game.id}
                  className="peer sr-only"
                />
                <label
                  htmlFor={`signup-game-${game.id}`}
                  className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-150 select-none hover:scale-[1.04] hover:text-foreground active:scale-[0.97] peer-checked:border-transparent peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
                >
                  {game.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="rounded-lg bg-secondary/10 px-3 py-2 text-sm text-secondary">
          {state.info}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="mt-1">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
