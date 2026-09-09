import { createClient } from "@/lib/supabase/server";
import type {
  CoachProfileWithRelations,
  LfgPostWithRelations,
  JoinRequestWithRequester,
  LfgMessageWithSender,
  Game,
} from "@/lib/supabase/types";

export async function getGames() {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").order("name");
  return data ?? [];
}

async function resolveGameId(gameSlug?: string) {
  if (!gameSlug) return undefined;
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("id")
    .eq("slug", gameSlug)
    .single();
  return data?.id;
}

export async function getLfgPosts(gameSlug?: string) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  const builder = supabase
    .from("lfg_posts")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data } = await (gameId ? builder.eq("game_id", gameId) : builder).returns<
    LfgPostWithRelations[]
  >();
  return data ?? [];
}

export async function getLfgPostById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lfg_posts")
    .select("*, profiles(username, region), games(name, slug)")
    .eq("id", id)
    .maybeSingle()
    .returns<LfgPostWithRelations>();
  return data;
}

export async function getCoachProfiles(gameSlug?: string) {
  const supabase = await createClient();
  const gameId = await resolveGameId(gameSlug);

  const builder = supabase
    .from("coach_profiles")
    .select("*, profiles(username, region), games(name, slug)")
    .order("created_at", { ascending: false });

  const { data } = await (gameId ? builder.eq("game_id", gameId) : builder).returns<
    CoachProfileWithRelations[]
  >();
  return data ?? [];
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

export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data;
}

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
