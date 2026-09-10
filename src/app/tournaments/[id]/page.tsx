import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, MapPin } from "lucide-react";

import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TournamentJoinButton } from "@/components/site/tournament-join-button";
import { TournamentOrganizerControls } from "@/components/site/tournament-organizer-controls";
import { TournamentRoster } from "@/components/site/tournament-roster";
import { TournamentBracket } from "@/components/site/tournament-bracket";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_STATUS_BADGE_VARIANT } from "@/lib/tournament-status";
import { createClient } from "@/lib/supabase/server";
import {
  getTournamentById,
  getTournamentParticipants,
  getTournamentMatches,
  getMyTournamentParticipant,
} from "@/lib/queries";

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

  const [participants, matches, myParticipantId] = await Promise.all([
    getTournamentParticipants(tournament.id),
    tournament.status === "open" ? Promise.resolve([]) : getTournamentMatches(tournament.id),
    viewer ? getMyTournamentParticipant(tournament.id, viewer.id) : null,
  ]);

  const isOrganizer = viewer?.id === tournament.organizer_id;
  const isRegistered = Boolean(myParticipantId);
  const isFull = Boolean(
    tournament.max_participants && participants.length >= tournament.max_participants,
  );

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
              {participants.length}
              {tournament.max_participants ? ` / ${tournament.max_participants}` : ""} players
            </span>
          </div>
        </div>

        {viewer ? (
          isOrganizer && tournament.status === "open" ? (
            <TournamentOrganizerControls
              tournamentId={tournament.id}
              participantCount={participants.length}
            />
          ) : !isOrganizer && tournament.status === "open" ? (
            <TournamentJoinButton
              tournamentId={tournament.id}
              isRegistered={isRegistered}
              isFull={isFull}
            />
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
          <h2 className="font-display text-xl">Registered players</h2>
          <TournamentRoster
            tournamentId={tournament.id}
            participants={participants}
            canManage={isOrganizer}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Bracket</h2>
          <TournamentBracket
            tournamentId={tournament.id}
            matches={matches}
            participants={participants}
            canReport={isOrganizer && tournament.status === "in_progress"}
          />
        </div>
      )}
    </Section>
  );
}
