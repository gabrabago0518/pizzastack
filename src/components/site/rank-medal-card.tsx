import { DotaRankIcon } from "@/components/site/dota-rank-icon";

// One "achievement card" in a rank banner — a game's verified rank, shown
// big enough to actually read the medal. Icon lookup is Dota-specific for
// now (the only game with a verification source); when a second game gets
// one, this either grows a `game` discriminator or the icon prop becomes a
// plain image URL instead of routing through DotaRankIcon.
export function RankMedalCard({
  game,
  rankLabel,
  rankTier,
}: {
  game: string;
  rankLabel: string;
  rankTier: number | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 px-5 py-4 transition-colors hover:border-secondary/50">
      <DotaRankIcon rankTier={rankTier} className="size-16 shrink-0 drop-shadow-md" />
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {game}
        </p>
        <p className="font-display text-xl leading-tight">{rankLabel}</p>
        <p className="text-xs font-medium text-secondary">Verified via Steam</p>
      </div>
    </div>
  );
}
