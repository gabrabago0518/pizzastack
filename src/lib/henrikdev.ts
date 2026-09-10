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

export interface ValorantMatchResult {
  matchId: string;
  won: boolean | null;
  agentName: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  mapName: string | null;
  mode: string | null;
  playedAt: string;
}

interface HenrikMatchPlayer {
  name?: string;
  tag?: string;
  team?: string;
  character?: string;
  stats?: { kills?: number; deaths?: number; assists?: number };
}

interface HenrikMatch {
  metadata?: {
    matchid?: string;
    map?: string;
    mode?: string;
    game_start?: number;
  };
  players?: { all_players?: HenrikMatchPlayer[] };
  teams?: {
    red?: { has_won?: boolean };
    blue?: { has_won?: boolean };
  };
}

interface HenrikMatchesResponse {
  data?: HenrikMatch[];
}

// v3/matches returns the requesting player's last N competitive+casual
// matches — find that player within each match's player list (matched by
// name+tag, case-insensitively) to pull their own stats and win/loss,
// since the endpoint doesn't put "this is you" anywhere more direct.
export async function fetchValorantMatches(
  name: string,
  tag: string,
  region: string,
  limit = 10,
): Promise<ValorantMatchResult[]> {
  const apiKey = process.env.HENRIKDEV_API_KEY;
  if (!apiKey) {
    throw new Error("HENRIKDEV_API_KEY is not configured");
  }

  const url = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${limit}`;
  const response = await fetch(url, {
    headers: { Authorization: apiKey, Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`HenrikDev matches request failed (${response.status})`);
  }

  const json = (await response.json()) as HenrikMatchesResponse;
  const results: ValorantMatchResult[] = [];

  for (const match of json.data ?? []) {
    const matchId = match.metadata?.matchid;
    if (!matchId) continue;

    const me = match.players?.all_players?.find(
      (player) =>
        player.name?.toLowerCase() === name.toLowerCase() &&
        player.tag?.toLowerCase() === tag.toLowerCase(),
    );
    if (!me) continue;

    const myTeam = me.team?.toLowerCase();
    const won =
      myTeam === "red"
        ? (match.teams?.red?.has_won ?? null)
        : myTeam === "blue"
          ? (match.teams?.blue?.has_won ?? null)
          : null;

    results.push({
      matchId,
      won,
      agentName: me.character ?? null,
      kills: me.stats?.kills ?? null,
      deaths: me.stats?.deaths ?? null,
      assists: me.stats?.assists ?? null,
      mapName: match.metadata?.map ?? null,
      mode: match.metadata?.mode ?? null,
      playedAt: match.metadata?.game_start
        ? new Date(match.metadata.game_start * 1000).toISOString()
        : new Date().toISOString(),
    });
  }

  return results;
}
