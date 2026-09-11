import Link from "next/link";
import type { Metadata } from "next";
import { Crown, SlidersHorizontal, Image as ImageIcon, Sparkles } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Prime",
  description:
    "Unlock profile customization on Pizzastack.gg — choose what shows on your profile, with more perks on the way.",
};

const perks = [
  {
    icon: SlidersHorizontal,
    title: "Customize your profile",
    description:
      "Choose exactly which sections show on your public profile — Dota 2/CS2 ranks, most played, games, listings, coaching.",
    available: true,
  },
  {
    icon: ImageIcon,
    title: "Profile backgrounds",
    description: "Pick a background for your profile page to stand out.",
    available: false,
  },
  {
    icon: Sparkles,
    title: "Animated avatar borders",
    description: "Moving avatar borders that show off your Prime status.",
    available: false,
  },
];

export default async function PrimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;
  const isPrime = profile?.account_tier === "prime";

  return (
    <Section className="!pb-24">
      <SectionHeading
        eyebrow="Pizzastack Prime"
        title="Make your profile yours"
        description="Control what other players see on your profile, with more ways to stand out coming soon."
        align="center"
      />

      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        {perks.map((perk, i) => (
          <Reveal key={perk.title} delay={i * 100}>
            <Card className="h-full">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <perk.icon className="size-5" />
                  </span>
                  {perk.available ? (
                    <Badge variant="secondary">Available now</Badge>
                  ) : (
                    <Badge variant="muted">Coming soon</Badge>
                  )}
                </div>
                <h3 className="font-display text-lg">{perk.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {perk.description}
                </p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-muted/20 p-8 text-center">
        {isPrime ? (
          <>
            <Crown className="size-8 text-primary" />
            <h2 className="font-display text-xl">You&apos;re already Prime</h2>
            <p className="text-sm text-muted-foreground">
              Manage what shows on your profile from the Edit profile button
              on your profile page.
            </p>
            <Button asChild variant="outline">
              <Link href="/profile">Go to your profile</Link>
            </Button>
          </>
        ) : (
          <>
            <Crown className="size-8 text-primary" />
            <h2 className="font-display text-xl">Monthly subscription</h2>
            <p className="text-sm text-muted-foreground">
              Pricing and checkout are coming soon — we&apos;re still setting
              up billing.
            </p>
            <Button disabled>
              <Crown /> Coming soon
            </Button>
          </>
        )}
      </Reveal>
    </Section>
  );
}
