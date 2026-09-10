"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface GuildFormState {
  error?: string;
}

const MAX_TAG_LENGTH = 6;

export async function createGuild(
  _prevState: GuildFormState,
  formData: FormData,
): Promise<GuildFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to create a guild." };
  }

  const { data: existingMembership } = await supabase
    .from("guild_members")
    .select("guild_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existingMembership) {
    return { error: "You're already in a guild — leave it before creating a new one." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const tag = String(formData.get("tag") ?? "")
    .trim()
    .toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const gameId = String(formData.get("gameId") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  if (!name || !tag) {
    return { error: "Give your guild a name and a tag." };
  }
  if (tag.length > MAX_TAG_LENGTH) {
    return { error: `Tag must be ${MAX_TAG_LENGTH} characters or fewer.` };
  }

  const { data: guild, error } = await supabase
    .from("guilds")
    .insert({
      name,
      tag,
      description: description || null,
      game_id: gameId || null,
      region: region || null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That guild name or tag is already taken."
          : error.message,
    };
  }

  const { error: memberError } = await supabase
    .from("guild_members")
    .insert({ profile_id: user.id, guild_id: guild.id, role: "leader" });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/guilds");
  redirect(`/guilds/${guild.id}`);
}

export interface GuildActionResult {
  error?: string;
}

export async function joinGuild(guildId: string): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to join a guild." };
  }

  const { error } = await supabase
    .from("guild_members")
    .insert({ profile_id: user.id, guild_id: guildId });

  if (error) {
    return {
      error: error.code === "23505" ? "You're already in a guild." : error.message,
    };
  }

  revalidatePath("/guilds");
  revalidatePath("/guilds/[id]", "page");
  return {};
}

// The leader can't leave — they delete the guild instead (see deleteGuild)
// to avoid an ownerless guild.
export async function leaveGuild(guildId: string): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { data: guild } = await supabase
    .from("guilds")
    .select("owner_id")
    .eq("id", guildId)
    .maybeSingle();

  if (guild?.owner_id === user.id) {
    return { error: "As the leader, delete the guild instead of leaving it." };
  }

  const { error } = await supabase
    .from("guild_members")
    .delete()
    .eq("profile_id", user.id)
    .eq("guild_id", guildId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds");
  revalidatePath("/guilds/[id]", "page");
  return {};
}

// RLS restricts this delete to the guild's owner, so a non-owner calling
// it just silently affects zero rows rather than erroring — the kick
// button is only ever rendered for the owner in the UI, so this is a
// defense-in-depth backstop, not the primary gate.
export async function kickMember(
  guildId: string,
  profileId: string,
): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("guild_members")
    .delete()
    .eq("profile_id", profileId)
    .eq("guild_id", guildId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds/[id]", "page");
  return {};
}

export async function deleteGuild(guildId: string): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase.from("guilds").delete().eq("id", guildId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds");
  redirect("/guilds");
}
