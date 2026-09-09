import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";

const links = [
  { href: "/teammates", label: "Find Teammates" },
  { href: "/coaches", label: "Find Coaches" },
];

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Logo id="nav" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">Profile</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
