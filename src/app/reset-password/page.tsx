import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/site/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

// Reachable only with the temporary session Supabase creates when a
// visitor clicks their emailed recovery link (see /auth/confirm) — proxy.ts
// treats this as a protected route, so anyone without that session is
// bounced to /login before ever seeing this page.
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Set a new password</h1>
      <p className="mb-8 text-muted-foreground">
        Choose a new password for your account.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
