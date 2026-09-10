import Link from "next/link";
import type { Metadata } from "next";
import { Plus, ArrowLeft } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { GameFilter } from "@/components/site/game-filter";
import { CoachingRequestFilters } from "@/components/site/coaching-request-filters";
import { CoachingRequestCard } from "@/components/site/coaching-request-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getGames, getCoachingRequests } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Looking for a Coach",
  description:
    "Post what you're looking for in a coach — game, rank, region, and what you want to learn — and let coaches reach out to you.",
  alternates: { canonical: "/coaches/looking-for-coach" },
};

export default async function LookingForCoachPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; rank?: string; region?: string }>;
}) {
  const { game, rank, region } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [games, requests] = await Promise.all([
    getGames(),
    getCoachingRequests(game, { rank, region }),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Level up"
          title="Looking for a coach"
          description="Post what you need and let coaches come to you — no fees, just reach out."
          className="mb-0"
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/coaches">
              <ArrowLeft /> Browse coaches
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/coaches/looking-for-coach/new">
              <Plus /> Post a listing
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-5">
        <GameFilter games={games} active={game} basePath="/coaches/looking-for-coach" />
      </div>

      <div className="mb-8">
        <CoachingRequestFilters gameSlug={game} rank={rank} region={region} />
      </div>

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {rank || region
            ? "No listings match these filters yet."
            : `No one's looking for a coach${game ? " for this game" : ""} yet — be the first.`}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <CoachingRequestCard key={request.id} request={request} viewerId={user?.id} />
          ))}
        </div>
      )}
    </Section>
  );
}
