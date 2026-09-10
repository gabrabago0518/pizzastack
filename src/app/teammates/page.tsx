import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GamePosterCard } from "@/components/site/game-poster-card";
import { ListingFilters } from "@/components/site/listing-filters";
import { LfgPostCard } from "@/components/site/lfg-post-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getGames, getLfgPosts, getJoinRequestsForPosts } from "@/lib/queries";
import type { JoinRequestWithRequester } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Find Teammates",
  description:
    "Browse open LFG listings from players looking for a squad, a duo, or a fifth. Pick a game and filter by rank, role, or mode.",
  alternates: { canonical: "/teammates" },
};

const ALL_GAMES_TILE = { name: "All games", slug: "all", cover_url: null };

export default async function TeammatesPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; rank?: string; role?: string; mode?: string }>;
}) {
  const { game, rank, role, mode } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const games = await getGames();
  const posts = game ? await getLfgPosts(game, { rank, role, mode }) : [];
  const selectedGame =
    game && game !== "all" ? games.find((g) => g.slug === game) : undefined;
  const selectedTile = game === "all" ? ALL_GAMES_TILE : selectedGame;

  const joinRequests = viewer
    ? await getJoinRequestsForPosts(posts.map((post) => post.id))
    : [];

  const myRequestByPost = new Map<string, JoinRequestWithRequester>();
  const pendingByPost = new Map<string, JoinRequestWithRequester[]>();
  const partyMembersByPost = new Map<string, JoinRequestWithRequester[]>();
  for (const request of joinRequests) {
    if (request.requester_id === viewer?.id) {
      myRequestByPost.set(request.post_id, request);
    } else if (request.status === "pending") {
      const list = pendingByPost.get(request.post_id) ?? [];
      list.push(request);
      pendingByPost.set(request.post_id, list);
    } else if (request.status === "accepted") {
      const list = partyMembersByPost.get(request.post_id) ?? [];
      list.push(request);
      partyMembersByPost.set(request.post_id, list);
    }
  }

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Squad up"
          title="Find teammates"
          description="Pick a game, then browse open listings from players looking for a squad, a duo, or a fifth."
          className="mb-0"
        />
        <Button asChild>
          <Link href="/teammates/new">
            <Plus /> Post a listing
          </Link>
        </Button>
      </div>

      {selectedTile ? (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 lg:w-40">
            <GamePosterCard game={selectedTile} href="/teammates" compact />
            <Link
              href="/teammates"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Change game
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {selectedGame ? (
              <ListingFilters gameSlug={selectedGame.slug} rank={rank} role={role} mode={mode} />
            ) : null}

            {posts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                No open listings match these filters yet — be the first to post
                one.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <LfgPostCard
                    key={post.id}
                    post={post}
                    viewerId={viewer?.id}
                    myRequestId={myRequestByPost.get(post.id)?.id}
                    myRequestStatus={myRequestByPost.get(post.id)?.status ?? "none"}
                    pendingRequests={pendingByPost.get(post.id) ?? []}
                    partyMembers={partyMembersByPost.get(post.id) ?? []}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <GamePosterCard game={ALL_GAMES_TILE} href="/teammates?game=all" />
          {games.map((g) => (
            <GamePosterCard key={g.id} game={g} href={`/teammates?game=${g.slug}`} />
          ))}
        </div>
      )}
    </Section>
  );
}
