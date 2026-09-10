"use client";

import * as React from "react";
import { Star, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitCoachReview, deleteCoachReview } from "@/app/coaches/actions";
import { cn } from "@/lib/utils";

export function CoachReviewForm({
  coachProfileId,
  initialRating,
  initialComment,
}: {
  coachProfileId: string;
  initialRating: number | null;
  initialComment: string | null;
}) {
  const [rating, setRating] = React.useState(initialRating ?? 0);
  const [comment, setComment] = React.useState(initialComment ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const hasExisting = initialRating != null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating.");
      return;
    }
    startTransition(async () => {
      const result = await submitCoachReview(coachProfileId, rating, comment);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCoachReview(coachProfileId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRating(0);
      setComment("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4"
    >
      <p className="text-sm font-medium">
        {hasExisting ? "Edit your review" : "Leave a review"}
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isPending}
            onClick={() => setRating(star)}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className="disabled:pointer-events-none disabled:opacity-60"
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                star <= rating
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30 hover:text-primary/60",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder="How was your experience? (optional)"
        disabled={isPending}
        className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-60"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {hasExisting ? "Update review" : "Submit review"}
        </Button>
        {hasExisting ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" /> Remove
          </Button>
        ) : null}
      </div>
    </form>
  );
}
