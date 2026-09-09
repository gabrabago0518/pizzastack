import type { Metadata } from "next";

import { Section } from "@/components/site/section";
import { CheckoutView } from "@/components/site/checkout-view";

export const metadata: Metadata = {
  title: "Checkout — Pizzastack",
};

export default function CheckoutPage() {
  return (
    <Section className="!pb-24">
      <h1 className="mb-10 font-display text-3xl sm:text-4xl">Checkout</h1>
      <CheckoutView />
    </Section>
  );
}
