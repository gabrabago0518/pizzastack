import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Link expired — Pizzastack.gg",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </span>
      <h1 className="font-display text-3xl">That link didn&apos;t work</h1>
      <p className="text-muted-foreground">
        {message ?? "This link is invalid or has expired."}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/signup">Create a new account</Link>
        </Button>
      </div>
    </div>
  );
}
