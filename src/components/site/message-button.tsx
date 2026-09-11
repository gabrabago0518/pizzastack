"use client";

import * as React from "react";
import { Loader2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startConversation } from "@/app/messages/actions";

export function MessageButton({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      await startConversation(profileId);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <MessageCircle className="size-3.5" />
      )}
      Message
    </Button>
  );
}
