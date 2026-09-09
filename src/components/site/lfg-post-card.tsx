import Link from "next/link";
import { Users, MapPin, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JoinRequestButton } from "@/components/site/join-request-button";
import { JoinRequestsManager } from "@/components/site/join-requests-manager";
import { formatRelativeTime } from "@/lib/utils";
import type { LfgPostWithRelations, JoinRequestWithRequester } from "@/lib/supabase/types";

type JoinStatus = "none" | "pending" | "accepted" | "declined";

export function LfgPostCard({
  post,
  viewerId,
  myRequestStatus = "none",
  pendingRequests = [],
}: {
  post: LfgPostWithRelations;
  viewerId?: string;
  myRequestStatus?: JoinStatus;
  pendingRequests?: JoinRequestWithRequester[];
}) {
  const isOwner = viewerId === post.author_id;

  return (
    <Card className="relative transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <Link
        href={`/teammates/${post.id}`}
        className="absolute inset-0 rounded-[inherit]"
        aria-label={post.title}
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{post.games?.name ?? "Unknown game"}</Badge>
              {post.mode ? <Badge variant="outline">{post.mode}</Badge> : null}
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
          {post.profiles?.username ? (
            <Link
              href={`/players/${post.profiles.username}`}
              className="relative flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Users className="size-3.5" />@{post.profiles.username}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              unknown
            </span>
          )}
          {post.region ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {post.region}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <UserPlus className="size-3.5" />
            Needs {post.players_needed}
          </span>
        </div>

        {isOwner ? (
          <div className="relative">
            <JoinRequestsManager requests={pendingRequests} />
          </div>
        ) : (
          <div className="relative flex justify-end">
            {viewerId ? (
              <JoinRequestButton postId={post.id} initialStatus={myRequestStatus} />
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/login">
                  <UserPlus /> Request to join
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
