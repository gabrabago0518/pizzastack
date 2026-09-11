import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ChatFab } from "@/components/site/chat-fab";
import { CookieConsent } from "@/components/site/cookie-consent";
import { PresenceHeartbeat } from "@/components/site/presence-heartbeat";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveListingIdForUser,
  getPendingJoinRequestCountForUser,
  getUnreadDmCount,
  getMyGuildMembership,
} from "@/lib/queries";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pizzastack.gg";
const siteDescription =
  "A community hub for gamers to squad up for their next match and connect with coaches who can level up their game.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pizzastack.gg — Find teammates. Find coaches.",
    template: "%s — Pizzastack.gg",
  },
  description: siteDescription,
  keywords: [
    "find teammates",
    "looking for group",
    "LFG",
    "gaming community",
    "squad finder",
    "esports coaching",
    "game coach",
  ],
  openGraph: {
    type: "website",
    siteName: "Pizzastack.gg",
    title: "Pizzastack.gg — Find teammates. Find coaches.",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pizzastack.gg — Find teammates. Find coaches.",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeListingId = user ? await getActiveListingIdForUser(user.id) : null;
  const pendingRequestCount = user ? await getPendingJoinRequestCountForUser(user.id) : 0;
  const unreadDmCount = user ? await getUnreadDmCount(user.id) : 0;
  const myGuildMembership = user ? await getMyGuildMembership(user.id) : null;

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatFab
          activeListingId={activeListingId}
          pendingRequestCount={pendingRequestCount}
          unreadDmCount={unreadDmCount}
          guildId={myGuildMembership?.guilds?.id ?? null}
          viewerId={user?.id ?? null}
        />
        <CookieConsent />
        {user ? <PresenceHeartbeat /> : null}
      </body>
    </html>
  );
}
