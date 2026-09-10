"use client";

import * as React from "react";
import Link from "next/link";
import { Users, MapPin, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { closeCoachingRequest } from "@/app/coaches/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { CoachingRequestWithRelations } from "@/lib/supabase/types";

export function CoachingRequestCard({
  request,
  viewerId,
}: {
  request: CoachingRequestWithRelations;
  viewerId?: string;
}) {
  const [closed, setClosed] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const isOwner = viewerId === request.author_id;

  function handleClose() {
    startTransition(async () => {
      const result = await closeCoachingRequest(request.id);
      if (!result.error) setClosed(true);
    });
  }

  if (closed) return null;

  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{request.games?.name ?? "Unknown game"}</Badge>
            {request.rank ? <Badge variant="muted">{request.rank}</Badge> : null}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(request.created_at)}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {request.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-sm text-muted-foreground">
          {request.profiles?.username ? (
            <Link
              href={`/players/${request.profiles.username}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Users className="size-3.5" />@{request.profiles.username}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              unknown
            </span>
          )}
          {request.region ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {request.region}
            </span>
          ) : null}
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
