import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { CoachCard } from "@/components/site/coach-card";
import { Button } from "@/components/ui/button";
import { getGames, getCoachProfiles } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Find Coaches",
  description:
    "Browse players who coach your game and reach out directly — no fees, no booking system.",
  alternates: { canonical: "/coaches" },
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const [games, coaches] = await Promise.all([getGames(), getCoachProfiles(game)]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Level up"
          title="Find coaches"
          description="Connect directly with players who coach — no fees, just reach out."
          className="mb-0"
        />
        <Button asChild variant="secondary">
          <Link href="/coaches/new">
            <Plus /> Become a coach
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <GameFilter games={games} active={game} basePath="/coaches" />
      </div>

      {coaches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No coaches listed{game ? " for this game" : ""} yet — be the first.
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
