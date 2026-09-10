import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, MapPin } from "lucide-react";

import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DotaRankIcon } from "@/components/site/dota-rank-icon";
import { StarRating } from "@/components/site/star-rating";
import { CoachReviewsList } from "@/components/site/coach-reviews-list";
import { CoachReviewForm } from "@/components/site/coach-review-form";
import { createClient } from "@/lib/supabase/server";
import {
  getCoachProfileById,
  getCoachReviews,
  getMyCoachReview,
} from "@/lib/queries";

interface CoachPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CoachPageProps): Promise<Metadata> {
  const { id } = await params;
  const coach = await getCoachProfileById(id);
  if (!coach) return { title: "Coach not found" };

  return {
    title: `${coach.headline} — ${coach.games?.name ?? "Coach"}`,
    description: coach.bio || `${coach.headline} on Pizzastack.gg.`,
  };
}

export default async function CoachPage({ params }: CoachPageProps) {
  const { id } = await params;
  const coach = await getCoachProfileById(id);
  if (!coach) notFound();

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const isOwner = viewer?.id === coach.profile_id;

  const [reviews, myReview] = await Promise.all([
    getCoachReviews(coach.id),
    viewer && !isOwner ? getMyCoachReview(coach.id, viewer.id) : null,
  ]);

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/coaches"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to coaches
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{coach.games?.name ?? "Unknown game"}</Badge>
              {coach.rank ? (
                <Badge variant="muted">
                  <DotaRankIcon rankTier={coach.rank_tier} className="size-3.5" /> {coach.rank}
                </Badge>
              ) : null}
              {coach.rate_note ? <Badge variant="muted">{coach.rate_note}</Badge> : null}
            </div>

            <div>
              <h1 className="font-display text-2xl leading-snug">{coach.headline}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                {coach.profiles?.username ? (
                  <Link
                    href={`/players/${coach.profiles.username}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    @{coach.profiles.username}
                  </Link>
                ) : null}
                {coach.review_count > 0 ? (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <StarRating rating={coach.avg_rating ?? 0} size="size-3.5" />
                    {(coach.avg_rating ?? 0).toFixed(1)} ({coach.review_count}{" "}
                    {coach.review_count === 1 ? "review" : "reviews"})
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">No reviews yet</span>
                )}
              </div>
            </div>

            {coach.bio ? (
              <p className="leading-relaxed text-muted-foreground">{coach.bio}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-4 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <MessageCircle className="size-3.5 text-secondary" />
                {coach.contact_method}
              </span>
              {coach.profiles?.region ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {coach.profiles.region}
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-4">
          <h2 className="font-display text-xl">Reviews</h2>

          {viewer && !isOwner ? (
            <CoachReviewForm
              coachProfileId={coach.id}
              initialRating={myReview?.rating ?? null}
              initialComment={myReview?.comment ?? null}
            />
          ) : null}

          <CoachReviewsList reviews={reviews} />
        </div>
      </div>
    </Section>
  );
}
