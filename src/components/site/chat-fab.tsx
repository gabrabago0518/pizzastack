"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, Bot, Users, Gamepad2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListingLoadingOverlay } from "@/components/site/listing-loading-overlay";
import { ChatMessagesPanel } from "@/components/site/chat-messages-panel";
import { ChatGuildPanel } from "@/components/site/chat-guild-panel";
import { cn } from "@/lib/utils";

const PREVIEW_DISMISSED_KEY = "chat-fab-preview-dismissed";
const PREVIEW_DELAY_MS = 1500;

// How far each menu item sits from the FAB's center once fanned out. Sized
// for RadialButton's 48px circles (spacing them ~62px apart along the
// arc) — a labeled pill needs much more room per item than a plain circle
// does, which is why the menu is icon-only here rather than reusing the
// old full-width row style.
const RADIAL_RADIUS = 118;

// Positions a menu item along the quarter-circle arc above and to the left
// of the FAB — the only two directions guaranteed not to run off-screen
// from a bottom-right-anchored button. angleDeg is measured the usual
// math way (0 = right, 90 = straight up, 180 = straight left), so 90-180
// sweeps from "up" to "left". Center-anchored (translate -50%,-50%) since
// every item is the same small, symmetric circle — unlike a wide labeled
// pill, there's no risk of it growing back off the right edge of the
// screen.
//
// Deliberately has no animation of its own on this element: the
// fade-up keyframes animate `transform`, and a CSS animation's value for
// a property wins over an inline style on that *same* element for as
// long as (and after) it runs — so pairing the position transform here
// with the entrance animation here would make every item's fade-up
// silently erase its own arc position once the animation settled. The
// child (RadialButton) carries the animation instead, on its own
// element, where it can't touch this transform.
function RadialItem({ angle, children }: { angle: number; children: React.ReactNode }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * RADIAL_RADIUS;
  const y = -Math.sin(rad) * RADIAL_RADIUS;
  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
    >
      {children}
    </div>
  );
}

// A single fanned-out menu item — icon-only (a text pill this size just
// doesn't fit cleanly on a circular arc), with the label as a native
// tooltip/aria-label for discoverability and a small numeric badge for
// counts that actually matter (unread DMs, pending requests). Non-count
// states ("Join a guild", "Coming soon") are conveyed by the tooltip and
// the disabled styling instead of an on-circle badge, since there's no
// room for text here.
function RadialButton({
  icon: Icon,
  label,
  badgeCount,
  disabled,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badgeCount?: number;
  disabled?: boolean;
  delay: number;
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "relative flex size-12 animate-fade-up items-center justify-center rounded-full border border-border shadow-md transition-colors",
        disabled
          ? "bg-muted text-muted-foreground"
          : "bg-card text-foreground hover:border-primary/50 hover:text-primary",
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <Icon className="size-5" />
      {badgeCount ? (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-destructive text-[9px] font-bold text-destructive-foreground">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
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
  guildName = null,
  guildTag = null,
  viewerId = null,
}: {
  activeListingId: string | null;
  pendingRequestCount?: number;
  unreadDmCount?: number;
  guildId?: string | null;
  guildName?: string | null;
  guildTag?: string | null;
  viewerId?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [panel, setPanel] = React.useState<"messages" | "guild" | null>(null);
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
        setPanel(null);
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
            hasUnreadDms && viewerId ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  dismissPreview();
                  setOpen(true);
                  setPanel("messages");
                }}
              >
                <MessageCircle className="size-3.5" /> View messages
              </Button>
            ) : hasUnreadDms ? (
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

      {open && panel === "messages" && viewerId ? (
        <ChatMessagesPanel viewerId={viewerId} onBack={() => setPanel(null)} />
      ) : open && panel === "guild" && viewerId && guildId && guildName && guildTag ? (
        <ChatGuildPanel
          guildId={guildId}
          guildName={guildName}
          guildTag={guildTag}
          viewerId={viewerId}
          onBack={() => setPanel(null)}
        />
      ) : null}

      {/* Everything below shares one 56px reference box (the FAB's own
          footprint) so RadialItem's angle math and the button's center
          line up exactly, whether or not the fanned-out menu is showing. */}
      <div className="relative size-14">
        {open && !panel ? (
          <>
            <RadialItem angle={180}>
              {activeListingId ? (
                <Link href={`/teammates/${activeListingId}`} onClick={() => setOpen(false)}>
                  <RadialButton
                    icon={Gamepad2}
                    label={
                      hasPendingRequests
                        ? `Current listing, ${pendingRequestCount} new`
                        : "Current listing"
                    }
                    badgeCount={pendingRequestCount}
                    delay={0}
                  />
                  <ListingLoadingOverlay />
                </Link>
              ) : (
                <RadialButton icon={Gamepad2} label="No active listing" disabled delay={0} />
              )}
            </RadialItem>

            <RadialItem angle={150}>
              {guildId && guildName && guildTag && viewerId ? (
                <button type="button" onClick={() => setPanel("guild")}>
                  <RadialButton icon={Users} label="Guild chat" delay={0.05} />
                </button>
              ) : (
                <Link href="/guilds" onClick={() => setOpen(false)}>
                  <RadialButton icon={Users} label="Join a guild" delay={0.05} />
                </Link>
              )}
            </RadialItem>

            <RadialItem angle={120}>
              {viewerId ? (
                <button type="button" onClick={() => setPanel("messages")}>
                  <RadialButton
                    icon={MessageCircle}
                    label={hasUnreadDms ? `Messages, ${unreadDmCount} new` : "Messages"}
                    badgeCount={unreadDmCount}
                    delay={0.1}
                  />
                </button>
              ) : (
                <Link href="/messages" onClick={() => setOpen(false)}>
                  <RadialButton icon={MessageCircle} label="Messages" delay={0.1} />
                </Link>
              )}
            </RadialItem>

            <RadialItem angle={90}>
              <RadialButton icon={Bot} label="AI customer support (coming soon)" disabled delay={0.15} />
            </RadialItem>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (!next) setPanel(null);
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
          className="absolute inset-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          {!open && badgeCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-[10px] font-bold text-destructive-foreground">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
