import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncRanksForSteamId } from "@/lib/rank-sync";

// Re-fetches every verified-game rank (Dota 2, CS2) for the signed-in
// user's connected Steam account. Writes via the service-role client for
// the same reason as the OpenID callback: rank must only ever be set from
// a server-verified fetch, never from the client.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("steam_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.steam_id) {
    return NextResponse.json(
      { error: "Connect your Steam account first." },
      { status: 400 },
    );
  }

  const ranks = await syncRanksForSteamId(user.id, profile.steam_id);

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return NextResponse.json({ ...ranks, syncedAt: new Date().toISOString() });
}
