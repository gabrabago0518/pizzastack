"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTournamentTeams } from "@/lib/queries";
import { generateBracket } from "@/lib/bracket";

export interface TournamentActionResult {
  error?: string;
}

export interface TournamentFormState {
  error?: string;
}

export async function createTournament(
  _prevState: TournamentFormState,
  formData: FormData,
): Promise<TournamentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to create a tournament." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const gameId = String(formData.get("gameId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const teamSizeRaw = String(formData.get("teamSize") ?? "");
  const maxTeamsRaw = String(formData.get("maxTeams") ?? "").trim();

  if (!name || !gameId || !teamSizeRaw) {
    return { error: "Give your tournament a name, pick a game, and pick a format." };
  }

  const teamSize = Number(teamSizeRaw);
  if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 10) {
    return { error: "Pick a valid team format." };
  }

  let maxTeams: number | null = null;
  if (maxTeamsRaw) {
    maxTeams = Number(maxTeamsRaw);
    if (!Number.isInteger(maxTeams) || maxTeams < 2) {
      return { error: "Max teams must be a whole number of 2 or more." };
    }
  }

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      game_id: gameId,
      organizer_id: user.id,
      description: description || null,
      region: region || null,
      team_size: teamSize,
      max_teams: maxTeams,
    })
    .select("id")
    .single();

  if (error || !tournament) {
    return { error: error?.message ?? "Couldn't create the tournament." };
  }

  revalidatePath("/tournaments");
  redirect(`/tournaments/${tournament.id}`);
}

export interface TeamActionResult {
  error?: string;
  teamId?: string;
}

