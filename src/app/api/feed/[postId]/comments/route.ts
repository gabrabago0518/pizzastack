import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeedCommentsForPost } from "@/lib/queries";

// Plain Route Handler, not a Server Action — comments are lazy-loaded when
// a post's comment section is expanded, and a Server Action call here
// would re-trigger the whole /feed page's RSC refresh for every expand,
// same reasoning as the listing chat and DM routes.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const comments = await getFeedCommentsForPost(postId);
  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const { body } = (await request.json()) as { body?: string };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You need to be logged in to comment." },
      { status: 401 },
    );
  }

  const trimmed = String(body ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
  }
  if (trimmed.length > 500) {
    return NextResponse.json(
      { error: "Comment is too long (max 500 characters)." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("feed_comments")
    .insert({ post_id: postId, author_id: user.id, body: trimmed });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({});
}
