export interface Cs2RankResult {
  premierRating: number | null;
  competitiveRank: number | null;
}

interface LeetifyProfileResponse {
  ranks?: {
    premier?: number | null;
    competitive?: { map_name: string; rank: number }[];
  };
}

// Leetify parses real match/GSI data rather than computing its own separate
// score, so ranks.premier is Valve's actual Premier CS Rating and
// ranks.competitive is the real classic skill group per map (not a
// third-party rating like FACEIT's). No API key is required for this
// endpoint — LEETIFY_API_KEY only raises the rate limit if set.
export async function fetchCs2RankFromLeetify(steamId64: string): Promise<Cs2RankResult> {
  const url = new URL("https://api-public.cs-prod.leetify.com/v3/profile");
  url.searchParams.set("steam64_id", steamId64);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.LEETIFY_API_KEY) {
    headers.Authorization = `Bearer ${process.env.LEETIFY_API_KEY}`;
  }

  const response = await fetch(url, { headers });
  const rawBody = await response.text();

  // TEMPORARY: log the raw response while diagnosing why ranks are coming
  // back empty — this endpoint's shape was confirmed from a third-party
  // wrapper's types, not Leetify's own docs (unreachable from the sandbox
  // this was built in), so it needs verifying against a real response.
  console.log(
    `[leetify] GET /v3/profile?steam64_id=${steamId64} -> ${response.status}: ${rawBody.slice(0, 2000)}`,
  );

  if (!response.ok) {
    if (response.status === 404) return { premierRating: null, competitiveRank: null };
    throw new Error(`Leetify request failed (${response.status})`);
  }

  const data = JSON.parse(rawBody) as LeetifyProfileResponse;
  const competitiveRanks = data.ranks?.competitive ?? [];
  const highestCompetitiveRank = competitiveRanks.length
    ? Math.max(...competitiveRanks.map((entry) => entry.rank))
    : null;

  return {
    premierRating: data.ranks?.premier ?? null,
    competitiveRank: highestCompetitiveRank,
  };
}
