import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

import { Section } from "@/components/site/section";
import { LfgForm } from "@/components/site/lfg-form";
import { ListingLoadingOverlay } from "@/components/site/listing-loading-overlay";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getGames, getProfile, getOwnOpenListingId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Post a Listing",
  robots: { index: false, follow: false },
};

export default async function NewLfgPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ownOpenListingId = await getOwnOpenListingId(user.id);
  if (ownOpenListingId) {
    return (
      <Section className="!pb-24">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-6" />
          </span>
          <h1 className="font-display text-3xl">Post a listing</h1>
          <p className="text-muted-foreground">
            You already have an active listing — close it before posting a new one.
          </p>
          <Button asChild size="lg">
            <Link href={`/teammates/${ownOpenListingId}`}>
              View your listing
              <ListingLoadingOverlay />
            </Link>
          </Button>
        </div>
      </Section>
    );
  }

  const [games, profile] = await Promise.all([getGames(), getProfile(user.id)]);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Post a listing</h1>
        <p className="mb-8 text-muted-foreground">
          Tell other players what you&apos;re looking for. Your listing goes
          live immediately on the teammates board.
        </p>
        <LfgForm
          games={games}
          dotaRankTier={profile?.dota_rank_tier ?? null}
          dotaLeaderboardRank={profile?.dota_leaderboard_rank ?? null}
          cs2PremierRating={profile?.cs2_premier_rating ?? null}
          cs2CompetitiveRank={profile?.cs2_competitive_rank ?? null}
          valorantTier={profile?.valorant_tier ?? null}
          valorantRr={profile?.valorant_rr ?? null}
        />
      </div>
    </Section>
  );
}
