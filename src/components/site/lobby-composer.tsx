"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createLobbyPost } from "@/app/lobby/actions";

export function LobbyComposer() {
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await createLobbyPost(body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What's on your mind?"
        className="flex w-full resize-none rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <span className="text-xs text-muted-foreground">{body.length}/1000</span>
        )}
        <Button type="submit" size="sm" disabled={isPending || !body.trim()} className="ml-auto">
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Post
        </Button>
      </div>
    </form>
  );
}
