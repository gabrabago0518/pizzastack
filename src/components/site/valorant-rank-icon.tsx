"use client";

import * as React from "react";

// Renders the real Valorant rank medal (from valorant-api.com, resolved
// and stored at sync time — see fetchValorantTierIcon). Falls back to
// hiding quietly on load failure, same as the other rank icon components:
// the rank text alongside it already carries the information.
export function ValorantRankIcon({
  iconUrl,
  className = "size-5",
}: {
  iconUrl: string | null;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);

  if (!iconUrl || broken) return null;

  return <img src={iconUrl} alt="" className={className} onError={() => setBroken(true)} />;
}
