"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PizzaIllustration } from "@/components/site/pizza-illustration";
import { useCart } from "@/lib/cart-context";

export function CheckoutView() {
  const { state, subtotal, clear } = useCart();
  const [fulfillment, setFulfillment] = React.useState("pickup");
  const [placed, setPlaced] = React.useState<string | null>(null);

  const tax = subtotal * 0.08875;
  const deliveryFee = fulfillment === "delivery" && subtotal > 0 ? 4.5 : 0;
  const total = subtotal + tax + deliveryFee;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const orderNumber = `PZ-${Math.floor(1000 + Math.random() * 9000)}`;
    setPlaced(orderNumber);
    clear();
  }

  if (placed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="font-display text-3xl">Order confirmed</h1>
        <p className="text-muted-foreground">
          Order <span className="font-semibold text-foreground">{placed}</span>{" "}
          is fired up. We&apos;ll have it ready in about 20 minutes.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/menu">Back to menu</Link>
        </Button>
      </div>
    );
  }

  if (state.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-display text-3xl">Your bag is empty</h1>
        <p className="text-muted-foreground">
          Add a few pies from the menu before checking out.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/menu">Browse the menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl">Fulfillment</h2>
          <Tabs value={fulfillment} onValueChange={setFulfillment}>
            <TabsList>
              <TabsTrigger value="pickup">Pickup</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required placeholder="Jane Rossi" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" required placeholder="(555) 010-0192" />
            </div>
          </div>
          {fulfillment === "delivery" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">Delivery address</Label>
              <Input id="address" required placeholder="214 Elm Street, Brooklyn, NY" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl">Payment</h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card">Card number</Label>
              <Input id="card" required inputMode="numeric" placeholder="4242 4242 4242 4242" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp">Expiry</Label>
              <Input id="exp" required placeholder="MM/YY" className="w-24" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" required inputMode="numeric" placeholder="123" className="w-20" />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full sm:w-fit">
          Place order &middot; ${total.toFixed(2)}
        </Button>
      </form>

      <Card className="sticky top-24">
        <CardContent className="flex flex-col gap-5">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="flex flex-col gap-4">
            {state.lines.map((line) => (
              <li key={line.pizza.slug} className="flex items-center gap-3">
                <div className="size-12 shrink-0 rounded-lg bg-muted/60 p-1.5">
                  <PizzaIllustration seed={line.pizza.slug} tone={line.pizza.tone} />
                </div>
                <div className="flex flex-1 items-center justify-between gap-2 text-sm">
                  <span>
                    {line.quantity} &times; {line.pizza.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    ${(line.pizza.price * line.quantity).toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <Separator />

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          <Separator />

          <div className="flex justify-between font-display text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
