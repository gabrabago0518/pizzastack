import Link from "next/link";
import { Search, Users, GraduationCap, Shield, CircleUserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";

const links = [
  { href: "/teammates", label: "Find Teammates", icon: Users },
  { href: "/coaches", label: "Find Coaches", icon: GraduationCap },
];

const iconLinkClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 md:gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <Logo id="nav" className="h-7 w-auto sm:h-9" />
        </Link>

        <form
          action="/search"
          method="GET"
          className="relative hidden max-w-xs flex-1 md:block"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            placeholder="Search players, coaches, squads..."
            className="h-9 w-full rounded-full border border-input bg-muted/40 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </form>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              title={link.label}
              className={iconLinkClassName}
            >
              <link.icon className="size-[18px]" />
            </Link>
          ))}
          <span
            aria-label="Find Guild — coming soon"
            title="Find Guild — coming soon"
            className="flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/40"
          >
            <Shield className="size-[18px]" />
          </span>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className={`${iconLinkClassName} md:hidden`}
          >
            <Search className="size-4" />
          </Link>
          {user ? (
            <>
              <Link href="/profile" aria-label="Profile" title="Profile" className={iconLinkClassName}>
                <CircleUserRound className="size-[18px]" />
              </Link>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="px-2.5 sm:px-4"
                >
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="px-2.5 sm:px-4">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="px-3.5 sm:px-4">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
