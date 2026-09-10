import { Card, CardContent } from "@/components/ui/card";
import { MatchCharacterIcon } from "@/components/site/match-character-icon";
import type { TopHero } from "@/lib/queries";

const GAME_NAMES: Record<string, string> = {
  "dota-2": "Dota 2",
  valorant: "Valorant",
};

export function MostPlayedList({
  topHeroes,
  emptyText,
}: {
  topHeroes: TopHero[];
  emptyText: string;
}) {
  if (topHeroes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {topHeroes.map((hero) => {
        const winRate = Math.round((hero.wins / hero.gamesPlayed) * 100);
        const losses = hero.gamesPlayed - hero.wins;
        return (
          <Card key={`${hero.gameSlug}-${hero.characterName}`}>
            <CardContent className="flex items-center gap-3">
              <MatchCharacterIcon src={hero.characterIconUrl} alt={hero.characterName} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{hero.characterName}</span>
                <span className="text-xs text-muted-foreground">
                  {GAME_NAMES[hero.gameSlug] ?? hero.gameSlug} · {hero.wins}W–{losses}L
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-display text-2xl text-primary">{winRate}%</span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  win rate · {hero.gamesPlayed} {hero.gamesPlayed === 1 ? "game" : "games"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
