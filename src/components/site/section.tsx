import type * as React from "react";
import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={cn("py-20 sm:py-28", className)} {...props}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-balance text-3xl font-medium sm:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-xl text-balance text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
