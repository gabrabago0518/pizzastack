export const RANKS_BY_GAME: Record<string, string[]> = {
  "league-of-legends": [
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Emerald",
    "Diamond",
    "Master",
    "Grandmaster",
    "Challenger",
  ],
  "overwatch-2": [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Master",
    "Grandmaster",
    "Champion",
  ],
  "apex-legends": [
    "Rookie",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Master",
    "Predator",
  ],
  "rocket-league": [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Champion",
    "Grand Champion",
    "Supersonic Legend",
  ],
  fortnite: [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Elite",
    "Champion",
    "Unreal",
  ],
  // These three games use a verified rank pulled from a connected account
  // (see verified-ranks.ts) rather than a manual pick when posting, so the
  // stored `rank` text is a formatted label with extra detail baked in
  // (e.g. "Legend 3", "Diamond 2 (RR 45)", "CS Rating: 12,345") rather than
  // a bare tier name. These lists exist only for the /teammates rank
  // filter, which matches them against that text with ILIKE '%tier%' —
  // safe even for CS2's Premier-rating listings, which just won't match
  // any tier bucket (Premier has no named tier to filter by).
  "dota-2": ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"],
  cs2: ["Silver", "Gold Nova", "Master Guardian", "Legendary Eagle", "Supreme", "Global Elite"],
  valorant: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
  "mobile-legends": [
    "Warrior",
    "Elite",
    "Master",
    "Grandmaster",
    "Epic",
    "Legend",
    "Mythic",
    "Mythical Glory",
  ],
};

export const FALLBACK_RANKS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export const PLAYERS_NEEDED_OPTIONS = [1, 2, 3, 4] as const;
