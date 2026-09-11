import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function CoachBadge({ className }: { className?: string }) {
  return (
    <Badge variant="secondary" className={className}>
      <GraduationCap /> Coach
    </Badge>
  );
}
