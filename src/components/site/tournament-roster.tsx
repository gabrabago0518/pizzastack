"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Shuffle, X } from "lucide-react";

import { AvatarDisplay } from "@/components/site/avatar-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  randomizeSeeds,
  setParticipantSeed,
  kickParticipant,
} from "@/app/tournaments/actions";
import type { TournamentParticipantWithProfile } from "@/lib/supabase/types";

export function TournamentRoster({
  tournamentId,
  participants,
  canManage,
}: {
  tournamentId: string;
  participants: TournamentParticipantWithProfile[];
  canManage: boolean;
}) {
  const [list, setList] = React.useState(participants);
  const [isPending, startTransition] = React.useTransition();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // Resyncs local state when the server hands down a fresh `participants`
  // prop (e.g. after revalidatePath following an action) — done during
  // render, guarded on reference equality, rather than an effect.
  const [prevParticipants, setPrevParticipants] = React.useState(participants);
  if (participants !== prevParticipants) {
    setPrevParticipants(participants);
    setList(participants);
  }

  function handleRandomize() {
    startTransition(async () => {
      await randomizeSeeds(tournamentId);
    });
  }

  function handleSeedChange(participantId: string, value: string) {
    const seed = value === "" ? null : Number(value);
    setList((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, seed } : p)),
    );
    startTransition(async () => {
      await setParticipantSeed(tournamentId, participantId, seed);
    });
  }

  function handleKick(participantId: string) {
    setPendingId(participantId);
    setList((prev) => prev.filter((p) => p.id !== participantId));
    startTransition(async () => {
      await kickParticipant(tournamentId, participantId);
      setPendingId(null);
    });
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No one has registered yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRandomize}
            disabled={isPending}
          >
            <Shuffle className="size-3.5" /> Randomize seeds
          </Button>
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {list.map((participant, index) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5"
          >
            {canManage ? (
              <Input
                type="number"
                min={1}
                value={participant.seed ?? ""}
                placeholder={String(index + 1)}
                onChange={(event) => handleSeedChange(participant.id, event.target.value)}
                className="h-8 w-14 px-2 text-center text-sm"
                aria-label={`Seed for ${participant.profiles?.username ?? "player"}`}
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {participant.seed ?? index + 1}
              </span>
            )}
            <AvatarDisplay
              url={participant.profiles?.avatar_url ?? null}
              label={participant.profiles?.username ?? "?"}
              className="size-8"
              textClassName="text-xs"
            />
            {participant.profiles?.username ? (
              <Link
                href={`/players/${participant.profiles.username}`}
                className="flex-1 text-sm font-medium transition-colors hover:text-primary"
              >
                @{participant.profiles.username}
              </Link>
            ) : (
              <span className="flex-1 text-sm text-muted-foreground">unknown</span>
            )}
            {canManage ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleKick(participant.id)}
                disabled={pendingId === participant.id}
                aria-label="Remove"
                className="text-muted-foreground hover:text-destructive"
              >
                {pendingId === participant.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
