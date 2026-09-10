"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, X, Crown, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { kickMember } from "@/app/guilds/actions";
import type { GuildMemberWithProfile } from "@/lib/supabase/types";

export function GuildMemberList({
  guildId,
  members,
  viewerId,
  isLeader,
}: {
  guildId: string;
  members: GuildMemberWithProfile[];
  viewerId?: string;
  isLeader: boolean;
}) {
  const [list, setList] = React.useState(members);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function handleKick(profileId: string) {
    setPendingId(profileId);
    setError(null);
    const previous = list;
    setList((prev) => prev.filter((member) => member.profile_id !== profileId));

    kickMember(guildId, profileId).then((result) => {
      setPendingId(null);
      if (result.error) {
        setList(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((member) => {
        const username = member.profiles?.username ?? "unknown";
        return (
          <div
            key={member.profile_id}
            className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
          >
            <Link href={`/players/${username}`} className="shrink-0">
              <AvatarDisplay
                url={member.profiles?.avatar_url ?? null}
                label={username}
                className="size-8"
                textClassName="text-xs"
              />
            </Link>
            <Link
              href={`/players/${username}`}
              className="flex-1 truncate text-sm font-medium hover:text-primary"
            >
              @{username}
            </Link>
            {member.role === "leader" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <Crown className="size-3.5" /> Leader
              </span>
            ) : member.role === "officer" ? (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Shield className="size-3.5" /> Officer
              </span>
            ) : null}
            {isLeader && member.profile_id !== viewerId ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleKick(member.profile_id)}
                disabled={pendingId === member.profile_id}
                aria-label={`Remove @${username}`}
                className="text-muted-foreground hover:text-destructive"
              >
                {pendingId === member.profile_id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
              </Button>
            ) : null}
          </div>
        );
      })}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
