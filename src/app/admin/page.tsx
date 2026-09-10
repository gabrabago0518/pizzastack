import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, CalendarPlus, Radio } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportsList } from "@/components/site/reports-list";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getAdminStats, getPlayerReports } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.is_admin) redirect("/dashboard");

  const [stats, reports] = await Promise.all([getAdminStats(), getPlayerReports()]);

  const tiles = [
    { label: "Total accounts", value: stats.totalAccounts, icon: Users },
    { label: "New today", value: stats.newToday, icon: CalendarPlus },
    { label: "Online now", value: stats.onlineNow, icon: Radio },
  ];

  return (
    <Section className="!pb-24">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Admin"
          title="Site overview"
          description="A quick look at account growth and current activity."
          className="mb-0"
        />
        <Button asChild variant="outline">
          <Link href="/profile">
            <ArrowLeft /> Normal view
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {tile.label}
                </p>
                <p className="font-display text-3xl">{tile.value.toLocaleString()}</p>
              </div>
              <tile.icon className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        &ldquo;Online now&rdquo; counts accounts active in the last 5 minutes —
        approximate, not a live connection count.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-xl">Player reports</h2>
        <ReportsList reports={reports} />
      </div>
    </Section>
  );
}
