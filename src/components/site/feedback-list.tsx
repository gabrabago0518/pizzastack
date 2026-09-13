"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markFeedbackReviewed } from "@/app/admin/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { FeedbackWithProfile } from "@/lib/supabase/types";

export function FeedbackList({ feedback }: { feedback: FeedbackWithProfile[] }) {
  const [list, setList] = React.useState(feedback);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function handleMarkReviewed(id: string) {
    setPendingId(id);
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "reviewed" } : item)),
    );
    markFeedbackReviewed(id).then(() => setPendingId(null));
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No feedback yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={item.status === "open" ? "accent" : "outline"}>
                  {item.status}
                </Badge>
                {item.profiles?.username ? (
                  <Link
                    href={`/players/${item.profiles.username}`}
                    className="font-medium hover:text-foreground"
                  >
                    @{item.profiles.username}
                  </Link>
                ) : (
                  <span className="font-medium">unknown</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(item.created_at)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{item.message}</p>
            {item.status === "open" ? (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkReviewed(item.id)}
                  disabled={pendingId === item.id}
                >
                  {pendingId === item.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Mark reviewed
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
