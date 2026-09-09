"use client";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PizzaIllustration } from "@/components/site/pizza-illustration";
import { useCart } from "@/lib/cart-context";
import type { Pizza } from "@/lib/pizza-data";
import { cn } from "@/lib/utils";

export function PizzaCard({ pizza, className }: { pizza: Pizza; className?: string }) {
  const { addItem } = useCart();

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.06]",
        className,
      )}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/60 p-8">
        {pizza.popular ? (
          <Badge variant="accent" className="absolute top-4 left-4">
            Popular
          </Badge>
        ) : null}
        <div className="size-32 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 sm:size-36">
          <PizzaIllustration seed={pizza.slug} tone={pizza.tone} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight">{pizza.name}</h3>
          <span className="shrink-0 font-display text-lg text-primary">
            ${pizza.price}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {pizza.description}
        </p>

        {pizza.tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {pizza.tags.map((tag) => (
              <Badge key={tag} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <Button
          onClick={() => addItem(pizza)}
          size="sm"
          className="mt-auto self-start"
        >
          <Plus /> Add to order
        </Button>
      </div>
    </div>
  );
}
