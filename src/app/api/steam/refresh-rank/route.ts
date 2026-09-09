import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchDotaRankFromOpenDota } from "@/lib/steam";

// Re-fetches the signed-in user's Dota 2 rank from OpenDota. Writes via the
// service-role client for the same reason as the OpenID callback: rank must
// only ever be set from a server-verified fetch, never from the client.
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

  let rankTier: number | null;
  let leaderboardRank: number | null;
  try {
    ({ rankTier, leaderboardRank } = await fetchDotaRankFromOpenDota(profile.steam_id));
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach OpenDota — try again in a moment." },
      { status: 502 },
    );
  }

  const syncedAt = new Date().toISOString();
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({
      dota_rank_tier: rankTier,
      dota_leaderboard_rank: leaderboardRank,
      dota_rank_synced_at: syncedAt,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return NextResponse.json({ rankTier, leaderboardRank, syncedAt });
}
