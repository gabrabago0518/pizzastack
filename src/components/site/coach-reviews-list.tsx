import { AvatarDisplay } from "@/components/site/avatar-display";
import { StarRating } from "@/components/site/star-rating";
import { formatRelativeTime } from "@/lib/utils";
import type { CoachReviewWithReviewer } from "@/lib/supabase/types";

export function CoachReviewsList({ reviews }: { reviews: CoachReviewWithReviewer[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="flex gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"
        >
          <AvatarDisplay
            url={review.profiles?.avatar_url ?? null}
            label={review.profiles?.username ?? "?"}
            className="size-9"
            textClassName="text-xs"
          />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {review.profiles?.username ? `@${review.profiles.username}` : "A player"}
              </span>
              <StarRating rating={review.rating} size="size-3.5" />
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(review.created_at)}
              </span>
            </div>
            {review.comment ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
