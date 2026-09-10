"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTournamentParticipants } from "@/lib/queries";
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
  const maxParticipantsRaw = String(formData.get("maxParticipants") ?? "").trim();

  if (!name || !gameId) {
    return { error: "Give your tournament a name and pick a game." };
  }

  let maxParticipants: number | null = null;
  if (maxParticipantsRaw) {
    maxParticipants = Number(maxParticipantsRaw);
    if (!Number.isInteger(maxParticipants) || maxParticipants < 2) {
      return { error: "Max participants must be a whole number of 2 or more." };
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
      max_participants: maxParticipants,
    })
    .select("id")
    .single();

  if (error || !tournament) {
    return { error: error?.message ?? "Couldn't create the tournament." };
  }

  revalidatePath("/tournaments");
  redirect(`/tournaments/${tournament.id}`);
}

export async function joinTournament(tournamentId: string): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in to join." };
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("status, max_participants")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) {
    return { error: "That tournament no longer exists." };
  }
  if (tournament.status !== "open") {
    return { error: "Registration for this tournament is closed." };
  }
  if (tournament.max_participants) {
    const { count } = await supabase
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);
    if ((count ?? 0) >= tournament.max_participants) {
      return { error: "This tournament is full." };
    }
  }

  const { error } = await supabase
    .from("tournament_participants")
    .insert({ tournament_id: tournamentId, profile_id: user.id });

  if (error) {
    return {
      error: error.code === "23505" ? "You're already registered." : error.message,
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Self-withdrawal — RLS only allows this while the tournament is still
// "open" (see the "Players can withdraw, organizers can remove anyone"
// policy), so a player can't drop out mid-bracket this way.
export async function leaveTournament(tournamentId: string): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("tournament_participants")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Organizer removing a specific participant (no-show, DQ, etc.) — allowed
// at any point per the same RLS policy leaveTournament relies on.
export async function kickParticipant(
  tournamentId: string,
  participantId: string,
): Promise<TournamentActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { error } = await supabase
    .from("tournament_participants")
    .delete()
    .eq("id", participantId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

export async function setParticipantSeed(
  tournamentId: string,
  participantId: string,
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
    .from("tournament_participants")
    .update({ seed })
    .eq("id", participantId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return {};
}

// Assigns every registered participant a random seed — a quick way for an
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

  const participants = await getTournamentParticipants(tournamentId);
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const results = await Promise.all(
    shuffled.map((participant, index) =>
      supabase
        .from("tournament_participants")
        .update({ seed: index + 1 })
        .eq("id", participant.id),
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
// id of the match their winner advances into.
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

  const participants = await getTournamentParticipants(tournamentId);
  if (participants.length < 2) {
    return { error: "You need at least 2 registered players to start." };
  }

  const rounds = generateBracket(participants.map((p) => ({ id: p.id })));

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
// the winner into the next match's open slot — flipping that match to
// "ready" once both its slots are filled, which is what fires the
// "match ready" notification (see notify_tournament_match_ready in
// schema.sql). Reporting the final match closes out the tournament.
// Only ever reportable once: a "ready" match with both participants known,
// not already "completed" — correcting a mistake after the bracket has
// moved on would mean unwinding everything downstream of it, which this
// doesn't attempt.
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
    return { error: "Pick the winner from the two players in this match." };
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
