import { notFound } from "next/navigation";

// Prime's subscription flow isn't live yet (no billing wired up) — rather
// than advertise a "coming soon" page nothing links to, this 404s until
// checkout is ready. The features it would sell (profile customization,
// backgrounds, avatar border) still work for whoever already has
// account_tier = 'prime' — only this marketing/signup page is disabled.
export default function PrimePage() {
  notFound();
}
