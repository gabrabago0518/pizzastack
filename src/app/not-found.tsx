import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-8" />
      </span>
      <h1 className="font-display text-3xl">Page not found</h1>
      <p className="text-muted-foreground">
        That page doesn&apos;t exist, or the listing may have been removed.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" variant="outline">
          <Link href="/teammates">Teammates</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
