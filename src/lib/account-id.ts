import { steamId64ToDotaAccountId } from "@/lib/dota-rank";

// Surfaces a player's per-game account identifier next to their username on
// listing cards, so another player can add them in-game without opening
// their profile. Dota 2 and CS2 share the same Steam account, so both use
// the same 32-bit Steam friend-code conversion; Valorant and MLBB have no
// numeric ID to derive, so their own linked-account fields are shown as-is.
export function formatGameAccountId(
  gameSlug: string | null | undefined,
  profile: {
    steam_id?: string | null;
    riot_name?: string | null;
    riot_tag?: string | null;
    mlbb_user_id?: string | null;
    mlbb_server?: string | null;
  } | null,
): string | null {
  if (!gameSlug || !profile) return null;

  switch (gameSlug) {
    case "dota-2":
    case "cs2":
      return profile.steam_id ? steamId64ToDotaAccountId(profile.steam_id) : null;
    case "valorant":
      return profile.riot_name && profile.riot_tag
        ? `${profile.riot_name}#${profile.riot_tag}`
        : null;
    case "mobile-legends":
      return profile.mlbb_user_id
        ? `${profile.mlbb_user_id}${profile.mlbb_server ? ` (${profile.mlbb_server})` : ""}`
        : null;
    default:
      return null;
  }
}
