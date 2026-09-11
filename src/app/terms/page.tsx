import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/site/section";
import { PolicySection } from "@/components/site/policy-section";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The rules for using Pizzastack.gg — your account, what you post (including highlight clips), copyright complaints, and our moderation rights.",
};

const CONTACT_EMAIL = "support@pizzastack.gg";
// TODO(owner): replace with your actual state/country before relying on this
// clause — see the governing-law section below.
const GOVERNING_LAW = "[your state/country]";

export default function TermsPage() {
  return (
    <Section className="!pb-24">
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        <SectionHeading
          eyebrow="Terms"
          title="Terms of Use"
          description="Last updated September 2026. By using Pizzastack.gg, you agree to these terms."
        />

        <PolicySection title="1. Who can use Pizzastack.gg">
          <p>
            You must be at least 13 years old to create an account. By
            signing up, you confirm you meet that minimum and that the
            information on your account is accurate.
          </p>
        </PolicySection>

        <PolicySection title="2. Your account">
          <p>
            You&apos;re responsible for what happens under your account,
            including anything posted from it. Keep your password private and
            tell us if you think someone else has access to your account.
          </p>
        </PolicySection>

        <PolicySection title="3. Content you post">
          <p>
            Teammate listings, coach applications, guild pages, chat
            messages, and highlight clips you upload are yours — posting them
            doesn&apos;t transfer ownership to us. To show your content on
            the site (and let other players view it), you grant Pizzastack.gg
            a non-exclusive, worldwide, royalty-free license to host, store,
            reproduce, and display it for that purpose, for as long as it
            stays on the platform.
          </p>
          <p>
            In return, you promise that anything you post — especially
            highlight clips — is yours to post, or you have the necessary
            rights and permissions to share it, and that it doesn&apos;t
            infringe anyone else&apos;s copyright, trademark, privacy, or
            other rights. Gameplay footage generally belongs at least in part
            to the game&apos;s publisher; most publishers publicly allow
            people to share their own gameplay clips, but Pizzastack.gg
            doesn&apos;t verify this for you and isn&apos;t responsible if a
            clip you upload turns out not to be authorized. You&apos;re
            solely responsible for what you upload.
          </p>
        </PolicySection>

        <PolicySection title="4. What's not allowed">
          <p>You may not post or send content that:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Infringes someone else&apos;s copyright, trademark, or other intellectual property rights</li>
            <li>Is illegal, harassing, hateful, or threatens or targets another person</li>
            <li>Impersonates another person or misrepresents your affiliation with anyone</li>
            <li>Promotes cheating, hacking, or exploits, or distributes malware</li>
            <li>Depicts minors in an unsafe or exploitative way</li>
            <li>Is spam, or advertises something unrelated to Pizzastack.gg</li>
          </ul>
          <p>
            Report a player or a piece of content you think breaks these
            rules from that player&apos;s or content&apos;s page — reports go
            straight to admins, not the person you&apos;re reporting.
          </p>
        </PolicySection>

        <PolicySection title="5. Moderation">
          <p>
            Highlight clips are reviewed by an admin before anyone besides
            you can see them, and can be rejected with a reason. We can also
            remove any content, at any time, and suspend or terminate any
            account, if we reasonably believe it violates these terms — we
            don&apos;t owe you advance notice before doing so, though
            we&apos;ll generally try to let you know why.
          </p>
        </PolicySection>

        <PolicySection title="6. Copyright & IP complaints">
          <p>
            If you believe content on Pizzastack.gg infringes your copyright,
            trademark, or other intellectual property rights, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              {CONTACT_EMAIL}
            </a>{" "}
            with:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>A description of the work or mark you own</li>
            <li>The URL or location of the content you&apos;re reporting on Pizzastack.gg</li>
            <li>Your contact information</li>
            <li>A statement that you have a good-faith belief the use isn&apos;t authorized</li>
            <li>
              A statement, made under penalty of perjury, that the above is
              accurate and that you&apos;re the rights owner or authorized to
              act on their behalf
            </li>
            <li>Your physical or electronic signature</li>
          </ul>
          <p>
            We&apos;ll review valid complaints and remove or disable access
            to infringing content, and may terminate the accounts of repeat
            infringers. If you believe your content was removed in error, you
            can send a counter-notice to the same address explaining why.
          </p>
        </PolicySection>

        <PolicySection title="7. Trademarks">
          <p>
            Pizzastack.gg is not affiliated with, sponsored by, or endorsed
            by Valve Corporation, Riot Games, Inc., or Leetify. Dota 2,
            Counter-Strike, Steam, and Valorant are trademarks of their
            respective owners, used here only to describe which games our
            features apply to.
          </p>
        </PolicySection>

        <PolicySection title="8. Third-party services">
          <p>
            Connecting a game account pulls verified rank data through
            outside services (Steam, OpenDota, Leetify, HenrikDev,
            valorant-api.com) — see our{" "}
            <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>{" "}
            for details. We don&apos;t control those services and aren&apos;t
            responsible for their accuracy or availability.
          </p>
        </PolicySection>

        <PolicySection title="9. No warranty">
          <p>
            Pizzastack.gg is provided &ldquo;as is,&rdquo; without warranties
            of any kind. We don&apos;t guarantee the site will be
            uninterrupted, error-free, or that rank data or other information
            on it is always accurate — verified ranks depend on third-party
            services we don&apos;t control.
          </p>
        </PolicySection>

        <PolicySection title="10. Limitation of liability">
          <p>
            To the extent allowed by law, Pizzastack.gg isn&apos;t liable for
            indirect, incidental, or consequential damages arising from your
            use of the site, including content posted by other users.
          </p>
        </PolicySection>

        <PolicySection title="11. Changes">
          <p>
            We may update these terms as the site changes. If we make a
            material change, we&apos;ll update the date at the top of this
            page. Continuing to use Pizzastack.gg after a change means you
            accept the updated terms.
          </p>
        </PolicySection>

        <PolicySection title="12. Governing law">
          <p>
            These terms are governed by the laws of {GOVERNING_LAW}, without
            regard to its conflict-of-law rules.
          </p>
        </PolicySection>

        <PolicySection title="Questions">
          <p>
            Reach us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              {CONTACT_EMAIL}
            </a>{" "}
            for anything about these terms.
          </p>
        </PolicySection>
      </div>
    </Section>
  );
}
