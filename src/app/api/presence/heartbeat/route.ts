import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Bumped by PresenceHeartbeat (mounted in the root layout for signed-in
// users) every minute or so — see getAdminStats for how "online now" is
// derived from this.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({});
}
