import { steamId64ToDotaAccountId } from "@/lib/dota-rank";

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const CLAIMED_ID_PATTERN = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

// Builds the redirect URL that starts Steam's OpenID 2.0 login flow. No API
// key needed — this is Valve's own OpenID identity provider, separate from
// the keyed Steam Web API.
export function buildSteamLoginUrl(origin: string, returnPath: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${origin}${returnPath}`,
    "openid.realm": origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

// Verifies a Steam OpenID callback by re-posting the returned params back to
// Steam with mode=check_authentication — Steam will only confirm params it
// actually issued, so this rejects forged or replayed callbacks. Returns the
// verified SteamID64, or null if verification fails.
export async function verifySteamOpenIdCallback(
  searchParams: URLSearchParams,
): Promise<string | null> {
  if (searchParams.get("openid.mode") !== "id_res") return null;

  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = claimedId.match(CLAIMED_ID_PATTERN);
  if (!match) return null;
  const steamId64 = match[1];

  const verifyParams = new URLSearchParams(searchParams);
  verifyParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  if (!response.ok) return null;

  const text = await response.text();
  return /is_valid\s*:\s*true/.test(text) ? steamId64 : null;
}

export interface DotaRankResult {
  rankTier: number | null;
  leaderboardRank: number | null;
}

// OpenDota derives rank_tier/leaderboard_rank from Dota 2's Game Coordinator
// via their own bot accounts — free, no API key, but only populated if the
// player has "Expose Public Match Data" on in the Dota 2 client.
export async function fetchDotaRankFromOpenDota(steamId64: string): Promise<DotaRankResult> {
  const accountId = steamId64ToDotaAccountId(steamId64);
  const response = await fetch(`https://api.opendota.com/api/players/${accountId}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OpenDota request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    rank_tier?: number | null;
    leaderboard_rank?: number | null;
  };

  return {
    rankTier: data.rank_tier ?? null,
    leaderboardRank: data.leaderboard_rank ?? null,
  };
}

export interface DotaMatchResult {
  matchId: string;
  won: boolean;
  heroId: number;
  kills: number;
  deaths: number;
  assists: number;
  duration: number;
  startTime: number;
}

// player_slot 0-127 is Radiant, 128+ is Dire — the win/loss comes from
// comparing that against radiant_win rather than a dedicated field.
export async function fetchDotaMatches(
  steamId64: string,
  limit = 10,
): Promise<DotaMatchResult[]> {
  const accountId = steamId64ToDotaAccountId(steamId64);
  const response = await fetch(
    `https://api.opendota.com/api/players/${accountId}/matches?limit=${limit}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) {
    throw new Error(`OpenDota matches request failed (${response.status})`);
  }

  const data = (await response.json()) as Array<{
    match_id: number;
    player_slot: number;
    radiant_win: boolean;
    hero_id: number;
    kills: number;
    deaths: number;
    assists: number;
    duration: number;
    start_time: number;
  }>;

  return data.map((match) => ({
    matchId: String(match.match_id),
    won: match.player_slot < 128 === match.radiant_win,
    heroId: match.hero_id,
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    duration: match.duration,
    startTime: match.start_time,
  }));
}
