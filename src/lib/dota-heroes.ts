interface OpenDotaHero {
  id: number;
  name: string; // "npc_dota_hero_antimage"
  localized_name: string; // "Anti-Mage"
}

export interface DotaHeroInfo {
  name: string;
  iconUrl: string;
}

// Cached per server instance — the hero list only changes with major
// patches, so refetching it for every match in a sync batch would be
// wasteful. Doesn't persist across cold starts, which is fine: worst case
// is an extra fetch next time.
let heroCache: Map<number, OpenDotaHero> | null = null;

async function getHeroCache(): Promise<Map<number, OpenDotaHero>> {
  if (heroCache) return heroCache;

  const response = await fetch("https://api.opendota.com/api/heroes", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OpenDota heroes request failed (${response.status})`);
  }
  const heroes = (await response.json()) as OpenDotaHero[];
  heroCache = new Map(heroes.map((hero) => [hero.id, hero]));
  return heroCache;
}

// Valve's hero portrait art, same CDN path OpenDota's own frontend and
// most third-party Dota tools use — keyed by the hero's internal name with
// the "npc_dota_hero_" prefix stripped.
export async function fetchDotaHeroInfo(heroId: number): Promise<DotaHeroInfo | null> {
  const heroes = await getHeroCache();
  const hero = heroes.get(heroId);
  if (!hero) return null;

  const key = hero.name.replace("npc_dota_hero_", "");
  return {
    name: hero.localized_name,
    iconUrl: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${key}.png`,
  };
}
