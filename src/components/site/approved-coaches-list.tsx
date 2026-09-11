"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Ban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewCoachApplication } from "@/app/admin/actions";
import type { CoachProfileWithRelations } from "@/lib/supabase/types";

export function ApprovedCoachesList({
  coaches,
}: {
  coaches: CoachProfileWithRelations[];
}) {
  const [list, setList] = React.useState(coaches);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleRevoke(id: string) {
    setPendingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    reviewCoachApplication(id, "rejected").then((result) => {
      setPendingId(null);
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setList((prev) => prev.filter((coach) => coach.id !== id));
    });
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No approved coaches yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((coach) => {
        const isPending = pendingId === coach.id;
        return (
          <Card key={coach.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="muted">{coach.games?.name ?? "Unknown game"}</Badge>
                    <span className="font-medium">{coach.headline}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {coach.profiles?.username ? (
                      <Link
                        href={`/players/${coach.profiles.username}`}
                        className="hover:text-foreground"
                      >
                        @{coach.profiles.username}
                      </Link>
                    ) : (
                      "unknown"
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(coach.id)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Ban className="size-3.5" />
                  )}
                  Revoke
                </Button>
              </div>
              {errors[coach.id] ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors[coach.id]}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
