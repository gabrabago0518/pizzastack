"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const mode = String(formData.get("mode") ?? "").trim();
  const rank = String(formData.get("rank") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const rolesNeeded = String(formData.get("rolesNeeded") ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const playersNeeded = Number(formData.get("playersNeeded"));

  if (!gameId || !title || !mode || !rank) {
    return { error: "Pick a game, a mode, a rank, and give your listing a title." };
  }
  if (!Number.isInteger(playersNeeded) || playersNeeded < 1 || playersNeeded > 4) {
    return { error: "Choose how many players you need (1-4)." };
  }

  const { error } = await supabase.from("lfg_posts").insert({
    author_id: user.id,
    game_id: gameId,
    title,
    description: description || null,
    mode,
    rank,
    region: region || null,
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
  redirect("/teammates");
}
