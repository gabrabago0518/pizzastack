"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewHighlight } from "@/app/admin/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { HighlightWithRelations } from "@/lib/supabase/types";

export function HighlightModerationList({
  highlights,
}: {
  highlights: HighlightWithRelations[];
}) {
  const [list, setList] = React.useState(highlights);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [reasons, setReasons] = React.useState<Record<string, string>>({});

  function handleReview(id: string, decision: "approved" | "rejected") {
    setPendingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    reviewHighlight(id, decision, reasons[id]).then((result) => {
      setPendingId(null);
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setList((prev) => prev.filter((highlight) => highlight.id !== id));
    });
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No pending highlights.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((highlight) => {
        const isPending = pendingId === highlight.id;
        return (
          <Card key={highlight.id}>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <div className="w-full shrink-0 overflow-hidden rounded-lg bg-black sm:w-48">
                <video
                  src={highlight.video_url}
                  controls
                  playsInline
                  className="aspect-video w-full"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {highlight.games?.name ? (
                      <Badge variant="muted">{highlight.games.name}</Badge>
                    ) : null}
                    <span className="font-medium">{highlight.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(highlight.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {highlight.profiles?.username ? (
                    <Link
                      href={`/players/${highlight.profiles.username}`}
                      className="hover:text-foreground"
                    >
                      @{highlight.profiles.username}
                    </Link>
                  ) : (
                    "unknown"
                  )}
                </p>
                {highlight.description ? (
                  <p className="text-sm text-muted-foreground">{highlight.description}</p>
                ) : null}

                <Input
                  placeholder="Rejection reason (optional)"
                  value={reasons[highlight.id] ?? ""}
                  onChange={(event) =>
                    setReasons((prev) => ({ ...prev, [highlight.id]: event.target.value }))
                  }
                  className="h-8 text-sm"
                />

                {errors[highlight.id] ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors[highlight.id]}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(highlight.id, "rejected")}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview(highlight.id, "approved")}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
