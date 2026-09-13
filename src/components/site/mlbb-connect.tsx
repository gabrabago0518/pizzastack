"use client";

// Mobile Legends has no public rank API at all (unlike Dota/CS2's Steam
// fetches or Valorant's HenrikDev lookup), so there's nothing to sync
// automatically here. A player submits their user ID + server and an admin
// checks it manually in-game before the highest star shows anywhere — see
// submitMlbbVerification/reviewMlbbVerification.
import * as React from "react";
import { useActionState } from "react";
import { Loader2, RefreshCw, Clock, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RankMedalCard } from "@/components/site/rank-medal-card";
import { submitMlbbVerification, type MlbbFormState } from "@/app/profile/actions";
import { formatRelativeTime } from "@/lib/utils";
import type { MlbbVerification } from "@/lib/supabase/types";

interface MlbbConnectProps {
  mlbbUserId: string | null;
  mlbbServer: string | null;
  mlbbIgn: string | null;
  highestStar: number | null;
  verifiedAt: string | null;
  latestVerification: MlbbVerification | null;
}

export function MlbbConnect({
  mlbbUserId,
  mlbbServer,
  mlbbIgn,
  highestStar,
  verifiedAt,
  latestVerification,
}: MlbbConnectProps) {
  const [state, formAction, isPending] = useActionState<MlbbFormState, FormData>(
    submitMlbbVerification,
    {},
  );

  const isPendingReview = latestVerification?.status === "pending";
  const rejectionReason =
    latestVerification?.status === "rejected" ? latestVerification.rejection_reason : null;
  const isVerified = Boolean(highestStar);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Mobile Legends: Bang Bang</p>
        <p className="text-sm text-muted-foreground">
          There&apos;s no public API for a live MLBB rank, so enter your user
          ID and server and an admin will check your highest star manually
          and verify it.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mlbbIgn" className="flex items-center gap-1.5">
          <Lock className="size-3" /> IGN
        </Label>
        <Input
          id="mlbbIgn"
          value={mlbbIgn ?? ""}
          placeholder="Set by admin once verified"
          disabled
          className="w-48"
        />
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mlbbUserId">User ID</Label>
          <Input
            id="mlbbUserId"
            name="mlbbUserId"
            defaultValue={mlbbUserId ?? ""}
            placeholder="123456789"
            required
            className="w-36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mlbbServer">Server</Label>
          <Input
            id="mlbbServer"
            name="mlbbServer"
            defaultValue={mlbbServer ?? ""}
            placeholder="1234"
            required
            className="w-24"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending || isPendingReview}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : isVerified ? (
            <RefreshCw />
          ) : null}
          {isPendingReview ? "Pending review" : isVerified ? "Sync" : "Submit for verification"}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-secondary">
          Submitted — an admin will review it and verify your highest star.
        </p>
      ) : null}

      {isVerified ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
          <RankMedalCard
            game="Mobile Legends: Bang Bang"
            rankLabel={`${highestStar} stars`}
            sourceLabel="Verified by admin"
          />
          <span className="text-sm text-muted-foreground">
            {verifiedAt ? `Verified ${formatRelativeTime(verifiedAt)}` : null}
          </span>
        </div>
      ) : null}

      {isPendingReview ? (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5" /> Your verification request is waiting on an admin.
        </p>
      ) : rejectionReason ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Last request was rejected{rejectionReason ? `: ${rejectionReason}` : "."}
        </p>
      ) : null}
    </div>
  );
}
