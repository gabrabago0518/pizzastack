"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface HighlightFormState {
  error?: string;
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function uploadHighlight(
  _prevState: HighlightFormState,
  formData: FormData,
): Promise<HighlightFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to upload a highlight." };
  }

  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const gameId = (formData.get("game_id") as string | null) || null;
  const file = formData.get("video");

  if (!title || title.length > 100) {
    return { error: "Give your clip a title (up to 100 characters)." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a video to upload." };
  }

  const extension = ALLOWED_VIDEO_TYPES[file.type];
  if (!extension) {
    return { error: "Use an MP4, WEBM, or MOV video." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "Video must be under 50MB." };
  }

  // Each clip gets its own path (unlike the single-file avatar upload),
  // since a player can have many highlights at once.
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("highlights")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("highlights").getPublicUrl(path);

  const { error: insertError } = await supabase.from("highlights").insert({
    profile_id: user.id,
    game_id: gameId,
    title,
    description: description || null,
    video_url: publicUrl,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/highlights");
  revalidatePath("/profile");
  redirect("/profile");
}

export interface DeleteHighlightResult {
  error?: string;
}

// Deletes the database row only — RLS (owner or admin) already gates this,
// and a highlight's storage object lives at a unique per-clip path (never
// reused like the avatar upload's upsert path), so an orphaned file left
// behind in the owner's own storage folder costs nothing beyond the bucket
// quota. Not worth a service-role round trip just to clean it up in v1.
export async function deleteHighlight(highlightId: string): Promise<DeleteHighlightResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase.from("highlights").delete().eq("id", highlightId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/highlights");
  revalidatePath("/profile");
  revalidatePath("/admin");
  return {};
}
