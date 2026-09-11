"use client";

import { useActionState } from "react";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { updateGuildSettings, type GuildSettingsFormState } from "@/app/guilds/actions";
import { REGIONS } from "@/lib/regions";
import type { Guild } from "@/lib/supabase/types";

export function GuildSettingsForm({ guild }: { guild: Guild }) {
  const updateForGuild = updateGuildSettings.bind(null, guild.id);
  const [state, formAction, isPending] = useActionState<GuildSettingsFormState, FormData>(
    updateForGuild,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="region">Region</Label>
        <SelectNative id="region" name="region" defaultValue={guild.region ?? ""}>
          <option value="">Select a region</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </SelectNative>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          <Check className="size-4" /> Guild updated.
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="mt-1 self-start">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
