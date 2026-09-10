import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

import { Section } from "@/components/site/section";
import { CoachingRequestForm } from "@/components/site/coaching-request-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getGames, getOwnOpenCoachingRequestId } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Post a Listing",
  robots: { index: false, follow: false },
};

export default async function NewCoachingRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ownOpenRequestId = await getOwnOpenCoachingRequestId(user.id);
  if (ownOpenRequestId) {
    return (
      <Section className="!pb-24">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-6" />
          </span>
          <h1 className="font-display text-3xl">Post a listing</h1>
          <p className="text-muted-foreground">
            You already have an active listing — close it before posting a new one.
          </p>
          <Button asChild size="lg">
            <Link href="/coaches/looking-for-coach">View your listing</Link>
          </Button>
        </div>
      </Section>
    );
  }

  const games = await getGames();

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Looking for a coach</h1>
        <p className="mb-8 text-muted-foreground">
          Tell coaches what you need help with. Your listing goes live
          immediately on the board.
        </p>
        <CoachingRequestForm games={games} />
      </div>
    </Section>
  );
}
