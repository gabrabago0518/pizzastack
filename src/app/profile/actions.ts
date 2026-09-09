"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
