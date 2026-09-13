"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type JoinStatus = "none" | "pending" | "accepted" | "declined" | "removed" | "left";

// Joining is immediate — no owner approval — so this only really has two
// live states: not in the party (join) and in the party (leave). 'left'
// falls back to the join button too, since leaving voluntarily doesn't
// block rejoining later (see enforce_lfg_join_rules, schema.sql).
// 'pending'/'declined' are kept as disabled labels purely for any row
// written before this button stopped producing them; 'removed' stays
// disabled since a kick is meant to stick.
export function JoinRequestButton({
  postId,
  requestId,
  initialStatus,
}: {
  postId: string;
  requestId?: string;
  initialStatus: JoinStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<JoinStatus>(initialStatus);
  const [currentRequestId, setCurrentRequestId] = React.useState(requestId);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleJoin() {
    const previousStatus = status;
    setStatus("accepted");
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/listings/${postId}/join`, { method: "POST" });
      const result = (await response.json()) as { error?: string; id?: string };
      if (result.error) {
        setStatus(previousStatus);
        setError(result.error);
        return;
      }
      if (result.id) setCurrentRequestId(result.id);
      // Joining unlocks the party chat immediately — refresh so this same
      // page picks that up without the joiner needing to reload by hand.
      router.refresh();
    });
  }

  function handleLeave() {
    if (!currentRequestId) return;
    setStatus("left");
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/join-requests/${currentRequestId}/leave`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        setStatus("accepted");
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (status === "accepted") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" onClick={handleLeave} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          Leave party
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (status === "removed") {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Removed
      </Button>
    );
  }

  if (status === "declined" || status === "pending") {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        {status === "pending" ? "Requested" : "Declined"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleJoin} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Join party
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
