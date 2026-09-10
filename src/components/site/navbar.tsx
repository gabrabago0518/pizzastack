import Link from "next/link";
import { Search, Users, GraduationCap, Shield, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/site/logo";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { NotificationBell } from "@/components/site/notification-bell";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { getProfile, getNotifications, getUnreadNotificationCount } from "@/lib/queries";

const links = [
  { href: "/teammates", label: "Find Teammates", icon: Users },
  { href: "/coaches", label: "Find Coaches", icon: GraduationCap },
  { href: "/guilds", label: "Find Guild", icon: Shield },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
];

const iconLinkClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;
  const [notifications, unreadCount] = user
    ? await Promise.all([getNotifications(user.id), getUnreadNotificationCount(user.id)])
    : [[], 0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 md:gap-6">
        <Link
          href="/"
          aria-label="Pizzastack.gg"
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <LogoMark className="size-8 sm:hidden" />
          <Logo id="nav" className="hidden h-9 w-auto sm:block" />
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

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className={`${iconLinkClassName} md:hidden`}
          >
            <Search className="size-4" />
          </Link>
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
          </nav>
          {user ? (
            <>
              <NotificationBell
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
              />
              <Link
                href="/profile"
                aria-label="Profile"
                title="Profile"
                className="flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
              >
                <AvatarDisplay
                  url={profile?.avatar_url ?? null}
                  label={profile?.display_name || profile?.username || "?"}
                  className="size-9"
                  textClassName="text-xs"
                />
              </Link>
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
