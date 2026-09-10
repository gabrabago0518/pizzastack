import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { ScrimmageForm } from "@/components/site/scrimmage-form";
import { createClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Post a Scrim",
  robots: { index: false, follow: false },
};

export default async function NewScrimmagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Post a scrim</h1>
        <p className="mb-8 text-muted-foreground">
          Let other teams know your game, region, and when you&apos;re free to
          play. You can post more than one time slot if you&apos;re open to
          several.
        </p>
        <ScrimmageForm games={games} />
      </div>
    </Section>
  );
}
