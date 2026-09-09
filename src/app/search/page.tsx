import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";

import { Section } from "@/components/site/section";
import { PlayerResultCard } from "@/components/site/player-result-card";
import { LfgPostCard } from "@/components/site/lfg-post-card";
import { CoachCard } from "@/components/site/coach-card";
import {
  searchProfiles,
  searchLfgPosts,
  searchCoachProfiles,
} from "@/lib/queries";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" — Search — Pizzastack.gg` : "Search — Pizzastack.gg" };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [players, posts, coaches] = query
    ? await Promise.all([
        searchProfiles(query),
        searchLfgPosts(query),
        searchCoachProfiles(query),
      ])
    : [[], [], []];

  const hasResults = players.length + posts.length + coaches.length > 0;

  return (
    <Section className="!pb-24">
      <div className="mb-10">
        <h1 className="mb-5 font-display text-3xl">Search</h1>
        <form action="/search" method="GET" className="relative max-w-lg">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search players, coaches, or squads..."
            autoFocus
            className="h-11 w-full rounded-full border border-input bg-transparent pr-4 pl-10 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </form>
      </div>

      {!query ? (
        <p className="text-muted-foreground">
          Search for a player&apos;s username, a squad listing, or a coach.
        </p>
      ) : !hasResults ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No results for &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-12">
          {players.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Players</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((profile) => (
                  <PlayerResultCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          ) : null}

          {posts.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Squads</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <LfgPostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : null}

          {coaches.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Coaches</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {coaches.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}
