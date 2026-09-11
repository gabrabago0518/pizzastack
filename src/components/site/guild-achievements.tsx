"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Medal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addGuildAchievement, deleteGuildAchievement } from "@/app/guilds/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { GuildAchievement } from "@/lib/supabase/types";

export function GuildAchievements({
  guildId,
  achievements,
  isLeader,
}: {
  guildId: string;
  achievements: GuildAchievement[];
  isLeader: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await addGuildAchievement(guildId, title, description);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDescription("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteGuildAchievement(id).then(() => {
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Medal className="size-4" /> Achievements
      </p>

      {isLeader ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            placeholder="Achievement title..."
          />
          <div className="flex items-center gap-2">
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description (optional)"
            />
            <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
              {isPending ? <Loader2 className="animate-spin" /> : "Add"}
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-2">
        {achievements.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No achievements yet.
          </p>
        ) : (
          achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <Medal className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{achievement.title}</span>
                  {achievement.description ? (
                    <p className="text-sm break-words text-muted-foreground">
                      {achievement.description}
                    </p>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(achievement.created_at)}
                  </span>
                </div>
              </div>
              {isLeader ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0"
                  onClick={() => handleDelete(achievement.id)}
                  disabled={deletingId === achievement.id}
                >
                  {deletingId === achievement.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
