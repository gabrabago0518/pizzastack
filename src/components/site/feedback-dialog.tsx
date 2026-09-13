"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/app/feedback/actions";

// The trigger's own markup is left to the caller (icon-only in the navbar,
// a full button on the homepage) — this component only owns the dialog and
// submit logic, shared between both placements instead of duplicated. Takes
// a pre-built element (not a render-prop function) because the callers here
// are Server Components, and a function can't cross that boundary as a
// prop — cloning the element to inject onClick works instead, since JSX
// elements themselves serialize fine.
export function FeedbackDialog({
  viewerId,
  trigger,
}: {
  viewerId: string | null;
  trigger: React.ReactElement<{ onClick?: () => void }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSubmitted(false);
      setError(null);
      setMessage("");
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback(message);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  // Not logged in — the trigger just sends them to log in instead of
  // opening a dialog they can't submit from anyway.
  if (!viewerId) {
    return React.cloneElement(trigger, { onClick: () => router.push("/login") });
  }

  return (
    <>
      {React.cloneElement(trigger, { onClick: () => setOpen(true) })}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Goes straight to the Pizzastack.gg team — bugs, ideas, anything
              you&apos;d change.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Thanks — we&apos;ve got it.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 px-6">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  autoFocus
                  placeholder="What's working, what's not, what you'd like to see..."
                  className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !message.trim()}>
                  {isPending ? <Loader2 className="animate-spin" /> : null}
                  Send feedback
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
