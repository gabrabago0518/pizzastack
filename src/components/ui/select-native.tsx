import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function SelectNative({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select-native"
        className={cn(
          "flex h-11 w-full appearance-none rounded-lg border border-input bg-card px-3.5 pr-9 text-sm text-foreground shadow-sm outline-none transition-[color,box-shadow]",
          "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { SelectNative };
