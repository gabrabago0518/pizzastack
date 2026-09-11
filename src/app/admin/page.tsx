import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, CalendarPlus, Radio } from "lucide-react";

import { Section, SectionHeading } from "@/components/site/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportsList } from "@/components/site/reports-list";
import { CoachApplicationsList } from "@/components/site/coach-applications-list";
import { ApprovedCoachesList } from "@/components/site/approved-coaches-list";
import { AccountsList } from "@/components/site/accounts-list";
import { HighlightModerationList } from "@/components/site/highlight-moderation-list";
import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  getAdminStats,
  getPlayerReports,
  getPendingCoachApplications,
  getApprovedCoaches,
  getAllAccounts,
  getPendingHighlights,
} from "@/lib/queries";

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

  const [stats, reports, coachApplications, approvedCoaches, accounts, pendingHighlights] =
    await Promise.all([
      getAdminStats(),
      getPlayerReports(),
      getPendingCoachApplications(),
      getApprovedCoaches(),
      getAllAccounts(),
      getPendingHighlights(),
    ]);

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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Accounts</h2>
          {stats.totalAccounts > accounts.length ? (
            <span className="text-xs text-muted-foreground">
              Showing the {accounts.length.toLocaleString()} most recent of{" "}
              {stats.totalAccounts.toLocaleString()}
            </span>
          ) : null}
        </div>
        <AccountsList accounts={accounts} />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-xl">Coaches</h2>
        <ApprovedCoachesList coaches={approvedCoaches} />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-xl">Coach applications</h2>
        <CoachApplicationsList applications={coachApplications} />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-xl">Highlights pending review</h2>
        <HighlightModerationList highlights={pendingHighlights} />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-xl">Player reports</h2>
        <ReportsList reports={reports} />
      </div>
    </Section>
  );
}
