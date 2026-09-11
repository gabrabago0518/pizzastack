"use client";

import { useState, useActionState } from "react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/supabase/actions";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Controlled fields so a failed submission only clears the field that
  // was actually wrong (per errorField) instead of React's default form
  // action behavior, which resets every uncontrolled field on completion.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.errorField === "username") setUsername("");
    if (state.errorField === "email") setEmail("");
    if (state.errorField === "password") setPassword("");
  }

  if (mode === "signup" && state.info) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <Mail className="size-6" />
        </span>
        <h2 className="font-display text-lg">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          {state.email ? (
            <span className="font-medium text-foreground">{state.email}</span>
          ) : (
            "your email"
          )}
          . Click it to verify your account, then log in below.
        </p>
      </div>
    );
  }

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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="mt-1">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
