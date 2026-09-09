import { MessageCircle, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachProfileWithRelations } from "@/lib/supabase/types";

export function CoachCard({ coach }: { coach: CoachProfileWithRelations }) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-lg">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{coach.games?.name ?? "Unknown game"}</Badge>
            {coach.rate_note ? <Badge variant="muted">{coach.rate_note}</Badge> : null}
          </div>
          <h3 className="font-display text-lg leading-snug">{coach.headline}</h3>
          <p className="text-sm text-muted-foreground">
            @{coach.profiles?.username ?? "unknown"}
          </p>
        </div>

        {coach.bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{coach.bio}</p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-border/60 pt-3 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <MessageCircle className="size-3.5 text-secondary" />
            {coach.contact_method}
          </span>
          {coach.profiles?.region ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              {coach.profiles.region}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
