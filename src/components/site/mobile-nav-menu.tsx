"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Below sm, the header has no room for every nav link, the feedback
// trigger, and the account icons side by side — this folds them into one
// hamburger menu instead, so the header itself only carries
// search/messages/notifications/profile. Takes pre-rendered rows as
// children (rather than a data prop) since a nav link's icon is a
// component reference, which can't cross the server/client boundary as a
// plain prop — rendering it server-side into JSX first sidesteps that.
export function MobileNavMenu({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Menu"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-3 pb-6">{children}</nav>
      </SheetContent>
    </Sheet>
  );
}
