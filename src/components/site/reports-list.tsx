"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markReportReviewed } from "@/app/admin/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { PlayerReportRow } from "@/lib/queries";

export function ReportsList({ reports }: { reports: PlayerReportRow[] }) {
  const [list, setList] = React.useState(reports);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function handleMarkReviewed(id: string) {
    setPendingId(id);
    setList((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status: "reviewed" } : report)),
    );
    markReportReviewed(id).then(() => setPendingId(null));
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No reports.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((report) => (
        <Card key={report.id}>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={report.status === "open" ? "accent" : "outline"}>
                  {report.status}
                </Badge>
                <span className="font-medium">{report.reason}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(report.createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {report.reporterUsername ? (
                <Link
                  href={`/players/${report.reporterUsername}`}
                  className="hover:text-foreground"
                >
                  @{report.reporterUsername}
                </Link>
              ) : (
                "unknown"
              )}{" "}
              reported{" "}
              {report.reportedUsername ? (
                <Link
                  href={`/players/${report.reportedUsername}`}
                  className="hover:text-foreground"
                >
                  @{report.reportedUsername}
                </Link>
              ) : (
                "unknown"
              )}
            </p>
            {report.details ? (
              <p className="text-sm text-muted-foreground">{report.details}</p>
            ) : null}
            {report.status === "open" ? (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkReviewed(report.id)}
                  disabled={pendingId === report.id}
                >
                  {pendingId === report.id ? (
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
