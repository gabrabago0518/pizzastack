import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/site/section";
import { AvatarUpload } from "@/components/site/avatar-upload";
import { ProfileForm } from "@/components/site/profile-form";
import { SteamConnect } from "@/components/site/steam-connect";
import { RiotConnect } from "@/components/site/riot-connect";
import { MlbbConnect } from "@/components/site/mlbb-connect";
import { DeleteAccountButton } from "@/components/site/delete-account-button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getGames, getGamesForProfile, getMyMlbbVerification } from "@/lib/queries";

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
  if (!profile) redirect("/");

  const [allGames, myGames, { count: ownedGuildCount }, myMlbbVerification] = await Promise.all([
    getGames(),
    getGamesForProfile(user.id),
    supabase.from("guilds").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
    getMyMlbbVerification(user.id),
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

        <div className="mt-8">
          <h2 className="mb-1 font-display text-lg">Linked Accounts</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Connect your in-game accounts to show verified ranks and let
            other players find you.
          </p>
          <div className="flex flex-col gap-4">
            <SteamConnect
              connected={Boolean(profile.steam_id)}
              dotaRankTier={profile.dota_rank_tier}
              dotaLeaderboardRank={profile.dota_leaderboard_rank}
              cs2PremierRating={profile.cs2_premier_rating}
              cs2CompetitiveRank={profile.cs2_competitive_rank}
              steamPersonaName={profile.steam_persona_name}
              syncedAt={
                [profile.dota_rank_synced_at, profile.cs2_rank_synced_at]
                  .filter((date): date is string => Boolean(date))
                  .sort()
                  .at(-1) ?? null
              }
              statusParam={steam}
            />

            <RiotConnect
              riotName={profile.riot_name}
              riotTag={profile.riot_tag}
              riotRegion={profile.riot_region}
              valorantTier={profile.valorant_tier}
              valorantTierIcon={profile.valorant_tier_icon}
              syncedAt={profile.valorant_rank_synced_at}
            />

            <MlbbConnect
              mlbbUserId={profile.mlbb_user_id}
              mlbbServer={profile.mlbb_server}
              mlbbIgn={profile.mlbb_ign}
              rankTier={profile.mlbb_rank_tier}
              subRank={profile.mlbb_sub_rank}
              highestStar={profile.mlbb_highest_star}
              verifiedAt={profile.mlbb_verified_at}
              latestVerification={myMlbbVerification ?? null}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-xl border border-destructive/30 p-5">
          <div>
            <h2 className="font-display text-lg">Danger zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and everything tied to it.
            </p>
          </div>
          <div className="flex justify-end">
            <DeleteAccountButton isGuildLeader={Boolean(ownedGuildCount)} />
          </div>
        </div>
      </div>
    </Section>
  );
}
