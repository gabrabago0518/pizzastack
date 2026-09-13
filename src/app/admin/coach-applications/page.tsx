import type { Metadata } from "next";

import { CoachApplicationsList } from "@/components/site/coach-applications-list";
import { getPendingCoachApplications } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Coach applications",
  robots: { index: false, follow: false },
};

export default async function AdminCoachApplicationsPage() {
  const applications = await getPendingCoachApplications();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">Coach applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pending coach listings waiting on review, oldest first.
        </p>
      </div>
      <CoachApplicationsList applications={applications} />
    </div>
  );
}
