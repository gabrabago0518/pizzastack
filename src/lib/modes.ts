export const MODES_BY_GAME: Record<string, string[]> = {
  valorant: ["Unranked", "Competitive", "Swiftplay", "Deathmatch", "Spike Rush"],
  "league-of-legends": ["Normal", "Ranked Solo/Duo", "Ranked Flex", "ARAM", "Clash"],
  cs2: ["Casual", "Competitive", "Premier", "Wingman", "Deathmatch"],
  "overwatch-2": ["Quick Play", "Competitive", "Arcade"],
  "apex-legends": ["Casual", "Ranked", "Mixtape"],
  "rocket-league": ["Casual", "Competitive", "Extra Modes"],
  fortnite: ["Battle Royale", "Zero Build", "Ranked", "Creative"],
  "dota-2": ["Unranked", "Ranked", "Turbo"],
};

export const FALLBACK_MODES = ["Casual", "Ranked"];
