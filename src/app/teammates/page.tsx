import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { LfgPostCard } from "@/components/site/lfg-post-card";
import { Button } from "@/components/ui/button";
import { getGames, getLfgPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Find Teammates — Pizzastack",
};

export default async function TeammatesPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const [games, posts] = await Promise.all([getGames(), getLfgPosts(game)]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Squad up"
          title="Find teammates"
          description="Browse open listings from players looking for a squad, a duo, or a fifth."
          className="mb-0"
        />
        <Button asChild>
          <Link href="/teammates/new">
            <Plus /> Post a listing
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <GameFilter games={games} active={game} basePath="/teammates" />
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No open listings{game ? " for this game" : ""} yet — be the first to
          post one.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <LfgPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </Section>
  );
}
