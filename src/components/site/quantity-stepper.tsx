"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  className?: string;
}

export function QuantityStepper({ quantity, onChange, className }: QuantityStepperProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease quantity"
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-card active:scale-95"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label="Increase quantity"
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-card active:scale-95"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
