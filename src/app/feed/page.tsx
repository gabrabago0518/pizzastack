import Link from "next/link";
import type { Metadata } from "next";

import { Section, SectionHeading } from "@/components/site/section";
import { FeedComposer } from "@/components/site/feed-composer";
import { FeedPostCard } from "@/components/site/feed-post-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getFeedPosts, getMyFeedReactions } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Feed",
  description: "See what other players are saying, and share what's on your mind.",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const posts = await getFeedPosts();
  const myReactions = viewer
    ? await getMyFeedReactions(
        posts.map((post) => post.id),
        viewer.id,
      )
    : new Set<string>();

  return (
    <Section className="!pb-24">
      <SectionHeading
        eyebrow="Community"
        title="Feed"
        description="Post a statement, a highlight, a rant — whatever's on your mind. Other players can comment and react."
        className="mb-8"
      />

      <div className="mx-auto flex max-w-xl flex-col gap-5">
        {viewer ? (
          <FeedComposer />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Log in to post, comment, and react.</p>
            <Button asChild size="sm">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}

        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Nothing here yet — be the first to post.
          </p>
        ) : (
          posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              viewerId={viewer?.id}
              initialReacted={myReactions.has(post.id)}
            />
          ))
        )}
      </div>
    </Section>
  );
}
