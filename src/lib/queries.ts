import { createClient } from "@/lib/supabase/server";
import type {
  CoachProfileWithRelations,
  LfgPostWithRelations,
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
