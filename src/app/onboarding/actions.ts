"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingFormState {
  error?: string;
}

export async function completeOnboarding(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to continue." };
  }

  const gameIds = formData.getAll("gameIds").map(String);

  if (gameIds.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_games")
      .insert(gameIds.map((gameId) => ({ profile_id: user.id, game_id: gameId })));
    // 23505 = unique_violation (already added) — treat as a no-op success.
    if (insertError && insertError.code !== "23505") {
      return { error: insertError.message };
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ onboarded: true })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
