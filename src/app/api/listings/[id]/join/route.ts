import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postSystemMessage } from "@/lib/party-chat";

// Plain Route Handler on purpose — not a Server Action. Calling a Server
// Action from a client component makes Next.js refresh the current route's
// RSC tree (the same mechanism behind revalidatePath taking effect live),
// which re-triggers this route's loading.tsx. A fetch() to a Route Handler
// doesn't touch that pipeline, so clicking "Join party" no longer flashes
// the whole page back to its loading state.
//
// Joining is immediate — no owner approval — so this upserts straight to
// 'accepted' rather than inserting a 'pending' row. The upsert (instead of
// a plain insert) also covers rejoining after a voluntary leave, which
// would otherwise collide with the post_id/requester_id unique constraint
// from that earlier row. enforce_lfg_join_rules (schema.sql) still blocks
// a kicked player from self-reinstating this way, and still caps the
// party at players_needed — both surface here as a plain error message.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You need to be logged in to join." },
      { status: 401 },
    );
  }

  const { data: post } = await supabase
    .from("lfg_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
  }
  if (post.author_id === user.id) {
    return NextResponse.json(
      { error: "You can't join your own listing." },
      { status: 400 },
    );
  }

  const { data: joined, error } = await supabase
    .from("lfg_join_requests")
    .upsert(
      { post_id: postId, requester_id: user.id, status: "accepted" },
      { onConflict: "post_id,requester_id" },
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    await postSystemMessage(supabase, postId, `@${profile.username} joined the party`);
  }

  revalidatePath("/teammates");
  return NextResponse.json({ id: joined.id });
}
