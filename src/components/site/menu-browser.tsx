"use client";

import * as React from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PizzaCard } from "@/components/site/pizza-card";
import { categories, pizzas } from "@/lib/pizza-data";

export function MenuBrowser() {
  const [active, setActive] = React.useState<string>("all");

  const filtered =
    active === "all" ? pizzas : pizzas.filter((p) => p.category === active);

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="all">All pies</TabsTrigger>
        {categories.map((c) => (
          <TabsTrigger key={c.value} value={c.value}>
            {c.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={active}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pizza) => (
            <PizzaCard key={pizza.slug} pizza={pizza} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
