import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Shared by the join-request accept/remove/leave route handlers, which each
// need to drop an "@username ... the party" line into that listing's chat.
export async function postSystemMessage(
  supabase: SupabaseClient<Database>,
  postId: string,
  body: string,
) {
  await supabase.from("lfg_messages").insert({ post_id: postId, kind: "system", body });
}
