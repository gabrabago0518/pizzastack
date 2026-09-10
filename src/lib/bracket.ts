// Single-elimination bracket generation. Convention researched from
// Challonge and standard tournament-seeding practice (used by the NCAA,
// FIFA, and the IOC among others): the two top seeds can only meet in the
// final, the top four only in the semifinals, and so on — and when the
// field isn't a power of two, byes go to the top seeds first. Both
// properties fall out of the same recursive seeding order below, so
// nothing needs special-casing for byes.

export interface BracketParticipant {
  id: string;
}

export interface BracketMatch {
  round: number;
  matchNumber: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  status: "pending" | "ready" | "completed";
  nextRound: number | null;
  nextMatchNumber: number | null;
  nextSlot: 1 | 2 | null;
}

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

// Returns, for each 0-indexed bracket position in a field of `size` slots
// (must be a power of two), which seed number (1-indexed) belongs there.
// Recursively doubles: at each step every already-placed seed s is paired
// with (2^round + 1 - s) — its "mirror" seed — which is exactly the
// standard bracket order (e.g. size 8 -> [1,8,4,5,2,7,3,6]).
function standardSeedOrder(size: number): number[] {
  let seeds = [1];
  let round = 1;
  while (seeds.length < size) {
    const sum = 2 ** round + 1;
    const next: number[] = [];
    for (const s of seeds) next.push(s, sum - s);
    seeds = next;
    round += 1;
  }
  return seeds;
}

// Builds every round of a single-elimination bracket for a seeded field.
// `participants` must already be sorted best seed first (index 0 = seed 1).
// A bye is represented as a round-1 match with only one side filled and
// status "completed" — its lone participant is the winner without a game
// being played, and that result is carried into the next round's slot
// immediately, so later rounds only ever wait on real matches.
export function generateBracket(participants: BracketParticipant[]): BracketMatch[][] {
  const n = participants.length;
  if (n < 2) return [];

  const size = nextPowerOfTwo(n);
  const order = standardSeedOrder(size);
  const slots: (BracketParticipant | null)[] = order.map((seed) =>
    seed <= n ? participants[seed - 1] : null,
  );

  const rounds: BracketMatch[][] = [];
  let current: (BracketParticipant | null)[] = slots;
  let roundNumber = 1;

  while (current.length > 1) {
    const next: (BracketParticipant | null)[] = [];
    const roundMatches: BracketMatch[] = [];

    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      const matchNumber = i / 2 + 1;

      let winnerId: string | null = null;
      let status: BracketMatch["status"] = "pending";
      if (a && b) {
        status = "ready";
      } else if (roundNumber === 1 && (a || b)) {
        // A genuine bye — an empty bracket slot from padding to a power of
        // two, only possible in round 1. A later round with one side still
        // unknown is waiting on an unplayed match, not a bye: it stays
        // "pending" with no winner, however long that takes to resolve.
        winnerId = (a ?? b)!.id;
        status = "completed";
      }

      roundMatches.push({
        round: roundNumber,
        matchNumber,
        participant1Id: a?.id ?? null,
        participant2Id: b?.id ?? null,
        winnerId,
        status,
        nextRound: null,
        nextMatchNumber: null,
        nextSlot: null,
      });

      next.push(winnerId ? { id: winnerId } : null);
    }

    rounds.push(roundMatches);
    current = next;
    roundNumber += 1;
  }

  // Wire up advancement pointers now that every round exists: matches
  // (2k-1) and (2k) of round r feed into match k of round r+1, into slot 1
  // and slot 2 respectively.
  for (let r = 0; r < rounds.length - 1; r++) {
    for (const match of rounds[r]) {
      match.nextRound = r + 2;
      match.nextMatchNumber = Math.ceil(match.matchNumber / 2);
      match.nextSlot = match.matchNumber % 2 === 1 ? 1 : 2;
    }
  }

  return rounds;
}

// Human-readable round names, counting back from the final — "Round of
// 16", "Quarterfinal", "Semifinal", "Final" — same labeling Challonge uses.
export function roundLabel(roundNumber: number, totalRounds: number): string {
  const remaining = totalRounds - roundNumber;
  if (remaining <= 0) return "Final";
  if (remaining === 1) return "Semifinal";
  if (remaining === 2) return "Quarterfinal";
  return `Round of ${2 ** (remaining + 1)}`;
}
