import { Users, GraduationCap, Shield, Trophy, Swords, type LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/teammates", label: "Find Teammates", icon: Users },
  { href: "/coaches", label: "Find Coaches", icon: GraduationCap },
  { href: "/guilds", label: "Find Guild", icon: Shield },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/scrims", label: "Find a Scrim", icon: Swords },
];
