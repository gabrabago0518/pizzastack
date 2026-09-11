"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MessageActionResult {
  error?: string;
}

// Finds the existing conversation with this player, or creates one, then
// redirects to it. profile_one_id/profile_two_id are always stored
// smaller-uuid-first (see schema.sql) so this has to sort the pair the
// same way before looking it up, or a conversation started from the other
// side would never be found.
export async function startConversation(otherProfileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.id === otherProfileId) redirect("/messages");

  const [profileOneId, profileTwoId] =
    user.id < otherProfileId ? [user.id, otherProfileId] : [otherProfileId, user.id];

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("profile_one_id", profileOneId)
    .eq("profile_two_id", profileTwoId)
    .maybeSingle();

  if (existing) redirect(`/messages/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ profile_one_id: profileOneId, profile_two_id: profileTwoId })
    .select("id")
    .single();

  if (error || !created) redirect("/messages");

  redirect(`/messages/${created.id}`);
}

// Marks every unread message from the other participant as read — called
// once when a conversation's thread is opened. Scoped to messages the
// caller didn't send; RLS backs this up independently (see
// direct_messages' "Participants can mark messages read" policy).
export async function markConversationRead(
  conversationId: string,
): Promise<MessageActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("direct_messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("read", false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/messages");
  return {};
}
