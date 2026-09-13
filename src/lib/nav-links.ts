import { Users, Swords, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Coaches, Guilds, Tournaments, Leaderboard, and Highlights are built and
// fully working (routes, data, RLS all live) but deliberately unlinked here
// while the site focuses on the core teammates/scrims community loop first
// — see NAV_LINKS_HIDDEN below. Add an entry back to NAV_LINKS to
// re-surface one; nothing about the feature itself needs rebuilding.
export const NAV_LINKS: NavLink[] = [
  { href: "/teammates", label: "Teammates", icon: Users },
  { href: "/scrims", label: "Scrimmages", icon: Swords },
];

// Not rendered anywhere — kept only as a record of what's hidden and why,
// so re-enabling one later is a one-line move back into NAV_LINKS instead
// of archaeology through git history.
export const NAV_LINKS_HIDDEN = [
  "/coaches",
  "/guilds",
  "/tournaments",
  "/leaderboard",
  "/highlights",
] as const;
