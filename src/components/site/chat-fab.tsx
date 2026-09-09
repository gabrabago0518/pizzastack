import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function ChatFab({ postId }: { postId: string }) {
  return (
    <Link
      href={`/teammates/${postId}`}
      aria-label="View your active listing and its chat"
      className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      <MessageCircle className="size-6" />
    </Link>
  );
}
