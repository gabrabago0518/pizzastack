"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { reviewMlbbVerification } from "@/app/admin/actions";
import { formatRelativeTime } from "@/lib/utils";
import { MLBB_RANK_TIERS, type MlbbRankTier } from "@/lib/mlbb-rank";
import type { MlbbVerificationWithProfile } from "@/lib/supabase/types";

const SUB_RANK_OPTIONS = [
  { value: "1", label: "I (highest)" },
  { value: "2", label: "II" },
  { value: "3", label: "III" },
  { value: "4", label: "IV" },
  { value: "5", label: "V (lowest)" },
];

export function MlbbVerificationsList({
  verifications,
}: {
  verifications: MlbbVerificationWithProfile[];
}) {
  const [list, setList] = React.useState(verifications);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [reasons, setReasons] = React.useState<Record<string, string>>({});
  const [stars, setStars] = React.useState<Record<string, string>>({});
  const [igns, setIgns] = React.useState<Record<string, string>>({});
  const [tiers, setTiers] = React.useState<Record<string, MlbbRankTier | "">>({});
  const [subRanks, setSubRanks] = React.useState<Record<string, string>>({});

  function handleReview(id: string, decision: "approved" | "rejected") {
    setPendingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    const tier = tiers[id] || undefined;
    const isMythic = tier === "mythic";
    reviewMlbbVerification(
      id,
      decision,
      decision === "approved" ? tier : undefined,
      decision === "approved" && !isMythic ? Number(subRanks[id]) : undefined,
      decision === "approved" && isMythic ? Number(stars[id]) : undefined,
      decision === "approved" ? igns[id] : undefined,
      reasons[id],
    ).then((result) => {
      setPendingId(null);
      if (result.error) {
        setErrors((prev) => ({ ...prev, [id]: result.error! }));
        return;
      }
      setList((prev) => prev.filter((verification) => verification.id !== id));
    });
  }

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No pending verification requests.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((verification) => {
        const isPending = pendingId === verification.id;
        const tier = tiers[verification.id] ?? "";
        const isMythic = tier === "mythic";
        return (
          <Card key={verification.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="muted">Mobile Legends</Badge>
                  {verification.profiles?.username ? (
                    <Link
                      href={`/players/${verification.profiles.username}`}
                      className="font-medium hover:text-foreground"
                    >
                      @{verification.profiles.username}
                    </Link>
                  ) : (
                    <span className="font-medium">unknown</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(verification.created_at)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                User ID <span className="font-medium text-foreground">{verification.mlbb_user_id}</span>{" "}
                · Server <span className="font-medium text-foreground">{verification.mlbb_server}</span>
              </p>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`ign-${verification.id}`} className="text-xs text-muted-foreground">
                    IGN
                  </label>
                  <Input
                    id={`ign-${verification.id}`}
                    placeholder="e.g. ShadowStrike"
                    value={igns[verification.id] ?? ""}
                    onChange={(event) =>
                      setIgns((prev) => ({ ...prev, [verification.id]: event.target.value }))
                    }
                    className="h-8 w-40 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`tier-${verification.id}`} className="text-xs text-muted-foreground">
                    Rank
                  </label>
                  <SelectNative
                    id={`tier-${verification.id}`}
                    value={tier}
                    onChange={(event) =>
                      setTiers((prev) => ({
                        ...prev,
                        [verification.id]: event.target.value as MlbbRankTier,
                      }))
                    }
                    className="h-8 w-36 text-sm"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {MLBB_RANK_TIERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectNative>
                </div>

                {tier && !isMythic ? (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`subrank-${verification.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Division
                    </label>
                    <SelectNative
                      id={`subrank-${verification.id}`}
                      value={subRanks[verification.id] ?? ""}
                      onChange={(event) =>
                        setSubRanks((prev) => ({ ...prev, [verification.id]: event.target.value }))
                      }
                      className="h-8 w-32 text-sm"
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {SUB_RANK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectNative>
                  </div>
                ) : null}

                {isMythic ? (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`star-${verification.id}`} className="text-xs text-muted-foreground">
                      Highest star
                    </label>
                    <Input
                      id={`star-${verification.id}`}
                      type="number"
                      min={1}
                      placeholder="e.g. 45"
                      value={stars[verification.id] ?? ""}
                      onChange={(event) =>
                        setStars((prev) => ({ ...prev, [verification.id]: event.target.value }))
                      }
                      className="h-8 w-28 text-sm"
                    />
                  </div>
                ) : null}

                <Input
                  placeholder="Rejection reason (optional)"
                  value={reasons[verification.id] ?? ""}
                  onChange={(event) =>
                    setReasons((prev) => ({ ...prev, [verification.id]: event.target.value }))
                  }
                  className="h-8 flex-1 text-sm"
                />
              </div>

              {errors[verification.id] ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors[verification.id]}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview(verification.id, "rejected")}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReview(verification.id, "approved")}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
