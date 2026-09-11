import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  CoachProfileWithRelations,
  CoachReviewWithReviewer,
  CoachingRequestWithRelations,
  LfgPostWithRelations,
  JoinRequestWithRequester,
  LfgMessageWithSender,
  Notification,
  Guild,
  GuildMember,
  GuildWithRelations,
  GuildMemberWithProfile,
  GuildMessageWithSender,
  GuildAnnouncementWithAuthor,
  GuildAchievement,
  Conversation,
  DirectMessageWithSender,
  Game,
  Tournament,
  TournamentMatch,
  TournamentWithRelations,
  TournamentTeamWithRelations,
  TournamentTeamMemberWithProfile,
  ScrimmageWithRelations,
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

export interface AdminAccountRow {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  isAdmin: boolean;
  isCoach: boolean;
  accountTier: "standard" | "prime";
}

// profiles are already publicly readable (usernames show up all over the
// site), so this needs no special RLS — the only "admin-only" part is that
// this full listing is never rendered anywhere but the is_admin-gated
// /admin page. Capped at a fixed limit rather than real pagination — fine
// at the site's current scale; worth revisiting if that stops being true.
const ADMIN_ACCOUNTS_LIMIT = 200;

export async function getAllAccounts(): Promise<AdminAccountRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at, is_admin, is_coach, account_tier")
    .order("created_at", { ascending: false })
    .limit(ADMIN_ACCOUNTS_LIMIT);

  return (data ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    isAdmin: row.is_admin,
    isCoach: row.is_coach,
    accountTier: row.account_tier as "standard" | "prime",
  }));
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
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "approved");

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
    .eq("status", "approved")
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

export interface CoachingRequestFilters {
  rank?: string;
  region?: string;
}

// The reverse of getCoachProfiles — players posting what they're looking
// for in a coach, browsable the same way on /coaches/looking-for-coach.
export async function getCoachingRequests(
  gameSlug?: string,
  filters: CoachingRequestFilters = {},
) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  let builder = supabase
    .from("coaching_requests")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (gameId) builder = builder.eq("game_id", gameId);
  if (filters.rank) builder = builder.eq("rank", filters.rank);
  if (filters.region) builder = builder.eq("region", filters.region);

  const { data } = await builder.returns<CoachingRequestWithRelations[]>();
  return data ?? [];
}

// Mirrors getOwnOpenListingId — only one open "looking for a coach" post
// per player at a time (coaching_requests_one_open_per_author).
export async function getOwnOpenCoachingRequestId(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coaching_requests")
    .select("id")
    .eq("author_id", userId)
    .eq("status", "open")
    .maybeSingle();
  return data?.id ?? null;
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

export async function getGuilds(gameSlug?: string) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  let builder = supabase
    .from("guilds")
    .select("*, games(name, slug)")
    .order("member_count", { ascending: false });

  if (gameId) builder = builder.eq("game_id", gameId);

  const { data } = await builder.returns<GuildWithRelations[]>();
  return data ?? [];
}

// Wrapped in React's cache() so generateMetadata and the page body (which
// both need this) share one query per request instead of two.
export const getGuildById = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guilds")
    .select("*, games(name, slug)")
    .eq("id", id)
    .maybeSingle()
    .returns<GuildWithRelations>();
  return data;
});

export async function getGuildMembers(guildId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guild_members")
    .select("*, profiles(username, avatar_url)")
    .eq("guild_id", guildId)
    .order("joined_at", { ascending: true })
    .returns<GuildMemberWithProfile[]>();
  return data ?? [];
}

// A player can only be in one guild at a time (guild_members.profile_id is
// its primary key), so this is at most one row — used to gate "Create a
// guild" and to show "You're already in a guild" states.
export async function getMyGuildMembership(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guild_members")
    .select("*, guilds(id, name, tag)")
    .eq("profile_id", profileId)
    .maybeSingle()
    .returns<(GuildMember & { guilds: Pick<Guild, "id" | "name" | "tag"> | null }) | null>();
  return data;
}

export async function getGuildMessages(guildId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guild_messages")
    .select("*, profiles(username, avatar_url)")
    .eq("guild_id", guildId)
    .order("created_at", { ascending: true })
    .returns<GuildMessageWithSender[]>();
  return data ?? [];
}

