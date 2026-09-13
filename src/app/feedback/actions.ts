"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubmitFeedbackResult {
  error?: string;
}

export async function submitFeedback(message: string): Promise<SubmitFeedbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to send feedback." };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { error: "Write a message before sending." };
  }
  if (trimmed.length > 2000) {
    return { error: "Keep it under 2000 characters." };
  }

  const { error } = await supabase.from("feedback").insert({
    profile_id: user.id,
    message: trimmed,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
