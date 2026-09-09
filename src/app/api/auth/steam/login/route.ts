import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSteamLoginUrl } from "@/lib/steam";

// Starts Steam's OpenID 2.0 login flow. Requires an existing Pizzastack
// session so the callback knows which profile to attach the verified
// SteamID to.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = new URL(request.url).origin;

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const loginUrl = buildSteamLoginUrl(origin, "/api/auth/steam/callback");
  return NextResponse.redirect(loginUrl);
}
