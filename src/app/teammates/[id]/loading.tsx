export default function ListingLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
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
