"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VERIFIED_RANK_GAME_SLUGS, resolveVerifiedRank } from "@/lib/verified-ranks";

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
    .select("name, slug")
    .eq("id", gameId)
    .maybeSingle();

  // Verified-game coaches are qualified by their Steam-verified rank, never
  // a self-reported one — so it's looked up server-side, not taken from the form.
  let rank: string | null = null;
  let rankTier: number | null = null;
  if (game && (VERIFIED_RANK_GAME_SLUGS as readonly string[]).includes(game.slug)) {
    const result = await resolveVerifiedRank(
      supabase,
      user.id,
      game.slug,
      `coaching ${game.name}`,
    );
    if ("error" in result) {
      return { error: result.error };
    }
    rank = result.rank;
    rankTier = result.rankTier;
  }

  const { error } = await supabase.from("coach_profiles").insert({
    profile_id: user.id,
    game_id: gameId,
    headline,
    bio: bio || null,
    rate_note: rateNote || null,
    contact_method: contactMethod,
    rank,
    rank_tier: rankTier,
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

export interface CoachReviewResult {
  error?: string;
}

// Same openness model as commending a player (see players/actions.ts) —
// there's no booking system to verify someone was actually coached, so
// any signed-in player other than the coach themselves can leave one.
// Upserted on (coach_profile_id, reviewer_id) so resubmitting edits the
// existing review instead of erroring or stacking duplicates; the
// coach_profiles.avg_rating/review_count aggregate updates itself via the
// recalculate_coach_rating trigger, not here.
export async function submitCoachReview(
  coachProfileId: string,
  rating: number,
  comment: string,
): Promise<CoachReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to leave a review." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pick a rating between 1 and 5 stars." };
  }

  const { data: coach } = await supabase
    .from("coach_profiles")
    .select("profile_id")
    .eq("id", coachProfileId)
    .maybeSingle();

  if (!coach) {
    return { error: "Coach listing not found." };
  }
  if (coach.profile_id === user.id) {
    return { error: "You can't review your own coach listing." };
  }

  const { error } = await supabase.from("coach_reviews").upsert(
    {
      coach_profile_id: coachProfileId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
    },
    { onConflict: "coach_profile_id,reviewer_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/coaches");
  revalidatePath("/coaches/[id]", "page");
  return {};
}

export async function deleteCoachReview(coachProfileId: string): Promise<CoachReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("coach_reviews")
    .delete()
    .eq("coach_profile_id", coachProfileId)
    .eq("reviewer_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/coaches");
  revalidatePath("/coaches/[id]", "page");
  return {};
}
