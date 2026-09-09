"use client";

import * as React from "react";
import { Loader2, UserPlus, Clock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type JoinStatus = "none" | "pending" | "accepted" | "declined" | "removed" | "left";

export function JoinRequestButton({
  postId,
  requestId,
  initialStatus,
}: {
  postId: string;
  requestId?: string;
  initialStatus: JoinStatus;
}) {
  const [status, setStatus] = React.useState<JoinStatus>(initialStatus);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleRequest() {
    setStatus("pending");
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/listings/${postId}/join`, { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        setStatus("none");
        setError(result.error);
      }
    });
  }

  function handleLeave() {
    if (!requestId) return;
    setStatus("left");
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/join-requests/${requestId}/leave`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        setStatus("accepted");
        setError(result.error);
      }
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

  if (status === "declined") {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Declined
      </Button>
    );
  }

  if (status === "removed") {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Removed
      </Button>
    );
  }

  if (status === "left") {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Left
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Clock /> Requested
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleRequest} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Request to join
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
