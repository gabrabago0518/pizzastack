import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, MapPin, UserPlus, Clock } from "lucide-react";

import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JoinRequestButton } from "@/components/site/join-request-button";
import { JoinRequestsManager } from "@/components/site/join-requests-manager";
import { PartyMembersManager } from "@/components/site/party-members-manager";
import { CloseListingButton } from "@/components/site/close-listing-button";
import { ListingChat } from "@/components/site/listing-chat";
import { createClient } from "@/lib/supabase/server";
import {
  getLfgPostById,
  getJoinRequestsForPosts,
  getMessagesForPost,
} from "@/lib/queries";
import { formatRelativeTime } from "@/lib/utils";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getLfgPostById(id);
  return { title: post ? `${post.title} — Pizzastack.gg` : "Listing — Pizzastack.gg" };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const post = await getLfgPostById(id);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const isOwner = viewer?.id === post.author_id;
  const joinRequests = viewer ? await getJoinRequestsForPosts([post.id]) : [];

  const myRequest = joinRequests.find((request) => request.requester_id === viewer?.id);
  const myRequestStatus = myRequest?.status ?? "none";
  const pendingRequests = joinRequests.filter((request) => request.status === "pending");
  const acceptedMembers = joinRequests.filter((request) => request.status === "accepted");

  const chatUnlocked = Boolean(viewer) && (isOwner || myRequestStatus === "accepted");
  const messages = chatUnlocked ? await getMessagesForPost(post.id) : [];

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/teammates"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to teammates
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{post.games?.name ?? "Unknown game"}</Badge>
              {post.mode ? <Badge variant="outline">{post.mode}</Badge> : null}
              {post.rank ? <Badge variant="muted">{post.rank}</Badge> : null}
              {post.status === "closed" ? (
                <Badge variant="outline">Closed</Badge>
              ) : null}
            </div>

            <div>
              <h1 className="font-display text-2xl leading-snug">{post.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                Posted {formatRelativeTime(post.created_at)}
              </p>
            </div>

            {post.description ? (
              <p className="leading-relaxed text-muted-foreground">
                {post.description}
              </p>
            ) : null}

            {post.roles_needed?.length ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Roles needed</span>
                <div className="flex flex-wrap gap-1.5">
                  {post.roles_needed.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              {post.profiles?.username ? (
                <Link
                  href={`/players/${post.profiles.username}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <Users className="size-3.5" />@{post.profiles.username}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  unknown
                </span>
              )}
              {post.region ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {post.region}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <UserPlus className="size-3.5" />
                Needs {post.players_needed}
              </span>
            </div>

            {isOwner ? (
              <>
                <JoinRequestsManager requests={pendingRequests} />
                <PartyMembersManager members={acceptedMembers} />
                {post.status === "open" ? (
                  <div className="flex justify-end">
                    <CloseListingButton postId={post.id} />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex justify-end">
                {viewer ? (
                  <JoinRequestButton
                    postId={post.id}
                    requestId={myRequest?.id}
                    initialStatus={myRequestStatus}
                  />
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login">
                      <UserPlus /> Request to join
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {chatUnlocked && viewer ? (
              <ListingChat
                postId={post.id}
                viewerId={viewer.id}
                initialMessages={messages}
              />
            ) : myRequestStatus === "pending" ? (
              <p className="text-center text-sm text-muted-foreground">
                Chat unlocks once the owner accepts your request.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
