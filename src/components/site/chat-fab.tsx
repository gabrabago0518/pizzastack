"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, Bot, Users, Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ListingLoadingOverlay } from "@/components/site/listing-loading-overlay";
import { cn } from "@/lib/utils";

function FabRow({
  icon: Icon,
  label,
  badge,
  badgeVariant = "muted",
  disabled,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
  disabled?: boolean;
  delay: number;
}) {
  return (
    <span
      className={cn(
        "flex animate-fade-up items-center gap-2.5 rounded-full border border-border bg-card py-2 pr-4 pl-3 text-sm font-medium shadow-md",
        disabled ? "text-muted-foreground" : "text-foreground hover:border-primary/40",
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          disabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" />
      </span>
      {label}
      {badge ? (
        <Badge variant={badgeVariant} className="ml-auto">
          {badge}
        </Badge>
      ) : null}
    </span>
  );
}

export function ChatFab({
  activeListingId,
  pendingRequestCount = 0,
}: {
  activeListingId: string | null;
  pendingRequestCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasPendingRequests = pendingRequestCount > 0;

  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex flex-col items-end gap-2">
          <FabRow icon={Bot} label="AI customer support" badge="Coming soon" disabled delay={0.1} />
          <FabRow icon={Users} label="Guild chat" badge="Coming soon" disabled delay={0.05} />
          {activeListingId ? (
            <Link href={`/teammates/${activeListingId}`} onClick={() => setOpen(false)}>
              <FabRow
                icon={Gamepad2}
                label="Current listing"
                badge={hasPendingRequests ? `${pendingRequestCount} new` : undefined}
                badgeVariant="default"
                delay={0}
              />
              <ListingLoadingOverlay />
            </Link>
          ) : (
            <FabRow
              icon={Gamepad2}
              label="Current listing"
              badge="None active"
              disabled
              delay={0}
            />
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          open
            ? "Close chat menu"
            : hasPendingRequests
              ? `Open chat menu, ${pendingRequestCount} pending join ${pendingRequestCount === 1 ? "request" : "requests"}`
              : "Open chat menu"
        }
        aria-expanded={open}
        className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && hasPendingRequests ? (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-[10px] font-bold text-destructive-foreground">
            {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
