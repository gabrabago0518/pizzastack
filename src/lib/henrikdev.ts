export interface ValorantRankResult {
  tierId: number | null;
  tierName: string | null;
  rr: number | null;
  elo: number | null;
}

interface HenrikMmrCurrent {
  tier?: { id?: number; name?: string };
  currenttier?: number;
  currenttierpatched?: string;
  rr?: number;
  ranking_in_tier?: number;
  elo?: number;
}

interface HenrikMmrResponse {
  data?: {
    current?: HenrikMmrCurrent;
    current_data?: HenrikMmrCurrent;
  };
}

// HenrikDev (api.henrikdev.xyz) is an unofficial, community-run Valorant
// stats API — Riot doesn't grant public rank/match data access without an
// approved RSO integration, so there's no official alternative here. The
// response shape has shifted across their API versions (v2's current_data
// vs v3's current, currenttierpatched/currenttier vs tier.name/tier.id,
// ranking_in_tier vs rr), so both are checked defensively.
export async function fetchValorantRank(
  name: string,
  tag: string,
  region: string,
): Promise<ValorantRankResult> {
  const apiKey = process.env.HENRIKDEV_API_KEY;
  if (!apiKey) {
    throw new Error("HENRIKDEV_API_KEY is not configured");
  }

  const url = `https://api.henrikdev.xyz/valorant/v3/mmr/${region}/pc/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  const response = await fetch(url, {
    headers: { Authorization: apiKey, Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { tierId: null, tierName: null, rr: null, elo: null };
    }
    throw new Error(`HenrikDev request failed (${response.status})`);
  }

  const data = (await response.json()) as HenrikMmrResponse;
  const current = data.data?.current ?? data.data?.current_data ?? {};

  return {
    tierId: current.tier?.id ?? current.currenttier ?? null,
    tierName: current.tier?.name ?? current.currenttierpatched ?? null,
    rr: current.rr ?? current.ranking_in_tier ?? null,
    elo: current.elo ?? null,
  };
}
