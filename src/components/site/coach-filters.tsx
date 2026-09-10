"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { SelectNative } from "@/components/ui/select-native";
import { RANKS_BY_GAME, FALLBACK_RANKS } from "@/lib/ranks";

const MIN_RATING_OPTIONS = [4, 3, 2] as const;

function submitOnChange(event: ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

// Auto-submitting GET form, same pattern as ListingFilters on /teammates.
export function CoachFilters({
  gameSlug,
  rank,
  minRating,
  sort,
}: {
  gameSlug?: string;
  rank?: string;
  minRating?: string;
  sort?: string;
}) {
  const rankOptions = gameSlug ? (RANKS_BY_GAME[gameSlug] ?? FALLBACK_RANKS) : [];
  const hasActiveFilter = Boolean(rank || minRating);

  return (
    <form action="/coaches" method="GET" className="flex flex-wrap items-center gap-3">
      {gameSlug ? <input type="hidden" name="game" value={gameSlug} /> : null}

      <SelectNative
        name="sort"
        defaultValue={sort ?? "newest"}
        onChange={submitOnChange}
        aria-label="Sort coaches"
        className="w-auto min-w-36"
      >
        <option value="newest">Newest</option>
        <option value="rating">Highest rated</option>
        <option value="reviews">Most reviewed</option>
      </SelectNative>

      {gameSlug ? (
        <SelectNative
          name="rank"
          defaultValue={rank ?? ""}
          onChange={submitOnChange}
          aria-label="Filter by rank"
          className="w-auto min-w-36"
        >
          <option value="">All ranks</option>
          {rankOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectNative>
      ) : null}

      <SelectNative
        name="minRating"
        defaultValue={minRating ?? ""}
        onChange={submitOnChange}
        aria-label="Filter by minimum rating"
        className="w-auto min-w-36"
      >
        <option value="">Any rating</option>
        {MIN_RATING_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}+ stars
          </option>
        ))}
      </SelectNative>

      {hasActiveFilter ? (
        <Link
          href={gameSlug ? `/coaches?game=${gameSlug}` : "/coaches"}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Clear filters
        </Link>
      ) : null}
    </form>
  );
}
