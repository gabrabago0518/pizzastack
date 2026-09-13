import Link from "next/link";
import { Users, ArrowRight, Swords, MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { FeedbackDialog } from "@/components/site/feedback-dialog";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_GAME_SLUGS } from "@/lib/queries";

// Coaches/Guilds/Tournaments/Leaderboard/Highlights feature cards are
// deliberately left out here while the homepage focuses on the core
// teammates + scrims loop — see NAV_LINKS_HIDDEN in lib/nav-links.ts for
// why. Nothing about those features was removed, just unpromoted.
const features = [
  {
    icon: Users,
    title: "Post what you need",
    description:
      "Looking for a 5th, a duo, or a whole roster? Post a listing with your game, rank, and roles needed.",
    href: "/teammates/new",
  },
  {
    icon: Swords,
    title: "Schedule a scrim",
    description:
      "Post your game, region, and when you're free to play — or browse open slots and reach out directly.",
    href: "/scrims",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ count: gameCount }, { count: postCount }, { count: scrimCount }] =
    await Promise.all([
      supabase
        .from("games")
        .select("*", { count: "exact", head: true })
        .in("slug", SUPPORTED_GAME_SLUGS),
      supabase
        .from("lfg_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
      supabase
        .from("scrimmages")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  const stats = [
    { label: "games supported", value: gameCount ?? 0 },
    { label: "open listings", value: postCount ?? 0 },
    { label: "open scrims", value: scrimCount ?? 0 },
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
            Find your next <span className="text-gradient">scrim</span>.
          </h1>
          <p
            className="animate-fade-up max-w-xl text-balance text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "0.1s" }}
          >
            Pizzastack.gg is a community hub for gamers — post what you&apos;re
            looking for, find players who play your way, and squad up faster.
          </p>
          <div
            className="animate-fade-up flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "0.15s" }}
          >
            <Button asChild size="lg">
              <Link href="/teammates/new">
                Post a Listing <ArrowRight />
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
        <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 100}>
              <Link href={feature.href} className="block h-full">
                <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
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
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-muted/20">
        <Reveal className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-balance font-display text-3xl sm:text-4xl">
            Website is under development
          </h2>
          <p className="max-w-md text-balance text-muted-foreground">
            Feedback and suggestions are much appreciated as we keep building.
          </p>
          <FeedbackDialog
            viewerId={user?.id ?? null}
            trigger={
              <Button size="lg">
                Give feedback <MessageSquarePlus />
              </Button>
            }
          />
        </Reveal>
      </Section>
    </>
  );
}
