"use client";

import * as React from "react";
import { Loader2, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { reportMatchResult } from "@/app/tournaments/actions";

export interface ReportableMatch {
  id: string;
  participant1Id: string | null;
  participant2Id: string | null;
  participant1Name: string;
  participant2Name: string;
}

export function ReportMatchDialog({
  tournamentId,
  match,
  open,
  onOpenChange,
  onReported,
}: {
  tournamentId: string;
  match: ReportableMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported: () => void;
}) {
  const [winnerId, setWinnerId] = React.useState<string | null>(null);
  const [score1, setScore1] = React.useState("");
  const [score2, setScore2] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Resets the form fields whenever the dialog opens for a (possibly new)
  // match — done during render, keyed off `open` itself, rather than an
  // effect: opening is driven externally (the parent sets `open`, not a
  // DialogTrigger), so Radix never calls onOpenChange(true) for us to hook.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setWinnerId(null);
      setScore1("");
      setScore2("");
      setError(null);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!match || !winnerId) {
      setError("Pick the winner.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reportMatchResult(
        tournamentId,
        match.id,
        winnerId,
        score1 === "" ? null : Number(score1),
        score2 === "" ? null : Number(score2),
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onReported();
      onOpenChange(false);
    });
  }

  if (!match) return null;

  const options = [
    { id: match.participant1Id, name: match.participant1Name },
    { id: match.participant2Id, name: match.participant2Name },
  ].filter((option): option is { id: string; name: string } => Boolean(option.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report result</DialogTitle>
          <DialogDescription>
            Pick the winner — this advances them to the next match.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 px-6">
            <div className="flex flex-col gap-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setWinnerId(option.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    winnerId === option.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.name}
                  {winnerId === option.id ? (
                    <Trophy className="size-4 text-primary" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="score1">{match.participant1Name} score (optional)</Label>
                <Input
                  id="score1"
                  type="number"
                  min={0}
                  value={score1}
                  onChange={(event) => setScore1(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="score2">{match.participant2Name} score (optional)</Label>
                <Input
                  id="score2"
                  type="number"
                  min={0}
                  value={score2}
                  onChange={(event) => setScore2(event.target.value)}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !winnerId}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Report result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
