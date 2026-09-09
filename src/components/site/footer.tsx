import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer id="locations" className="border-t border-border/60 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-base">
              P
            </span>
            <span className="font-display text-lg">Pizzastack</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Hand-stretched dough, a wood-fired oven, and a short list of
            honest ingredients. No shortcuts, just good pizza.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <h4 className="font-display text-base">Locations</h4>
          <p className="text-muted-foreground">214 Elm Street, Brooklyn, NY</p>
          <p className="text-muted-foreground">88 Ferry Road, Queens, NY</p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <h4 className="font-display text-base">Hours</h4>
          <p className="text-muted-foreground">Tue&ndash;Sun, 11:30am&ndash;10pm</p>
          <p className="text-muted-foreground">Closed Mondays</p>
          <Link
            href="/menu"
            className="mt-1 font-medium text-primary hover:underline"
          >
            View full menu &rarr;
          </Link>
        </div>
      </div>

      <Separator />

      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Pizzastack. All rights reserved.</p>
        <p>Made with a wood-fired oven and a lot of flour.</p>
      </div>
    </footer>
  );
}
