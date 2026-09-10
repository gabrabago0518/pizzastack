import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { GuildCard } from "@/components/site/guild-card";
import { Button } from "@/components/ui/button";
import { getGames, getGuilds } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Find a Guild",
  description:
    "Browse player-run guilds and communities on Pizzastack.gg, or start your own.",
  alternates: { canonical: "/guilds" },
};

export default async function GuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const [games, guilds] = await Promise.all([getGames(), getGuilds(game)]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Squad up, long term"
          title="Find a guild"
          description="Join a player-run community, or start your own."
          className="mb-0"
        />
        <Button asChild variant="secondary">
          <Link href="/guilds/new">
            <Plus /> Create a guild
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <GameFilter games={games} active={game} basePath="/guilds" />
      </div>

      {guilds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No guilds{game ? " for this game" : ""} yet — be the first to create one.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guilds.map((guild) => (
            <GuildCard key={guild.id} guild={guild} />
          ))}
        </div>
      )}
    </Section>
  );
}
