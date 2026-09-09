import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifySteamOpenIdCallback } from "@/lib/steam";
import { syncRanksForSteamId } from "@/lib/rank-sync";

// Verifies the Steam OpenID response, then writes the verified SteamID and
// fresh ranks for every verified game to the signed-in user's profile using
// the service-role client — never the user's own session — so this is the
// only path that can set those columns (see the column grants added
// alongside steam_id/dota_*/cs2_* in supabase/schema.sql).
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

  await syncRanksForSteamId(user.id, steamId64);

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return NextResponse.redirect(settingsUrl("connected"));
}
