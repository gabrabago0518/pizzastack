import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Owner-only: close a listing (frees them up to post a new one, since only
// one open listing per player is allowed).
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
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const { data: post } = await supabase
    .from("lfg_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
  }
  if (post.author_id !== user.id) {
    return NextResponse.json(
      { error: "Only the listing owner can close it." },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("lfg_posts")
    .update({ status: "closed" })
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/teammates");
  return NextResponse.json({});
}
