import { Users, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { LfgPostWithRelations } from "@/lib/supabase/types";

export function LfgPostCard({ post }: { post: LfgPostWithRelations }) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{post.games?.name ?? "Unknown game"}</Badge>
              {post.rank ? <Badge variant="muted">{post.rank}</Badge> : null}
            </div>
            <h3 className="font-display text-lg leading-snug">{post.title}</h3>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {post.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        ) : null}

        {post.roles_needed?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {post.roles_needed.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-4 border-t border-border/60 pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />@{post.profiles?.username ?? "unknown"}
          </span>
          {post.region ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {post.region}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
