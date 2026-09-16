"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VERIFIED_RANK_GAME_SLUGS, resolveVerifiedRank } from "@/lib/verified-ranks";
import { REGIONS } from "@/lib/regions";
import { RANK_NOT_NEEDED_MODES } from "@/lib/modes";
import { MEETUP_GAME_SLUGS } from "@/lib/meetup-games";

export interface LfgFormState {
  error?: string;
}

export async function createLfgPost(
  _prevState: LfgFormState,
  formData: FormData,
): Promise<LfgFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to post a listing." };
  }

  const gameId = String(formData.get("gameId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!gameId || !title) {
    return { error: "Pick a game and give your listing a title." };
  }

  const { data: game } = await supabase
    .from("games")
    .select("name, slug")
    .eq("id", gameId)
    .maybeSingle();

  // Meetup games (Car Parking Multiplayer 1/2 — see meetup-games.ts) have
  // no rank/role/mode/capacity concept at all: just a title, a server ID
  // so other players can find the room, and an optional description.
  // Short-circuits before any of the normal fields are even read.
  if (game && (MEETUP_GAME_SLUGS as readonly string[]).includes(game.slug)) {
    const serverId = String(formData.get("serverId") ?? "").trim();
    if (!serverId) {
      return { error: "Enter the server ID so other players can find the room." };
    }

    const { error } = await supabase.from("lfg_posts").insert({
      author_id: user.id,
      game_id: gameId,
      title,
      description: description || null,
      server_id: serverId,
      mode: null,
      rank: null,
      region: null,
      roles_needed: null,
      players_needed: null,
    });

    if (error) {
      // 23505 = unique_violation on lfg_posts_one_open_per_author.
      if (error.code === "23505") {
        return {
          error: "You already have an active listing. Close it before posting a new one.",
        };
      }
      return { error: error.message };
    }

    revalidatePath("/teammates");
    redirect("/teammates?posted=1");
  }

  const mode = String(formData.get("mode") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const rolesNeeded = String(formData.get("rolesNeeded") ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const playersNeeded = Number(formData.get("playersNeeded"));

  if (!mode) {
    return { error: "Pick a game, a mode, and give your listing a title." };
  }
  if (!Number.isInteger(playersNeeded) || playersNeeded < 1 || playersNeeded > 4) {
    return { error: "Choose how many players you need (1-4)." };
  }
  if (!(REGIONS as readonly string[]).includes(region)) {
    return { error: "Pick a region." };
  }

  // Unranked/Turbo matches have no rank to report — skips both the manual
  // field and the verified-rank gate below, same as the form does.
  const rankNotNeeded = RANK_NOT_NEEDED_MODES.includes(mode);

  // Verified games' rank is never trusted from the form — it's pulled
  // server-side from the author's Steam-verified rank, so it can't be
  // self-reported.
  let rank: string | null;
  if (rankNotNeeded) {
    rank = null;
  } else if (game && (VERIFIED_RANK_GAME_SLUGS as readonly string[]).includes(game.slug)) {
    const result = await resolveVerifiedRank(
      supabase,
      user.id,
      game.slug,
      `posting a ${game.name} listing`,
    );
    if ("error" in result) {
      return { error: result.error };
    }
    rank = result.rank;
  } else {
    rank = String(formData.get("rank") ?? "").trim();
    if (!rank) {
      return { error: "Pick a game, a mode, a rank, and give your listing a title." };
    }
  }

  const { error } = await supabase.from("lfg_posts").insert({
    author_id: user.id,
    game_id: gameId,
    title,
    description: description || null,
    mode,
    rank,
    region,
    roles_needed: rolesNeeded.length ? rolesNeeded : null,
    players_needed: playersNeeded,
  });

  if (error) {
    // 23505 = unique_violation on lfg_posts_one_open_per_author.
    if (error.code === "23505") {
      return {
        error: "You already have an active listing. Close it before posting a new one.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/teammates");
  redirect("/teammates?posted=1");
}
