"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/app/profile/actions";

export function DeleteAccountButton({ isGuildLeader }: { isGuildLeader: boolean }) {
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 className="size-3.5" /> Delete account
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-sm text-right text-xs text-muted-foreground">
        This permanently deletes your account, profile, listings, messages,
        and highlights.
        {isGuildLeader
          ? " You lead a guild — deleting your account also deletes that guild for everyone in it."
          : ""}{" "}
        This can&apos;t be undone.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Yes, delete my account
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
