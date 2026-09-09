import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postSystemMessage } from "@/lib/party-chat";

// Owner-only: kick an already-accepted player from the party.
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
    .select("post_id, requester_id, lfg_posts(author_id)")
    .eq("id", requestId)
    .maybeSingle()
    .returns<{
      post_id: string;
      requester_id: string;
      lfg_posts: { author_id: string } | null;
    }>();

  if (!joinRequest) {
    return NextResponse.json({ error: "That request no longer exists." }, { status: 404 });
  }
  if (joinRequest.lfg_posts?.author_id !== user.id) {
    return NextResponse.json(
      { error: "Only the listing owner can remove a player." },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("lfg_join_requests")
    .update({ status: "removed" })
    .eq("id", requestId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: requester } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", joinRequest.requester_id)
    .maybeSingle();

  if (requester) {
    await postSystemMessage(
      supabase,
      joinRequest.post_id,
      `@${requester.username} was removed from the party`,
    );
  }

  revalidatePath("/teammates");
  return NextResponse.json({});
}
