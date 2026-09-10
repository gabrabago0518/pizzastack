"use client";

import * as React from "react";
import { Flag, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { reportPlayer } from "@/app/players/actions";
import { REPORT_REASONS } from "@/lib/report-reasons";

export function ReportPlayerDialog({
  profileId,
  username,
}: {
  profileId: string;
  username: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSubmitted(false);
      setError(null);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await reportPlayer(profileId, reason, details);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Flag className="size-3.5" /> Report
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report @{username}</DialogTitle>
            <DialogDescription>
              Reports go to Pizzastack.gg admins for review — not the player.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Thanks — your report has been sent to the team.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 px-6">
                <SelectNative
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  aria-label="Reason"
                >
                  {REPORT_REASONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectNative>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  rows={3}
                  placeholder="Any details that would help (optional)"
                  className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin" /> : null}
                  Submit report
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
