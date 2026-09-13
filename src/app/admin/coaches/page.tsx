import type { Metadata } from "next";

import { ApprovedCoachesList } from "@/components/site/approved-coaches-list";
import { getApprovedCoaches } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Coaches",
  robots: { index: false, follow: false },
};

export default async function AdminCoachesPage() {
  const coaches = await getApprovedCoaches();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">Coaches</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every currently-live coach listing on the site.
        </p>
      </div>
      <ApprovedCoachesList coaches={coaches} />
    </div>
  );
}
