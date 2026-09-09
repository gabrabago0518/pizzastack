import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role client: bypasses RLS and the column grants that restrict what
// a user's own session can write. Used ONLY for steam_id/dota_rank_* — those
// are set solely from server-verified Steam data (see src/lib/steam.ts), and
// must never be writable by the user's own authenticated session, or the
// "verified" rank stops meaning anything. Never import this into client code.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
