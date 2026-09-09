export const VALORANT_REGIONS = [
  { value: "na", label: "North America" },
  { value: "eu", label: "Europe" },
  { value: "ap", label: "Asia Pacific" },
  { value: "kr", label: "Korea" },
  { value: "latam", label: "Latin America" },
  { value: "br", label: "Brazil" },
] as const;

export function isValorantRegion(value: string): boolean {
  return VALORANT_REGIONS.some((region) => region.value === value);
}

export function formatValorantRank(tier: string | null, rr: number | null): string {
  if (!tier) return "Unranked";
  return rr != null ? `${tier} (RR ${rr})` : tier;
}
