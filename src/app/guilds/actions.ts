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

// RLS restricts posting to the guild's leader, so a non-leader calling this
// gets an actual insert error back (a with-check violation), not a silent
// no-op like the delete actions below.
export async function postGuildAnnouncement(
  guildId: string,
  body: string,
): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Write something to post." };
  }

  const { error } = await supabase
    .from("guild_announcements")
    .insert({ guild_id: guildId, author_id: user.id, body: trimmed });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds/[id]", "page");
  return {};
}

// RLS restricts this delete to the guild's leader, so a non-leader calling
// it just silently affects zero rows — same defense-in-depth backstop as
// kickMember above.
export async function deleteGuildAnnouncement(
  announcementId: string,
): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("guild_announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds/[id]", "page");
  return {};
}

export async function addGuildAchievement(
  guildId: string,
  title: string,
  description: string,
): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { error: "Give the achievement a title." };
  }

  const { error } = await supabase.from("guild_achievements").insert({
    guild_id: guildId,
    title: trimmedTitle,
    description: description.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds/[id]", "page");
  return {};
}

export async function deleteGuildAchievement(
  achievementId: string,
): Promise<GuildActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("guild_achievements")
    .delete()
    .eq("id", achievementId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guilds/[id]", "page");
  return {};
}

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface GuildAvatarFormState {
  error?: string;
  avatarUrl?: string;
}

// Same upload flow as a player avatar (see profile/actions.ts's
// uploadAvatar) — crop client-side, upload to the shared "avatars"
// bucket, just at "guilds/{guildId}/avatar.<ext>" instead of
// "{user_id}/avatar.<ext>". Storage RLS (schema.sql) already restricts
// that path to the guild's own leader; the ownership check below is just
// for a clean error message instead of a silent storage rejection.
export async function uploadGuildAvatar(
  guildId: string,
  _prevState: GuildAvatarFormState,
  formData: FormData,
): Promise<GuildAvatarFormState> {
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

  if (!guild || guild.owner_id !== user.id) {
    return { error: "Only the guild leader can change the guild avatar." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const extension = ALLOWED_AVATAR_TYPES[file.type];
  if (!extension) {
    return { error: "Use a PNG, JPEG, WEBP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be under 4MB." };
  }

  const path = `guilds/${guildId}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Bust caches on the public URL since the path itself doesn't change
  // between uploads (upsert overwrites the same file).
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("guilds")
    .update({ avatar_url: bustedUrl })
    .eq("id", guildId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/guilds/${guildId}`);
  revalidatePath(`/guilds/${guildId}/settings`);
  revalidatePath("/guilds");
  return { avatarUrl: bustedUrl };
}

export interface GuildSettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateGuildSettings(
  guildId: string,
  _prevState: GuildSettingsFormState,
  formData: FormData,
): Promise<GuildSettingsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const region = String(formData.get("region") ?? "").trim();

  const { error } = await supabase
    .from("guilds")
    .update({ region: region || null })
    .eq("id", guildId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/guilds/${guildId}`);
  revalidatePath(`/guilds/${guildId}/settings`);
  revalidatePath("/guilds");
  return { success: true };
}

export interface ToggleGuildGameResult {
  error?: string;
}

export async function toggleGuildGame(
  guildId: string,
  gameId: string,
  selected: boolean,
): Promise<ToggleGuildGameResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  if (selected) {
    const { error } = await supabase
      .from("guild_games")
      .insert({ guild_id: guildId, game_id: gameId });
    // 23505 = unique_violation (already added) — treat as a no-op success.
    if (error && error.code !== "23505") {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("guild_games")
      .delete()
      .eq("guild_id", guildId)
      .eq("game_id", gameId);
    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath(`/guilds/${guildId}`);
  revalidatePath(`/guilds/${guildId}/settings`);
  return {};
}
