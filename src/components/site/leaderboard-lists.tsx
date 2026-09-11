import Link from "next/link";
import { Users, MessageSquare } from "lucide-react";

import { AvatarDisplay } from "@/components/site/avatar-display";
import { StarRating } from "@/components/site/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TopCoachRow, TopGuildRow, TopLfgPostRow } from "@/lib/queries";

// Gold/silver/bronze for the top 3, plain muted circle after that — same
// "reward the podium, don't overdesign the rest" idea as most leaderboards.
const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-400/15 text-amber-400",
  2: "bg-zinc-300/15 text-zinc-300",
  3: "bg-orange-600/15 text-orange-400",
};

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        RANK_STYLES[rank] ?? "bg-muted text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function TopCoachesList({ coaches }: { coaches: TopCoachRow[] }) {
  if (coaches.length === 0) {
    return <EmptyState text="No rated coaches yet — reviews will populate this once players leave them." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {coaches.map((coach, index) => (
        <Card key={coach.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RankBadge rank={index + 1} />
              <AvatarDisplay
                url={coach.avatarUrl}
                label={coach.username}
                className="size-9"
                textClassName="text-sm"
              />
              <div className="flex flex-col">
                <Link href={`/players/${coach.username}`} className="font-medium hover:text-primary">
                  {coach.headline}
                </Link>
                <span className="text-xs text-muted-foreground">@{coach.username}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {coach.gameName ? <Badge variant="muted">{coach.gameName}</Badge> : null}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <StarRating rating={coach.avgRating} size="size-3.5" />
                {coach.avgRating.toFixed(1)} ({coach.reviewCount})
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TopGuildsList({ guilds }: { guilds: TopGuildRow[] }) {
  if (guilds.length === 0) {
    return <EmptyState text="No guilds yet — be the first to start one." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {guilds.map((guild, index) => (
        <Card key={guild.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RankBadge rank={index + 1} />
              <div className="flex flex-col">
                <Link href={`/guilds/${guild.id}`} className="font-medium hover:text-primary">
                  {guild.name}
                </Link>
                <span className="text-xs text-muted-foreground">[{guild.tag}]</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {guild.gameName ? <Badge variant="muted">{guild.gameName}</Badge> : null}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-3.5" />
                {guild.memberCount} {guild.memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TopLfgPostsList({ posts }: { posts: TopLfgPostRow[] }) {
  if (posts.length === 0) {
    return <EmptyState text="No listings have drawn any join requests yet." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post, index) => (
        <Card key={post.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RankBadge rank={index + 1} />
              <div className="flex flex-col">
                <Link href={`/teammates/${post.id}`} className="font-medium hover:text-primary">
                  {post.title}
                </Link>
                <span className="text-xs text-muted-foreground">@{post.username}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {post.gameName ? <Badge variant="muted">{post.gameName}</Badge> : null}
              <Badge variant={post.status === "open" ? "accent" : "outline"}>{post.status}</Badge>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare className="size-3.5" />
                {post.requestCount} {post.requestCount === 1 ? "request" : "requests"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
