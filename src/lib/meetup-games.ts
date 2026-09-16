// Games with no rank, role, mode, or room-capacity concept at all — just
// a place to meet up. A listing for one of these skips the whole
// mode/rank/roles/players-needed/region form and asks for a server ID
// instead (see lfg-form.tsx, teammates/actions.ts). Distinct from
// RANK_NOT_NEEDED_MODES in modes.ts, which is a per-mode exception within
// otherwise-normal games — these games have no ranked concept in any mode.
export const MEETUP_GAME_SLUGS = ["car-parking-multiplayer", "car-parking-multiplayer-2"];
