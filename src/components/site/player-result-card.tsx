import Link from "next/link";
import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/lib/supabase/types";

export function PlayerResultCard({ profile }: { profile: Profile }) {
  const label = profile.display_name || profile.username;
  const initial = label.charAt(0).toUpperCase();

  return (
    <Link href={`/players/${profile.username}`}>
      <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <CardContent className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <span className="font-display text-lg text-muted-foreground">
                {initial}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{label}</span>
            <span className="truncate text-sm text-muted-foreground">
              @{profile.username}
            </span>
          </div>
          {profile.region ? (
            <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {profile.region}
            </span>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
