import Link from "next/link";
import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/site/avatar-display";
import type { HighlightWithRelations } from "@/lib/supabase/types";

// The card's <video> has no controls — it's just a poster frame preview,
// clicking anywhere navigates to the full player on /highlights/[id]
// (native <video controls> inside a <Link> would intercept clicks meant
// for navigation).
export function HighlightCard({ highlight }: { highlight: HighlightWithRelations }) {
  return (
    <Link href={`/highlights/${highlight.id}`}>
      <Card className="overflow-hidden !p-0 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <div className="relative aspect-video w-full bg-muted">
          <video
            src={highlight.video_url}
            className="size-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 hover:opacity-100">
            <div className="flex size-11 items-center justify-center rounded-full bg-white/90">
              <Play className="size-5 fill-black text-black" />
            </div>
          </div>
        </div>
        <CardContent className="flex flex-col gap-2 !pt-4 !pb-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {highlight.games?.name ? <Badge variant="muted">{highlight.games.name}</Badge> : null}
          </div>
          <h3 className="line-clamp-1 font-display text-base leading-snug">{highlight.title}</h3>
          {highlight.profiles?.username ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <AvatarDisplay
                url={highlight.profiles.avatar_url}
                label={highlight.profiles.username}
                className="size-5"
                textClassName="text-[10px]"
              />
              @{highlight.profiles.username}
            </span>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
