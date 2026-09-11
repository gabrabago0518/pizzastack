"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface AdminActionResult {
  error?: string;
}

// coach_profiles.status (and profiles.is_coach) are deliberately left out
// of the authenticated grant — see schema.sql — so flipping them has to go
// through the service-role client, which bypasses RLS and column grants
// entirely. That means this action must re-check is_admin itself instead
// of relying on the caller's own RLS, unlike markReportReviewed below.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.is_admin ? user : null;
}

export async function reviewCoachApplication(
  coachProfileId: string,
  decision: "approved" | "rejected",
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { error: "You need to be an admin to do that." };
  }

  const serviceClient = createServiceClient();
  const { data: coachProfile, error: fetchError } = await serviceClient
    .from("coach_profiles")
    .select("profile_id")
    .eq("id", coachProfileId)
    .maybeSingle();

  if (fetchError || !coachProfile) {
    return { error: "Coach application not found." };
  }

  const { error } = await serviceClient
    .from("coach_profiles")
    .update({ status: decision })
    .eq("id", coachProfileId);

  if (error) {
    return { error: error.message };
  }

  if (decision === "approved") {
    await serviceClient
      .from("profiles")
      .update({ is_coach: true })
      .eq("id", coachProfile.profile_id);
  } else {
    // Also used to revoke a previously-approved coach (see the "Coaches"
    // section of /admin) — a coach can be approved for more than one game,
    // so is_coach only comes off once none of their coach_profiles are
    // still approved.
    const { count } = await serviceClient
      .from("coach_profiles")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", coachProfile.profile_id)
      .eq("status", "approved");

    if (!count) {
      await serviceClient
        .from("profiles")
        .update({ is_coach: false })
        .eq("id", coachProfile.profile_id);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/coaches");
  return {};
}

// RLS restricts this update to admins (see player_reports' "Admins can
// update report status" policy), so a non-admin calling it just silently
// affects zero rows — the button is only ever rendered on /admin, which
// is itself gated on is_admin at the page level.
export async function markReportReviewed(reportId: string): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("player_reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return {};
}
