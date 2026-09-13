"use client";

import * as React from "react";
import { Loader2, UserPlus, UserCheck, UserX, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendBuddyRequest, respondToBuddyRequest, removeBuddy } from "@/app/buddies/actions";
import { startConversation } from "@/app/messages/actions";
import type { BuddyStatus } from "@/lib/queries";

// Replaces the old always-open MessageButton — DMs are buddies-only now
// (see conversations' insert policy in schema.sql), so this single button
// carries every stage of that relationship instead of a separate "Message"
// button assuming it's always allowed.
export function BuddyButton({
  profileId,
  initialStatus,
}: {
  profileId: string;
  initialStatus: BuddyStatus;
}) {
  const [status, setStatus] = React.useState<BuddyStatus>(initialStatus);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendBuddyRequest(profileId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("pending_sent");
    });
  }

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await respondToBuddyRequest(profileId, true);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("buddies");
    });
  }

  function handleDeclineOrCancel() {
    setError(null);
    startTransition(async () => {
      const result =
        status === "pending_received"
          ? await respondToBuddyRequest(profileId, false)
          : await removeBuddy(profileId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatus("none");
    });
  }

  function handleMessage() {
    startTransition(async () => {
      await startConversation(profileId);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {status === "buddies" ? (
          <>
            <Button variant="outline" size="sm" onClick={handleMessage} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <MessageCircle className="size-3.5" />}
              Message
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeclineOrCancel}
              disabled={isPending}
              title="Remove buddy"
            >
              <UserX className="size-3.5" />
            </Button>
          </>
        ) : status === "pending_received" ? (
          <>
            <Button variant="outline" size="sm" onClick={handleAccept} disabled={isPending}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
              Accept buddy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeclineOrCancel}
              disabled={isPending}
              title="Decline"
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : status === "pending_sent" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeclineOrCancel}
            disabled={isPending}
            title="Cancel request"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
            Request sent
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleSend} disabled={isPending}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
            Add buddy
          </Button>
        )}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
