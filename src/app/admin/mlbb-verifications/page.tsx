import type { Metadata } from "next";

import { MlbbVerificationsList } from "@/components/site/mlbb-verifications-list";
import { getPendingMlbbVerifications } from "@/lib/queries";

export const metadata: Metadata = {
  title: "MLBB verifications",
  robots: { index: false, follow: false },
};

export default async function AdminMlbbVerificationsPage() {
  const verifications = await getPendingMlbbVerifications();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">Mobile Legends verifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rank verification requests waiting on manual review, oldest first.
        </p>
      </div>
      <MlbbVerificationsList verifications={verifications} />
    </div>
  );
}
