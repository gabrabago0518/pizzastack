import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { GuildForm } from "@/components/site/guild-form";
import { createClient } from "@/lib/supabase/server";
import { getGames, getMyGuildMembership } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Create a Guild",
  robots: { index: false, follow: false },
};

export default async function NewGuildPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await getMyGuildMembership(user.id);
  if (membership) redirect(`/guilds/${membership.guild_id}`);

  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Create a guild</h1>
        <p className="mb-8 text-muted-foreground">
          A persistent home for your crew — chat, a roster, and a page other
          players can find and join.
        </p>
        <GuildForm games={games} />
      </div>
    </Section>
  );
}
