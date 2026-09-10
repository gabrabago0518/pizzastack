"use client";

import * as React from "react";
import { Loader2, LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { joinTournament, leaveTournament } from "@/app/tournaments/actions";

export function TournamentJoinButton({
  tournamentId,
  isRegistered,
  isFull,
}: {
  tournamentId: string;
  isRegistered: boolean;
  isFull: boolean;
}) {
  const [registered, setRegistered] = React.useState(isRegistered);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleJoin() {
    setRegistered(true);
    setError(null);
    startTransition(async () => {
      const result = await joinTournament(tournamentId);
      if (result.error) {
        setRegistered(false);
        setError(result.error);
      }
    });
  }

  function handleLeave() {
    setRegistered(false);
    setError(null);
    startTransition(async () => {
      const result = await leaveTournament(tournamentId);
      if (result.error) {
        setRegistered(true);
        setError(result.error);
      }
    });
  }

  if (registered) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" onClick={handleLeave} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          Withdraw
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (isFull) {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Tournament full
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleJoin} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
        Join tournament
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
