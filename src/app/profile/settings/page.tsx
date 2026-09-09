import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/site/section";
import { ProfileForm } from "@/components/site/profile-form";
import { GamesPicker } from "@/components/site/games-picker";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getGames, getGamesForProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Profile settings — Pizzastack.gg",
};

export default async function ProfileSettingsPage() {
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

        <Card className="mb-8">
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg">Games you play</h2>
            <p className="text-sm text-muted-foreground">
              Tap a game to add or remove it from your profile.
            </p>
          </div>
          <GamesPicker
            allGames={allGames}
            initialSelectedIds={myGames.map((game) => game.id)}
          />
        </div>
      </div>
    </Section>
  );
}
