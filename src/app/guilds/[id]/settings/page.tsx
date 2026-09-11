import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/site/section";
import { GuildAvatarUpload } from "@/components/site/guild-avatar-upload";
import { GuildSettingsForm } from "@/components/site/guild-settings-form";
import { GuildGamesPicker } from "@/components/site/guild-games-picker";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getGuildById, getGames, getGamesForGuild } from "@/lib/queries";

interface GuildSettingsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Guild Settings",
  robots: { index: false, follow: false },
};

export default async function GuildSettingsPage({ params }: GuildSettingsPageProps) {
  const { id } = await params;
  const guild = await getGuildById(id);
  if (!guild) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.id !== guild.owner_id) redirect(`/guilds/${guild.id}`);

  const [allGames, guildGames] = await Promise.all([
    getGames(),
    getGamesForGuild(guild.id),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/guilds/${guild.id}`}
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to guild
        </Link>
        <h1 className="mb-2 font-display text-3xl">Guild settings</h1>
        <p className="mb-8 text-muted-foreground">
          This is what other players see on {guild.name}&apos;s guild page.
        </p>

        <Card>
          <CardContent>
            <div className="mb-6 flex justify-center">
              <GuildAvatarUpload
                guildId={guild.id}
                initialUrl={guild.avatar_url}
                displayLabel={guild.name}
              />
            </div>
            <GuildSettingsForm guild={guild} />

            <div className="mt-6 flex flex-col gap-1.5 border-t border-border/60 pt-6">
              <p className="text-sm font-medium">Other games this guild plays</p>
              <p className="mb-1 text-sm text-muted-foreground">
                {guild.games?.name
                  ? `${guild.games.name} is the guild's primary game, set when it was created. Tap to add any other games your guild plays.`
                  : "Tap a game to add or remove it from your guild."}
              </p>
              <GuildGamesPicker
                guildId={guild.id}
                allGames={allGames}
                initialSelectedIds={guildGames.map((game) => game.id)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
