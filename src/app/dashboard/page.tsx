import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users, GraduationCap, UserCog, Plus } from "lucide-react";

import { Section } from "@/components/site/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getMyLfgPosts, getMyCoachProfiles, getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Dashboard — Pizzastack",
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
    getMyLfgPosts(user.id),
    getMyCoachProfiles(user.id),
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
            <Card className="h-full transition-colors hover:border-primary/40">
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
          {myPosts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              You haven&apos;t posted a listing yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {myPosts.map((post) => (
                <li key={post.id}>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{post.title}</span>
                        <Badge variant="muted" className="w-fit">
                          {post.games?.name}
                        </Badge>
                      </div>
                      <Badge variant={post.status === "open" ? "accent" : "outline"}>
                        {post.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
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
          {myCoachProfiles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              You&apos;re not listed as a coach yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {myCoachProfiles.map((coach) => (
                <li key={coach.id}>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{coach.headline}</span>
                        <Badge variant="muted" className="w-fit">
                          {coach.games?.name}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}
