import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postSystemMessage } from "@/lib/party-chat";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const { accept } = (await request.json()) as { accept?: boolean };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const { data: updated, error } = await supabase
    .from("lfg_join_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", requestId)
    .select("post_id, requester_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (accept) {
    const { data: requester } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", updated.requester_id)
      .maybeSingle();

    if (requester) {
      await postSystemMessage(supabase, updated.post_id, `@${requester.username} entered the party`);
    }
  }

  revalidatePath("/teammates");
  return NextResponse.json({});
}
