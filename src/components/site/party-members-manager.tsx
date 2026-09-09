"use client";

import * as React from "react";
import { UserX, Loader2 } from "lucide-react";

import type { JoinRequestWithRequester } from "@/lib/supabase/types";

export function PartyMembersManager({
  members,
}: {
  members: JoinRequestWithRequester[];
}) {
  const [removed, setRemoved] = React.useState<Set<string>>(new Set());
  const [isPending, startTransition] = React.useTransition();

  const active = members.filter((member) => !removed.has(member.id));
  if (active.length === 0) return null;

  function handleRemove(requestId: string) {
    setRemoved((prev) => new Set(prev).add(requestId));
    startTransition(async () => {
      await fetch(`/api/join-requests/${requestId}/remove`, { method: "POST" });
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {active.length} {active.length === 1 ? "player" : "players"} in the party
      </p>
      {active.map((member) => (
        <div key={member.id} className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            @{member.profiles?.username ?? "unknown"}
          </span>
          <button
            type="button"
            onClick={() => handleRemove(member.id)}
            disabled={isPending}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15 disabled:pointer-events-none disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <UserX className="size-3.5" />
            )}
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
