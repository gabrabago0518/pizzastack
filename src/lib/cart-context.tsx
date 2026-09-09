"use client";

import * as React from "react";
import { type Pizza } from "@/lib/pizza-data";

export interface CartLine {
  pizza: Pizza;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD"; pizza: Pizza }
  | { type: "REMOVE"; slug: string }
  | { type: "SET_QUANTITY"; slug: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "HYDRATE"; lines: CartLine[] };

const CartContext = React.createContext<{
  state: CartState;
  addItem: (pizza: Pizza) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  subtotal: number;
  count: number;
} | null>(null);

const STORAGE_KEY = "pizzastack:cart";

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.lines.find((l) => l.pizza.slug === action.pizza.slug);
      const lines = existing
        ? state.lines.map((l) =>
            l.pizza.slug === action.pizza.slug
              ? { ...l, quantity: l.quantity + 1 }
              : l,
          )
        : [...state.lines, { pizza: action.pizza, quantity: 1 }];
      return { ...state, lines, isOpen: true };
    }
    case "REMOVE":
      return {
        ...state,
        lines: state.lines.filter((l) => l.pizza.slug !== action.slug),
      };
    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          lines: state.lines.filter((l) => l.pizza.slug !== action.slug),
        };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.pizza.slug === action.slug ? { ...l, quantity: action.quantity } : l,
        ),
      };
    }
    case "CLEAR":
      return { ...state, lines: [] };
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "HYDRATE":
      return { ...state, lines: action.lines };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { lines: [], isOpen: false });
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", lines: JSON.parse(raw) });
    } catch {
      // ignore malformed local storage
    } finally {
      hydrated.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
  }, [state.lines]);

  const value = React.useMemo(() => {
    const subtotal = state.lines.reduce(
      (sum, l) => sum + l.pizza.price * l.quantity,
      0,
    );
    const count = state.lines.reduce((sum, l) => sum + l.quantity, 0);
    return {
      state,
      addItem: (pizza: Pizza) => dispatch({ type: "ADD", pizza }),
      removeItem: (slug: string) => dispatch({ type: "REMOVE", slug }),
      setQuantity: (slug: string, quantity: number) =>
        dispatch({ type: "SET_QUANTITY", slug, quantity }),
      clear: () => dispatch({ type: "CLEAR" }),
      open: () => dispatch({ type: "OPEN" }),
      close: () => dispatch({ type: "CLOSE" }),
      subtotal,
      count,
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
