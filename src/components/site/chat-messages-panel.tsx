"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { AvatarDisplay } from "@/components/site/avatar-display";
import { DmThread } from "@/components/site/dm-thread";
import { cn } from "@/lib/utils";
import type { ConversationRow } from "@/lib/queries";

// The floating counterpart to /messages — a conversation list on the left,
// the selected thread on the right, all inside one panel that opens from
// the chat FAB instead of navigating away. Same DmThread component as the
// full page, just told to fill its container instead of framing itself
// (see the `embedded` prop) and to fetch immediately on switching threads
// instead of waiting out the regular poll interval.
export function ChatMessagesPanel({
  viewerId,
  onBack,
}: {
  viewerId: string;
  onBack: () => void;
}) {
  const [conversations, setConversations] = React.useState<ConversationRow[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/messages")
      .then((response) => response.json())
      .then((data: { conversations?: ConversationRow[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const list = data.conversations ?? [];
        setConversations(list);
        setSelectedId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your messages.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = conversations?.find((conversation) => conversation.id === selectedId) ?? null;

  return (
    <div className="flex h-[26rem] max-h-[70vh] w-[22rem] max-w-[calc(100vw-3rem)] animate-fade-up flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to menu"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="font-medium">Messages</span>
        <Link
          href="/messages"
          className="ml-auto text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Open full inbox
        </Link>
      </div>

      {error ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-destructive">
          {error}
        </p>
      ) : conversations === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
          No conversations yet — message a player from their profile to start one.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="flex w-16 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border p-1.5 sm:w-36">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-1.5 text-left transition-colors",
                  conversation.id === selectedId ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="relative shrink-0">
                  <AvatarDisplay
                    url={conversation.otherAvatarUrl}
                    label={conversation.otherUsername}
                    className="size-8"
                    textClassName="text-xs"
                  />
                  {conversation.hasUnread ? (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                  ) : null}
                </span>
                <span className="hidden min-w-0 flex-1 truncate text-xs font-medium sm:block">
                  @{conversation.otherUsername}
                </span>
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {selected ? (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
                  <AvatarDisplay
                    url={selected.otherAvatarUrl}
                    label={selected.otherUsername}
                    className="size-6"
                    textClassName="text-[10px]"
                  />
                  <Link
                    href={`/players/${selected.otherUsername}`}
                    className="truncate text-sm font-medium hover:text-primary"
                  >
                    @{selected.otherUsername}
                  </Link>
                </div>
                <div className="min-h-0 flex-1 p-2">
                  <DmThread
                    key={selected.id}
                    conversationId={selected.id}
                    viewerId={viewerId}
                    initialMessages={[]}
                    embedded
                    autoRefreshOnMount
                  />
                </div>
              </>
            ) : (
              <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                Select a conversation
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
