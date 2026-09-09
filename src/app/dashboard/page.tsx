import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, GraduationCap, UserCog, Plus } from "lucide-react";

import { Section } from "@/components/site/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LfgPostsList, CoachProfilesList } from "@/components/site/activity-lists";
import { createClient } from "@/lib/supabase/server";
import { getLfgPostsByAuthor, getCoachProfilesByAuthor, getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Dashboard — Pizzastack.gg",
};

const actions = [
  {
    href: "/teammates",
    icon: Users,
    title: "Find teammates",
    description: "Browse open listings from other players.",
  },
  {
    href: "/coaches",
    icon: GraduationCap,
    title: "Find coaches",
    description: "Connect with players who coach your game.",
  },
  {
    href: "/profile",
    icon: UserCog,
    title: "Edit profile",
    description: "Update your bio, region, and display name.",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile, myPosts, myCoachProfiles] = await Promise.all([
    getProfile(user.id),
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

      <div className="grid gap-8 lg:grid-cols-2">
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

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Your coach listings</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/coaches/new">
                <Plus /> New listing
              </Link>
            </Button>
          </div>
          <CoachProfilesList
            coachProfiles={myCoachProfiles}
            emptyText="You're not listed as a coach yet."
          />
        </div>
      </div>
    </Section>
  );
}
