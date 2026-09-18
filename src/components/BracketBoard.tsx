"use client";

import { useState, useTransition } from "react";
import {
  matchupKey,
  resolveLegalOptions,
  type MatchupLite,
} from "@/lib/bracket";
import { submitPick } from "@/app/competitions/[slug]/actions";
import ContestantCard, { type ContestantOption } from "@/components/ContestantCard";

interface BracketBoardProps {
  competitionSlug: string;
  canPick: boolean;
  matchups: MatchupLite[];
  contestants: ContestantOption[];
  initialPicks: { matchupId: string; contestantId: string }[];
  initialEntryId: string | null;
}

export default function BracketBoard({
  competitionSlug,
  canPick,
  matchups,
  contestants,
  initialPicks,
  initialEntryId,
}: BracketBoardProps) {
  // Picks live in local state so choosing a winner updates this round *and*
  // cascades into whichever later round it feeds, instantly — no round trip
  // to the database in between. submitPick() below persists in the
  // background; a failure rolls the optimistic update back.
  const [picks, setPicks] = useState(
    () => new Map(initialPicks.map((p) => [p.matchupId, p.contestantId]))
  );
  const [entryId, setEntryId] = useState(initialEntryId);
  const [pendingMatchupId, setPendingMatchupId] = useState<string | null>(null);
  const [errorsByMatchupId, setErrorsByMatchupId] = useState(
    () => new Map<string, string>()
  );
  const [, startTransition] = useTransition();

  const contestantsById = new Map(contestants.map((c) => [c.id, c]));
  const matchupsByKey = new Map(
    matchups.map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const rounds = [...new Set(matchups.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  function handlePick(matchup: MatchupLite, contestantId: string) {
    const previous = picks.get(matchup.id) ?? null;

    setPicks((prev) => new Map(prev).set(matchup.id, contestantId));
    setErrorsByMatchupId((prev) => {
      const next = new Map(prev);
      next.delete(matchup.id);
      return next;
    });
    setPendingMatchupId(matchup.id);

    startTransition(async () => {
      try {
        const result = await submitPick(
          competitionSlug,
          matchup.id,
          contestantId,
          entryId
        );
        setEntryId(result.entryId);
      } catch (err) {
        setPicks((prev) => {
          const next = new Map(prev);
          if (previous) next.set(matchup.id, previous);
          else next.delete(matchup.id);
          return next;
        });
        setErrorsByMatchupId((prev) =>
          new Map(prev).set(
            matchup.id,
            err instanceof Error ? err.message : "Couldn't save that pick."
          )
        );
      } finally {
        setPendingMatchupId((current) =>
          current === matchup.id ? null : current
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {rounds.map((round) => (
        <section key={round} className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Round {round}
          </h2>
          <div className="flex flex-col gap-3">
            {matchups
              .filter((m) => m.round === round)
              .map((matchup) => {
                const [optionAId, optionBId] = resolveLegalOptions(
                  matchup,
                  matchupsByKey,
                  picks
                );
                const optionA = optionAId
                  ? (contestantsById.get(optionAId) ?? null)
                  : null;
                const optionB = optionBId
                  ? (contestantsById.get(optionBId) ?? null)
                  : null;
                const pickedId = picks.get(matchup.id) ?? null;
                const error = errorsByMatchupId.get(matchup.id);
                const isPending = pendingMatchupId === matchup.id;

                return (
                  <div key={matchup.id} className="flex flex-col gap-1">
                    <div className="grid grid-cols-2 gap-2">
                      {[optionA, optionB].map((option, i) => {
                        const isPicked =
                          option !== null && option.id === pickedId;
                        const disabled = !canPick || option === null;

                        return (
                          <ContestantCard
                            key={option?.id ?? `empty-${i}`}
                            option={option}
                            isPicked={isPicked}
                            disabled={disabled}
                            isPending={isPending}
                            onSelect={() =>
                              option && handlePick(matchup, option.id)
                            }
                          />
                        );
                      })}
                    </div>
                    {error && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
