"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/site/admin-nav-links";
import type { AdminBadgeCounts } from "@/lib/queries";

// The sidebar (admin/layout.tsx) is desktop-only (hidden below lg) — this
// is its mobile stand-in, same Sheet primitive as the site's own
// NavMenu, so the admin section still has a way to switch pages on
// a phone.
export function AdminMobileNav({ counts }: { counts: AdminBadgeCounts }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Admin menu"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Admin</SheetTitle>
        </SheetHeader>
        <div className="px-3 pb-6">
          <AdminNavLinks counts={counts} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
