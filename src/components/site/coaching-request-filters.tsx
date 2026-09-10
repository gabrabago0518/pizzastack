"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { SelectNative } from "@/components/ui/select-native";
import { REGIONS } from "@/lib/regions";
import { RANKS_BY_GAME, FALLBACK_RANKS } from "@/lib/ranks";

function submitOnChange(event: ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

// Auto-submitting GET form, same pattern as CoachFilters/ListingFilters.
export function CoachingRequestFilters({
  gameSlug,
  rank,
  region,
}: {
  gameSlug?: string;
  rank?: string;
  region?: string;
}) {
  const rankOptions = gameSlug ? (RANKS_BY_GAME[gameSlug] ?? FALLBACK_RANKS) : [];
  const hasActiveFilter = Boolean(rank || region);

  return (
    <form
      action="/coaches/looking-for-coach"
      method="GET"
      className="flex flex-wrap items-center gap-3"
    >
      {gameSlug ? <input type="hidden" name="game" value={gameSlug} /> : null}

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
        name="region"
        defaultValue={region ?? ""}
        onChange={submitOnChange}
        aria-label="Filter by region"
        className="w-auto min-w-36"
      >
        <option value="">All regions</option>
        {REGIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectNative>

      {hasActiveFilter ? (
        <Link
          href={gameSlug ? `/coaches/looking-for-coach?game=${gameSlug}` : "/coaches/looking-for-coach"}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Clear filters
        </Link>
      ) : null}
    </form>
  );
}
