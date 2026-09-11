import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Section } from "@/components/site/section";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { RankBanner } from "@/components/site/rank-banner";
import {
  CommendProvider,
  CommendCount,
  CommendToggleButton,
} from "@/components/site/commend-button";
import { LfgPostsList, CoachProfilesList } from "@/components/site/activity-lists";
import { MostPlayedList } from "@/components/site/most-played-list";
import { ReportPlayerDialog } from "@/components/site/report-player-dialog";
import { PrimeBadge } from "@/components/site/prime-badge";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getProfileByUsername,
  getLfgPostsByAuthor,
  getCoachProfilesByAuthor,
  getGamesForProfile,
  getCommendCount,
  hasCommended,
  getTopHeroesForProfile,
} from "@/lib/queries";

interface PlayerPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Player not found" };

  const label = profile.display_name || profile.username;
  const description = profile.bio
    ? profile.bio.slice(0, 155)
    : `@${profile.username}'s gaming profile on Pizzastack.gg${
        profile.region ? ` — ${profile.region}` : ""
      }.`;

  return {
    title: `${label} (@${profile.username})`,
    description,
  };
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const isOwnProfile = viewer?.id === profile.id;

  const [posts, coachProfiles, games, commendCount, viewerHasCommended, topHeroes] =
    await Promise.all([
      getLfgPostsByAuthor(profile.id),
      getCoachProfilesByAuthor(profile.id),
      getGamesForProfile(profile.id),
      getCommendCount(profile.id),
      viewer && !isOwnProfile ? hasCommended(profile.id, viewer.id) : false,
      getTopHeroesForProfile(profile.id),
    ]);

  const label = profile.display_name || profile.username;

  return (
    <Section className="!pb-24">
      <CommendProvider
        profileId={profile.id}
        initialCommended={viewerHasCommended}
        initialCount={commendCount}
      >
        <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <AvatarDisplay url={profile.avatar_url} label={label} />
            <div className="flex flex-col items-center gap-1.5 sm:items-start">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="font-display text-3xl">{label}</h1>
                {profile.account_tier === "prime" ? <PrimeBadge /> : null}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {profile.region ? <Badge variant="muted">{profile.region}</Badge> : null}
                <CommendCount />
              </div>
              {profile.show_games && games.length > 0 ? (
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

          {viewer && !isOwnProfile ? (
            <div className="flex items-center gap-2">
              <CommendToggleButton />
              <ReportPlayerDialog profileId={profile.id} username={profile.username} />
            </div>
          ) : null}
        </div>
      </CommendProvider>

      {profile.bio ? (
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground sm:mx-0 sm:text-left">
          {profile.bio}
        </p>
      ) : null}

      {profile.show_ranks ? (
        <RankBanner
          dotaRankTier={profile.dota_rank_tier}
          dotaLeaderboardRank={profile.dota_leaderboard_rank}
          dotaTotalMatches={profile.dota_total_matches}
          dotaHoursPlayed={profile.dota_hours_played}
          cs2PremierRating={profile.cs2_premier_rating}
          cs2CompetitiveRank={profile.cs2_competitive_rank}
        />
      ) : null}

      {profile.show_most_played ? (
        <div className="mb-10 flex flex-col gap-4">
          <h2 className="font-display text-xl">Most played</h2>
          <MostPlayedList
            topHeroes={topHeroes}
            emptyText={`@${profile.username} has no synced matches yet.`}
          />
        </div>
      ) : null}

      {profile.show_listings || profile.show_coaching ? (
        <div className="grid gap-8 lg:grid-cols-2">
          {profile.show_listings ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Listings</h2>
              <LfgPostsList
                posts={posts}
                emptyText={`@${profile.username} hasn't posted any listings.`}
              />
            </div>
          ) : null}
          {profile.show_coaching ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-xl">Coaching</h2>
              <CoachProfilesList
                coachProfiles={coachProfiles}
                emptyText={`@${profile.username} isn't listed as a coach.`}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </Section>
  );
}
