export type ProfileBackgroundKey = "sunset" | "aurora" | "midnight" | "ember" | "violet";

export interface ProfileBackground {
  key: ProfileBackgroundKey;
  label: string;
  gradient: string;
}

// Values here must match profiles_profile_background_check in schema.sql.
export const PROFILE_BACKGROUNDS: ProfileBackground[] = [
  { key: "sunset", label: "Sunset", gradient: "linear-gradient(135deg, #f6339b, #ff8a3d)" },
  { key: "aurora", label: "Aurora", gradient: "linear-gradient(135deg, #22d3ee, #8e51ff)" },
  { key: "midnight", label: "Midnight", gradient: "linear-gradient(135deg, #1e1b4b, #4338ca)" },
  { key: "ember", label: "Ember", gradient: "linear-gradient(135deg, #f6339b, #7c2d92)" },
  { key: "violet", label: "Violet", gradient: "linear-gradient(135deg, #8e51ff, #f6339b)" },
];

export function getProfileBackgroundGradient(
  key: ProfileBackgroundKey | null | undefined,
): string | null {
  if (!key) return null;
  return PROFILE_BACKGROUNDS.find((background) => background.key === key)?.gradient ?? null;
}
