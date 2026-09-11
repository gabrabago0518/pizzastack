"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { markConversationRead } from "@/app/messages/actions";
import type { DirectMessageWithSender } from "@/lib/supabase/types";

const POLL_INTERVAL_MS = 4000;

export function DmThread({
  conversationId,
  viewerId,
  initialMessages,
  embedded = false,
  autoRefreshOnMount = false,
}: {
  conversationId: string;
  viewerId: string;
  initialMessages: DirectMessageWithSender[];
  // Strips the standalone card chrome (border/background/padding) and fills
  // its parent's height instead of capping its own — for embedding inside
  // another container that already provides the frame, like the floating
  // messages panel in ChatFab, rather than the full /messages/[id] page.
  embedded?: boolean;
  // The full page already has server-rendered initialMessages, so its
  // first refresh can wait for the regular poll interval. The floating
  // panel remounts this with an empty initialMessages every time the
  // viewer switches conversations, so it needs to fetch immediately
  // instead of showing a stale/empty thread for up to 4 seconds.
  autoRefreshOnMount?: boolean;
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const listRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    const response = await fetch(`/api/messages/${conversationId}`);
    const { messages: latest } = (await response.json()) as {
      messages: DirectMessageWithSender[];
    };
    setMessages(latest);
  }, [conversationId]);

  React.useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Separate from the polling effect above so it can be cancelled if the
  // conversation changes again before the fetch resolves — the floating
  // panel remounts this per conversation, so a slow response for a thread
  // the viewer has already clicked away from should never land.
  React.useEffect(() => {
    if (!autoRefreshOnMount) return;
    let cancelled = false;
    fetch(`/api/messages/${conversationId}`)
      .then((response) => response.json())
      .then((data: { messages: DirectMessageWithSender[] }) => {
        if (!cancelled) setMessages(data.messages);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, autoRefreshOnMount]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // Marking read is a one-time "I've opened this thread" action, not tied
  // to every poll — re-running it on each refresh would just be redundant
  // no-op updates.
  React.useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        setError(result.error);
        return;
      }
      setInput("");
      await refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        embedded ? "h-full" : "rounded-lg border border-border bg-muted/20 p-3",
      )}
    >
      <div
        ref={listRef}
        className={cn(
          "flex flex-col gap-2 overflow-y-auto",
          embedded ? "min-h-0 flex-1" : "max-h-[28rem] min-h-64",
        )}
      >
        {messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === viewerId;
            return (
              <div
                key={message.id}
                className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
              >
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(message.created_at)}
                </span>
                <p
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-1.5 text-sm break-words",
                    isMine ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                  )}
                >
                  {message.body}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          placeholder="Send a message..."
          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
        <Button type="submit" size="sm" disabled={isPending || !input.trim()}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