// Member-only — RLS on guild_announcements independently enforces this, the
// page just avoids issuing the query at all for a non-member.
export async function getGuildAnnouncements(guildId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guild_announcements")
    .select("*, profiles(username, avatar_url)")
    .eq("guild_id", guildId)
    .order("created_at", { ascending: false })
    .returns<GuildAnnouncementWithAuthor[]>();
  return data ?? [];
}

// Member-only, same as getGuildAnnouncements above.
export async function getGuildAchievements(guildId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guild_achievements")
    .select("*")
    .eq("guild_id", guildId)
    .order("created_at", { ascending: false })
    .returns<GuildAchievement[]>();
  return data ?? [];
}

export interface ConversationRow {
  id: string;
  otherUsername: string;
  otherAvatarUrl: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string;
  hasUnread: boolean;
}

// Two plain queries + a JS merge, same reasoning as getPlayerReports —
// "the other participant" is whichever of profile_one_id/profile_two_id
// isn't the viewer, which Postgrest can't express as a single embed.
export async function getConversations(profileId: string): Promise<ConversationRow[]> {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, profile_one_id, profile_two_id, last_message_at")
    .order("last_message_at", { ascending: false });

  if (!conversations || conversations.length === 0) return [];

  const otherIds = conversations.map((conversation) =>
    conversation.profile_one_id === profileId
      ? conversation.profile_two_id
      : conversation.profile_one_id,
  );
  const conversationIds = conversations.map((conversation) => conversation.id);

  const [{ data: profiles }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").in("id", otherIds),
    supabase
      .from("direct_messages")
      .select("conversation_id, sender_id, body, read")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const lastBodyByConversation = new Map<string, string>();
  const unreadConversations = new Set<string>();
  for (const message of messages ?? []) {
    if (!lastBodyByConversation.has(message.conversation_id)) {
      lastBodyByConversation.set(message.conversation_id, message.body);
    }
    if (!message.read && message.sender_id !== profileId) {
      unreadConversations.add(message.conversation_id);
    }
  }

  return conversations.map((conversation) => {
    const otherId =
      conversation.profile_one_id === profileId
        ? conversation.profile_two_id
        : conversation.profile_one_id;
    const other = profileById.get(otherId);
    return {
      id: conversation.id,
      otherUsername: other?.username ?? "unknown",
      otherAvatarUrl: other?.avatar_url ?? null,
      lastMessageBody: lastBodyByConversation.get(conversation.id) ?? null,
      lastMessageAt: conversation.last_message_at,
      hasUnread: unreadConversations.has(conversation.id),
    };
  });
}

// Wrapped in React's cache() so generateMetadata and the page body (which
// both need this) share one query per request instead of two.
export const getConversationById = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle()
    .returns<Conversation>();
  return data;
});

export async function getDirectMessages(conversationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_messages")
    .select("*, profiles(username, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .returns<DirectMessageWithSender[]>();
  return data ?? [];
}

// RLS on direct_messages already scopes visible rows to conversations the
// caller is a participant of, so no extra join is needed here.
export async function getUnreadDmCount(profileId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("direct_messages")
    .select("*", { count: "exact", head: true })
    .eq("read", false)
    .neq("sender_id", profileId);
  return count ?? 0;
}

export interface PlayerReportRow {
  id: string;
  reporterUsername: string | null;
  reportedUsername: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewed";
  createdAt: string;
}

// Admin-only — RLS on player_reports independently enforces this (only
// admins can select), this is just gated at the page level too so a
// non-admin never even issues the query. Two plain queries + a JS merge
// rather than embedding both profile relations in one select, since that
// needs Postgres's auto-generated two-different-FK-to-the-same-table
// constraint names guessed correctly in the query string — this is safer.
export async function getPlayerReports(): Promise<PlayerReportRow[]> {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("player_reports")
    .select("id, reporter_id, reported_id, reason, details, status, created_at")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) return [];

  const profileIds = Array.from(
    new Set(reports.flatMap((report) => [report.reporter_id, report.reported_id])),
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", profileIds);

  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return reports.map((report) => ({
    id: report.id,
    reporterUsername: usernameById.get(report.reporter_id) ?? null,
    reportedUsername: usernameById.get(report.reported_id) ?? null,
    reason: report.reason,
    details: report.details,
    status: report.status as "open" | "reviewed",
    createdAt: report.created_at,
  }));
}

// Admin-only, oldest first — RLS on coach_profiles independently enforces
// this (the "publicly readable" policy only lets an admin session see
// another player's pending/rejected row), this is just gated at the page
// level too so a non-admin never even issues the query. Only one FK to
// profiles here (unlike player_reports' two), so a normal embedded select
// is unambiguous.
export async function getPendingCoachApplications() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<CoachProfileWithRelations[]>();
  return data ?? [];
}

