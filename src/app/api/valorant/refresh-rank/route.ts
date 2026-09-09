import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncValorantRank } from "@/lib/rank-sync";

// Re-fetches the signed-in user's Valorant rank from HenrikDev using their
// already-saved Riot ID. Writes via the service-role client, same as every
// other rank column — see connectRiotAccount for why riot_name/tag/region
// themselves are plain user-editable fields while the fetched rank isn't.
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
    .select("riot_name, riot_tag, riot_region")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.riot_name || !profile.riot_tag || !profile.riot_region) {
    return NextResponse.json(
      { error: "Connect your Riot ID first." },
      { status: 400 },
    );
  }

  try {
    const rank = await syncValorantRank(
      user.id,
      profile.riot_name,
      profile.riot_tag,
      profile.riot_region,
    );
    revalidatePath("/profile");
    revalidatePath("/profile/settings");
    return NextResponse.json(rank);
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach HenrikDev — try again in a moment." },
      { status: 502 },
    );
  }
}
