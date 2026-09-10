"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { SelectNative } from "@/components/ui/select-native";
import { REGIONS } from "@/lib/regions";

function submitOnChange(event: ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

// Auto-submitting GET form, same pattern as the other directory filters.
export function ScrimmageFilters({
  gameSlug,
  region,
}: {
  gameSlug?: string;
  region?: string;
}) {
  return (
    <form action="/scrims" method="GET" className="flex flex-wrap items-center gap-3">
      {gameSlug ? <input type="hidden" name="game" value={gameSlug} /> : null}

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

      {region ? (
        <Link
          href={gameSlug ? `/scrims?game=${gameSlug}` : "/scrims"}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Clear filters
        </Link>
      ) : null}
    </form>
  );
}
