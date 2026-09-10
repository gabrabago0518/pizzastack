import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Read-only star display — rounds to the nearest whole star since partial
// fills would need a clip-path per star for a fraction most viewers
// wouldn't reliably read anyway (a rounded "4/5 stars" reads just as
// clearly as "4.3/5 stars" at this size).
export function StarRating({
  rating,
  size = "size-4",
  className,
}: {
  rating: number;
  size?: string;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size,
            star <= rounded ? "fill-primary text-primary" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}
