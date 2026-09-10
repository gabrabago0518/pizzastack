"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { SelectNative } from "@/components/ui/select-native";
import { RANKS_BY_GAME, FALLBACK_RANKS } from "@/lib/ranks";
import { ROLES_BY_GAME, FALLBACK_ROLES } from "@/lib/roles";
import { MODES_BY_GAME, FALLBACK_MODES } from "@/lib/modes";
import { REGIONS } from "@/lib/regions";

function submitOnChange(event: ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

// Auto-submitting GET form (same pattern as the navbar search box) rather
// than a client-side router push — each option is game-specific, so
// picking one always needs a fresh server-rendered listings query anyway.
export function ListingFilters({
  gameSlug,
  rank,
  role,
  mode,
  region,
  sort,
}: {
  gameSlug: string;
  rank?: string;
  role?: string;
  mode?: string;
  region?: string;
  sort?: string;
}) {
  // Rank/Role/Mode are per-game option lists, so they only make sense once
  // a specific game is picked — "All games" has no single list to offer.
  // Region is game-agnostic, so it's always shown.
  const isSpecificGame = gameSlug !== "all";
  const rankOptions = RANKS_BY_GAME[gameSlug] ?? FALLBACK_RANKS;
  const roleOptions = ROLES_BY_GAME[gameSlug] ?? FALLBACK_ROLES;
  const modeOptions = MODES_BY_GAME[gameSlug] ?? FALLBACK_MODES;
  const hasActiveFilter = Boolean(rank || role || mode || region);

  return (
    <form
      action="/teammates"
      method="GET"
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="game" value={gameSlug} />

      <SelectNative
        name="sort"
        defaultValue={sort ?? "newest"}
        onChange={submitOnChange}
        aria-label="Sort listings"
        className="w-auto min-w-36"
      >
        <option value="newest">Newest</option>
        <option value="requested">Most requested</option>
      </SelectNative>

      {isSpecificGame ? (
        <>
          <SelectNative
            name="mode"
            defaultValue={mode ?? ""}
            onChange={submitOnChange}
            aria-label="Filter by mode"
            className="w-auto min-w-36"
          >
            <option value="">All modes</option>
            {modeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectNative>

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

          <SelectNative
            name="role"
            defaultValue={role ?? ""}
            onChange={submitOnChange}
            aria-label="Filter by role"
            className="w-auto min-w-36"
          >
            <option value="">All roles</option>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectNative>
        </>
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
          href={`/teammates?game=${gameSlug}`}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Clear filters
        </Link>
      ) : null}
    </form>
  );
}
