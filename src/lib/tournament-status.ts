import type { Tournament } from "@/lib/supabase/types";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export const TOURNAMENT_STATUS_LABEL: Record<Tournament["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TOURNAMENT_STATUS_BADGE_VARIANT: Record<Tournament["status"], BadgeVariant> = {
  open: "accent",
  in_progress: "secondary",
  completed: "outline",
  cancelled: "muted",
};
