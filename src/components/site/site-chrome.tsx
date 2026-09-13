"use client";

import { usePathname } from "next/navigation";

// The admin section has its own dedicated shell (sidebar + topbar, see
// admin/layout.tsx) — the public marketing navbar/footer/chat bubble
// would just double up on chrome there, so this hides whatever it wraps
// for every /admin route. Takes the already-fetched server components as
// children rather than owning their data itself, same reasoning as
// MobileNavMenu — a client component can still receive server-rendered
// JSX, just not fetch data of its own.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
