"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { GuildChat } from "@/components/site/guild-chat";
import { Badge } from "@/components/ui/badge";

// The floating counterpart to a guild's chat tab on /guilds/[id] — just one
// thread, so unlike the messages panel there's no left-hand list, only a
// header (guild name/tag + a link out to the full guild page) above the
// embedded GuildChat.
export function ChatGuildPanel({
  guildId,
  guildName,
  guildTag,
  viewerId,
  onBack,
}: {
  guildId: string;
  guildName: string;
  guildTag: string;
  viewerId: string;
  onBack: () => void;
}) {
  return (
    <div className="flex h-[26rem] max-h-[70vh] w-80 max-w-[calc(100vw-3rem)] animate-fade-up flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to menu"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="min-w-0 truncate font-medium">{guildName}</span>
        <Badge variant="secondary" className="shrink-0">
          [{guildTag}]
        </Badge>
        <Link
          href={`/guilds/${guildId}`}
          className="ml-auto shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Open guild
        </Link>
      </div>

      <div className="min-h-0 flex-1 p-2">
        <GuildChat
          guildId={guildId}
          viewerId={viewerId}
          initialMessages={[]}
          embedded
          autoRefreshOnMount
        />
      </div>
    </div>
  );
}
