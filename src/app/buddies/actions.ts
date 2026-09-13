"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface BuddyActionResult {
  error?: string;
}

export async function sendBuddyRequest(recipientId: string): Promise<BuddyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };
  if (user.id === recipientId) return { error: "You can't buddy yourself." };

  const { error } = await supabase
    .from("buddy_requests")
    .insert({ requester_id: user.id, recipient_id: recipientId });

  if (error) {
    return {
      error: error.code === "23505" ? "A buddy request already exists." : error.message,
    };
  }

  revalidatePath("/messages");
  return {};
}

// Addressed by the requester's profile id rather than the request row id,
// so callers (BuddyButton, the pending-requests list) never need to know
// the row id — just who the request is with.
export async function respondToBuddyRequest(
  requesterId: string,
  accept: boolean,
): Promise<BuddyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // Accepting flips status via the "Recipient can accept" policy; declining
  // just deletes the row (see buddy_requests in schema.sql — there's no
  // 'declined' status to set).
  const { error } = accept
    ? await supabase
        .from("buddy_requests")
        .update({ status: "accepted" })
        .eq("requester_id", requesterId)
        .eq("recipient_id", user.id)
    : await supabase
        .from("buddy_requests")
        .delete()
        .eq("requester_id", requesterId)
        .eq("recipient_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/messages");
  return {};
}

// Covers cancelling a pending sent request, declining a received one by
// profile id instead of request id, and unfriending an accepted buddy —
// all three are just "delete the row between us" (see schema.sql).
export async function removeBuddy(otherProfileId: string): Promise<BuddyActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("buddy_requests")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${otherProfileId}),and(requester_id.eq.${otherProfileId},recipient_id.eq.${user.id})`,
    );

  if (error) return { error: error.message };

  revalidatePath("/messages");
  return {};
}
