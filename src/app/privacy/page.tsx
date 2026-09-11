import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/site/section";
import { PolicySection } from "@/components/site/policy-section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Pizzastack.gg stores about you, which cookies we use, the third-party sites we pull verified rank data from, and your data rights.",
};

const CONTACT_EMAIL = "support@pizzastack.gg";

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
            guild content, chat messages, commendations, and uploaded
            highlight clips. If you connect Steam or a Riot ID, we also store
            the verified rank data described below.
          </p>
          <p>
            All of this — your account record and any file you upload
            (avatars, guild avatars, highlight videos) — is hosted on our
            infrastructure provider, Supabase (database, authentication, and
            file storage). We don&apos;t sell or share it with data brokers or
            advertisers.
          </p>
        </PolicySection>

        <PolicySection title="Content moderation">
          <p>
            Highlight clips are reviewed by an admin before they&apos;re shown
            to anyone besides you — see our{" "}
            <Link href="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Terms of Use
            </Link>{" "}
            for what&apos;s allowed. While a clip is pending or if it&apos;s
            rejected, it&apos;s visible only to you and to admins doing the
            review; a rejected clip also stores the reason so you can see why.
            Reports you file against another player, and reports filed
            against you, are visible only to admins.
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

        <PolicySection title="Your data rights">
          <p>
            You can disconnect Steam or your Riot ID at any time from{" "}
            <Link href="/profile/settings" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              profile settings
            </Link>
            , which stops future rank syncs, and you can edit or delete most
            of what you&apos;ve posted (listings, guild content, highlights)
            yourself from wherever it&apos;s shown.
          </p>
          <p>
            The same profile settings page has a &ldquo;Delete account&rdquo;
            option that permanently deletes your account, profile, and
            everything tied to it — listings, coach applications, messages,
            and highlights. This can&apos;t be undone. If you lead a guild,
            deleting your account also deletes that guild for its other
            members, since a guild only exists tied to its owner — the delete
            button warns you about this before you confirm.
          </p>
          <p>
            For anything this page doesn&apos;t cover — a copy of your data,
            a correction we haven&apos;t given you a self-service way to
            make, or a request under a data-protection law that applies to
            you (like GDPR or CCPA) — email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              {CONTACT_EMAIL}
            </a>{" "}
            and we&apos;ll handle it directly.
          </p>
        </PolicySection>

        <PolicySection title="Questions">
          <p>
            Reach us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              {CONTACT_EMAIL}
            </a>{" "}
            for anything about this policy or your data.
          </p>
        </PolicySection>
      </div>
    </Section>
  );
}
