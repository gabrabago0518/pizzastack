import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { HighlightCard } from "@/components/site/highlight-card";
import { Button } from "@/components/ui/button";
import { getGames, getApprovedHighlights } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Highlights",
  description: "Watch player-uploaded gaming highlight reels on Pizzastack.gg.",
  alternates: { canonical: "/highlights" },
};

export default async function HighlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const [games, highlights] = await Promise.all([getGames(), getApprovedHighlights(game)]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Clip it"
          title="Highlights"
          description="Player-uploaded clips, reviewed before they go live."
          className="mb-0"
        />
        <Button asChild variant="secondary">
          <Link href="/highlights/new">
            <Plus /> Upload a highlight
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <GameFilter games={games} active={game} basePath="/highlights" />
      </div>

      {highlights.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No highlights{game ? " for this game" : ""} yet — be the first to upload one.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((highlight) => (
            <HighlightCard key={highlight.id} highlight={highlight} />
          ))}
        </div>
      )}
    </Section>
  );
}
