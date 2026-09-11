import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { HighlightForm } from "@/components/site/highlight-form";
import { createClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Upload a Highlight",
  robots: { index: false, follow: false },
};

export default async function NewHighlightPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Upload a highlight</h1>
        <p className="mb-8 text-muted-foreground">
          Share a gaming clip with the community. An admin reviews every
          upload before it&apos;s publicly visible — you&apos;ll see it on
          your profile right away either way.
        </p>
        <HighlightForm games={games} />
      </div>
    </Section>
  );
}
