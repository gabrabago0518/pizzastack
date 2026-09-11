"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, Bot, Users, Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingLoadingOverlay } from "@/components/site/listing-loading-overlay";
import { cn } from "@/lib/utils";

const PREVIEW_DISMISSED_KEY = "chat-fab-preview-dismissed";
const PREVIEW_DELAY_MS = 1500;

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

// A proactive preview bubble above the FAB, styled like a chat widget's
// greeting popup (avatar + name header, a message bubble, a CTA button) —
// draws the eye to the FAB instead of it just sitting there waiting to be
// clicked.
function ChatFabPreview({
  message,
  cta,
  onDismiss,
}: {
  message: string;
  cta: React.ReactNode;
  onDismiss: () => void;
}) {
  return (
    <div className="w-72 animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
          <Gamepad2 className="size-5" />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-primary bg-accent" />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-medium">Pizzastack</span>
          <span className="truncate text-xs text-primary-foreground/80">Community</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto shrink-0 text-primary-foreground/70 transition-colors hover:text-primary-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3 bg-muted/30 p-4">
        <p className="w-fit max-w-[85%] rounded-xl rounded-tl-none bg-background px-3 py-2 text-sm shadow-sm">
          {message}
        </p>
        {cta}
      </div>
    </div>
  );
}

export function ChatFab({
  activeListingId,
  pendingRequestCount = 0,
  unreadDmCount = 0,
  guildId = null,
}: {
  activeListingId: string | null;
  pendingRequestCount?: number;
  unreadDmCount?: number;
  guildId?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasPendingRequests = pendingRequestCount > 0;
  const hasUnreadDms = unreadDmCount > 0;
  const badgeCount = pendingRequestCount + unreadDmCount;

  const dismissPreview = React.useCallback(() => {
    setPreviewVisible(false);
    try {
      sessionStorage.setItem(PREVIEW_DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable — worst case the preview shows again next load.
    }
  }, []);

  // Surfaces the preview bubble once, a beat after the page settles, unless
  // it's already been dismissed this tab session.
  React.useEffect(() => {
    let alreadyDismissed = false;
    try {
      alreadyDismissed = sessionStorage.getItem(PREVIEW_DISMISSED_KEY) === "1";
    } catch {
      // Storage unavailable — fall through and just show it this load.
    }
    if (alreadyDismissed) return;

    const timer = setTimeout(() => setPreviewVisible(true), PREVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

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
      {!open && previewVisible ? (
        <ChatFabPreview
          message={
            hasUnreadDms
              ? `You have ${unreadDmCount} unread message${unreadDmCount === 1 ? "" : "s"} waiting.`
              : "Looking to squad up? Say hi in chat."
          }
          onDismiss={dismissPreview}
          cta={
            hasUnreadDms ? (
              <Button asChild size="sm" onClick={dismissPreview}>
                <Link href="/messages">
                  <MessageCircle className="size-3.5" /> View messages
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  dismissPreview();
                  setOpen(true);
                }}
              >
                <MessageCircle className="size-3.5" /> Open chat
              </Button>
            )
          }
        />
      ) : null}

      {open ? (
        <div className="flex flex-col items-end gap-2">
          <FabRow icon={Bot} label="AI customer support" badge="Coming soon" disabled delay={0.15} />
          <Link href="/messages" onClick={() => setOpen(false)}>
            <FabRow
              icon={MessageCircle}
              label="Messages"
              badge={hasUnreadDms ? `${unreadDmCount} new` : undefined}
              badgeVariant="default"
              delay={0.1}
            />
          </Link>
          {guildId ? (
            <Link href={`/guilds/${guildId}`} onClick={() => setOpen(false)}>
              <FabRow icon={Users} label="Guild chat" delay={0.05} />
            </Link>
          ) : (
            <FabRow icon={Users} label="Guild chat" badge="Not in a guild" disabled delay={0.05} />
          )}
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
        onClick={() => {
          setOpen((prev) => !prev);
          dismissPreview();
        }}
        aria-label={
          open
            ? "Close chat menu"
            : badgeCount > 0
              ? `Open chat menu, ${badgeCount} unread`
              : "Open chat menu"
        }
        aria-expanded={open}
        className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && badgeCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-[10px] font-bold text-destructive-foreground">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
