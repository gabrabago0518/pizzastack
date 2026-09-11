"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { postGuildAnnouncement, deleteGuildAnnouncement } from "@/app/guilds/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { GuildAnnouncementWithAuthor } from "@/lib/supabase/types";

export function GuildAnnouncements({
  guildId,
  announcements,
  isLeader,
}: {
  guildId: string;
  announcements: GuildAnnouncementWithAuthor[];
  isLeader: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function handlePost(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setError(null);
    startTransition(async () => {
      const result = await postGuildAnnouncement(guildId, text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInput("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteGuildAnnouncement(id).then(() => {
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Megaphone className="size-4" /> Announcements
      </p>

      {isLeader ? (
        <form onSubmit={handlePost} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={2000}
            placeholder="Post an announcement..."
          />
          <Button type="submit" size="sm" disabled={isPending || !input.trim()}>
            {isPending ? <Loader2 className="animate-spin" /> : "Post"}
          </Button>
        </form>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-2">
        {announcements.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No announcements yet.
          </p>
        ) : (
          announcements.map((announcement) => {
            const username = announcement.profiles?.username ?? "unknown";
            return (
              <div
                key={announcement.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-card p-3"
              >
                <div className="flex items-start gap-2">
                  <AvatarDisplay
                    url={announcement.profiles?.avatar_url ?? null}
                    label={username}
                    className="size-7"
                    textClassName="text-xs"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">
                      {announcement.profiles?.username ? (
                        <Link
                          href={`/players/${username}`}
                          className="hover:text-foreground"
                        >
                          @{username}
                        </Link>
                      ) : (
                        "unknown"
                      )}{" "}
                      &middot; {formatRelativeTime(announcement.created_at)}
                    </span>
                    <p className="text-sm break-words">{announcement.body}</p>
                  </div>
                </div>
                {isLeader ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => handleDelete(announcement.id)}
                    disabled={deletingId === announcement.id}
                  >
                    {deletingId === announcement.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
