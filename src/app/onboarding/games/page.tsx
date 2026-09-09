import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingGamesForm } from "@/components/site/onboarding-games-form";
import { createClient } from "@/lib/supabase/server";
import { getGames, getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "What Do You Play?",
  robots: { index: false, follow: false },
};

export default async function OnboardingGamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile?.onboarded) redirect("/dashboard");

  const games = await getGames();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">What do you play?</h1>
      <p className="mb-8 text-muted-foreground">
        Pick the games you play so other players and coaches can find you.
        You can always change this later in your profile settings.
      </p>
      <OnboardingGamesForm games={games} />
    </div>
  );
}
