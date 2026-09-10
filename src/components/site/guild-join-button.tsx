"use client";

import * as React from "react";
import { Loader2, LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { joinGuild, leaveGuild } from "@/app/guilds/actions";

export function GuildJoinButton({
  guildId,
  isMember,
  alreadyInAnotherGuild,
}: {
  guildId: string;
  isMember: boolean;
  alreadyInAnotherGuild: boolean;
}) {
  const [joined, setJoined] = React.useState(isMember);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleJoin() {
    setJoined(true);
    setError(null);
    startTransition(async () => {
      const result = await joinGuild(guildId);
      if (result.error) {
        setJoined(false);
        setError(result.error);
      }
    });
  }

  function handleLeave() {
    setJoined(false);
    setError(null);
    startTransition(async () => {
      const result = await leaveGuild(guildId);
      if (result.error) {
        setJoined(true);
        setError(result.error);
      }
    });
  }

  if (joined) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" onClick={handleLeave} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          Leave guild
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (alreadyInAnotherGuild) {
    return (
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        Already in a guild
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleJoin} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
        Join guild
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
