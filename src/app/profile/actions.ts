"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncValorantRank } from "@/lib/rank-sync";
import { isValorantRegion } from "@/lib/valorant-rank";

export interface ProfileFormState {
  error?: string;
  success?: boolean;
}

export interface AvatarFormState {
  error?: string;
  avatarUrl?: string;
}

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadAvatar(
  _prevState: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to update your avatar." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const extension = ALLOWED_AVATAR_TYPES[file.type];
  if (!extension) {
    return { error: "Use a PNG, JPEG, WEBP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be under 4MB." };
  }

  const path = `${user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Bust caches on the public URL since the path itself doesn't change
  // between uploads (upsert overwrites the same file).
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: bustedUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { avatarUrl: bustedUrl };
}

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to edit your profile." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      region: region || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export interface ToggleGameResult {
  error?: string;
}

export async function toggleProfileGame(
  gameId: string,
  selected: boolean,
): Promise<ToggleGameResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to edit your profile." };
  }

  if (selected) {
    const { error } = await supabase
      .from("profile_games")
      .insert({ profile_id: user.id, game_id: gameId });
    // 23505 = unique_violation (already added) — treat as a no-op success.
    if (error && error.code !== "23505") {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("profile_games")
      .delete()
      .eq("profile_id", user.id)
      .eq("game_id", gameId);
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return {};
}

export interface RiotFormState {
  error?: string;
  success?: boolean;
}

// Riot ID isn't verified the way Steam is (no RSO login available) — the
// name/tag/region are just self-reported, saved like any other profile
// field. The rank pulled for that Riot ID afterward still can't be
// tampered with directly (see syncValorantRank), even though the identity
// behind it isn't proven.
export async function connectRiotAccount(
  _prevState: RiotFormState,
  formData: FormData,
): Promise<RiotFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to connect your Riot ID." };
  }

  const name = String(formData.get("riotName") ?? "").trim();
  const tag = String(formData.get("riotTag") ?? "")
    .trim()
    .replace(/^#/, "");
  const region = String(formData.get("riotRegion") ?? "").trim();

  if (!name || !tag || !isValorantRegion(region)) {
    return { error: "Enter your Riot ID (name and tag) and pick a region." };
  }

  const { error: saveError } = await supabase
    .from("profiles")
    .update({ riot_name: name, riot_tag: tag, riot_region: region })
    .eq("id", user.id);

  if (saveError) {
    return { error: saveError.message };
  }

  try {
    await syncValorantRank(user.id, name, tag, region);
  } catch {
    // Riot ID saved; rank sync can be retried from the settings page.
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { success: true };
}
