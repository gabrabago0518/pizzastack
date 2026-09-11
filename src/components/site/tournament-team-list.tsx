"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, X, Crown, Shuffle, Plus, LogOut, Ban, Shield } from "lucide-react";

import { AvatarDisplay } from "@/components/site/avatar-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  disbandTeam,
  kickTeamMember,
  setTeamSeed,
  randomizeSeeds,
  registerGuildAsTeam,
} from "@/app/tournaments/actions";
import type {
  TournamentTeamWithRelations,
  TournamentTeamMemberWithProfile,
} from "@/lib/supabase/types";

function CreateTeamForm({
  tournamentId,
  onCreated,
}: {
  tournamentId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTeam(tournamentId, name);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setName("");
      onCreated();
    });
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> Create a team
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex flex-col gap-1">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Team name"
          className="h-9 w-56"
          autoFocus
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Create
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RegisterGuildTeamButton({
  tournamentId,
  guildName,
  onRegistered,
}: {
  tournamentId: string;
  guildName: string;
  onRegistered: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await registerGuildAsTeam(tournamentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.skippedCount) {
        setNotice(
          `Registered ${result.registeredCount} of ${
            (result.registeredCount ?? 0) + result.skippedCount
          } guild members — the rest were already on a team elsewhere in this tournament or didn't fit the roster size.`,
        );
      }
      onRegistered();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Shield className="size-3.5" />}
        Register {guildName} as a team
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {notice ? <p className="max-w-xs text-xs text-muted-foreground">{notice}</p> : null}
    </div>
  );
}

function TeamCard({
  tournamentId,
  team,
  members,
  teamSize,
  viewerId,
  isCaptain,
  canManage,
  canJoin,
}: {
  tournamentId: string;
  team: TournamentTeamWithRelations;
  members: TournamentTeamMemberWithProfile[];
  teamSize: number;
  viewerId?: string;
  isCaptain: boolean;
  canManage: boolean;
  canJoin: boolean;
}) {
  const router = useRouter();
  const [seed, setSeed] = React.useState(team.seed);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [prevTeamSeed, setPrevTeamSeed] = React.useState(team.seed);
  if (team.seed !== prevTeamSeed) {
    setPrevTeamSeed(team.seed);
    setSeed(team.seed);
  }

  function handleSeedChange(value: string) {
    const next = value === "" ? null : Number(value);
    setSeed(next);
    startTransition(async () => {
      await setTeamSeed(tournamentId, team.id, next);
    });
  }

  function handleJoin() {
    setError(null);
    setPendingAction("join");
    startTransition(async () => {
      const result = await joinTeam(tournamentId, team.id);
      setPendingAction(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleLeave() {
    setError(null);
    setPendingAction("leave");
    startTransition(async () => {
      const result = await leaveTeam(tournamentId, team.id);
      setPendingAction(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDisband() {
    setError(null);
    setPendingAction("disband");
    startTransition(async () => {
      const result = await disbandTeam(tournamentId, team.id);
      setPendingAction(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleKick(memberId: string) {
    setPendingAction(memberId);
    startTransition(async () => {
      await kickTeamMember(tournamentId, memberId);
      setPendingAction(null);
      router.refresh();
    });
  }

  const isFull = members.length >= teamSize;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {canManage ? (
            <Input
              type="number"
              min={1}
              value={seed ?? ""}
              onChange={(event) => handleSeedChange(event.target.value)}
              className="h-8 w-14 px-2 text-center text-sm"
              aria-label={`Seed for ${team.name}`}
            />
          ) : team.seed ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {team.seed}
            </span>
          ) : null}
          <span className="font-display text-lg">{team.name}</span>
          {team.guilds ? <Badge variant="secondary">[{team.guilds.tag}]</Badge> : null}
          <span className="text-xs text-muted-foreground">
            {members.length}/{teamSize}
          </span>
        </div>

        {isCaptain ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDisband}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            {pendingAction === "disband" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Ban className="size-3.5" />
            )}
            Disband
          </Button>
        ) : viewerId && members.some((m) => m.profile_id === viewerId) ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleLeave}
            disabled={isPending}
          >
            {pendingAction === "leave" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            Leave
          </Button>
        ) : canJoin ? (
          <Button type="button" size="sm" onClick={handleJoin} disabled={isPending || isFull}>
            {pendingAction === "join" ? <Loader2 className="animate-spin" /> : null}
            {isFull ? "Full" : "Join"}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {members.map((member) => {
          const username = member.profiles?.username ?? "unknown";
          const canKick = canManage || isCaptain;
          return (
            <div key={member.id} className="flex items-center gap-2.5">
              <Link href={`/players/${username}`} className="shrink-0">
                <AvatarDisplay
                  url={member.profiles?.avatar_url ?? null}
                  label={username}
                  className="size-7"
                  textClassName="text-xs"
                />
              </Link>
              <Link
                href={`/players/${username}`}
                className="flex-1 truncate text-sm hover:text-primary"
              >
                @{username}
              </Link>
              {member.profile_id === team.captain_id ? (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Crown className="size-3.5" /> Captain
                </span>
              ) : null}
              {canKick ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleKick(member.id)}
                  disabled={isPending}
                  aria-label={`Remove @${username}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {pendingAction === member.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function TournamentTeamList({
  tournamentId,
  teams,
  membersByTeam,
  teamSize,
  viewerId,
  myTeamId,
  myLedGuild,
  isOrganizer,
  canCreateTeam,
}: {
  tournamentId: string;
  teams: TournamentTeamWithRelations[];
  membersByTeam: Record<string, TournamentTeamMemberWithProfile[]>;
  teamSize: number;
  viewerId?: string;
  myTeamId: string | null;
  myLedGuild: { id: string; name: string } | null;
  isOrganizer: boolean;
  canCreateTeam: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleRandomize() {
    startTransition(async () => {
      await randomizeSeeds(tournamentId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {viewerId && !myTeamId && canCreateTeam ? (
          <div className="flex flex-wrap items-start gap-2">
            <CreateTeamForm tournamentId={tournamentId} onCreated={() => router.refresh()} />
            {myLedGuild ? (
              <RegisterGuildTeamButton
                tournamentId={tournamentId}
                guildName={myLedGuild.name}
                onRegistered={() => router.refresh()}
              />
            ) : null}
          </div>
        ) : viewerId && !myTeamId ? (
          <p className="text-sm text-muted-foreground">
            This tournament already has its max number of teams — you can still join one that has room.
          </p>
        ) : (
          <span />
        )}
        {isOrganizer && teams.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRandomize}
            disabled={isPending}
          >
            <Shuffle className="size-3.5" /> Randomize seeds
          </Button>
        ) : null}
      </div>

      {teams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No teams registered yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              tournamentId={tournamentId}
              team={team}
              members={membersByTeam[team.id] ?? []}
              teamSize={teamSize}
              viewerId={viewerId}
              isCaptain={viewerId === team.captain_id}
              canManage={isOrganizer}
              canJoin={!myTeamId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
