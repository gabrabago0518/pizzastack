"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatDotaRank } from "@/lib/dota-rank";

export interface CoachFormState {
  error?: string;
}

export async function createCoachProfile(
  _prevState: CoachFormState,
  formData: FormData,
): Promise<CoachFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to list yourself as a coach." };
  }

  const gameId = String(formData.get("gameId") ?? "");
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const rateNote = String(formData.get("rateNote") ?? "").trim();
  const contactMethod = String(formData.get("contactMethod") ?? "").trim();

  if (!gameId || !headline || !contactMethod) {
    return {
      error: "Pick a game, add a headline, and share how players can reach you.",
    };
  }

  const { data: game } = await supabase
    .from("games")
    .select("slug")
    .eq("id", gameId)
    .maybeSingle();

  // Dota 2 coaches are qualified by their Steam-verified rank, never a
  // self-reported one — so it's looked up server-side, not taken from the form.
  let rank: string | null = null;
  if (game?.slug === "dota-2") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("dota_rank_tier, dota_leaderboard_rank")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.dota_rank_tier) {
      return {
        error: "Connect your Steam account and sync your rank before coaching Dota 2.",
      };
    }
    rank = formatDotaRank(profile.dota_rank_tier, profile.dota_leaderboard_rank);
  }

  const { error } = await supabase.from("coach_profiles").insert({
    profile_id: user.id,
    game_id: gameId,
    headline,
    bio: bio || null,
    rate_note: rateNote || null,
    contact_method: contactMethod,
    rank,
  });

  if (error) {
    return {
      error: error.code === "23505"
        ? "You've already listed yourself as a coach for this game."
        : error.message,
    };
  }

  await supabase.from("profiles").update({ is_coach: true }).eq("id", user.id);

  revalidatePath("/coaches");
  redirect("/coaches");
}
