"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ScrimmageFormState {
  error?: string;
}

export async function createScrimmage(
  _prevState: ScrimmageFormState,
  formData: FormData,
): Promise<ScrimmageFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to post a scrim." };
  }

  const gameId = String(formData.get("gameId") ?? "");
  const region = String(formData.get("region") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!gameId || !scheduledAt) {
    return { error: "Pick a game and when you want to scrim." };
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { error: "That schedule doesn't look right." };
  }

  const { error } = await supabase.from("scrimmages").insert({
    author_id: user.id,
    game_id: gameId,
    region: region || null,
    scheduled_at: scheduledDate.toISOString(),
    description: description || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/scrims");
  redirect("/scrims");
}

export interface ScrimmageActionResult {
  error?: string;
}

export async function closeScrimmage(scrimmageId: string): Promise<ScrimmageActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("scrimmages")
    .update({ status: "closed" })
    .eq("id", scrimmageId)
    .eq("author_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/scrims");
  return {};
}
