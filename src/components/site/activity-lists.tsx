import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListingLoadingOverlay } from "@/components/site/listing-loading-overlay";
import type { HighlightWithRelations } from "@/lib/supabase/types";

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
