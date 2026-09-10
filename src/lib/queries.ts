import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  CoachProfileWithRelations,
  CoachReviewWithReviewer,
  LfgPostWithRelations,
  JoinRequestWithRequester,
  LfgMessageWithSender,
  Notification,
  Game,
} from "@/lib/supabase/types";

export interface TopHero {
  gameSlug: string;
  characterName: string;
  characterIconUrl: string | null;
  gamesPlayed: number;
  wins: number;
}

// The most-played hero/agent per game, with win rate. Synced into
// top_hero_stats directly (see rank-sync.ts) rather than aggregated here
// from raw match rows — for Dota 2 that sync pulls OpenDota's own all-time
// per-hero totals, so this stays accurate for accounts with a long match
// history instead of skewing toward whatever handful of recent matches
// happened to be sampled. Excludes any already-synced Valorant rows —
// see verified-ranks.ts for why that sync is currently disabled.
export async function getTopHeroesForProfile(profileId: string): Promise<TopHero[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("top_hero_stats")
    .select("game_slug, character_name, character_icon_url, games_played, wins")
    .eq("profile_id", profileId)
    .neq("game_slug", "valorant");

  return (data ?? []).map((row) => ({
    gameSlug: row.game_slug,
    characterName: row.character_name,
    characterIconUrl: row.character_icon_url,
    gamesPlayed: row.games_played,
    wins: row.wins,
  }));
}

export async function getGames() {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").order("name");
  return data ?? [];
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

// "Online now" is approximate — last_seen_at within the last 5 minutes,
// bumped by a client-side heartbeat (see /api/presence/heartbeat) rather
// than a real-time presence channel. Good enough for an at-a-glance admin
// count without holding open a websocket per visitor.
export async function getAdminStats() {
  const supabase = await createClient();
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: totalAccounts }, { count: newToday }, { count: onlineNow }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", onlineSince),
    ]);

  return {
    totalAccounts: totalAccounts ?? 0,
    newToday: newToday ?? 0,
    onlineNow: onlineNow ?? 0,
  };
}

async function resolveGameId(gameSlug?: string) {
  if (!gameSlug || gameSlug === "all") return undefined;
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("id")
    .eq("slug", gameSlug)
    .single();
  return data?.id;
}

export interface LfgPostFilters {
  rank?: string;
  role?: string;
  mode?: string;
  region?: string;
  sort?: "newest" | "requested";
}

export async function getLfgPosts(gameSlug?: string, filters: LfgPostFilters = {}) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  let builder = supabase
    .from("lfg_posts")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "open");

  // request_count is a trigger-maintained total of every join request the
  // listing has ever received (see schema.sql) — a simple proxy for "how
  // much interest has this gotten" to power a "Most requested" sort.
  builder =
    filters.sort === "requested"
      ? builder.order("request_count", { ascending: false }).order("created_at", { ascending: false })
      : builder.order("created_at", { ascending: false });

  if (gameId) builder = builder.eq("game_id", gameId);
  // Rank is a formatted label ("Legend 3", "Diamond 2 (RR 45)"), not a bare
  // tier name, for the verified-rank games — see ranks.ts — so this matches
  // the tier as a substring rather than requiring an exact value.
  if (filters.rank) builder = builder.ilike("rank", `%${filters.rank}%`);
  if (filters.role) builder = builder.contains("roles_needed", [filters.role]);
  if (filters.mode) builder = builder.eq("mode", filters.mode);
  if (filters.region) builder = builder.eq("region", filters.region);

  const { data } = await builder.returns<LfgPostWithRelations[]>();
  return data ?? [];
}

// Wrapped in React's cache() so generateMetadata and the page body (which
// both need this) share one query per request instead of two.
export const getLfgPostById = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_posts")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("id", id)
    .maybeSingle()
    .returns<LfgPostWithRelations>();
  return data;
});

export interface CoachProfileFilters {
  rank?: string;
  minRating?: number;
  sort?: "newest" | "rating" | "reviews";
}

export async function getCoachProfiles(
  gameSlug?: string,
  filters: CoachProfileFilters = {},
) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  let builder = supabase
    .from("coach_profiles")
    .select("*, profiles(username, region), games(name, slug)");

  if (filters.sort === "rating") {
    builder = builder
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else if (filters.sort === "reviews") {
    builder = builder
      .order("review_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    builder = builder.order("created_at", { ascending: false });
  }

  if (gameId) builder = builder.eq("game_id", gameId);
  // Rank is a formatted verified-rank label ("Legend 3"), same substring
  // match as the teammates listing filter — see ListingFilters/ranks.ts.
  if (filters.rank) builder = builder.ilike("rank", `%${filters.rank}%`);
  if (filters.minRating) builder = builder.gte("avg_rating", filters.minRating);

  const { data } = await builder.returns<CoachProfileWithRelations[]>();
  return data ?? [];
}

// Wrapped in React's cache() so generateMetadata and the page body (which
// both need this) share one query per request instead of two.
export const getCoachProfileById = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("id", id)
    .maybeSingle()
    .returns<CoachProfileWithRelations>();
  return data;
});

