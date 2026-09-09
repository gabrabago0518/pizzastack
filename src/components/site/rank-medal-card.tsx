import type { ReactNode } from "react";

// One "achievement card" in a rank banner — a game's verified rank, shown
// big enough to actually read. `icon` is optional since not every game has
// icon artwork wired up yet (e.g. CS2 shows text-only for now) — pass
// nothing rather than a placeholder; the card still reads fine without one.
// `sourceLabel` is required (not defaulted) so every caller states its
// trust level honestly — e.g. "Verified via Steam" for Dota/CS2 vs.
// "Via Riot ID" for Valorant, which isn't identity-verified.
export function RankMedalCard({
  game,
  rankLabel,
  sourceLabel,
  icon,
}: {
  game: string;
  rankLabel: string;
  sourceLabel: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 px-5 py-4 transition-colors hover:border-secondary/50">
      {icon}
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {game}
        </p>
        <p className="font-display text-xl leading-tight">{rankLabel}</p>
        <p className="text-xs font-medium text-secondary">{sourceLabel}</p>
      </div>
    </div>
  );
}
