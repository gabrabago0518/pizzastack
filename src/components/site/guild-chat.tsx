"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { GuildMessageWithSender } from "@/lib/supabase/types";

// Realtime (see the guild_messages entry in the supabase_realtime
// publication, schema.sql) delivers new messages instantly; this is just a
// backstop in case the socket drops without reconnecting on its own, so a
// stalled connection doesn't go unnoticed for long.
const FALLBACK_POLL_INTERVAL_MS = 20000;

export function GuildChat({
  guildId,
  viewerId,
  initialMessages,
  embedded = false,
  autoRefreshOnMount = false,
}: {
  guildId: string;
  viewerId: string;
  initialMessages: GuildMessageWithSender[];
  // Strips the standalone card chrome (border/background/padding, the
  // internal "Guild chat" title) and fills its parent's height instead of
  // capping its own — for embedding inside another container that already
  // provides the frame, like the floating guild panel in ChatFab, rather
  // than the full /guilds/[id] page.
  embedded?: boolean;
  // The full guild page already has server-rendered initialMessages, so
  // its first update can wait for realtime/the fallback poll. The floating
  // panel remounts this with an empty initialMessages every time it opens,
  // so it needs to fetch immediately instead of showing an empty thread.
  autoRefreshOnMount?: boolean;
}) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const listRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    const response = await fetch(`/api/guilds/${guildId}/messages`);
    const { messages: latest } = (await response.json()) as {
      messages: GuildMessageWithSender[];
    };
    setMessages(latest);
  }, [guildId]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`guild-chat-${guildId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guild_messages",
          filter: `guild_id=eq.${guildId}`,
        },
        () => refresh(),
      )
      .subscribe();

    const interval = setInterval(refresh, FALLBACK_POLL_INTERVAL_MS);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [guildId, refresh]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // Separate from the realtime/fallback-poll effect above so it can be
  // cancelled if the panel closes again before the fetch resolves.
  React.useEffect(() => {
    if (!autoRefreshOnMount) return;
    let cancelled = false;
    fetch(`/api/guilds/${guildId}/messages`)
      .then((response) => response.json())
      .then((data: { messages: GuildMessageWithSender[] }) => {
        if (!cancelled) setMessages(data.messages);
      });
    return () => {
      cancelled = true;
    };
  }, [guildId, autoRefreshOnMount]);

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/guilds/${guildId}/messages`, {
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
      {embedded ? null : <p className="text-sm font-medium">Guild chat</p>}

      <div
        ref={listRef}
        className={cn(
          "flex flex-col gap-2 overflow-y-auto",
          embedded ? "min-h-0 flex-1" : "max-h-96",
        )}
      >
        {messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No messages yet — say hi to your guild.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === viewerId;
            const hasProfile = Boolean(message.profiles?.username);
            const username = message.profiles?.username ?? "unknown";
            return (
              <div
                key={message.id}
                className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}
              >
                {hasProfile ? (
                  <Link href={`/players/${username}`} className="shrink-0">
                    <AvatarDisplay
                      url={message.profiles?.avatar_url ?? null}
                      label={username}
                      className="size-7"
                      textClassName="text-xs"
                    />
                  </Link>
                ) : (
                  <AvatarDisplay
                    url={message.profiles?.avatar_url ?? null}
                    label={username}
                    className="size-7"
                    textClassName="text-xs"
                  />
                )}
                <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                  <span className="text-xs text-muted-foreground">
                    {hasProfile ? (
                      <Link href={`/players/${username}`} className="hover:text-foreground">
                        {isMine ? "You" : `@${username}`}
                      </Link>
                    ) : isMine ? (
                      "You"
                    ) : (
                      `@${username}`
                    )}{" "}
                    &middot; {formatRelativeTime(message.created_at)}
                  </span>
                  <p
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-1.5 text-sm break-words",
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground",
                    )}
                  >
                    {message.body}
                  </p>
                </div>
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
          maxLength={1000}
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
