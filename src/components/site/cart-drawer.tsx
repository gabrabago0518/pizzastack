"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantityStepper } from "@/components/site/quantity-stepper";
import { PizzaIllustration } from "@/components/site/pizza-illustration";
import { useCart } from "@/lib/cart-context";

export function CartDrawer() {
  const { state, setQuantity, removeItem, close, subtotal, count } = useCart();

  return (
    <Sheet open={state.isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent side="right" className="p-0">
        <SheetHeader>
          <SheetTitle>Your order</SheetTitle>
          <SheetDescription>
            {count > 0
              ? `${count} item${count === 1 ? "" : "s"} in your bag`
              : "Your bag is empty."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {state.lines.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Add a pizza from the menu to get started.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {state.lines.map((line) => (
                <li key={line.pizza.slug} className="flex gap-4 py-5">
                  <div className="size-16 shrink-0 rounded-xl bg-muted/60 p-2">
                    <PizzaIllustration seed={line.pizza.slug} tone={line.pizza.tone} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-base leading-tight">
                        {line.pizza.name}
                      </p>
                      <button
                        onClick={() => removeItem(line.pizza.slug)}
                        aria-label={`Remove ${line.pizza.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <QuantityStepper
                        quantity={line.quantity}
                        onChange={(q) => setQuantity(line.pizza.slug, q)}
                      />
                      <span className="font-medium tabular-nums">
                        ${(line.pizza.price * line.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter>
          <Separator />
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display text-lg">${subtotal.toFixed(2)}</span>
          </div>
          {state.lines.length === 0 ? (
            <Button size="lg" disabled>
              Checkout
            </Button>
          ) : (
            <Button asChild size="lg" onClick={close}>
              <Link href="/checkout">Checkout</Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
