import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, MapPin } from "lucide-react";

import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TournamentOrganizerControls } from "@/components/site/tournament-organizer-controls";
import { TournamentTeamList } from "@/components/site/tournament-team-list";
import { TournamentBracket } from "@/components/site/tournament-bracket";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_STATUS_BADGE_VARIANT } from "@/lib/tournament-status";
import { createClient } from "@/lib/supabase/server";
import {
  getTournamentById,
  getTournamentTeams,
  getTournamentTeamMembers,
  getTournamentMatches,
  getMyTournamentTeam,
} from "@/lib/queries";
import type { TournamentTeamMemberWithProfile } from "@/lib/supabase/types";

interface TournamentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) return { title: "Tournament not found" };

  return {
    title: tournament.name,
    description: tournament.description || `${tournament.name} on Pizzastack.gg.`,
  };
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) notFound();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const [teams, matches, myTeam] = await Promise.all([
    getTournamentTeams(tournament.id),
    tournament.status === "open" ? Promise.resolve([]) : getTournamentMatches(tournament.id),
    viewer ? getMyTournamentTeam(tournament.id, viewer.id) : null,
  ]);

  const membersByTeamEntries = await Promise.all(
    teams.map(async (team) => [team.id, await getTournamentTeamMembers(team.id)] as const),
  );
  const membersByTeam: Record<string, TournamentTeamMemberWithProfile[]> =
    Object.fromEntries(membersByTeamEntries);

  const isOrganizer = viewer?.id === tournament.organizer_id;
  const isFull = Boolean(tournament.max_teams && teams.length >= tournament.max_teams);

  return (
    <Section className="!pb-24">
      <Link
        href="/tournaments"
        className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to tournaments
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {tournament.games?.name ? (
              <Badge variant="secondary">{tournament.games.name}</Badge>
            ) : null}
            <Badge variant="muted">
              {tournament.team_size}v{tournament.team_size}
            </Badge>
            <Badge variant={TOURNAMENT_STATUS_BADGE_VARIANT[tournament.status]}>
              {TOURNAMENT_STATUS_LABEL[tournament.status]}
            </Badge>
            {tournament.region ? (
              <Badge variant="outline">
                <MapPin className="size-3" /> {tournament.region}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-3xl leading-snug">{tournament.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {tournament.profiles?.username ? (
              <Link
                href={`/players/${tournament.profiles.username}`}
                className="transition-colors hover:text-foreground"
              >
                Hosted by @{tournament.profiles.username}
              </Link>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {teams.length}
              {tournament.max_teams ? ` / ${tournament.max_teams}` : ""} teams
            </span>
            {isFull ? <span>Registration full</span> : null}
          </div>
        </div>

        {viewer ? (
          isOrganizer && tournament.status === "open" ? (
            <TournamentOrganizerControls
              tournamentId={tournament.id}
              participantCount={teams.length}
            />
          ) : !isOrganizer && myTeam ? (
            <span className="text-sm text-muted-foreground">
              You&apos;re on <span className="font-medium text-foreground">{myTeam.teamName}</span>
            </span>
          ) : null
        ) : tournament.status === "open" ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Log in to join</Link>
          </Button>
        ) : null}
      </div>

      {tournament.description ? (
        <p className="mb-8 max-w-2xl leading-relaxed text-muted-foreground">
          {tournament.description}
        </p>
      ) : null}

      {tournament.status === "open" ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Teams</h2>
          <TournamentTeamList
            tournamentId={tournament.id}
            teams={teams}
            membersByTeam={membersByTeam}
            teamSize={tournament.team_size}
            viewerId={viewer?.id}
            myTeamId={myTeam?.teamId ?? null}
            isOrganizer={isOrganizer}
            canCreateTeam={!isFull}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Bracket</h2>
          <TournamentBracket
            tournamentId={tournament.id}
            matches={matches}
            teams={teams}
            canReport={isOrganizer && tournament.status === "in_progress"}
          />
        </div>
      )}
    </Section>
  );
}