export interface AdminCoachRow {
  id: string;
  gameName: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  lastSeenAt: string | null;
}

// Admin-only overview of every currently-live coach listing, styled like
// getAllAccounts' rows (avatar, username, joined/last-online) rather than
// getCoachProfiles' public-directory shape — so an admin can revoke one
// after the fact, separate from the pending-review queue above.
// Newest-approved first, matching the public directory's default.
export async function getApprovedCoaches(): Promise<AdminCoachRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select(
      "id, profiles(username, display_name, avatar_url, created_at, last_seen_at), games(name)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        profiles: {
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          last_seen_at: string | null;
        } | null;
        games: { name: string } | null;
      }[]
    >();

  return (data ?? []).map((row) => ({
    id: row.id,
    gameName: row.games?.name ?? null,
    username: row.profiles?.username ?? "unknown",
    displayName: row.profiles?.display_name ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    joinedAt: row.profiles?.created_at ?? "",
    lastSeenAt: row.profiles?.last_seen_at ?? null,
  }));
}

export interface TournamentFilters {
  status?: Tournament["status"];
}

export async function getTournaments(gameSlug?: string, filters: TournamentFilters = {}) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  let builder = supabase
    .from("tournaments")
    .select("*, profiles(username, avatar_url), games(name, slug), tournament_teams(count)")
    .order("created_at", { ascending: false });

  if (gameId) builder = builder.eq("game_id", gameId);
  if (filters.status) builder = builder.eq("status", filters.status);

  const { data } = await builder.returns<TournamentWithRelations[]>();
  return data ?? [];
}

// Wrapped in React's cache() so generateMetadata and the page body (which
// both need this) share one query per request instead of two.
export const getTournamentById = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*, profiles(username, avatar_url), games(name, slug), tournament_teams(count)")
    .eq("id", id)
    .maybeSingle()
    .returns<TournamentWithRelations>();
  return data;
});

// Ordered seed-first (nulls last, tie-broken by registration order) — this
// is the exact order generateBracket (src/lib/bracket.ts) seeds from, so
// the team list an organizer sees while setting seeds is the same order
// the bracket will use.
export async function getTournamentTeams(tournamentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_teams")
    .select("*, profiles(username, avatar_url), guilds(name, tag), tournament_team_members(count)")
    .eq("tournament_id", tournamentId)
    .order("seed", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<TournamentTeamWithRelations[]>();
  return data ?? [];
}

export async function getTournamentTeamMembers(teamId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_team_members")
    .select("*, profiles(username, avatar_url)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .returns<TournamentTeamMemberWithProfile[]>();
  return data ?? [];
}

// The team (if any) a player is on for a given tournament — at most one,
// enforced by tournament_team_members' (tournament_id, profile_id) unique
// constraint. Used to show "You're on Team X" and gate create/join actions.
export async function getMyTournamentTeam(tournamentId: string, profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_team_members")
    .select("team_id, tournament_teams(name)")
    .eq("tournament_id", tournamentId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) return null;
  return { teamId: data.team_id, teamName: data.tournament_teams?.name ?? null };
}

// Raw match rows only — no participant/profile embed. tournament_matches
// has three separate foreign keys into tournament_teams
// (participant1_id/participant2_id/winner_id), and embedding relations to
// the same target table more than once needs Postgrest's `!constraint`
// disambiguation syntax; rather than risk a subtly wrong guess there, the
// bracket UI is handed this alongside getTournamentTeams (which has only
// one, unambiguous profiles relation) and joins the two client-side.
export async function getTournamentMatches(tournamentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: true })
    .order("match_number", { ascending: true })
    .returns<TournamentMatch[]>();
  return data ?? [];
}

export interface ScrimmageFilters {
  region?: string;
}

// Soonest-scheduled first — a scrim board reads naturally chronologically,
// unlike the other boards (newest-posted first).
export async function getScrimmages(gameSlug?: string, filters: ScrimmageFilters = {}) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  let builder = supabase
    .from("scrimmages")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "open")
    .order("scheduled_at", { ascending: true });

  if (gameId) builder = builder.eq("game_id", gameId);
  if (filters.region) builder = builder.eq("region", filters.region);

  const { data } = await builder.returns<ScrimmageWithRelations[]>();
  return data ?? [];
}
