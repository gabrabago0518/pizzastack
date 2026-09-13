"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, UserCheck, X, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { respondToBuddyRequest } from "@/app/buddies/actions";
import { startConversation } from "@/app/messages/actions";
import type { BuddyProfile, PendingBuddyRequest } from "@/lib/queries";

// Sits above the conversation list on /messages — incoming buddy requests
// need a place to be acted on, and the buddies list is the easiest way to
// jump into a DM now that starting one requires being buddies first (see
// conversations' insert policy in schema.sql).
export function BuddiesPanel({
  buddies,
  pendingRequests,
}: {
  buddies: BuddyProfile[];
  pendingRequests: PendingBuddyRequest[];
}) {
  const [requests, setRequests] = React.useState(pendingRequests);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleRespond(requesterId: string, accept: boolean) {
    setPendingId(requesterId);
    startTransition(async () => {
      await respondToBuddyRequest(requesterId, accept);
      setRequests((current) => current.filter((request) => request.requesterId !== requesterId));
      setPendingId(null);
    });
  }

  function handleMessage(profileId: string) {
    setPendingId(profileId);
    startTransition(async () => {
      await startConversation(profileId);
    });
  }

  if (requests.length === 0 && buddies.length === 0) return null;

  return (
    <div className="mx-auto mb-8 flex max-w-xl flex-col gap-4">
      {requests.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Buddy requests
          </h2>
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <AvatarDisplay
                url={request.avatarUrl}
                label={request.username}
                className="size-9"
                textClassName="text-xs"
              />
              <span className="flex-1 truncate text-sm font-medium">@{request.username}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending && pendingId === request.requesterId}
                onClick={() => handleRespond(request.requesterId, true)}
              >
                {isPending && pendingId === request.requesterId ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UserCheck className="size-3.5" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending && pendingId === request.requesterId}
                onClick={() => handleRespond(request.requesterId, false)}
                title="Decline"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {buddies.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Buddies
          </h2>
          <div className="flex flex-wrap gap-2">
            {buddies.map((buddy) => (
              <div
                key={buddy.id}
                className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1.5 pl-2.5"
              >
                <Link
                  href={`/players/${buddy.username}`}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
                >
                  <AvatarDisplay
                    url={buddy.avatar_url}
                    label={buddy.username}
                    className="size-6"
                    textClassName="text-[10px]"
                  />
                  @{buddy.username}
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  disabled={isPending && pendingId === buddy.id}
                  onClick={() => handleMessage(buddy.id)}
                  title="Message"
                >
                  {isPending && pendingId === buddy.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <MessageCircle className="size-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
