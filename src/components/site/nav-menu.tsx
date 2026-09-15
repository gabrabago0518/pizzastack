"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// The section nav links (Teammates/Scrimmages/Lobby) plus feedback all fold
// into this one hamburger button at every breakpoint, rather than sitting
// as separate text links across the header — keeps the header itself down
// to logo/search/account icons regardless of screen size. Takes
// pre-rendered rows as children (rather than a data prop) since a nav
// link's icon is a component reference, which can't cross the
// server/client boundary as a plain prop — rendering it server-side into
// JSX first sidesteps that.
export function NavMenu({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Menu"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
