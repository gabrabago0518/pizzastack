import type { Metadata } from "next";

import { ReportsList } from "@/components/site/reports-list";
import { getPlayerReports } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Player reports",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  const reports = await getPlayerReports();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">Player reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports filed against players, open first.
        </p>
      </div>
      <ReportsList reports={reports} />
    </div>
  );
}
