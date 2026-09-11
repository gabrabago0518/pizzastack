import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListingLoadingOverlay } from "@/components/site/listing-loading-overlay";
import type {
  LfgPostWithRelations,
  CoachProfileWithRelations,
  HighlightWithRelations,
} from "@/lib/supabase/types";

export function LfgPostsList({
  posts,
  emptyText,
}: {
  posts: LfgPostWithRelations[];
  emptyText: string;
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/teammates/${post.id}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{post.title}</span>
                  <Badge variant="muted" className="w-fit">
                    {post.games?.name}
                  </Badge>
                </div>
                <Badge variant={post.status === "open" ? "accent" : "outline"}>
                  {post.status}
                </Badge>
              </CardContent>
            </Card>
            <ListingLoadingOverlay />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CoachProfilesList({
  coachProfiles,
  emptyText,
}: {
  coachProfiles: CoachProfileWithRelations[];
  emptyText: string;
}) {
  if (coachProfiles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {coachProfiles.map((coach) => (
        <li key={coach.id}>
          <Card>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{coach.headline}</span>
                <Badge variant="muted" className="w-fit">
                  {coach.games?.name}
                </Badge>
              </div>
              <Badge
                variant={
                  coach.status === "approved"
                    ? "accent"
                    : coach.status === "rejected"
                      ? "muted"
                      : "outline"
                }
              >
                {coach.status}
              </Badge>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function HighlightsList({
  highlights,
  emptyText,
}: {
  highlights: HighlightWithRelations[];
  emptyText: string;
}) {
  if (highlights.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {highlights.map((highlight) => (
        <li key={highlight.id}>
          <Link href={`/highlights/${highlight.id}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{highlight.title}</span>
                  {highlight.games?.name ? (
                    <Badge variant="muted" className="w-fit">
                      {highlight.games.name}
                    </Badge>
                  ) : null}
                </div>
                <Badge
                  variant={
                    highlight.status === "approved"
                      ? "accent"
                      : highlight.status === "rejected"
                        ? "muted"
                        : "outline"
                  }
                >
                  {highlight.status}
                </Badge>
              </CardContent>
            </Card>
            <ListingLoadingOverlay />
          </Link>
        </li>
      ))}
    </ul>
  );
}
