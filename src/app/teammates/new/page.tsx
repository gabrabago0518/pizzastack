import type { Metadata } from "next";

import { Section } from "@/components/site/section";
import { LfgForm } from "@/components/site/lfg-form";
import { getGames } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Post a listing — Pizzastack",
};

export default async function NewLfgPostPage() {
  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Post a listing</h1>
        <p className="mb-8 text-muted-foreground">
          Tell other players what you&apos;re looking for. Your listing goes
          live immediately on the teammates board.
        </p>
        <LfgForm games={games} />
      </div>
    </Section>
  );
}
