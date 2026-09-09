import Link from "next/link";
import { Flame, Leaf, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeading } from "@/components/site/section";
import { PizzaCard } from "@/components/site/pizza-card";
import { PizzaIllustration } from "@/components/site/pizza-illustration";
import { pizzas } from "@/lib/pizza-data";

const featured = pizzas.filter((p) => p.popular).slice(0, 3);

const values = [
  {
    icon: Flame,
    title: "Wood-fired, always",
    description: "90-second bakes in a 900°F oven for a leopard-spotted crust.",
  },
  {
    icon: Leaf,
    title: "Honest ingredients",
    description: "San Marzano tomatoes, fior di latte, and a 48-hour dough.",
  },
  {
    icon: Timer,
    title: "Ready when you are",
    description: "Order ahead and skip the line for pickup or delivery.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-noise pointer-events-none absolute inset-0 text-primary/[0.04]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div className="animate-fade-up flex flex-col gap-6">
            <Badge variant="muted" className="w-fit">
              Now taking online orders
            </Badge>
            <h1 className="text-balance font-display text-5xl leading-[1.05] sm:text-6xl">
              Wood-fired pizza,
              <br />
              made to <span className="text-primary">order</span>.
            </h1>
            <p className="max-w-md text-balance text-lg leading-relaxed text-muted-foreground">
              Hand-stretched dough, a short list of honest ingredients, and a
              900°F oven. Order ahead for pickup or delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/menu">Order now</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#story">Our story</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="animate-float absolute inset-0">
              <PizzaIllustration seed="diavola" tone="red" />
            </div>
            <div className="absolute -top-4 -right-4 size-24 -rotate-12 opacity-70 sm:size-28">
              <PizzaIllustration seed="verde" tone="green" />
            </div>
          </div>
        </div>
      </section>

      <Section className="border-t border-border/60 !py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <v.icon className="size-5" />
              </span>
              <h3 className="font-display text-lg">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-muted/30">
        <SectionHeading
          eyebrow="Fan favorites"
          title="Our most-ordered pies"
          description="A handful of pizzas our regulars can't stop ordering. See the full menu for every pie, by the slice or the pound."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((pizza) => (
            <PizzaCard key={pizza.slug} pizza={pizza} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/menu">View full menu</Link>
          </Button>
        </div>
      </Section>

      <Section id="story">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <span className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
              Our story
            </span>
            <h2 className="text-balance font-display text-3xl sm:text-4xl">
              Started with one oven and a stubborn love of good dough.
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Pizzastack began as a single wood-fired oven in a Brooklyn
              garage. Ten years later, the oven is bigger, but the dough
              recipe hasn&apos;t changed &mdash; a slow, 48-hour ferment that
              gives every crust its char and chew.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              We keep the menu short on purpose: fewer pies, made better,
              with ingredients we&apos;d be happy to eat on their own.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-2xl bg-muted/60 p-6">
              <PizzaIllustration seed="quattro-formaggi" tone="gold" />
            </div>
            <div className="mt-8 aspect-square rounded-2xl bg-muted/60 p-6">
              <PizzaIllustration seed="funghi-tartufo" tone="cream" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
