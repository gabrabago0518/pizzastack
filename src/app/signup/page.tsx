import Link from "next/link";
import type { Metadata } from "next";

import { AuthForm } from "@/components/site/auth-form";
import { signUp } from "@/lib/supabase/actions";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Pizzastack.gg account to find teammates, post LFG listings, and connect with coaches.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Create your account</h1>
      <p className="mb-8 text-muted-foreground">
        Build a profile, post what you&apos;re looking for, and start
        connecting with your next squad or coach.
      </p>
      <AuthForm mode="signup" action={signUp} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
