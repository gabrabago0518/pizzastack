import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postSystemMessage } from "@/lib/party-chat";

// Requester-only: leave a party they were previously accepted into.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const { data: joinRequest } = await supabase
    .from("lfg_join_requests")
    .select("post_id, requester_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!joinRequest) {
    return NextResponse.json({ error: "That request no longer exists." }, { status: 404 });
  }
  if (joinRequest.requester_id !== user.id) {
    return NextResponse.json(
      { error: "You can only leave a party you joined." },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("lfg_join_requests")
    .update({ status: "left" })
    .eq("id", requestId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    await postSystemMessage(supabase, joinRequest.post_id, `@${profile.username} left the party`);
  }

  revalidatePath("/teammates");
  return NextResponse.json({});
}
