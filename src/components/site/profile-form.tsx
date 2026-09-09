"use client";

import { useActionState } from "react";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { updateProfile, type ProfileFormState } from "@/app/profile/actions";
import { GamesPicker } from "@/components/site/games-picker";
import { REGIONS } from "@/lib/regions";
import type { Game, Profile } from "@/lib/supabase/types";

export function ProfileForm({
  profile,
  allGames,
  initialSelectedGameIds,
}: {
  profile: Profile;
  allGames: Game[];
  initialSelectedGameIds: string[];
}) {
  const [state, formAction, isPending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={`@${profile.username}`} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name ?? ""}
          placeholder="How you want to appear to other players"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder="What you play, your playstyle, what you're looking for..."
          className="flex w-full rounded-lg border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="region">Region</Label>
        <SelectNative
          id="region"
          name="region"
          defaultValue={profile.region ?? ""}
        >
          <option value="">Select a region</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </SelectNative>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Games you play</Label>
        <p className="text-sm text-muted-foreground">
          Tap a game to add or remove it from your profile.
        </p>
        <GamesPicker
          allGames={allGames}
          initialSelectedIds={initialSelectedGameIds}
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          <Check className="size-4" /> Profile updated.
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="mt-1 self-start">
        {isPending ? <Loader2 className="animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
