import { seededRandom } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import type { ToppingTone } from "@/lib/pizza-data";

const TONE_MAP: Record<ToppingTone, { base: string; topping: string[] }> = {
  red: { base: "var(--sauce)", topping: ["#c1421a", "#8f2d10", "#e0a83b"] },
  green: { base: "var(--sauce)", topping: ["#3f5a44", "#5e7d54", "#e0a83b"] },
  gold: { base: "#e9d4a3", topping: ["#e0a83b", "#c1421a", "#f4e4bc"] },
  cream: { base: "#f1e6cf", topping: ["#e0a83b", "#3f5a44", "#c1421a"] },
};

interface PizzaIllustrationProps {
  seed: string;
  tone: ToppingTone;
  className?: string;
}

// Rounded to 2 decimals so SSR/CSR renders match exactly — Math.cos/Math.sin
// can differ in the last bits between the server's Node engine and the
// browser's engine, which would otherwise trip a hydration mismatch.
const round = (n: number) => Math.round(n * 100) / 100;

export function PizzaIllustration({ seed, tone, className }: PizzaIllustrationProps) {
  const rand = seededRandom(seed);
  const palette = TONE_MAP[tone];

  const toppings = Array.from({ length: 9 }).map((_, i) => {
    const angle = rand() * Math.PI * 2;
    const radius = 14 + rand() * 26;
    const cx = round(50 + Math.cos(angle) * radius);
    const cy = round(50 + Math.sin(angle) * radius);
    const r = round(3 + rand() * 3.2);
    const color = palette.topping[i % palette.topping.length];
    return { cx, cy, r, color, key: i };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-full", className)}
      role="img"
      aria-label="Pizza illustration"
    >
      <circle cx="50" cy="50" r="48" fill="var(--crust)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="black" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="50" cy="50" r="41" fill={palette.base} />
      {Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={round(50 + Math.cos(a) * 44.5)}
            cy={round(50 + Math.sin(a) * 44.5)}
            r="1.6"
            fill="black"
            fillOpacity="0.07"
          />
        );
      })}
      {toppings.map((t) => (
        <circle key={t.key} cx={t.cx} cy={t.cy} r={t.r} fill={t.color} fillOpacity={0.92} />
      ))}
      <circle cx="50" cy="50" r="41" fill="white" fillOpacity="0.03" />
    </svg>
  );
}
