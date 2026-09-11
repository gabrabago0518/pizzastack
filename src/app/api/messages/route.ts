import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversations } from "@/lib/queries";

// Powers the floating messages panel in ChatFab — the /messages page
// fetches this same data through a Server Component, but the panel is a
// client component that needs to load (and reload, on demand) the
// conversation list without a full page navigation.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be logged in to see your messages." }, { status: 401 });
  }

  const conversations = await getConversations(user.id);
  return NextResponse.json({ conversations });
}
