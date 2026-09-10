"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";

import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/notifications/actions";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Notification } from "@/lib/supabase/types";

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  function handleItemClick(notification: Notification) {
    if (notification.read) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    markNotificationRead(notification.id);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    markAllNotificationsRead();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex size-2.5 items-center justify-center rounded-full bg-destructive" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Check className="size-3.5" /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link ?? "#"}
                  onClick={() => {
                    handleItemClick(notification);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col gap-0.5 border-b border-border/40 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-muted/50",
                    !notification.read && "bg-primary/5",
                  )}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {!notification.read ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                    {notification.title}
                  </span>
                  {notification.body ? (
                    <span className="text-muted-foreground">{notification.body}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground/70">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
