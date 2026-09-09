import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/site/section";
import { AvatarUpload } from "@/components/site/avatar-upload";
import { ProfileForm } from "@/components/site/profile-form";
import { SteamConnect } from "@/components/site/steam-connect";
import { RiotConnect } from "@/components/site/riot-connect";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getGames, getGamesForProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Profile Settings",
  robots: { index: false, follow: false },
};

interface ProfileSettingsPageProps {
  searchParams: Promise<{ steam?: string }>;
}

export default async function ProfileSettingsPage({
  searchParams,
}: ProfileSettingsPageProps) {
  const { steam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/dashboard");

  const [allGames, myGames] = await Promise.all([
    getGames(),
    getGamesForProfile(user.id),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <Link
          href="/profile"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to profile
        </Link>
        <h1 className="mb-2 font-display text-3xl">Profile settings</h1>
        <p className="mb-8 text-muted-foreground">
          This is what other players see on your listings and coach profile.
        </p>

        <Card>
          <CardContent>
            <div className="mb-6 flex justify-center">
              <AvatarUpload
                initialUrl={profile.avatar_url}
                displayLabel={profile.display_name || profile.username}
              />
            </div>
            <ProfileForm
              profile={profile}
              allGames={allGames}
              initialSelectedGameIds={myGames.map((game) => game.id)}
            />
          </CardContent>
        </Card>

        <div className="mt-6">
          <SteamConnect
            connected={Boolean(profile.steam_id)}
            dotaRankTier={profile.dota_rank_tier}
            dotaLeaderboardRank={profile.dota_leaderboard_rank}
            cs2PremierRating={profile.cs2_premier_rating}
            cs2CompetitiveRank={profile.cs2_competitive_rank}
            syncedAt={
              [profile.dota_rank_synced_at, profile.cs2_rank_synced_at]
                .filter((date): date is string => Boolean(date))
                .sort()
                .at(-1) ?? null
            }
            statusParam={steam}
          />
        </div>

        <div className="mt-6">
          <RiotConnect
            riotName={profile.riot_name}
            riotTag={profile.riot_tag}
            riotRegion={profile.riot_region}
            valorantTier={profile.valorant_tier}
            valorantRr={profile.valorant_rr}
            syncedAt={profile.valorant_rank_synced_at}
          />
        </div>
      </div>
    </Section>
  );
}
