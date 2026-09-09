interface CompetitiveTierEntry {
  tier: number;
  tierName: string;
  smallIcon: string | null;
  largeIcon: string | null;
}

interface CompetitiveTierSet {
  tiers: CompetitiveTierEntry[];
}

interface CompetitiveTiersResponse {
  data?: CompetitiveTierSet[];
}

// valorant-api.com is a community-run mirror of Riot's own game content
// files (not player data — no auth needed). It returns one tier SET per
// act/episode since Riot reskins the rank icons periodically; the last
// entry in the array is always the current one. Real icon URLs, not a
// guessed CDN path — the mistake made with Dota's icon URL earlier this
// session doesn't apply here.
export async function fetchValorantTierIcon(tierId: number | null): Promise<string | null> {
  if (tierId === null) return null;

  const response = await fetch("https://valorant-api.com/v1/competitivetiers");
  if (!response.ok) return null;

  const json = (await response.json()) as CompetitiveTiersResponse;
  const currentSet = json.data?.at(-1);
  const entry = currentSet?.tiers.find((t) => t.tier === tierId);

  return entry?.largeIcon ?? entry?.smallIcon ?? null;
}
