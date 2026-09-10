import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGuildMessages } from "@/lib/queries";

// Plain Route Handler, not a Server Action — see the comment in
// api/listings/[id]/messages/route.ts, same reasoning: this polls every
// few seconds and a Server Action poll would re-trigger the guild page's
// loading state on every single poll.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: guildId } = await params;
  const messages = await getGuildMessages(guildId);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: guildId } = await params;
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
    .from("guild_messages")
    .insert({ guild_id: guildId, sender_id: user.id, body: trimmed });

  // RLS silently rejects rows that fail the policy check instead of
  // erroring, so a non-member posting here surfaces as a generic
  // insert failure — treat it as "you don't have access to this chat".
  if (error) {
    return NextResponse.json(
      { error: "You don't have access to this chat." },
      { status: 403 },
    );
  }

  return NextResponse.json({});
}
