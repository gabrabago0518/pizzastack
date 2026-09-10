"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { roundLabel } from "@/lib/bracket";
import { ReportMatchDialog, type ReportableMatch } from "@/components/site/report-match-dialog";
import type { TournamentMatch, TournamentTeamWithRelations } from "@/lib/supabase/types";

const MATCH_HEIGHT = 72;
const MATCH_GAP = 16;

function participantLabel(
  participantId: string | null,
  round: number,
  status: TournamentMatch["status"],
  nameById: Map<string, string>,
): string {
  if (participantId) return nameById.get(participantId) ?? "Unknown team";
  if (round === 1 && status === "completed") return "BYE";
  return "TBD";
}

export function TournamentBracket({
  tournamentId,
  matches,
  teams,
  canReport,
}: {
  tournamentId: string;
  matches: TournamentMatch[];
  teams: TournamentTeamWithRelations[];
  canReport: boolean;
}) {
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const nameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const team of teams) {
      map.set(team.id, team.name);
    }
    return map;
  }, [teams]);

  const rounds = React.useMemo(() => {
    const byRound = new Map<number, TournamentMatch[]>();
    for (const match of matches) {
      const list = byRound.get(match.round) ?? [];
      list.push(match);
      byRound.set(match.round, list);
    }
    return Array.from(byRound.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  if (rounds.length === 0) return null;

  const totalRounds = rounds.length;
  const firstRoundMatchCount = rounds[0][1].length;
  const columnHeight = firstRoundMatchCount * MATCH_HEIGHT + (firstRoundMatchCount - 1) * MATCH_GAP;

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) ?? null;
  const reportableMatch: ReportableMatch | null = selectedMatch
    ? {
        id: selectedMatch.id,
        participant1Id: selectedMatch.participant1_id,
        participant2Id: selectedMatch.participant2_id,
        participant1Name: participantLabel(
          selectedMatch.participant1_id,
          selectedMatch.round,
          selectedMatch.status,
          nameById,
        ),
        participant2Name: participantLabel(
          selectedMatch.participant2_id,
          selectedMatch.round,
          selectedMatch.status,
          nameById,
        ),
      }
    : null;

  function openMatch(matchId: string) {
    setSelectedMatchId(matchId);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-10">
          {rounds.map(([round, roundMatches]) => (
            <div key={round} className="flex flex-col gap-2" style={{ width: 220 }}>
              <h3 className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {roundLabel(round, totalRounds)}
              </h3>
              <div
                className="flex flex-col justify-around"
                style={{ height: columnHeight }}
              >
                {roundMatches.map((match) => {
                  const name1 = participantLabel(
                    match.participant1_id,
                    match.round,
                    match.status,
                    nameById,
                  );
                  const name2 = participantLabel(
                    match.participant2_id,
                    match.round,
                    match.status,
                    nameById,
                  );
                  const clickable = canReport && match.status === "ready";

                  return (
                    <button
                      key={match.id}
                      type="button"
                      disabled={!clickable}
                      onClick={() => openMatch(match.id)}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors",
                        clickable && "cursor-pointer hover:border-primary/50",
                        !clickable && "cursor-default",
                      )}
                      style={{ height: MATCH_HEIGHT }}
                    >
                      {[
                        { id: match.participant1_id, name: name1, score: match.score1 },
                        { id: match.participant2_id, name: name2, score: match.score2 },
                      ].map((side, sideIndex) => {
                        const isWinner = match.winner_id !== null && match.winner_id === side.id;
                        const isKnown = Boolean(side.id);
                        return (
                          <div
                            key={sideIndex}
                            className={cn(
                              "flex flex-1 items-center justify-between gap-2 px-3 text-sm",
                              sideIndex === 0 && "border-b border-border/60",
                              isWinner && "bg-primary/10 font-medium text-foreground",
                              !isKnown && "text-muted-foreground italic",
                            )}
                          >
                            <span className="truncate">{side.name}</span>
                            <span className="flex shrink-0 items-center gap-1">
                              {side.score !== null ? side.score : null}
                              {isWinner ? <Trophy className="size-3 text-primary" /> : null}
                            </span>
                          </div>
                        );
                      })}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ReportMatchDialog
        tournamentId={tournamentId}
        match={reportableMatch}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onReported={() => router.refresh()}
      />
    </>
  );
}
