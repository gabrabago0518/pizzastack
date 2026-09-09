import Link from "next/link";
import { Users, GraduationCap, Gamepad2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/site/section";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: Users,
    title: "Post what you need",
    description:
      "Looking for a 5th, a duo, or a whole roster? Post a listing with your game, rank, and roles needed.",
  },
  {
    icon: GraduationCap,
    title: "Find a coach",
    description:
      "Browse players who coach your game and reach out directly. No fees, no booking system.",
  },
  {
    icon: Gamepad2,
    title: "Any game, one hub",
    description:
      "Valorant, League, CS2, Apex, and more. One profile, every game you play.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const [{ count: gameCount }, { count: postCount }, { count: coachCount }] =
    await Promise.all([
      supabase.from("games").select("*", { count: "exact", head: true }),
      supabase
        .from("lfg_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
      supabase.from("coach_profiles").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "games supported", value: gameCount ?? 0 },
    { label: "open listings", value: postCount ?? 0 },
    { label: "coaches listed", value: coachCount ?? 0 },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
          <Badge variant="muted" className="animate-fade-up">
            Built for squads, not solo queue
          </Badge>
          <h1
            className="animate-fade-up text-balance font-display text-5xl leading-[1.05] sm:text-6xl"
            style={{ animationDelay: "0.05s" }}
          >
            Find your next <span className="text-gradient">teammate</span>.
            <br />
            Find your next <span className="text-gradient">coach</span>.
          </h1>
          <p
            className="animate-fade-up max-w-xl text-balance text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "0.1s" }}
          >
            Pizzastack.gg is a community hub for gamers — post what you&apos;re
            looking for, browse coaches who know your game, and squad up
            faster.
          </p>
          <div
            className="animate-fade-up flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "0.15s" }}
          >
            <Button asChild size="lg">
              <Link href="/signup">
                Create your profile <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/teammates">Browse listings</Link>
            </Button>
          </div>

          <div
            className="animate-fade-up mt-6 flex flex-wrap justify-center gap-8"
            style={{ animationDelay: "0.2s" }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="font-display text-3xl text-primary">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Everything you need to squad up"
          description="Build a profile once, then use it across every game you play."
          align="center"
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="font-display text-lg">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-muted/20">
        <div className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-balance font-display text-3xl sm:text-4xl">
            Ready to find your squad?
          </h2>
          <p className="max-w-md text-balance text-muted-foreground">
            It takes less than a minute to create a profile and post your
            first listing.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">
              Get started <ArrowRight />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
