import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { CoachForm } from "@/components/site/coach-form";
import { createClient } from "@/lib/supabase/server";
import { getGames, getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Become a Coach",
  robots: { index: false, follow: false },
};

export default async function NewCoachProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [games, profile] = await Promise.all([getGames(), getProfile(user.id)]);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Become a coach</h1>
        <p className="mb-8 text-muted-foreground">
          List yourself in the coach directory for a game you know well.
          Players will see your contact info directly — no booking system,
          no fees.
        </p>
        <CoachForm
          games={games}
          dotaRankTier={profile?.dota_rank_tier ?? null}
          dotaLeaderboardRank={profile?.dota_leaderboard_rank ?? null}
        />
      </div>
    </Section>
  );
}
