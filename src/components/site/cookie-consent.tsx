"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";

type Consent = "accepted" | "rejected" | null;

// The site's only cookies today are Supabase's essential auth session
// cookies, which keep the visitor signed in either way — so this banner is
// mostly about disclosure, not gating. It's still wired up for real: the
// choice is persisted so a future optional script (analytics, ads) can
// check readConsent() === "accepted" before loading instead of loading
// unconditionally.
//
// Modeled as a tiny external store (via useSyncExternalStore) rather than
// effect + setState, since localStorage isn't available during SSR and the
// server/client snapshots need to differ without a synchronous setState-in-
// effect render cascade.
let listeners: Array<() => void> = [];

function readConsent(): Consent {
  try {
    return localStorage.getItem(STORAGE_KEY) as Consent;
  } catch {
    // Storage unavailable (private browsing, blocked) — treat as decided
    // rather than nag on every page load.
    return "accepted";
  }
}

function getServerSnapshot(): Consent {
  return "accepted";
}

function subscribe(callback: () => void) {
  listeners.push(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
    window.removeEventListener("storage", callback);
  };
}

function writeConsent(value: "accepted" | "rejected") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore — the choice just won't persist across visits.
  }
  listeners.forEach((listener) => listener());
}

export function CookieConsent() {
  const consent = React.useSyncExternalStore(subscribe, readConsent, getServerSnapshot);

  if (consent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies to keep you signed in. When you connect a
          Steam or Riot account, we also pull your rank from third-party
          sites — OpenDota, Leetify, HenrikDev, and valorant-api.com — to
          show a verified badge on your profile. See our{" "}
          <Link
            href="/privacy"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => writeConsent("rejected")}>
            Reject All
          </Button>
          <Button size="sm" onClick={() => writeConsent("accepted")}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
