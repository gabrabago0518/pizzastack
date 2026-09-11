import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section, SectionHeading } from "@/components/site/section";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { createClient } from "@/lib/supabase/server";
import { getConversations } from "@/lib/queries";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const conversations = await getConversations(user.id);

  return (
    <Section className="!pb-24">
      <SectionHeading
        eyebrow="Inbox"
        title="Messages"
        description="Your direct messages with other players."
        className="mb-8"
      />

      {conversations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No conversations yet — message a player from their profile to start one.
        </p>
      ) : (
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <AvatarDisplay
                url={conversation.otherAvatarUrl}
                label={conversation.otherUsername}
                className="size-11"
                textClassName="text-sm"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">@{conversation.otherUsername}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {conversation.lastMessageBody ?? "No messages yet"}
                </p>
              </div>
              {conversation.hasUnread ? (
                <span className="size-2.5 shrink-0 rounded-full bg-primary" />
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
