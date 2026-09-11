"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewCoachApplication } from "@/app/admin/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { CoachProfileWithRelations } from "@/lib/supabase/types";

export function CoachApplicationsList({
  applications,
}: {
  applications: CoachProfileWithRelations[];
}) {
  const [list, setList] = React.useState(applications);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleReview(id: string, decision: "approved" | "rejected") {
    setPendingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    reviewCoachApplication(id, decision).then((result) => {
      setPendingId(null);
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setList((prev) => prev.filter((application) => application.id !== id));
    });
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No pending applications.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((application) => {
        const isPending = pendingId === application.id;
        return (
          <Card key={application.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="muted">
                    {application.games?.name ?? "Unknown game"}
                  </Badge>
                  <span className="font-medium">{application.headline}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(application.created_at)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {application.profiles?.username ? (
                  <Link
                    href={`/players/${application.profiles.username}`}
                    className="hover:text-foreground"
                  >
                    @{application.profiles.username}
                  </Link>
                ) : (
                  "unknown"
                )}
                {application.rank ? ` · ${application.rank}` : ""}
                {application.rate_note ? ` · ${application.rate_note}` : ""}
              </p>
              {application.bio ? (
                <p className="text-sm text-muted-foreground">{application.bio}</p>
              ) : null}
              <p className="text-sm">
                <span className="font-medium">Contact: </span>
                {application.contact_method}
              </p>
              {errors[application.id] ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors[application.id]}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview(application.id, "rejected")}
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
                  onClick={() => handleReview(application.id, "approved")}
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
