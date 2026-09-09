import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Plain Route Handler on purpose — not a Server Action. Calling a Server
// Action from a client component makes Next.js refresh the current route's
// RSC tree (the same mechanism behind revalidatePath taking effect live),
// which re-triggers this route's loading.tsx. A fetch() to a Route Handler
// doesn't touch that pipeline, so clicking "Request to join" no longer
// flashes the whole page back to its loading state.
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
      { error: "You need to be logged in to request to join." },
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
      { error: "You can't request to join your own listing." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("lfg_join_requests")
    .insert({ post_id: postId, requester_id: user.id });
  // 23505 = unique_violation (already requested) — treat as a no-op success.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/teammates");
  return NextResponse.json({});
}
