import Link from "next/link";
import type { Metadata } from "next";
import { Users, CalendarPlus, Radio, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getAdminStats, getAdminBadgeCounts } from "@/lib/queries";
import { ADMIN_NAV } from "@/lib/admin-nav";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const [stats, counts] = await Promise.all([getAdminStats(), getAdminBadgeCounts()]);

  const tiles = [
    { label: "Total accounts", value: stats.totalAccounts, icon: Users },
    { label: "New today", value: stats.newToday, icon: CalendarPlus },
    { label: "Online now", value: stats.onlineNow, icon: Radio },
  ];

  const queueItems = ADMIN_NAV.filter((item) => item.countKey);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account growth and what needs your review right now.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {tile.label}
                </p>
                <p className="font-display text-3xl">{tile.value.toLocaleString()}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <tile.icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="-mt-4 text-xs text-muted-foreground">
        &ldquo;Online now&rdquo; counts accounts active in the last 5 minutes — approximate, not
        a live connection count.
      </p>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Needs attention
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {queueItems.map((item) => {
            const count = item.countKey ? counts[item.countKey] : 0;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                      <item.icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {count === 0
                          ? "All clear"
                          : `${count} pending ${count === 1 ? "item" : "items"}`}
                      </p>
                    </div>
                    {count > 0 ? (
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : (
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
