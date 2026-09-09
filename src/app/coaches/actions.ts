"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("coach_profiles").insert({
    profile_id: user.id,
    game_id: gameId,
    headline,
    bio: bio || null,
    rate_note: rateNote || null,
    contact_method: contactMethod,
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
