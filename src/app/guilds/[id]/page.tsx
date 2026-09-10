import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, MapPin } from "lucide-react";

import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GuildJoinButton } from "@/components/site/guild-join-button";
import { GuildMemberList } from "@/components/site/guild-member-list";
import { GuildChat } from "@/components/site/guild-chat";
import { DeleteGuildButton } from "@/components/site/delete-guild-button";
import { createClient } from "@/lib/supabase/server";
import {
  getGuildById,
  getGuildMembers,
  getGuildMessages,
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

  const [members, myMembership] = await Promise.all([
    getGuildMembers(guild.id),
    viewer ? getMyGuildMembership(viewer.id) : null,
  ]);

  const isMember = members.some((member) => member.profile_id === viewer?.id);
  const isLeader = viewer?.id === guild.owner_id;
  const alreadyInAnotherGuild = Boolean(myMembership && myMembership.guild_id !== guild.id);

  const messages = isMember ? await getGuildMessages(guild.id) : [];

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/guilds"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to guilds
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">[{guild.tag}]</Badge>
                  {guild.games?.name ? <Badge variant="muted">{guild.games.name}</Badge> : null}
                  {guild.region ? (
                    <Badge variant="outline">
                      <MapPin className="size-3" /> {guild.region}
                    </Badge>
                  ) : null}
                </div>
                <h1 className="font-display text-2xl leading-snug">{guild.name}</h1>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  {guild.member_count} {guild.member_count === 1 ? "member" : "members"}
                </span>
              </div>

              {viewer ? (
                isLeader ? (
                  <DeleteGuildButton guildId={guild.id} />
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
              <p className="leading-relaxed text-muted-foreground">{guild.description}</p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
              <h2 className="text-sm font-medium">Roster</h2>
              <GuildMemberList
                guildId={guild.id}
                members={members}
                viewerId={viewer?.id}
                isLeader={isLeader}
              />
            </div>

            {isMember && viewer ? (
              <GuildChat guildId={guild.id} viewerId={viewer.id} initialMessages={messages} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
