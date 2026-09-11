import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, MapPin, Settings } from "lucide-react";

import { Section } from "@/components/site/section";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GuildJoinButton } from "@/components/site/guild-join-button";
import { GuildMemberList } from "@/components/site/guild-member-list";
import { GuildChat } from "@/components/site/guild-chat";
import { GuildAnnouncements } from "@/components/site/guild-announcements";
import { GuildAchievements } from "@/components/site/guild-achievements";
import { DeleteGuildButton } from "@/components/site/delete-guild-button";
import { createClient } from "@/lib/supabase/server";
import {
  getGuildById,
  getGuildMembers,
  getGuildMessages,
  getGuildAnnouncements,
  getGuildAchievements,
  getGamesForGuild,
  getMyGuildMembership,
} from "@/lib/queries";

interface GuildPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GuildPageProps): Promise<Metadata> {
  const { id } = await params;
  const guild = await getGuildById(id);
  if (!guild) return { title: "Guild not found" };

  return {
    title: `[${guild.tag}] ${guild.name}`,
    description: guild.description || `${guild.name} on Pizzastack.gg.`,
  };
}

export default async function GuildPage({ params }: GuildPageProps) {
  const { id } = await params;
  const guild = await getGuildById(id);
  if (!guild) notFound();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const [members, myMembership, extraGames] = await Promise.all([
    getGuildMembers(guild.id),
    viewer ? getMyGuildMembership(viewer.id) : null,
    getGamesForGuild(guild.id),
  ]);

  const isMember = members.some((member) => member.profile_id === viewer?.id);
  const isLeader = viewer?.id === guild.owner_id;
  const alreadyInAnotherGuild = Boolean(myMembership && myMembership.guild_id !== guild.id);

  const [messages, announcements, achievements] = isMember
    ? await Promise.all([
        getGuildMessages(guild.id),
        getGuildAnnouncements(guild.id),
        getGuildAchievements(guild.id),
      ])
    : [[], [], []];

  return (
    <Section className="!pb-24">
      <Link
        href="/guilds"
        className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to guilds
      </Link>

      <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AvatarDisplay url={guild.avatar_url} label={guild.name} />
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-3xl">{guild.name}</h1>
              <Badge variant="secondary">[{guild.tag}]</Badge>
            </div>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              {guild.member_count} {guild.member_count === 1 ? "member" : "members"}
            </span>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              {guild.games?.name ? <Badge variant="muted">{guild.games.name}</Badge> : null}
              {extraGames.map((game) => (
                <Badge key={game.id} variant="muted">
                  {game.name}
                </Badge>
              ))}
              {guild.region ? (
                <Badge variant="outline">
                  <MapPin className="size-3" /> {guild.region}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {viewer ? (
          isLeader ? (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/guilds/${guild.id}/settings`}>
                  <Settings className="size-3.5" /> Edit guild
                </Link>
              </Button>
              <DeleteGuildButton guildId={guild.id} />
            </div>
          ) : (
            <GuildJoinButton
              guildId={guild.id}
              isMember={isMember}
              alreadyInAnotherGuild={alreadyInAnotherGuild}
            />
          )
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Log in to join</Link>
          </Button>
        )}
      </div>

      {guild.description ? (
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground sm:mx-0 sm:text-left">
          {guild.description}
        </p>
      ) : null}

      <div className="mb-10 flex flex-col gap-4">
        <h2 className="font-display text-xl">Roster</h2>
        <GuildMemberList
          guildId={guild.id}
          members={members}
          viewerId={viewer?.id}
          isLeader={isLeader}
        />
      </div>

      {isMember && viewer ? (
        <div className="flex flex-col gap-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Announcements</h2>
              <GuildAnnouncements
                guildId={guild.id}
                announcements={announcements}
                isLeader={isLeader}
              />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Achievements</h2>
              <GuildAchievements
                guildId={guild.id}
                achievements={achievements}
                isLeader={isLeader}
              />
            </div>
          </div>

          <GuildChat guildId={guild.id} viewerId={viewer.id} initialMessages={messages} />
        </div>
      ) : null}
    </Section>
  );
}
