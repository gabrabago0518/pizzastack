export const ROLES_BY_GAME: Record<string, string[]> = {
  valorant: ["Duelist", "Controller", "Initiator", "Sentinel", "Flex"],
  "league-of-legends": ["Top", "Jungle", "Mid", "ADC", "Support"],
  cs2: ["Entry Fragger", "Support", "AWPer", "IGL", "Lurker"],
  "overwatch-2": ["Tank", "Damage", "Support"],
  "apex-legends": ["Fragger", "Support", "Recon"],
  "rocket-league": ["Striker", "Midfield", "Defense"],
  fortnite: ["Fragger", "Builder", "Support"],
  "dota-2": ["Carry", "Mid", "Offlane", "Soft Support", "Hard Support"],
  "mobile-legends": ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"],
};

export const FALLBACK_ROLES = ["Flex", "Support", "Carry", "IGL"];
