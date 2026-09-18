"use client";

import { useState, useTransition } from "react";
import {
  isBye,
  matchupKey,
  resolveLegalOptions,
  type MatchupLite,
} from "@/lib/bracket";
import { clearPicks, submitPick } from "@/app/competitions/[slug]/actions";
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
  // Only one matchup's photos expand at a time — several expanded together
  // would overlap each other once scaled up.
  const [expandedMatchupId, setExpandedMatchupId] = useState<string | null>(
    null
  );
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const contestantsById = new Map(contestants.map((c) => [c.id, c]));
  const matchupsByKey = new Map(
    matchups.map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const rounds = [...new Set(matchups.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  // Byes never get a pick (nothing to decide), so they don't count toward
  // "how much is left."
  const pickableMatchups = matchups.filter((m) => !isBye(m));
  const pickedCount = pickableMatchups.filter((m) => picks.has(m.id)).length;
  const remainingCount = pickableMatchups.length - pickedCount;
  const isComplete = pickableMatchups.length > 0 && remainingCount === 0;

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

  function handleClearPicks() {
    if (!entryId || pickedCount === 0) return;
    if (
      !window.confirm(
        "Clear all your picks for this competition? This can't be undone."
      )
    ) {
      return;
    }

    const previous = picks;
    setPicks(new Map());
    setClearError(null);
    setIsClearing(true);

    startTransition(async () => {
      try {
        await clearPicks(competitionSlug, entryId);
      } catch (err) {
        setPicks(previous);
        setClearError(
          err instanceof Error ? err.message : "Couldn't clear picks."
        );
      } finally {
        setIsClearing(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {canPick && pickableMatchups.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isComplete
                ? "All picks made."
                : `${pickedCount} of ${pickableMatchups.length} picks made — ${remainingCount} left.`}
            </p>
            {pickedCount > 0 && (
              <button
                type="button"
                onClick={handleClearPicks}
                disabled={isClearing}
                className="shrink-0 text-xs text-zinc-500 underline decoration-dotted hover:text-zinc-800 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-zinc-200"
              >
                {isClearing ? "Clearing…" : "Clear picks"}
              </button>
            )}
          </div>
          {clearError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {clearError}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-10">
        {rounds.map((round) => (
        <section key={round} className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Round {round}
          </h2>
          <div className="flex flex-col gap-3">
            {matchups
              .filter((m) => m.round === round)
              .map((matchup, i) => {
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
                const isExpanded = expandedMatchupId === matchup.id;
                const canExpand = optionA !== null && optionB !== null;
                // A bye has nothing to vote on — the lone contestant
                // advances automatically, not by anyone picking them.
                const matchupIsBye = isBye(matchup);
                const rowBg =
                  i % 2 === 0
                    ? "bg-zinc-100 dark:bg-[#141414]"
                    : "bg-white dark:bg-[#222222]";

                if (matchupIsBye) {
                  const byeOption = optionA ?? optionB;
                  return (
                    <div
                      key={matchup.id}
                      className={`flex flex-col gap-2 rounded-lg p-2 ${rowBg}`}
                    >
                      {/* A spacer matching the button's width on the left
                          balances it, so the text centers on the full row
                          width (matching the photo below) instead of just
                          the space left of the button. */}
                      <div className="grid grid-cols-[1.75rem_1fr_1.75rem] items-center gap-3">
                        <div aria-hidden />
                        <p className="text-center text-sm text-zinc-700 dark:text-zinc-300">
                          <span className="font-medium text-zinc-950 dark:text-zinc-50">
                            {byeOption?.name}
                          </span>{" "}
                          received a first-round bye.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMatchupId((current) =>
                              current === matchup.id ? null : matchup.id
                            )
                          }
                          aria-label={
                            isExpanded ? "Hide photo" : "Show photo"
                          }
                          aria-pressed={isExpanded}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isExpanded
                              ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                              : "border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
                          }`}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-4 w-4"
                            aria-hidden
                          >
                            <circle
                              cx="8.5"
                              cy="8.5"
                              r="5.5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                            <line
                              x1="13"
                              y1="13"
                              x2="17.5"
                              y2="17.5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="w-full">
                          <ContestantCard
                            option={byeOption}
                            isPicked
                            disabled
                            isPending={false}
                            onSelect={() => {}}
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={matchup.id}
                    className={`flex flex-col gap-2 rounded-lg p-2 ${rowBg}`}
                  >
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        disabled={!canExpand}
                        onClick={() =>
                          setExpandedMatchupId((current) =>
                            current === matchup.id ? null : matchup.id
                          )
                        }
                        aria-label={
                          isExpanded ? "Collapse photos" : "Expand photos"
                        }
                        aria-pressed={isExpanded}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30 ${
                          isExpanded
                            ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                            : "border-zinc-300 text-zinc-500 enabled:hover:border-zinc-500 enabled:hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:enabled:hover:border-zinc-500 dark:enabled:hover:text-zinc-200"
                        }`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          className="h-4 w-4"
                          aria-hidden
                        >
                          <circle
                            cx="8.5"
                            cy="8.5"
                            r="5.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                          <line
                            x1="13"
                            y1="13"
                            x2="17.5"
                            y2="17.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Collapsed: side by side, compact. Expanded: each photo
                        gets the full row width instead of just scaling up in
                        place, since these photos need real size to read. */}
                    <div
                      className={
                        isExpanded
                          ? "flex flex-col gap-3"
                          : "grid grid-cols-2 gap-2"
                      }
                    >
                      <ContestantCard
                        option={optionA}
                        isPicked={optionA !== null && optionA.id === pickedId}
                        disabled={!canPick || optionA === null}
                        isPending={isPending}
                        onSelect={() =>
                          optionA && handlePick(matchup, optionA.id)
                        }
                      />
                      <ContestantCard
                        option={optionB}
                        isPicked={optionB !== null && optionB.id === pickedId}
                        disabled={!canPick || optionB === null}
                        isPending={isPending}
                        onSelect={() =>
                          optionB && handlePick(matchup, optionB.id)
                        }
                      />
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

      {canPick && pickableMatchups.length > 0 && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            isComplete
              ? "border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          {isComplete
            ? "Your bracket is complete — every matchup has a pick."
            : `${remainingCount} matchup${remainingCount === 1 ? "" : "s"} still need${remainingCount === 1 ? "s" : ""} a pick.`}
        </div>
      )}
    </div>
  );
}
