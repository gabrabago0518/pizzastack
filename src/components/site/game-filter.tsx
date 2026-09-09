import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/supabase/types";

export function GameFilter({
  games,
  active,
  basePath,
}: {
  games: Game[];
  active?: string;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={basePath}
        className={cn(
          "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !active
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        All games
      </Link>
      {games.map((game) => (
        <Link
          key={game.id}
          href={`${basePath}?game=${game.slug}`}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            active === game.slug
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {game.name}
        </Link>
      ))}
    </div>
  );
}
