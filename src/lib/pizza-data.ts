export type PizzaCategory = "signature" | "classic" | "white" | "vegetarian";

export type ToppingTone = "red" | "green" | "gold" | "cream";

export interface Pizza {
  slug: string;
  name: string;
  description: string;
  price: number;
  category: PizzaCategory;
  tags?: string[];
  tone: ToppingTone;
  popular?: boolean;
}

export const categories: { value: PizzaCategory; label: string }[] = [
  { value: "signature", label: "Signature" },
  { value: "classic", label: "Classic" },
  { value: "white", label: "White Pies" },
  { value: "vegetarian", label: "Vegetarian" },
];

export const pizzas: Pizza[] = [
  {
    slug: "margherita",
    name: "Margherita",
    description:
      "San Marzano tomato, fior di latte, basil, extra-virgin olive oil.",
    price: 17,
    category: "classic",
    tone: "red",
    tags: ["Vegetarian"],
    popular: true,
  },
  {
    slug: "diavola",
    name: "Diavola",
    description: "Spicy soppressata, tomato, fior di latte, calabrian chili oil.",
    price: 20,
    category: "signature",
    tone: "red",
    tags: ["Spicy"],
    popular: true,
  },
  {
    slug: "quattro-formaggi",
    name: "Quattro Formaggi",
    description: "Mozzarella, taleggio, gorgonzola, parmigiano, honey drizzle.",
    price: 21,
    category: "white",
    tone: "gold",
    tags: ["Vegetarian"],
  },
  {
    slug: "funghi-tartufo",
    name: "Funghi e Tartufo",
    description: "Wild mushroom, fontina, truffle cream, rosemary, pecorino.",
    price: 23,
    category: "signature",
    tone: "cream",
    tags: ["Vegetarian"],
    popular: true,
  },
  {
    slug: "prosciutto-rucola",
    name: "Prosciutto e Rucola",
    description: "Fior di latte, prosciutto di parma, arugula, shaved grana.",
    price: 22,
    category: "signature",
    tone: "red",
  },
  {
    slug: "marinara",
    name: "Marinara",
    description: "San Marzano tomato, garlic, oregano, extra-virgin olive oil.",
    price: 15,
    category: "classic",
    tone: "red",
    tags: ["Vegan"],
  },
  {
    slug: "verde",
    name: "Verde",
    description: "Basil pesto, zucchini ribbons, ricotta, pistachio, lemon zest.",
    price: 20,
    category: "vegetarian",
    tone: "green",
    tags: ["Vegetarian"],
  },
  {
    slug: "salsiccia-friarielli",
    name: "Salsiccia e Friarielli",
    description: "House fennel sausage, broccoli rabe, smoked scamorza.",
    price: 22,
    category: "signature",
    tone: "green",
  },
  {
    slug: "quattro-stagioni",
    name: "Quattro Stagioni",
    description: "Artichoke, mushroom, prosciutto cotto, olive, tomato.",
    price: 21,
    category: "classic",
    tone: "red",
  },
  {
    slug: "burrata",
    name: "Burrata e Pomodorini",
    description: "Slow-roasted cherry tomato, burrata, basil, aged balsamic.",
    price: 22,
    category: "white",
    tone: "cream",
    tags: ["Vegetarian"],
    popular: true,
  },
  {
    slug: "melanzane",
    name: "Melanzane alla Parmigiana",
    description: "Fried eggplant, tomato, smoked mozzarella, basil, grana.",
    price: 19,
    category: "vegetarian",
    tone: "red",
    tags: ["Vegetarian"],
  },
  {
    slug: "nduja",
    name: "'Nduja e Miele",
    description: "Spreadable calabrian sausage, fior di latte, wildflower honey.",
    price: 21,
    category: "signature",
    tone: "red",
    tags: ["Spicy"],
  },
];

export function getPizzaBySlug(slug: string) {
  return pizzas.find((p) => p.slug === slug);
}
