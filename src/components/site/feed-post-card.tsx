"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, MessageCircle, Loader2, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { PrimeBadge } from "@/components/site/prime-badge";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  toggleFeedReaction,
  deleteFeedPost,
  deleteFeedComment,
} from "@/app/feed/actions";
import type { FeedPostWithAuthor, FeedCommentWithAuthor } from "@/lib/supabase/types";

export function FeedPostCard({
  post,
  viewerId,
  initialReacted,
}: {
  post: FeedPostWithAuthor;
  viewerId?: string;
  initialReacted: boolean;
}) {
  const [reacted, setReacted] = React.useState(initialReacted);
  const [reactionCount, setReactionCount] = React.useState(post.reaction_count);
  const [commentCount, setCommentCount] = React.useState(post.comment_count);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<FeedCommentWithAuthor[] | null>(null);
  const [commentInput, setCommentInput] = React.useState("");
  const [deleted, setDeleted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const isOwner = viewerId === post.author_id;
  const username = post.profiles?.username ?? "unknown";

  function handleReact() {
    if (!viewerId) return;
    const next = !reacted;
    setReacted(next);
    setReactionCount((count) => count + (next ? 1 : -1));

    startTransition(async () => {
      const result = await toggleFeedReaction(post.id, next);
      if (result.error) {
        setReacted(!next);
        setReactionCount((count) => count + (next ? -1 : 1));
      }
    });
  }

  async function loadComments() {
    const response = await fetch(`/api/feed/${post.id}/comments`);
    const data = (await response.json()) as { comments: FeedCommentWithAuthor[] };
    setComments(data.comments);
  }

  function handleToggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === null) {
      loadComments();
    }
  }

  function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    const text = commentInput.trim();
    if (!text) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/feed/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const result = (await response.json()) as { error?: string };
      if (result.error) {
        setError(result.error);
        return;
      }
      setCommentInput("");
      setCommentCount((count) => count + 1);
      await loadComments();
    });
  }

  function handleDeleteComment(commentId: string) {
    setComments((current) => current?.filter((c) => c.id !== commentId) ?? null);
    setCommentCount((count) => Math.max(0, count - 1));
    startTransition(async () => {
      await deleteFeedComment(commentId);
    });
  }

  function handleDeletePost() {
    setDeleted(true);
    startTransition(async () => {
      const result = await deleteFeedPost(post.id);
      if (result.error) {
        setDeleted(false);
        setError(result.error);
      }
    });
  }

  if (deleted) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {post.profiles?.username ? (
          <Link href={`/players/${username}`} className="shrink-0">
            <AvatarDisplay
              url={post.profiles.avatar_url}
              label={username}
              className="size-10"
              textClassName="text-sm"
            />
          </Link>
        ) : (
          <AvatarDisplay url={null} label={username} className="size-10" textClassName="text-sm" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.profiles?.username ? (
              <Link
                href={`/players/${username}`}
                className="font-medium hover:text-foreground"
              >
                @{username}
              </Link>
            ) : (
              <span className="font-medium">@{username}</span>
            )}
            {post.profiles?.account_tier === "prime" ? <PrimeBadge /> : null}
            <span className="text-xs text-muted-foreground">
              &middot; {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {post.body}
          </p>
        </div>
        {isOwner ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDeletePost}
            disabled={isPending}
            title="Delete post"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-4 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={handleReact}
          disabled={!viewerId || isPending}
          aria-pressed={reacted}
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
            reacted ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className={cn("size-4", reacted && "fill-current")} />
          {reactionCount > 0 ? reactionCount : "Like"}
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageCircle className="size-4" />
          {commentCount > 0 ? commentCount : "Comment"}
        </button>
      </div>

      {commentsOpen ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
          {comments === null ? (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No comments yet — say something.
            </p>
          ) : (
            comments.map((comment) => {
              const commentUsername = comment.profiles?.username ?? "unknown";
              return (
                <div key={comment.id} className="flex items-start gap-2.5">
                  <AvatarDisplay
                    url={comment.profiles?.avatar_url ?? null}
                    label={commentUsername}
                    className="size-7"
                    textClassName="text-xs"
                  />
                  <div className="min-w-0 flex-1 rounded-lg bg-muted/40 px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">@{commentUsername}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm break-words whitespace-pre-wrap">{comment.body}</p>
                  </div>
                  {viewerId === comment.author_id ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
                      title="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })
          )}

          {viewerId ? (
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                maxLength={500}
                placeholder="Write a comment..."
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
              <Button type="submit" size="sm" disabled={isPending || !commentInput.trim()}>
                {isPending ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </form>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
