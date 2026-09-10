export const MODES_BY_GAME: Record<string, string[]> = {
  valorant: ["Unranked", "Competitive", "Swiftplay", "Deathmatch", "Spike Rush"],
  "league-of-legends": ["Normal", "Ranked Solo/Duo", "Ranked Flex", "ARAM", "Clash"],
  cs2: ["Casual", "Competitive", "Premier", "Wingman", "Deathmatch"],
  "overwatch-2": ["Quick Play", "Competitive", "Arcade"],
  "apex-legends": ["Casual", "Ranked", "Mixtape"],
  "rocket-league": ["Casual", "Competitive", "Extra Modes"],
  fortnite: ["Battle Royale", "Zero Build", "Ranked", "Creative"],
  "dota-2": ["Unranked", "Ranked", "Turbo"],
  "mobile-legends": ["Classic", "Ranked", "Brawl"],
};

export const FALLBACK_MODES = ["Casual", "Ranked"];

// Modes with no meaningful rank to report — Unranked matches have none,
// Turbo (Dota 2's fast/casual mode) doesn't affect MMR. Used by both the
// posting form (to skip the rank field/verified-rank gate) and the
// server action (so that skip can't be bypassed by editing the form).
export const RANK_NOT_NEEDED_MODES = ["Unranked", "Turbo"];
