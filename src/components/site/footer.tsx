import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <Logo id="footer" className="h-8 w-auto" />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            The hub for squading up. Post what you&apos;re looking for, find
            players who play your way, and connect with coaches to close the
            gap.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <h4 className="font-display text-base">Explore</h4>
          <Link href="/teammates" className="text-muted-foreground transition-colors hover:text-foreground">
            Find Teammates
          </Link>
          <Link href="/coaches" className="text-muted-foreground transition-colors hover:text-foreground">
            Find Coaches
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <h4 className="font-display text-base">Account</h4>
          <Link href="/signup" className="text-muted-foreground transition-colors hover:text-foreground">
            Create an account
          </Link>
          <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
            Log in
          </Link>
        </div>
      </div>

      <Separator />

      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Pizzastack.gg. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy & Cookies
          </Link>
          <a
            href="https://leetify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Data Provided by Leetify
          </a>
          <p>Squad up. Level up.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-6 text-[11px] leading-relaxed text-muted-foreground/70">
        <p>
          Pizzastack.gg is not affiliated with, sponsored by, or endorsed by
          Valve Corporation, Leetify, or Riot Games, Inc. Dota 2, Counter-
          Strike, Steam, and Valorant are trademarks of their respective
          owners.
        </p>
      </div>
    </footer>
  );
}
