"use client";

import * as React from "react";
import { Loader2, UserPlus, Check, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requestToJoin } from "@/app/teammates/actions";

type JoinStatus = "none" | "pending" | "accepted" | "declined";

export function JoinRequestButton({
  postId,
  initialStatus,
}: {
  postId: string;
  initialStatus: JoinStatus;
}) {
  const [status, setStatus] = React.useState<JoinStatus>(initialStatus);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleRequest() {
    setStatus("pending");
    setError(null);

    startTransition(async () => {
      const result = await requestToJoin(postId);
      if (result.error) {
        setStatus("none");
        setError(result.error);
      }
    });
  }

  if (status === "accepted") {
    return (
      <Button variant="outline" size="sm" disabled className="text-accent">
        <Check /> Accepted
      </Button>
    );
  }

  if (status === "declined") {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Declined
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
