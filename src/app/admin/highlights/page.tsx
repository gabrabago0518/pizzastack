import type { Metadata } from "next";

import { HighlightModerationList } from "@/components/site/highlight-moderation-list";
import { getPendingHighlights } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Highlights",
  robots: { index: false, follow: false },
};

export default async function AdminHighlightsPage() {
  const highlights = await getPendingHighlights();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">Highlights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Uploaded clips waiting on review, oldest first.
        </p>
      </div>
      <HighlightModerationList highlights={highlights} />
    </div>
  );
}
