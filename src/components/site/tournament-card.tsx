import Link from "next/link";
import { Users, MapPin, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_STATUS_BADGE_VARIANT } from "@/lib/tournament-status";
import type { TournamentWithRelations } from "@/lib/supabase/types";

export function TournamentCard({ tournament }: { tournament: TournamentWithRelations }) {
  const teamCount = tournament.tournament_teams?.[0]?.count ?? 0;

  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{tournament.games?.name ?? "Unknown game"}</Badge>
              <Badge variant="muted">
                {tournament.team_size}v{tournament.team_size}
              </Badge>
              <Badge variant={TOURNAMENT_STATUS_BADGE_VARIANT[tournament.status]}>
                {TOURNAMENT_STATUS_LABEL[tournament.status]}
              </Badge>
            </div>
            <Link
              href={`/tournaments/${tournament.id}`}
              className="font-display text-lg leading-snug transition-colors hover:text-primary"
            >
              {tournament.name}
            </Link>
            {tournament.profiles?.username ? (
              <Link
                href={`/players/${tournament.profiles.username}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Hosted by @{tournament.profiles.username}
              </Link>
            ) : null}
          </div>
          <Trophy className="size-6 shrink-0 text-secondary" />
        </div>

        {tournament.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {tournament.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {teamCount}
            {tournament.max_teams ? ` / ${tournament.max_teams}` : ""} teams
          </span>
          {tournament.region ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {tournament.region}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
