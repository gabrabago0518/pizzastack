import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Pizzastack.gg stores about you, which cookies we use, and the third-party sites we pull verified rank data from.",
};

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Section className="!pb-24">
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        <SectionHeading
          eyebrow="Privacy"
          title="Privacy & Cookies"
          description="Last updated September 2026. This page explains what we collect, why, and the outside sites involved."
        />

        <PolicySection title="Cookies we use">
          <p>
            Pizzastack.gg only sets essential cookies — the session cookie
            Supabase (our auth provider) uses to keep you signed in. We
            don&apos;t run ad trackers or third-party analytics, so there&apos;s
            nothing non-essential to opt out of today. If that changes, any
            new script will only load after you accept cookies from the
            banner.
          </p>
        </PolicySection>

        <PolicySection title="What we store">
          <p>
            Your account (email, username, display name, bio, region, avatar)
            and anything you post — teammate listings, coach applications,
            messages, and commendations. If you connect Steam or a Riot ID,
            we also store the verified rank data described below.
          </p>
        </PolicySection>

        <PolicySection title="Third-party sites we use for verified ranks">
          <p>
            Connecting a game account pulls your real rank from that game&apos;s
            data, sourced through these outside services rather than
            self-reported:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-foreground">Steam</span> — OpenID
              login to verify you own the Steam account you connect.
            </li>
            <li>
              <span className="font-medium text-foreground">OpenDota</span> —
              Dota 2 rank data.
            </li>
            <li>
              <span className="font-medium text-foreground">Leetify</span> —
              CS2 rank data.
            </li>
            <li>
              <span className="font-medium text-foreground">HenrikDev</span> — an
              unofficial Valorant stats API, used with the Riot ID you enter
              yourself (Valorant has no login-based verification available to
              us, so identity there is self-reported — only the rank value
              is pulled from real data).
            </li>
            <li>
              <span className="font-medium text-foreground">
                valorant-api.com
              </span>{" "}
              — Riot&apos;s public game-content mirror, used only to fetch rank
              medal artwork.
            </li>
          </ul>
          <p>
            We only send these services the identifiers needed to look up
            your rank (Steam ID, or Riot name/tag/region) — never your
            Pizzastack.gg password or email.
          </p>
        </PolicySection>

        <PolicySection title="Your choices">
          <p>
            You can disconnect Steam or your Riot ID at any time from{" "}
            <Link href="/profile/settings" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              profile settings
            </Link>
            , which stops future rank syncs. Deleting your account removes
            your profile and everything tied to it.
          </p>
        </PolicySection>
      </div>
    </Section>
  );
}
