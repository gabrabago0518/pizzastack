"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ToggleCommendResult {
  error?: string;
}

export async function toggleCommend(
  profileId: string,
  commend: boolean,
): Promise<ToggleCommendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to commend a player." };
  }

  if (user.id === profileId) {
    return { error: "You can't commend yourself." };
  }

  if (commend) {
    const { error } = await supabase
      .from("commendations")
      .insert({ profile_id: profileId, commender_id: user.id });
    // 23505 = unique_violation (already commended) — treat as a no-op success.
    if (error && error.code !== "23505") {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("commendations")
      .delete()
      .eq("profile_id", profileId)
      .eq("commender_id", user.id);
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/players/[username]", "page");
  return {};
}
