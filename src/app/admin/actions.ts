"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AdminActionResult {
  error?: string;
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
