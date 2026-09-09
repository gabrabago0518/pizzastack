import type { Metadata } from "next";

import { Section, SectionHeading } from "@/components/site/section";
import { MenuBrowser } from "@/components/site/menu-browser";

export const metadata: Metadata = {
  title: "Menu — Pizzastack",
  description: "Browse the full Pizzastack menu of wood-fired pies.",
};

export default function MenuPage() {
  return (
    <Section className="!pb-24">
      <SectionHeading
        eyebrow="The menu"
        title="Every pie we make"
        description="All pizzas are 12-inch, hand-stretched, and baked to order in our wood-fired oven."
      />
      <MenuBrowser />
    </Section>
  );
}
