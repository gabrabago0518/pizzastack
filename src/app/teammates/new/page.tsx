import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { LfgForm } from "@/components/site/lfg-form";
import { createClient } from "@/lib/supabase/server";
import { getGames, getProfile } from "@/lib/queries";

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
        />
      </div>
    </Section>
  );
}
