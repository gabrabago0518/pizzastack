import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ChatFab } from "@/components/site/chat-fab";
import { createClient } from "@/lib/supabase/server";
import { getActiveListingIdForUser } from "@/lib/queries";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pizzastack.gg — Find teammates. Find coaches.",
  description:
    "A community hub for gamers to squad up for their next match and connect with coaches who can level up their game.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeListingId = user ? await getActiveListingIdForUser(user.id) : null;

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        {activeListingId ? <ChatFab postId={activeListingId} /> : null}
      </body>
    </html>
  );
}
