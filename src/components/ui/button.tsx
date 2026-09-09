import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.97]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.97]",
        outline:
          "border border-input bg-transparent hover:bg-muted hover:scale-[1.02] active:scale-[0.97]",
        ghost: "hover:bg-muted hover:scale-[1.02] active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02] active:scale-[0.97]",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-5",
        sm: "h-9 px-4 text-[0.8125rem] has-[>svg]:px-3.5",
        lg: "h-13 px-8 text-base has-[>svg]:px-7",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
