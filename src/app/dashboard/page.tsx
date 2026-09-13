import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, Swords, UserCog, Plus } from "lucide-react";

import { Section } from "@/components/site/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LfgPostsList, CoachProfilesList } from "@/components/site/activity-lists";
import { createClient } from "@/lib/supabase/server";
import {
  getLfgPostsByAuthor,
  getCoachProfilesByAuthor,
  getProfile,
  getGamesForProfile,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const actions = [
  {
    href: "/teammates",
    icon: Users,
    title: "Teammates",
    description: "Browse open listings from other players.",
  },
  {
    href: "/scrims",
    icon: Swords,
    title: "Scrimmages",
    description: "Browse open scrims or post one of your own.",
  },
  {
    href: "/profile",
    icon: UserCog,
    title: "Your profile",
    description: "View your activity and manage your account.",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile && !profile.onboarded) {
    // Accounts that already picked games (e.g. via the old signup-time
    // picker) shouldn't be asked again — heal the flag and let them through.
    const existingGames = await getGamesForProfile(user.id);
    if (existingGames.length > 0) {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    } else {
      redirect("/onboarding/games");
    }
  }

  const [myPosts, myCoachProfiles] = await Promise.all([
    getLfgPostsByAuthor(user.id),
    getCoachProfilesByAuthor(user.id),
  ]);

  return (
    <Section className="!pb-24">
      <h1 className="mb-2 font-display text-3xl">
        Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
      </h1>
      <p className="mb-10 text-muted-foreground">
        @{profile?.username} &middot; here&apos;s what&apos;s happening with
        your account.
      </p>

      <div className="mb-12 grid gap-5 sm:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
              <CardContent className="flex flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <action.icon className="size-5" />
                </span>
                <h3 className="font-display text-lg">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className={myCoachProfiles.length > 0 ? "grid gap-8 lg:grid-cols-2" : undefined}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Your listings</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/teammates/new">
                <Plus /> New listing
              </Link>
            </Button>
          </div>
          <LfgPostsList posts={myPosts} emptyText="You haven't posted a listing yet." />
        </div>

        {/* Coaches isn't promoted on the dashboard right now (see
            lib/nav-links.ts), so this column only shows up for someone who
            already has a coach listing from before — nothing to manage,
            nothing shown, rather than a "become a coach" upsell here. */}
        {myCoachProfiles.length > 0 ? (
          <div className="mt-8 flex flex-col gap-4 lg:mt-0">
            <h2 className="font-display text-xl">Your coach listings</h2>
            <CoachProfilesList coachProfiles={myCoachProfiles} emptyText="" />
          </div>
        ) : null}
      </div>
    </Section>
  );
}
