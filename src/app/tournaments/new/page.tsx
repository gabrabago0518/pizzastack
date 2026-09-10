import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { TournamentForm } from "@/components/site/tournament-form";
import { createClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Create Tournament",
  robots: { index: false, follow: false },
};

export default async function NewTournamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Create a tournament</h1>
        <p className="mb-8 text-muted-foreground">
          You&apos;ll manage registration, seeding, and results as the
          organizer — the bracket builds itself once you start it.
        </p>
        <TournamentForm games={games} />
      </div>
    </Section>
  );
}
