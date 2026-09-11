"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  errorField?: "username" | "email" | "password";
  info?: string;
  email?: string;
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!username || !email || !password) {
    return {
      error: "Fill in every field to create your account.",
      errorField: !username ? "username" : !email ? "email" : "password",
    };
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return {
      error: "Username must be 3-20 characters: letters, numbers, underscores only.",
      errorField: "username",
    };
  }
  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
      errorField: "password",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    // Supabase's own message doesn't tag a field — guess from its wording
    // (e.g. "User already registered" or a password-policy rejection) so
    // only the field actually at fault gets cleared, not the whole form.
    const message = error.message.toLowerCase();
    const errorField = message.includes("password")
      ? "password"
      : message.includes("email") || message.includes("registered")
        ? "email"
        : undefined;
    return { error: error.message, errorField };
  }

  if (!data.session) {
    // Email confirmation is required — no session yet, don't redirect
    // into a protected route (proxy.ts would just bounce back to /login).
    return {
      info: "Check your inbox to confirm your email, then log in.",
      email,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error: "Confirm your email first — check your inbox for the link.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pizzastack.gg";

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter your email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    console.error("[auth] resetPasswordForEmail failed:", error);
  }

  // Same response whether or not the email has an account — otherwise this
  // becomes a way to check which emails are registered.
  return {
    info: "If an account exists for that email, we've sent a link to reset your password.",
  };
}

export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  // Only works within the temporary session Supabase creates from the
  // recovery link's token — see /auth/confirm, which is what a visitor
  // actually lands on first when they click the emailed link.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
