"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMessagesForPost } from "@/lib/queries";

export interface LfgFormState {
  error?: string;
}

export async function createLfgPost(
  _prevState: LfgFormState,
  formData: FormData,
): Promise<LfgFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to post a listing." };
  }

  const gameId = String(formData.get("gameId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const mode = String(formData.get("mode") ?? "").trim();
  const rank = String(formData.get("rank") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const rolesNeeded = String(formData.get("rolesNeeded") ?? "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const playersNeeded = Number(formData.get("playersNeeded"));

  if (!gameId || !title || !mode || !rank) {
    return { error: "Pick a game, a mode, a rank, and give your listing a title." };
  }
  if (!Number.isInteger(playersNeeded) || playersNeeded < 1 || playersNeeded > 4) {
    return { error: "Choose how many players you need (1-4)." };
  }

  const { error } = await supabase.from("lfg_posts").insert({
    author_id: user.id,
    game_id: gameId,
    title,
    description: description || null,
    mode,
    rank,
    region: region || null,
    roles_needed: rolesNeeded.length ? rolesNeeded : null,
    players_needed: playersNeeded,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teammates");
  redirect("/teammates");
}

export interface JoinRequestState {
  error?: string;
}

export async function requestToJoin(postId: string): Promise<JoinRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to request to join." };
  }

  const { data: post } = await supabase
    .from("lfg_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return { error: "That listing no longer exists." };
  }
  if (post.author_id === user.id) {
    return { error: "You can't request to join your own listing." };
  }

  const { error } = await supabase
    .from("lfg_join_requests")
    .insert({ post_id: postId, requester_id: user.id });
  // 23505 = unique_violation (already requested) — treat as a no-op success.
  if (error && error.code !== "23505") {
    return { error: error.message };
  }

  revalidatePath("/teammates");
  return {};
}

export async function respondToJoinRequest(
  requestId: string,
  accept: boolean,
): Promise<JoinRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("lfg_join_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", requestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teammates");
  return {};
}

export interface SendMessageState {
  error?: string;
}

export async function sendMessage(
  postId: string,
  body: string,
): Promise<SendMessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to chat." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Message can't be empty." };
  }
  if (trimmed.length > 1000) {
    return { error: "Message is too long (max 1000 characters)." };
  }

  const { error } = await supabase
    .from("lfg_messages")
    .insert({ post_id: postId, sender_id: user.id, body: trimmed });

  // RLS silently rejects rows that fail the policy check instead of erroring,
  // so a chat that hasn't unlocked yet (no accepted request) surfaces as a
  // generic insert failure here — treat it as "you can't chat here yet".
  if (error) {
    return { error: "You don't have access to this chat." };
  }

  return {};
}

// Thin server-action wrapper so the client-side polling in ListingChat can
// call it directly (getMessagesForPost itself isn't a server action).
export async function getListingMessages(postId: string) {
  return getMessagesForPost(postId);
}
