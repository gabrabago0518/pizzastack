import type { Metadata } from "next";

import { Section } from "@/components/site/section";
import { CoachForm } from "@/components/site/coach-form";
import { getGames } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Become a coach — Pizzastack",
};

export default async function NewCoachProfilePage() {
  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Become a coach</h1>
        <p className="mb-8 text-muted-foreground">
          List yourself in the coach directory for a game you know well.
          Players will see your contact info directly — no booking system,
          no fees.
        </p>
        <CoachForm games={games} />
      </div>
    </Section>
  );
}
