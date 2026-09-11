import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";

export function PrimeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-yellow-700/50 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-yellow-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        className,
      )}
    >
      <Crown className="size-3" />
      Prime
    </span>
  );
}
