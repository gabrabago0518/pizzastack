import { Card, CardContent } from "@/components/ui/card";
import { MatchCharacterIcon } from "@/components/site/match-character-icon";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { MatchHistoryEntry } from "@/lib/supabase/types";

const GAME_NAMES: Record<string, string> = {
  "dota-2": "Dota 2",
  valorant: "Valorant",
};

export function MatchHistoryList({
  matches,
  emptyText,
}: {
  matches: MatchHistoryEntry[];
  emptyText: string;
}) {
  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {matches.map((match) => (
        <li key={match.id}>
          <Card
            className={cn(
              "border-l-4",
              match.won === true
                ? "border-l-accent"
                : match.won === false
                  ? "border-l-destructive"
                  : "border-l-border",
            )}
          >
            <CardContent className="flex items-center gap-3 py-3">
              <MatchCharacterIcon
                src={match.character_icon_url}
                alt={match.character_name ?? "?"}
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="font-medium">
                    {match.character_name ?? "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {GAME_NAMES[match.game_slug] ?? match.game_slug}
                  </span>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {[match.mode, match.map_name].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase",
                    match.won === true
                      ? "text-accent"
                      : match.won === false
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {match.won === true ? "Win" : match.won === false ? "Loss" : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {match.kills ?? 0}/{match.deaths ?? 0}/{match.assists ?? 0}
                </span>
              </div>

              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {formatRelativeTime(match.played_at)}
              </span>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
