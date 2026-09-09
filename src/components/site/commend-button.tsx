"use client";

import * as React from "react";
import { Award } from "lucide-react";

import { toggleCommend } from "@/app/players/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommendState {
  commended: boolean;
  count: number;
  isPending: boolean;
  toggle: () => void;
}

const CommendContext = React.createContext<CommendState | null>(null);

function useCommend() {
  const ctx = React.useContext(CommendContext);
  if (!ctx) {
    throw new Error("useCommend must be used within a CommendProvider");
  }
  return ctx;
}

export function CommendProvider({
  profileId,
  initialCommended,
  initialCount,
  children,
}: {
  profileId: string;
  initialCommended: boolean;
  initialCount: number;
  children: React.ReactNode;
}) {
  const [commended, setCommended] = React.useState(initialCommended);
  const [count, setCount] = React.useState(initialCount);
  const [isPending, startTransition] = React.useTransition();

  function toggle() {
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
    <CommendContext.Provider value={{ commended, count, isPending, toggle }}>
      {children}
    </CommendContext.Provider>
  );
}

export function CommendCount() {
  const { count } = useCommend();

  return (
    <Badge variant="secondary">
      <Award /> {count} {count === 1 ? "commend" : "commends"}
    </Badge>
  );
}

export function CommendToggleButton() {
  const { commended, isPending, toggle } = useCommend();

  return (
    <button
      type="button"
      onClick={toggle}
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
      {commended ? "Uncommend" : "Commend"}
    </button>
  );
}
