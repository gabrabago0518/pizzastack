"use client";

import * as React from "react";
import { Check, X, Loader2 } from "lucide-react";

import type { JoinRequestWithRequester } from "@/lib/supabase/types";

export function JoinRequestsManager({
  requests,
}: {
  requests: JoinRequestWithRequester[];
}) {
  const [decided, setDecided] = React.useState<Set<string>>(new Set());
  const [isPending, startTransition] = React.useTransition();

  const pending = requests.filter((request) => !decided.has(request.id));
  if (pending.length === 0) return null;

  function handleRespond(requestId: string, accept: boolean) {
    setDecided((prev) => new Set(prev).add(requestId));
    startTransition(async () => {
      await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {pending.length} {pending.length === 1 ? "player wants" : "players want"} to
        join
      </p>
      {pending.map((request) => (
        <div key={request.id} className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            @{request.profiles?.username ?? "unknown"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRespond(request.id, true)}
              disabled={isPending}
              aria-label="Accept"
              className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-60"
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
    </div>
  );
}
