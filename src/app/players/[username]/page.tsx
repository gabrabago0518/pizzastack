import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Section } from "@/components/site/section";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { LfgPostsList, CoachProfilesList } from "@/components/site/activity-lists";
import { Badge } from "@/components/ui/badge";
import {
  getProfileByUsername,
  getLfgPostsByAuthor,
  getCoachProfilesByAuthor,
  getGamesForProfile,
} from "@/lib/queries";

interface PlayerPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} — Pizzastack.gg` };
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [posts, coachProfiles, games] = await Promise.all([
    getLfgPostsByAuthor(profile.id),
    getCoachProfilesByAuthor(profile.id),
    getGamesForProfile(profile.id),
  ]);

  const label = profile.display_name || profile.username;

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <AvatarDisplay url={profile.avatar_url} label={label} />
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <h1 className="font-display text-3xl">{label}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.region ? <Badge variant="muted">{profile.region}</Badge> : null}
          {games.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              {games.map((game) => (
                <Badge key={game.id} variant="secondary">
                  {game.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground sm:mx-0 sm:text-left">
          {profile.bio}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Listings</h2>
          <LfgPostsList
            posts={posts}
            emptyText={`@${profile.username} hasn't posted any listings.`}
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Coaching</h2>
          <CoachProfilesList
            coachProfiles={coachProfiles}
            emptyText={`@${profile.username} isn't listed as a coach.`}
          />
        </div>
      </div>
    </Section>
  );
}
