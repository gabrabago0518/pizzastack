import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// A same-origin, relative "next" path only — starts with exactly one slash
// (never "//..." or "/\...", both of which some browsers treat as
// protocol-relative and will happily follow off-site). Anything else falls
// back to /dashboard rather than trusting an attacker-supplied email link
// to send a just-verified session somewhere else.
function safeNextPath(raw: string | null): string {
  if (raw && /^\/(?!\/|\\)/.test(raw)) return raw;
  return "/dashboard";
}

// Handles every Supabase auth email link (signup confirmation, password
// recovery, email change, magic link) — the email template just needs to
// point at this route with the right `type` and an optional `next` path.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const message =
    searchParams.get("error_description") ??
    "That confirmation link is invalid or has expired.";

  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent(message)}`,
  );
}
