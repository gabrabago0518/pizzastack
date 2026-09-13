import type { Metadata } from "next";

import { FeedbackList } from "@/components/site/feedback-list";
import { getOpenFeedback } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Feedback",
  robots: { index: false, follow: false },
};

export default async function AdminFeedbackPage() {
  const feedback = await getOpenFeedback();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submitted straight from the site&apos;s feedback dialog.
        </p>
      </div>
      <FeedbackList feedback={feedback} />
    </div>
  );
}
