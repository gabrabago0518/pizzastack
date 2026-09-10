import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { ScrimmageFilters } from "@/components/site/scrimmage-filters";
import { ScrimmageCard } from "@/components/site/scrimmage-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getGames, getScrimmages } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Scrimmages",
  description:
    "Post your game, region, and when you want to scrim — or browse open scrim slots and reach out directly.",
  alternates: { canonical: "/scrims" },
};

export default async function ScrimsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; region?: string }>;
}) {
  const { game, region } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [games, scrimmages] = await Promise.all([
    getGames(),
    getScrimmages(game, { region }),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Practice"
          title="Scrimmages"
          description="Post when you're free to scrim, or browse open slots and reach out directly."
          className="mb-0"
        />
        <Button asChild variant="secondary">
          <Link href="/scrims/new">
            <Plus /> Post a scrim
          </Link>
        </Button>
      </div>

      <div className="mb-5">
        <GameFilter games={games} active={game} basePath="/scrims" />
      </div>

      <div className="mb-8">
        <ScrimmageFilters gameSlug={game} region={region} />
      </div>

      {scrimmages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {region
            ? "No scrims match these filters yet."
            : `No open scrims${game ? " for this game" : ""} yet — be the first.`}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {scrimmages.map((scrimmage) => (
            <ScrimmageCard key={scrimmage.id} scrimmage={scrimmage} viewerId={user?.id} />
          ))}
        </div>
      )}
    </Section>
  );
}
