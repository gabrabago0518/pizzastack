import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  Film,
  ShieldCheck,
  Flag,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Matches a key in AdminBadgeCounts (admin/layout.tsx) — omitted for
  // sections with nothing to triage (Overview, Accounts, Coaches).
  countKey?: "feedback" | "coachApplications" | "highlights" | "mlbbVerifications" | "reports";
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/accounts", label: "Accounts", icon: Users },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, countKey: "feedback" },
  { href: "/admin/coaches", label: "Coaches", icon: GraduationCap },
  {
    href: "/admin/coach-applications",
    label: "Coach applications",
    icon: ClipboardList,
    countKey: "coachApplications",
  },
  { href: "/admin/highlights", label: "Highlights", icon: Film, countKey: "highlights" },
  {
    href: "/admin/mlbb-verifications",
    label: "MLBB verifications",
    icon: ShieldCheck,
    countKey: "mlbbVerifications",
  },
  { href: "/admin/reports", label: "Reports", icon: Flag, countKey: "reports" },
];
