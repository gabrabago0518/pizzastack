import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { AvatarDisplay } from "@/components/site/avatar-display";
import { AdminNavLinks } from "@/components/site/admin-nav-links";
import { AdminMobileNav } from "@/components/site/admin-mobile-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { getProfile, getAdminBadgeCounts } from "@/lib/queries";

// A dedicated app-shell layout (sidebar + topbar), not the public site's
// Section/Navbar chrome — see SiteChrome in the root layout, which hides
// the marketing navbar/footer/chat bubble for every /admin route so this
// doesn't end up double-chromed. Every /admin/* page inherits this gate,
// so none of them need to re-check is_admin themselves.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.is_admin) redirect("/");

  const counts = await getAdminBadgeCounts();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border/60 px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo id="admin" className="h-7 w-auto" />
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminNavLinks counts={counts} />
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 p-4">
          <div className="flex items-center gap-2.5">
            <AvatarDisplay
              url={profile.avatar_url}
              label={profile.display_name || profile.username}
              className="size-8"
              textClassName="text-xs"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {profile.display_name || `@${profile.username}`}
              </p>
              <p className="truncate text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">
              <ArrowLeft /> Back to site
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <AdminMobileNav counts={counts} />
          <span className="font-display text-lg lg:hidden">Admin</span>
          <form action={signOut} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
