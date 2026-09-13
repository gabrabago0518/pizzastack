import { RankMedalCard } from "@/components/site/rank-medal-card";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { ValorantRankIcon } from "@/components/site/valorant-rank-icon";
import { MlbbRankLabel } from "@/components/site/mlbb-rank-label";
import { MlbbRankIcon } from "@/components/site/mlbb-rank-icon";
import { formatDotaRank } from "@/lib/dota-rank";
import { formatCs2Rank } from "@/lib/cs2-rank";
import { formatValorantRank } from "@/lib/valorant-rank";
import type { MlbbRankTier } from "@/lib/mlbb-rank";

// A showcase strip of a player's ranks across games. Built as a list so
// adding the next game's rank later is just another entry here, not a
// redesign. Valorant is included but each card states its own trust level
// via sourceLabel rather than the section claiming every entry is
// "verified" — Dota/CS2 are proven via Steam OpenID, Valorant's rank value
// is real (from HenrikDev) but its identity is a self-entered Riot ID, per
// verified-ranks.ts.
// Dota/CS2 are cryptographically tied to the viewer's account via Steam
// OpenID, so "Verified via Steam" alone already proves who's behind the
// rank. Valorant and MLBB have no such login — the rank *value* is real
// (fetched from HenrikDev) or admin-checked (MLBB), but nothing proves
// the Riot ID/MLBB account shown actually belongs to this profile rather
// than a borrowed or copied one. Showing the exact in-game username here
// lets another player cross-check it themselves (search the Riot ID in
// a tracker, add the MLBB ID in-game) — the closest this site can get to
// "authenticity" without a real API tying the two accounts together.
function formatValorantStatLine(riotName: string | null, riotTag: string | null): string | undefined {
  return riotName && riotTag ? `${riotName}#${riotTag}` : undefined;
}

// Renders "PersonaName · 1,234 matches · 567 hrs played" — the Steam
// persona name leads (same reason as Valorant/MLBB's username line: shows
// exactly which account earned this), then whichever career-totals fields
// have synced. Any piece alone (a partial sync, a very new account with
// 0 hours rounding down, or no persona name yet) still reads fine, so
// this degrades gracefully rather than requiring all three.
function formatDotaStatLine(
  personaName: string | null,
  totalMatches: number | null,
  hoursPlayed: number | null,
): string | undefined {
  const parts: string[] = [];
  if (personaName) parts.push(personaName);
  if (totalMatches !== null) parts.push(`${totalMatches.toLocaleString()} matches`);
  if (hoursPlayed !== null) parts.push(`${hoursPlayed.toLocaleString()} hrs played`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function RankBanner({
  dotaRankTier,
  dotaLeaderboardRank,
  dotaTotalMatches,
  dotaHoursPlayed,
  cs2PremierRating,
  cs2CompetitiveRank,
  steamPersonaName,
  valorantTier,
  valorantTierIcon,
  riotName,
  riotTag,
  mlbbRankTier,
  mlbbSubRank,
  mlbbHighestStar,
  mlbbIgn,
}: {
  dotaRankTier: number | null;
  dotaLeaderboardRank: number | null;
  dotaTotalMatches?: number | null;
  dotaHoursPlayed?: number | null;
  cs2PremierRating: number | null;
  cs2CompetitiveRank: number | null;
  steamPersonaName?: string | null;
  valorantTier?: string | null;
  valorantTierIcon?: string | null;
  riotName?: string | null;
  riotTag?: string | null;
  mlbbRankTier?: MlbbRankTier | null;
  mlbbSubRank?: number | null;
  mlbbHighestStar?: number | null;
  mlbbIgn?: string | null;
}) {
  const hasCs2Rank = Boolean(cs2PremierRating || cs2CompetitiveRank);
  const hasValorantRank = Boolean(valorantTier);
  const hasMlbbRank = Boolean(mlbbRankTier);
  if (!dotaRankTier && !hasCs2Rank && !hasValorantRank && !hasMlbbRank) return null;

  return (
    <div className="mb-10 flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Ranks
      </h2>
      <div className="flex flex-wrap gap-3">
        {dotaRankTier ? (
          <RankMedalCard
            game="Dota 2"
            rankLabel={formatDotaRank(dotaRankTier, dotaLeaderboardRank)}
            sourceLabel="Verified via Steam"
            statLine={formatDotaStatLine(
              steamPersonaName ?? null,
              dotaTotalMatches ?? null,
              dotaHoursPlayed ?? null,
            )}
            icon={<DotaRankIcon rankTier={dotaRankTier} className="size-16 shrink-0 drop-shadow-md" />}
          />
        ) : null}
        {hasCs2Rank ? (
          <RankMedalCard
            game="Counter-Strike 2"
            rankLabel={formatCs2Rank(cs2PremierRating, cs2CompetitiveRank)}
            sourceLabel="Verified via Steam"
            statLine={steamPersonaName ?? undefined}
            leetifyAttribution
          />
        ) : null}
        {hasValorantRank ? (
          <RankMedalCard
            game="Valorant"
            rankLabel={formatValorantRank(valorantTier ?? null)}
            sourceLabel="Via Riot ID"
            statLine={formatValorantStatLine(riotName ?? null, riotTag ?? null)}
            icon={<ValorantRankIcon iconUrl={valorantTierIcon ?? null} className="size-16 shrink-0 drop-shadow-md" />}
          />
        ) : null}
        {hasMlbbRank ? (
          <RankMedalCard
            game="Mobile Legends"
            rankLabel={
              <MlbbRankLabel
                tier={mlbbRankTier ?? null}
                subRank={mlbbSubRank ?? null}
                highestStar={mlbbHighestStar ?? null}
              />
            }
            sourceLabel="Verified by admin"
            statLine={mlbbIgn ?? undefined}
            icon={
              <MlbbRankIcon
                tier={mlbbRankTier ?? null}
                highestStar={mlbbHighestStar ?? null}
                className="size-16 shrink-0 drop-shadow-md"
              />
            }
          />
        ) : null}
      </div>
    </div>
  );
}