export async function getCoachReviews(coachProfileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_reviews")
    .select("*, profiles(username, avatar_url)")
    .eq("coach_profile_id", coachProfileId)
    .order("created_at", { ascending: false })
    .returns<CoachReviewWithReviewer[]>();
  return data ?? [];
}

export async function getMyCoachReview(coachProfileId: string, reviewerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_reviews")
    .select("rating, comment")
    .eq("coach_profile_id", coachProfileId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();
  return data;
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

// Wrapped in React's cache() so generateMetadata and the page body (which
// both need this) share one query per request instead of two.
export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data;
});

export async function getLfgPostsByAuthor(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_posts")
    .select("*, games(name, slug)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .returns<LfgPostWithRelations[]>();
  return data ?? [];
}

export async function getCoachProfilesByAuthor(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select("*, games(name, slug)")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .returns<CoachProfileWithRelations[]>();
  return data ?? [];
}

// PostgREST's `.or()` treats "," and "()" as filter-list syntax, so strip
// them from user input rather than let a stray character reshape the query.
function sanitizeSearchTerm(query: string) {
  return query.replace(/[,()]/g, "").trim();
}

export async function searchProfiles(query: string, limit = 12) {
  const term = sanitizeSearchTerm(query);
  if (!term) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(limit);
  return data ?? [];
}

export async function searchLfgPosts(query: string, limit = 12) {
  const term = sanitizeSearchTerm(query);
  if (!term) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_posts")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "open")
    .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<LfgPostWithRelations[]>();
  return data ?? [];
}

export async function searchCoachProfiles(query: string, limit = 12) {
  const term = sanitizeSearchTerm(query);
  if (!term) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select("*, profiles(username, region), games(name, slug)")
    .or(`headline.ilike.%${term}%,bio.ilike.%${term}%`)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CoachProfileWithRelations[]>();
  return data ?? [];
}

export async function getCommendCount(profileId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("commendations")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);
  return count ?? 0;
}

export async function hasCommended(profileId: string, commenderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commendations")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("commender_id", commenderId)
    .maybeSingle();
  return data !== null;
}

// RLS scopes this to rows the viewer is allowed to see: their own join
// requests (as requester), plus requests on posts they own — so callers can
// bucket the result into "my request status" vs "requests to manage"
// without any extra filtering.
export async function getJoinRequestsForPosts(postIds: string[]) {
  if (postIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_join_requests")
    .select("*, profiles(username, avatar_url)")
    .in("post_id", postIds)
    .order("created_at", { ascending: true })
    .returns<JoinRequestWithRequester[]>();
  return data ?? [];
}

// RLS scopes this to the post's owner and any accepted requester, so it
// naturally returns nothing (rather than an error) for anyone else.
export async function getMessagesForPost(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_messages")
    .select("*, profiles(username, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<LfgMessageWithSender[]>();
  return data ?? [];
}

// The player's own open listing, if any — used to gate the "post a
// listing" page, since only one open listing per author is allowed
// (lfg_posts_one_open_per_author). Unlike getActiveListingIdForUser below,
// this deliberately ignores parties they've merely joined — those don't
// block posting a new listing of their own.
export async function getOwnOpenListingId(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_posts")
    .select("id")
    .eq("author_id", userId)
    .eq("status", "open")
    .maybeSingle();
  return data?.id ?? null;
}

// How many players are waiting on a decision on the listing the user
// currently owns — surfaced as a notification badge on the chat FAB (see
// ChatFab) so an owner notices a new request without having to open the
// listing. Scoped to their open listing only: pending requests on a
// listing they've since closed aren't actionable anymore.
export async function getPendingJoinRequestCountForUser(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("lfg_join_requests")
    .select("id, lfg_posts!inner(author_id, status)", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("lfg_posts.author_id", userId)
    .eq("lfg_posts.status", "open");
  return count ?? 0;
}

// The listing to point the floating chat button at: the player's own open
// listing takes priority, otherwise the most recent open party they're an
// accepted member of. Returns null if neither applies.
export async function getActiveListingIdForUser(userId: string) {
  const supabase = await createClient();

  const { data: owned } = await supabase
    .from("lfg_posts")
    .select("id")
    .eq("author_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (owned) return owned.id;

  const { data: joined } = await supabase
    .from("lfg_join_requests")
    .select("post_id, lfg_posts!inner(status)")
    .eq("requester_id", userId)
    .eq("status", "accepted")
    .eq("lfg_posts.status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<{ post_id: string; lfg_posts: { status: string } | null }>();

  return joined?.post_id ?? null;
}

export async function getGamesForProfile(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_games")
    .select("games(*)")
    .eq("profile_id", profileId)
    .returns<{ games: Game | null }[]>();
  return (data ?? [])
    .map((row) => row.games)
    .filter((game): game is Game => game !== null);
}

// Populated by triggers on lfg_join_requests, commendations, and
// coach_reviews (see schema.sql) — never written directly by the app.
export async function getNotifications(profileId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Notification[]>();
  return data ?? [];
}

export async function getUnreadNotificationCount(profileId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("read", false);
  return count ?? 0;
}
