"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { closeScrimmage } from "@/app/scrims/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { ScrimmageWithRelations } from "@/lib/supabase/types";

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function ScrimmageCard({
  scrimmage,
  viewerId,
}: {
  scrimmage: ScrimmageWithRelations;
  viewerId?: string;
}) {
  const [closed, setClosed] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const isOwner = viewerId === scrimmage.author_id;

  function handleClose() {
    startTransition(async () => {
      const result = await closeScrimmage(scrimmage.id);
      if (!result.error) setClosed(true);
    });
  }

  if (closed) return null;

  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{scrimmage.games?.name ?? "Unknown game"}</Badge>
          {scrimmage.region ? <Badge variant="muted">{scrimmage.region}</Badge> : null}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 font-display text-lg">
            <Calendar className="size-4 text-secondary" />
            {dateTimeFormatter.format(new Date(scrimmage.scheduled_at))}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(scrimmage.scheduled_at)}
          </span>
        </div>

        {scrimmage.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {scrimmage.description}
          </p>
        ) : null}

        <div className="border-t border-border/60 pt-3 text-sm text-muted-foreground">
          {scrimmage.profiles?.username ? (
            <Link
              href={`/players/${scrimmage.profiles.username}`}
              className="transition-colors hover:text-foreground"
            >
              @{scrimmage.profiles.username}
            </Link>
          ) : (
            <span>unknown</span>
          )}
        </div>

        {isOwner ? (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleClose} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
              Close listing
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
