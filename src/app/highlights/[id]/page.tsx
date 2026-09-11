import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { DeleteHighlightButton } from "@/components/site/delete-highlight-button";
import { createClient } from "@/lib/supabase/server";
import { getHighlightById, getProfile } from "@/lib/queries";
import { formatRelativeTime } from "@/lib/utils";

interface HighlightPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: HighlightPageProps): Promise<Metadata> {
  const { id } = await params;
  const highlight = await getHighlightById(id);
  if (!highlight) return { title: "Highlight not found" };

  return {
    title: highlight.title,
    description: highlight.description || `${highlight.title} on Pizzastack.gg.`,
  };
}

export default async function HighlightPage({ params }: HighlightPageProps) {
  const { id } = await params;
  // RLS already scopes a non-owner/non-admin viewer to approved rows only
  // (see the "Highlights are publicly readable" policy) — a pending or
  // rejected highlight just returns null here for anyone else, same
  // no-separate-permission-check pattern as /guilds/[id] and /coaches/[id].
  const highlight = await getHighlightById(id);
  if (!highlight) notFound();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const isOwner = viewer?.id === highlight.profile_id;
  const profile = viewer ? await getProfile(viewer.id) : null;
  const isAdmin = Boolean(profile?.is_admin);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/highlights"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to highlights
        </Link>

        <div className="mb-5 overflow-hidden rounded-2xl border border-border/70 bg-black">
          <video src={highlight.video_url} controls playsInline className="aspect-video w-full" />
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {highlight.games?.name ? (
                  <Badge variant="secondary">{highlight.games.name}</Badge>
                ) : null}
                {highlight.status !== "approved" ? (
                  <Badge variant={highlight.status === "rejected" ? "muted" : "outline"}>
                    {highlight.status}
                  </Badge>
                ) : null}
              </div>
              {isOwner || isAdmin ? (
                <DeleteHighlightButton highlightId={highlight.id} />
              ) : null}
            </div>

            <div>
              <h1 className="font-display text-2xl leading-snug">{highlight.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {highlight.profiles?.username ? (
                  <Link
                    href={`/players/${highlight.profiles.username}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <AvatarDisplay
                      url={highlight.profiles.avatar_url}
                      label={highlight.profiles.username}
                      className="size-5"
                      textClassName="text-[10px]"
                    />
                    @{highlight.profiles.username}
                  </Link>
                ) : null}
                <span>· {formatRelativeTime(highlight.created_at)}</span>
              </div>
            </div>

            {highlight.description ? (
              <p className="leading-relaxed text-muted-foreground">{highlight.description}</p>
            ) : null}

            {highlight.status === "rejected" && highlight.rejection_reason && (isOwner || isAdmin) ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Rejected: {highlight.rejection_reason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
