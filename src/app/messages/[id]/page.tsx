import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/site/section";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { DmThread } from "@/components/site/dm-thread";
import { createClient } from "@/lib/supabase/server";
import { getConversationById, getDirectMessages, getProfile } from "@/lib/queries";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) redirect("/login");

  const conversation = await getConversationById(id);
  if (!conversation) notFound();

  const isParticipant =
    conversation.profile_one_id === viewer.id || conversation.profile_two_id === viewer.id;
  if (!isParticipant) notFound();

  const otherId =
    conversation.profile_one_id === viewer.id
      ? conversation.profile_two_id
      : conversation.profile_one_id;

  const [otherProfile, messages] = await Promise.all([
    getProfile(otherId),
    getDirectMessages(conversation.id),
  ]);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/messages"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to messages
        </Link>

        <div className="mb-4 flex items-center gap-3">
          <AvatarDisplay
            url={otherProfile?.avatar_url ?? null}
            label={otherProfile?.display_name || otherProfile?.username || "?"}
            className="size-10"
            textClassName="text-sm"
          />
          <Link
            href={`/players/${otherProfile?.username ?? ""}`}
            className="font-display text-lg hover:text-primary"
          >
            {otherProfile?.username ? `@${otherProfile.username}` : "Unknown player"}
          </Link>
        </div>

        <DmThread
          conversationId={conversation.id}
          viewerId={viewer.id}
          initialMessages={messages}
        />
      </div>
    </Section>
  );
}
