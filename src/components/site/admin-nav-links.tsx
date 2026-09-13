"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/lib/admin-nav";
import type { AdminBadgeCounts } from "@/lib/queries";

export function AdminNavLinks({
  counts,
  onNavigate,
}: {
  counts: AdminBadgeCounts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {ADMIN_NAV.map((item) => {
        // Overview's href ("/admin") is a prefix of every other admin
        // route, so it needs an exact match while the rest use startsWith
        // to stay active on nested/dynamic sub-routes.
        const isActive =
          item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        const count = item.countKey ? counts[item.countKey] : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {count ? (
              <span
                className={cn(
                  "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
