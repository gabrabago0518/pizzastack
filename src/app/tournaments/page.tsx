import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { TournamentCard } from "@/components/site/tournament-card";
import { Button } from "@/components/ui/button";
import { getGames, getTournaments } from "@/lib/queries";
import type { Tournament } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Tournaments",
  description:
    "Browse and join community tournaments, or create your own single-elimination bracket.",
  alternates: { canonical: "/tournaments" },
};

const STATUS_FILTERS: { value: Tournament["status"] | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; status?: string }>;
}) {
  const { game, status } = await searchParams;
  const validStatus = (["open", "in_progress", "completed", "cancelled"] as const).includes(
    status as Tournament["status"],
  )
    ? (status as Tournament["status"])
    : undefined;

  const [games, tournaments] = await Promise.all([
    getGames(),
    getTournaments(game, { status: validStatus }),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Compete"
          title="Tournaments"
          description="Join a bracket, or start your own — single elimination, generated automatically."
          className="mb-0"
        />
        <Button asChild variant="secondary">
          <Link href="/tournaments/new">
            <Plus /> Create tournament
          </Link>
        </Button>
      </div>

      <div className="mb-5">
        <GameFilter games={games} active={game} basePath="/tournaments" />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const href = [
            game ? `game=${game}` : null,
            filter.value ? `status=${filter.value}` : null,
          ]
            .filter(Boolean)
            .join("&");
          const active = (validStatus ?? undefined) === filter.value;
          return (
            <Link
              key={filter.label}
              href={href ? `/tournaments?${href}` : "/tournaments"}
              className={
                active
                  ? "rounded-full border border-transparent bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
                  : "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:scale-[1.04] hover:text-foreground active:scale-[0.97]"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {tournaments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No tournaments{game || validStatus ? " match these filters" : " yet"} — be the first.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </Section>
  );
}
