"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FeedActionResult {
  error?: string;
}

export async function createFeedPost(body: string): Promise<FeedActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to post." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Say something first." };
  }
  if (trimmed.length > 1000) {
    return { error: "That's too long (max 1000 characters)." };
  }

  const { error } = await supabase.from("feed_posts").insert({
    author_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/feed");
  return {};
}

// RLS backs this up independently (authors and admins can delete a feed
// post) — a caller who isn't either just deletes zero rows.
export async function deleteFeedPost(postId: string): Promise<FeedActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/feed");
  return {};
}

export async function deleteFeedComment(commentId: string): Promise<FeedActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase.from("feed_comments").delete().eq("id", commentId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/feed");
  return {};
}

// Toggles the viewer's own "like" on a post — one row per (post, viewer),
// same shape as toggleCommend.
export async function toggleFeedReaction(
  postId: string,
  react: boolean,
): Promise<FeedActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to react." };
  }

  if (react) {
    const { error } = await supabase
      .from("feed_reactions")
      .insert({ post_id: postId, profile_id: user.id });
    // 23505 = unique_violation (already reacted) — treat as a no-op success.
    if (error && error.code !== "23505") {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("feed_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/feed");
  return {};
}
