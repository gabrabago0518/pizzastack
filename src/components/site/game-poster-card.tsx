import Link from "next/link";
import { GamePosterImage } from "@/components/site/game-poster-image";
import { cn } from "@/lib/utils";

interface PosterGame {
  name: string;
  slug: string;
  cover_url: string | null;
}

// Neither Valorant nor Mobile Legends has a Steam listing, so there's no
// equivalent official box-art URL for them the way there is for the
// Steam-hosted games in schema.sql (cover_url pulls those straight from
// Valve's CDN by app id) — hotlinking a scraped copy of someone else's
// key art instead would be an unlicensed image on a site with no rights
// to it. This gives those two (and anything else without a cover_url) a
// brand-toned gradient instead of the site's default pink/purple one, so
// the tile still reads as "this game" at a glance until real licensed
// art is available to drop in as a cover_url.
const BRAND_GRADIENTS: Record<string, string> = {
  valorant: "from-[#ff4655]/50 via-card to-black/60",
  "mobile-legends": "from-[#1560bd]/45 via-card to-[#f0a020]/35",
};
const DEFAULT_GRADIENT = "from-primary/25 via-card to-secondary/25";

// A game tile styled like a library box-art card (portrait poster, name
// overlaid at the bottom) rather than the plain text pill used elsewhere
// (see GameFilter, still used on /coaches). The gradient-and-name layer
// always renders first, underneath — for games with no cover_url (no
// equally reliable public art source for every game yet, see schema.sql)
// it's the whole card; for games with one, GamePosterImage covers it and
// falls back to it on load failure, so a missing or broken photo never
// leaves a blank or broken-image card.
export function GamePosterCard({
  game,
  href,
  compact = false,
}: {
  game: PosterGame;
  href: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg",
        compact && "max-w-[160px]",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-gradient-to-br p-4 text-center transition-transform duration-300 group-hover:scale-105",
          BRAND_GRADIENTS[game.slug] ?? DEFAULT_GRADIENT,
        )}
      >
        <span className="font-display text-lg leading-tight text-foreground/85">
          {game.name}
        </span>
      </div>
      {game.cover_url ? <GamePosterImage src={game.cover_url} /> : null}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 pt-10 pb-3">
        <p className="text-sm leading-tight font-semibold text-white drop-shadow-sm">
          {game.name}
        </p>
      </div>
    </Link>
  );
}
