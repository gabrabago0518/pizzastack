"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startTournament, cancelTournament } from "@/app/tournaments/actions";

export function TournamentOrganizerControls({
  tournamentId,
  participantCount,
}: {
  tournamentId: string;
  participantCount: number;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startTournament(tournamentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel() {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await cancelTournament(tournamentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          className={confirmingCancel ? "text-destructive" : "text-muted-foreground"}
        >
          {isPending && confirmingCancel ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Ban className="size-3.5" />
          )}
          {confirmingCancel ? "Confirm cancel?" : "Cancel tournament"}
        </Button>
        <Button
          size="sm"
          onClick={handleStart}
          disabled={isPending || participantCount < 2}
        >
          {isPending && !confirmingCancel ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          Start tournament
        </Button>
      </div>
      {participantCount < 2 ? (
        <p className="text-xs text-muted-foreground">Need at least 2 players to start.</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
