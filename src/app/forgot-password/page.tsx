import Link from "next/link";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/site/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Reset your password</h1>
      <p className="mb-8 text-muted-foreground">
        Enter the email on your account and we&apos;ll send you a link to reset
        your password.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
