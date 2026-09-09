"use client";

import * as React from "react";
import { Award } from "lucide-react";

import { toggleCommend } from "@/app/players/actions";
import { cn } from "@/lib/utils";

export function CommendButton({
  profileId,
  initialCommended,
  initialCount,
}: {
  profileId: string;
  initialCommended: boolean;
  initialCount: number;
}) {
  const [commended, setCommended] = React.useState(initialCommended);
  const [count, setCount] = React.useState(initialCount);
  const [isPending, startTransition] = React.useTransition();

  function handleToggle() {
    const willCommend = !commended;

    setCommended(willCommend);
    setCount((prev) => prev + (willCommend ? 1 : -1));

    startTransition(async () => {
      const result = await toggleCommend(profileId, willCommend);
      if (result.error) {
        setCommended(!willCommend);
        setCount((prev) => prev + (willCommend ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={commended}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
        commended
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Award className="size-4" />
      {commended ? "Commended" : "Commend"} · {count}
    </button>
  );
}
