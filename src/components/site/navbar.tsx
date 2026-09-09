"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/#story", label: "Our Story" },
  { href: "/#locations", label: "Locations" },
];

export function Navbar() {
  const { count, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-base">
            P
          </span>
          <span className="font-display text-lg tracking-tight">Pizzastack</span>
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
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/menu">Order pickup</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={open}
            aria-label="Open cart"
            className="relative"
          >
            <ShoppingBag />
            {count > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
                {count}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </header>
  );
}
