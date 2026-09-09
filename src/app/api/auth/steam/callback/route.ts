import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifySteamOpenIdCallback, fetchDotaRankFromOpenDota } from "@/lib/steam";

// Verifies the Steam OpenID response, then writes the verified SteamID and a
// fresh Dota 2 rank to the signed-in user's profile using the service-role
// client — never the user's own session — so this is the only path that can
// set those columns (see the column grants added alongside steam_id/dota_*
// in supabase/schema.sql).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const settingsUrl = (status: string) => `${origin}/profile/settings?steam=${status}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const steamId64 = await verifySteamOpenIdCallback(url.searchParams);
  if (!steamId64) {
    return NextResponse.redirect(settingsUrl("invalid"));
  }

  const service = createServiceClient();
  const { error: linkError } = await service
    .from("profiles")
    .update({ steam_id: steamId64 })
    .eq("id", user.id);

  if (linkError) {
    // 23505 = unique_violation — this Steam account is already linked elsewhere.
    return NextResponse.redirect(
      settingsUrl(linkError.code === "23505" ? "taken" : "error"),
    );
  }

  try {
    const { rankTier, leaderboardRank } = await fetchDotaRankFromOpenDota(steamId64);
    await service
      .from("profiles")
      .update({
        dota_rank_tier: rankTier,
        dota_leaderboard_rank: leaderboardRank,
        dota_rank_synced_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch {
    // Steam connected fine; rank sync can be retried from the settings page.
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return NextResponse.redirect(settingsUrl("connected"));
}
