"use client";

import { useState, useTransition } from "react";
import { submitPick } from "@/app/competitions/[slug]/actions";

interface ContestantOption {
  id: string;
  name: string;
  seed: number | null;
}

interface MatchupPickerProps {
  competitionSlug: string;
  matchupId: string;
  optionA: ContestantOption | null;
  optionB: ContestantOption | null;
  pickedId: string | null;
  canPick: boolean;
}

export default function MatchupPicker({
  competitionSlug,
  matchupId,
  optionA,
  optionB,
  pickedId,
  canPick,
}: MatchupPickerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(contestantId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await submitPick(competitionSlug, matchupId, contestantId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save that pick.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
        {[optionA, optionB].map((option, i) => {
          const isPicked = option !== null && option.id === pickedId;
          const disabled = !canPick || isPending || option === null;

          return (
            <button
              key={option?.id ?? `empty-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => option && pick(option.id)}
              className={`flex-1 px-4 py-3 text-left text-sm transition-colors ${
                i === 0 ? "border-r border-zinc-200 dark:border-zinc-800" : ""
              } ${
                isPicked
                  ? "bg-foreground text-background font-medium"
                  : "bg-white text-zinc-700 hover:enabled:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:enabled:bg-zinc-900"
              } ${option === null ? "italic text-zinc-400 dark:text-zinc-600" : ""}`}
            >
              {option
                ? `${option.seed ? `#${option.seed} ` : ""}${option.name}`
                : "TBD"}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
