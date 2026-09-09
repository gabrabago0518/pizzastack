"use client";

import * as React from "react";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CloseListingButton({ postId }: { postId: string }) {
  const [closed, setClosed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/listings/${postId}/close`, { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        setError(result.error);
        return;
      }
      setClosed(true);
    });
  }

  if (closed) {
    return <p className="text-sm text-muted-foreground">Listing closed.</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Lock />}
        Close listing
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
