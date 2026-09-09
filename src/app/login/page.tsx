import Link from "next/link";
import type { Metadata } from "next";

import { AuthForm } from "@/components/site/auth-form";
import { signIn } from "@/lib/supabase/actions";

export const metadata: Metadata = {
  title: "Log in — Pizzastack.gg",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Welcome back</h1>
      <p className="mb-8 text-muted-foreground">
        Log in to post LFG listings, message coaches, and manage your profile.
      </p>
      <AuthForm mode="login" action={signIn} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
