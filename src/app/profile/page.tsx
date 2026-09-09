import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Section } from "@/components/site/section";
import { ProfileForm } from "@/components/site/profile-form";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Your profile — Pizzastack.gg",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/dashboard");

  return (
    <Section className="!pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 font-display text-3xl">Your profile</h1>
        <p className="mb-8 text-muted-foreground">
          This is what other players see on your listings and coach profile.
        </p>
        <ProfileForm profile={profile} />
      </div>
    </Section>
  );
}
