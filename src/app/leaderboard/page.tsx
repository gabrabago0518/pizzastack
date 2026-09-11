import type { Metadata } from "next";

import { Section, SectionHeading } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import {
  TopCoachesList,
  TopGuildsList,
  TopLfgPostsList,
} from "@/components/site/leaderboard-lists";
import { getTopRatedCoaches, getMostActiveGuilds, getMostRequestedLfgPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top-rated coaches, the most active guilds, and the listings drawing the most join requests on Pizzastack.gg.",
  alternates: { canonical: "/leaderboard" },
};

export default async function LeaderboardPage() {
  const [coaches, guilds, posts] = await Promise.all([
    getTopRatedCoaches(),
    getMostActiveGuilds(),
    getMostRequestedLfgPosts(),
  ]);

  return (
    <Section className="!pb-24">
      <SectionHeading
        eyebrow="Rankings"
        title="Leaderboard"
        description="Top-rated coaches, the most active guilds, and the listings drawing the most interest."
        align="center"
      />

      <div className="flex flex-col gap-12">
        <Reveal className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Top-rated coaches</h2>
          <TopCoachesList coaches={coaches} />
        </Reveal>

        <Reveal delay={100} className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Most active guilds</h2>
          <TopGuildsList guilds={guilds} />
        </Reveal>

        <Reveal delay={200} className="flex flex-col gap-4">
          <h2 className="font-display text-xl">Most-requested listings</h2>
          <TopLfgPostsList posts={posts} />
        </Reveal>
      </div>
    </Section>
  );
}
