"use client";

import { useLinkStatus } from "next/link";

// Full-viewport loading state for navigating into a listing page. Must be
// rendered as a child of the <Link> it tracks (useLinkStatus requirement) —
// its `fixed` positioning takes it out of that link's layout box, so it
// still covers the whole screen. This replaces teammates/[id]/loading.tsx,
// which caused missing/closed listings to return a 200 instead of a 404
// (the route's Suspense boundary flushed the loading fallback — and
// therefore the response status — before notFound() could run). Since this
// is purely a client-side navigation indicator, it has no effect on the
// destination route's actual HTTP response.
export function ListingLoadingOverlay() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
      <div className="relative size-14">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent"
          style={{ borderTopColor: "var(--primary)", borderRightColor: "var(--secondary)" }}
        />
      </div>
      <p className="text-sm text-muted-foreground">Loading listing…</p>
    </div>
  );
}
