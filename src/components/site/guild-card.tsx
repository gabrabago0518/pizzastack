import Link from "next/link";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GuildWithRelations } from "@/lib/supabase/types";

export function GuildCard({ guild }: { guild: GuildWithRelations }) {
  return (
    <Link href={`/guilds/${guild.id}`}>
      <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">[{guild.tag}]</Badge>
            {guild.games?.name ? <Badge variant="muted">{guild.games.name}</Badge> : null}
            {guild.region ? <Badge variant="outline">{guild.region}</Badge> : null}
          </div>
          <h3 className="font-display text-lg leading-snug">{guild.name}</h3>
          {guild.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {guild.description}
            </p>
          ) : null}
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-3.5" />
            {guild.member_count} {guild.member_count === 1 ? "member" : "members"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
