import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { CoachFilters } from "@/components/site/coach-filters";
import { CoachCard } from "@/components/site/coach-card";
import { Button } from "@/components/ui/button";
import { getGames, getCoachProfiles } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Coaches",
  description:
    "Browse players who coach your game and reach out directly — no fees, no booking system.",
  alternates: { canonical: "/coaches" },
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{
    game?: string;
    rank?: string;
    minRating?: string;
    sort?: string;
  }>;
}) {
  const { game, rank, minRating, sort } = await searchParams;
  const validSort = sort === "rating" || sort === "reviews" ? sort : "newest";
  const [games, coaches] = await Promise.all([
    getGames(),
    getCoachProfiles(game, {
      rank,
      minRating: minRating ? Number(minRating) : undefined,
      sort: validSort,
    }),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Level up"
          title="Coaches"
          description="Connect directly with players who coach — no fees, just reach out."
          className="mb-0"
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/coaches/looking-for-coach">
              <Search /> Looking for a coach?
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/coaches/new">
              <Plus /> Become a coach
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-5">
        <GameFilter games={games} active={game} basePath="/coaches" />
      </div>

      <div className="mb-8">
        <CoachFilters gameSlug={game} rank={rank} minRating={minRating} sort={sort} />
      </div>

      {coaches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {rank || minRating
            ? "No coaches match these filters yet."
            : `No coaches listed${game ? " for this game" : ""} yet — be the first.`}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}
    </Section>
  );
}
