import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExternalLink, Settings } from "lucide-react";

import { Section } from "@/components/site/section";
import { AvatarUpload } from "@/components/site/avatar-upload";
import { LfgPostsList, CoachProfilesList } from "@/components/site/activity-lists";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  getLfgPostsByAuthor,
  getCoachProfilesByAuthor,
  getGamesForProfile,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Your profile — Pizzastack.gg",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/dashboard");

  const [posts, coachProfiles, games] = await Promise.all([
    getLfgPostsByAuthor(user.id),
    getCoachProfilesByAuthor(user.id),
    getGamesForProfile(user.id),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AvatarUpload
            initialUrl={profile.avatar_url}
            displayLabel={profile.display_name || profile.username}
          />
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <h1 className="font-display text-3xl">
              {profile.display_name || `@${profile.username}`}
            </h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {profile.region ? <Badge variant="muted">{profile.region}</Badge> : null}
              <Link
                href={`/players/${profile.username}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View public profile <ExternalLink className="size-3.5" />
              </Link>
            </div>
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

        <Button asChild variant="outline">
          <Link href="/profile/settings">
            <Settings /> Profile settings
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Your listings</h2>
          <LfgPostsList
            posts={posts}
            emptyText="You haven't posted a listing yet."
          />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Your coach listings</h2>
          <CoachProfilesList
            coachProfiles={coachProfiles}
            emptyText="You're not listed as a coach yet."
          />
        </div>
      </div>
    </Section>
  );
}
