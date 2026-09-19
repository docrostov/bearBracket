import {
  isBye,
  matchupKey,
  resolveLegalOptions,
  type MatchupLite,
} from "@/lib/bracket";

export interface ContestantLite {
  id: string;
  name: string;
  seed: number | null;
}

/**
 * Renders a bracket's rounds read-only, marking each pick correct/incorrect
 * against official results as they come in. Shared by an individual entry's
 * page and the official-results page — the latter just passes a "pick" map
 * that always mirrors the real winner_id, so every decided matchup renders
 * as correct by construction (see the results_entry trigger in
 * supabase/migrations/0007_official_results_entry.sql).
 */
export default function ReadOnlyBracket({
  matchups,
  contestants,
  picks,
}: {
  matchups: MatchupLite[];
  contestants: ContestantLite[];
  picks: Map<string, string>;
}) {
  const contestantsById = new Map<string, ContestantLite>(
    contestants.map((c) => [c.id, c])
  );
  const matchupsByKey = new Map(
    matchups.map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const rounds = [...new Set(matchups.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  return (
    <div className="flex flex-col gap-8">
      {rounds.map((round) => (
        <section key={round} className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Round {round}
          </h2>
          <div className="flex flex-col gap-2">
            {matchups
              .filter((m) => m.round === round)
              .map((matchup) => {
                if (isBye(matchup)) {
                  const byeOption =
                    contestantsById.get(matchup.contestant_a_id ?? "") ??
                    contestantsById.get(matchup.contestant_b_id ?? "") ??
                    null;
                  return (
                    <p
                      key={matchup.id}
                      className="rounded-md border border-border-strong bg-surface px-3 py-2 text-center text-sm text-ink-soft"
                    >
                      <span className="font-medium text-ink">
                        {byeOption?.name}
                      </span>{" "}
                      received a first-round bye.
                    </p>
                  );
                }

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
                const isDecided = matchup.winner_id !== null;

                return (
                  <div
                    key={matchup.id}
                    className={`grid grid-cols-2 gap-2 rounded-md border p-2 ${
                      isDecided
                        ? "border-border-strong bg-surface"
                        : "border-border bg-cream"
                    }`}
                  >
                    <PickCell
                      option={optionA}
                      pickedId={pickedId}
                      winnerId={matchup.winner_id}
                    />
                    <PickCell
                      option={optionB}
                      pickedId={pickedId}
                      winnerId={matchup.winner_id}
                    />
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PickCell({
  option,
  pickedId,
  winnerId,
}: {
  option: ContestantLite | null;
  pickedId: string | null;
  winnerId: string | null;
}) {
  const isPicked = option !== null && option.id === pickedId;
  const isResolved = isPicked && winnerId !== null;
  const isCorrect = isResolved && option!.id === winnerId;

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm ${
        isResolved
          ? isCorrect
            ? "border border-[#c3d5b3] bg-success-bg"
            : "border border-[#e0c0b3] bg-danger-bg"
          : ""
      }`}
    >
      <span
        className={
          isPicked
            ? "font-medium text-ink"
            : option
              ? "text-ink-soft"
              : "italic text-muted"
        }
      >
        {option ? `${option.seed ? `#${option.seed} ` : ""}${option.name}` : "TBD"}
      </span>
      {isResolved && (
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-paper ${
            isCorrect ? "bg-success" : "bg-danger"
          }`}
        >
          {isCorrect ? "✓" : "✗"}
        </span>
      )}
    </div>
  );
}
