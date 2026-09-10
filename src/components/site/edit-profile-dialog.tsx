"use client";

import * as React from "react";
import { Pencil, Loader2, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setProfileVisibility, type ProfileVisibilityField } from "@/app/profile/actions";
import { cn } from "@/lib/utils";

interface VisibilityOption {
  field: ProfileVisibilityField;
  label: string;
  description: string;
}

const OPTIONS: VisibilityOption[] = [
  {
    field: "show_ranks",
    label: "Verified ranks",
    description: "Your Dota 2, CS2, and Valorant ranks.",
  },
  {
    field: "show_most_played",
    label: "Most played",
    description: "Your top hero/agent per game with win rate.",
  },
  {
    field: "show_games",
    label: "Games played",
    description: "The game badges next to your name.",
  },
  {
    field: "show_listings",
    label: "Listings",
    description: "Your open Find Teammates posts.",
  },
  {
    field: "show_coaching",
    label: "Coaching",
    description: "Your coach directory listing.",
  },
];

export function EditProfileDialog({
  username,
  initialVisibility,
}: {
  username: string;
  initialVisibility: Record<ProfileVisibilityField, boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [visibility, setVisibility] = React.useState(initialVisibility);
  const [pendingFields, setPendingFields] = React.useState<Set<ProfileVisibilityField>>(
    () => new Set(),
  );

  function handleToggle(field: ProfileVisibilityField) {
    const next = !visibility[field];
    setVisibility((prev) => ({ ...prev, [field]: next }));
    setPendingFields((prev) => new Set(prev).add(field));

    setProfileVisibility(field, next, username).then((result) => {
      setPendingFields((prev) => {
        const copy = new Set(prev);
        copy.delete(field);
        return copy;
      });
      if (result.error) {
        setVisibility((prev) => ({ ...prev, [field]: !next }));
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil /> Edit profile
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What shows on your profile</DialogTitle>
            <DialogDescription>
              Choose what other players see on your public profile. This
              doesn&apos;t affect your own view here.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1 px-6 pb-6">
            {OPTIONS.map((option) => {
              const active = visibility[option.field];
              const isPending = pendingFields.has(option.field);
              return (
                <button
                  key={option.field}
                  type="button"
                  onClick={() => handleToggle(option.field)}
                  disabled={isPending}
                  aria-pressed={active}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      active
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : active ? (
                      <Check className="size-3.5" />
                    ) : null}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
