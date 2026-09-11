import { Users, GraduationCap, Shield, Trophy, Swords, Medal, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/teammates", label: "Teammates", icon: Users },
  { href: "/coaches", label: "Coaches", icon: GraduationCap },
  { href: "/guilds", label: "Guilds", icon: Shield },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/scrims", label: "Scrimmages", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
];
