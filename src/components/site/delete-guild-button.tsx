"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteGuild } from "@/app/guilds/actions";

// Leaders can't leave the guild (see leaveGuild's comment) — deleting it
// is the only way out, so this is a deliberate two-step confirm rather
// than a single click.
export function DeleteGuildButton({ guildId }: { guildId: string }) {
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteGuild(guildId);
      if (result?.error) setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 className="size-3.5" /> Delete guild
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Are you sure?</span>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Yes, delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