// Creates a team and registers its creator as captain and first member in
// one action — a team never exists without at least its captain on it.
export async function createTeam(
  tournamentId: string,
  name: string,
): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to create a team." };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "Give your team a name." };
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("status, max_teams")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) {
    return { error: "That tournament no longer exists." };
  }
  if (tournament.status !== "open") {
    return { error: "Registration for this tournament is closed." };
  }
  if (tournament.max_teams) {
    const { count } = await supabase
      .from("tournament_teams")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);
    if ((count ?? 0) >= tournament.max_teams) {
      return { error: "This tournament already has its max number of teams." };
    }
  }

  const { data: team, error } = await supabase
    .from("tournament_teams")
    .insert({ tournament_id: tournamentId, name: trimmedName, captain_id: user.id })
    .select("id")
    .single();

  if (error || !team) {
    return {
      error:
        error?.code === "23505"
          ? "A team with that name already exists in this tournament."
          : (error?.message ?? "Couldn't create the team."),
    };
  }

  const { error: memberError } = await supabase.from("tournament_team_members").insert({
    team_id: team.id,
    tournament_id: tournamentId,
    profile_id: user.id,
  });

  if (memberError) {
    // Roll back the now-captain-less team rather than leave an orphan.
    await supabase.from("tournament_teams").delete().eq("id", team.id);
    return {
      error:
        memberError.code === "23505"
          ? "You're already on a team in this tournament."
          : memberError.message,
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return { teamId: team.id };
}

export async function joinTeam(
  tournamentId: string,
  teamId: string,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to join a team." };
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("status, team_size")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) {
    return { error: "That tournament no longer exists." };
  }
  if (tournament.status !== "open") {
    return { error: "Registration for this tournament is closed." };
  }

  const { count } = await supabase
    .from("tournament_team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);
  if ((count ?? 0) >= tournament.team_size) {
    return { error: "This team is already full." };
  }

  const { error } = await supabase.from("tournament_team_members").insert({
    team_id: teamId,
    tournament_id: tournamentId,
    profile_id: user.id,
  });

  if (error) {
    return {
      error:
        error.code === "23505" ? "You're already on a team in this tournament." : error.message,
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Self-leave — blocked for a captain with teammates still on the roster
// (see disbandTeam for that case), same "can't abandon what you're
// responsible for" rule guilds use for their leader.
export async function leaveTeam(
  tournamentId: string,
  teamId: string,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { data: team } = await supabase
    .from("tournament_teams")
    .select("captain_id")
    .eq("id", teamId)
    .maybeSingle();

  if (team?.captain_id === user.id) {
    const { count } = await supabase
      .from("tournament_team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);
    if ((count ?? 0) > 1) {
      return {
        error: "You're the captain — disband the team instead of leaving it with teammates on it.",
      };
    }
    // Sole member and captain: leaving is the same as disbanding.
    const { error } = await supabase.from("tournament_teams").delete().eq("id", teamId);
    if (error) return { error: error.message };
    revalidatePath(`/tournaments/${tournamentId}`);
    return {};
  }

  const { error } = await supabase
    .from("tournament_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Captain-only: removes the whole team (and every membership row with it,
// via cascade).
export async function disbandTeam(
  tournamentId: string,
  teamId: string,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("tournament_teams")
    .delete()
    .eq("id", teamId)
    .eq("captain_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Captain or organizer removing a specific teammate (no-show, DQ, etc.).
export async function kickTeamMember(
  tournamentId: string,
  memberId: string,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("tournament_team_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

export async function setTeamSeed(
  tournamentId: string,
  teamId: string,
  seed: number | null,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("tournament_teams")
    .update({ seed })
    .eq("id", teamId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Assigns every registered team a random seed — a quick way for an
// organizer who doesn't care about manual seeding to still get a fair
// draw instead of a bracket ordered by registration time.
export async function randomizeSeeds(tournamentId: string): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const teams = await getTournamentTeams(tournamentId);
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const results = await Promise.all(
    shuffled.map((team, index) =>
      supabase.from("tournament_teams").update({ seed: index + 1 }).eq("id", team.id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Locks registration and generates the full bracket in one shot (see
// generateBracket in src/lib/bracket.ts) — inserted last round first, so
// each earlier round's rows can point next_match_id at the real database
// id of the match their winner advances into. Each bracket slot is a team.
export async function startTournament(tournamentId: string): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("organizer_id, status")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) {
    return { error: "That tournament no longer exists." };
  }
  if (tournament.organizer_id !== user.id) {
    return { error: "Only the organizer can start the tournament." };
  }
  if (tournament.status !== "open") {
    return { error: "This tournament has already started." };
  }

  const teams = await getTournamentTeams(tournamentId);
  if (teams.length < 2) {
    return { error: "You need at least 2 registered teams to start." };
  }

  const rounds = generateBracket(teams.map((team) => ({ id: team.id })));

  let nextRoundIds = new Map<number, string>();
  for (let r = rounds.length - 1; r >= 0; r--) {
    const rows = rounds[r].map((match) => ({
      tournament_id: tournamentId,
      round: match.round,
      match_number: match.matchNumber,
      participant1_id: match.participant1Id,
      participant2_id: match.participant2Id,
      winner_id: match.winnerId,
      status: match.status,
      next_match_id:
        match.nextMatchNumber !== null ? (nextRoundIds.get(match.nextMatchNumber) ?? null) : null,
      next_match_slot: match.nextSlot,
    }));

    const { data: inserted, error } = await supabase
      .from("tournament_matches")
      .insert(rows)
      .select("id, match_number");

    if (error || !inserted) {
      return { error: error?.message ?? "Couldn't generate the bracket." };
    }

    nextRoundIds = new Map(inserted.map((row) => [row.match_number, row.id]));
  }

  const { error: statusError } = await supabase
    .from("tournaments")
    .update({ status: "in_progress" })
    .eq("id", tournamentId);

  if (statusError) {
    return { error: statusError.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Reports a winner (and optional score) for a ready match, then advances
// the winning team into the next match's open slot — flipping that match
// to "ready" once both its slots are filled, which is what fires the
// "match ready" notification (see notify_tournament_match_ready in
// schema.sql). Reporting the final match closes out the tournament.
// Only ever reportable once: a "ready" match with both teams known, not
// already "completed" — correcting a mistake after the bracket has moved
// on would mean unwinding everything downstream of it, which this doesn't
// attempt.
export async function reportMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  score1: number | null,
  score2: number | null,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("organizer_id")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament || tournament.organizer_id !== user.id) {
    return { error: "Only the organizer can report results." };
  }

  const { data: match } = await supabase
    .from("tournament_matches")
    .select("status, participant1_id, participant2_id, next_match_id, next_match_slot")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    return { error: "That match no longer exists." };
  }
  if (match.status === "completed") {
    return { error: "This match has already been reported." };
  }
  if (match.status !== "ready") {
    return { error: "This match isn't ready yet — it's still waiting on an earlier result." };
  }
  if (winnerId !== match.participant1_id && winnerId !== match.participant2_id) {
    return { error: "Pick the winner from the two teams in this match." };
  }

  const { error: updateError } = await supabase
    .from("tournament_matches")
    .update({ winner_id: winnerId, score1, score2, status: "completed" })
    .eq("id", matchId);

  if (updateError) {
    return { error: updateError.message };
  }

  if (match.next_match_id) {
    const slotUpdate =
      match.next_match_slot === 2
        ? { participant2_id: winnerId }
        : { participant1_id: winnerId };
    const { data: nextMatch } = await supabase
      .from("tournament_matches")
      .update(slotUpdate)
      .eq("id", match.next_match_id)
      .select("participant1_id, participant2_id, status")
      .single();

    if (
      nextMatch &&
      nextMatch.status === "pending" &&
      nextMatch.participant1_id &&
      nextMatch.participant2_id
    ) {
      await supabase
        .from("tournament_matches")
        .update({ status: "ready" })
        .eq("id", match.next_match_id);
    }
  } else {
    await supabase.from("tournaments").update({ status: "completed" }).eq("id", tournamentId);
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

export async function cancelTournament(tournamentId: string): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("tournaments")
    .update({ status: "cancelled" })
    .eq("id", tournamentId)
    .eq("organizer_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return {};
}
