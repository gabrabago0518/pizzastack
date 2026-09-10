"use client";

import * as React from "react";
import { Check, X, Loader2 } from "lucide-react";

import type { JoinRequestWithRequester } from "@/lib/supabase/types";

export function JoinRequestsManager({
  requests,
  acceptedCount,
  playersNeeded,
}: {
  requests: JoinRequestWithRequester[];
  acceptedCount: number;
  playersNeeded: number;
}) {
  const [decided, setDecided] = React.useState<Set<string>>(new Set());
  const [optimisticAccepted, setOptimisticAccepted] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const pending = requests.filter((request) => !decided.has(request.id));
  if (pending.length === 0) return null;

  // The party can still fill up between page loads (another accept, or a
  // slot opening back up) — this tracks accepts made in this session on
  // top of the server-rendered count, so the button disables the moment
  // the last slot is taken without waiting on a refresh.
  const isFull = acceptedCount + optimisticAccepted >= playersNeeded;

  function handleRespond(requestId: string, accept: boolean) {
    setError(null);
    setDecided((prev) => new Set(prev).add(requestId));
    if (accept) setOptimisticAccepted((prev) => prev + 1);

    startTransition(async () => {
      const response = await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        // The listing filled up (or the request was already resolved)
        // between render and click — undo the optimistic removal so the
        // owner can see the request again and try a different one.
        setDecided((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
        if (accept) setOptimisticAccepted((prev) => prev - 1);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {pending.length} {pending.length === 1 ? "player wants" : "players want"} to
        join
      </p>
      {isFull ? (
        <p className="text-xs text-muted-foreground">
          Party is full ({acceptedCount + optimisticAccepted}/{playersNeeded}) — decline
          or remove a member to free a slot.
        </p>
      ) : null}
      {pending.map((request) => (
        <div key={request.id} className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            @{request.profiles?.username ?? "unknown"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRespond(request.id, true)}
              disabled={isPending || isFull}
              aria-label="Accept"
              className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-40"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => handleRespond(request.id, false)}
              disabled={isPending}
              aria-label="Decline"
              className="flex size-7 items-center justify-center rounded-full bg-destructive/15 text-destructive transition-colors hover:bg-destructive/25 disabled:pointer-events-none disabled:opacity-60"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
