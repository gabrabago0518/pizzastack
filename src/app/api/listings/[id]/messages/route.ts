import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMessagesForPost } from "@/lib/queries";

// Plain Route Handler, not a Server Action — see the comment in
// api/listings/[id]/join/route.ts. This one matters even more here: the
// chat polls every few seconds, and a Server Action poll would have
// re-triggered the listing page's loading.tsx on every single poll.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;
  const messages = await getMessagesForPost(postId);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;
  const { body } = (await request.json()) as { body?: string };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You need to be logged in to chat." },
      { status: 401 },
    );
  }

  const trimmed = String(body ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (trimmed.length > 1000) {
    return NextResponse.json(
      { error: "Message is too long (max 1000 characters)." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("lfg_messages")
    .insert({ post_id: postId, sender_id: user.id, body: trimmed });

  // RLS silently rejects rows that fail the policy check instead of erroring,
  // so a chat that hasn't unlocked yet (no accepted request) surfaces as a
  // generic insert failure here — treat it as "you can't chat here yet".
  if (error) {
    return NextResponse.json(
      { error: "You don't have access to this chat." },
      { status: 403 },
    );
  }

  return NextResponse.json({});
}
