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

interface AgentEntry {
  displayName: string;
  displayIcon: string | null;
}

interface AgentsResponse {
  data?: AgentEntry[];
}

// Cached per server instance for the same reason as Dota's hero cache
// (dota-heroes.ts) — the agent roster only changes with new agent
// releases, so there's no need to refetch it for every match in a sync
// batch.
let agentCache: AgentEntry[] | null = null;

// HenrikDev's match data gives the agent by display name (e.g. "Jett"),
// not a UUID, so this matches on displayName rather than an id.
export async function fetchValorantAgentIcon(agentName: string | null): Promise<string | null> {
  if (!agentName) return null;

  if (!agentCache) {
    const response = await fetch(
      "https://valorant-api.com/v1/agents?isPlayableCharacter=true",
    );
    if (!response.ok) return null;
    const json = (await response.json()) as AgentsResponse;
    agentCache = json.data ?? [];
  }

  const agent = agentCache.find(
    (entry) => entry.displayName.toLowerCase() === agentName.toLowerCase(),
  );
  return agent?.displayIcon ?? null;
}
