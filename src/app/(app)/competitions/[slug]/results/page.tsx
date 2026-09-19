import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isBye,
  matchupKey,
  officialOccupants,
  type MatchupLite,
} from "@/lib/bracket";

interface ContestantLite {
  id: string;
  name: string;
  seed: number | null;
}

export default async function ResultsPage(
  props: PageProps<"/competitions/[slug]/results">
) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (!competition) {
    notFound();
  }

  const [{ data: matchups }, { data: contestants }] = await Promise.all([
    supabase
      .from("matchups")
      .select("id, round, slot_in_round, contestant_a_id, contestant_b_id, winner_id")
      .eq("competition_id", competition.id)
      .order("round")
      .order("slot_in_round"),
    supabase
      .from("contestants")
      .select("id, name, seed")
      .eq("competition_id", competition.id),
  ]);

  const matchupsList: MatchupLite[] = matchups ?? [];
  const contestantsById = new Map<string, ContestantLite>(
    (contestants ?? []).map((c) => [c.id, c])
  );
  const matchupsByKey = new Map(
    matchupsList.map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const rounds = [...new Set(matchupsList.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-ink">
          {competition.name} — Results
        </h1>
        <p className="text-sm text-ink-soft">
          What&apos;s actually happened so far — filled in round by round as
          the real tournament plays out.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {rounds.map((round) => (
          <section key={round} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Round {round}
            </h2>
            <div className="flex flex-col gap-2">
              {matchupsList
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

                  const [occupantAId, occupantBId] = officialOccupants(
                    matchup,
                    matchupsByKey
                  );
                  const occupantA = occupantAId
                    ? (contestantsById.get(occupantAId) ?? null)
                    : null;
                  const occupantB = occupantBId
                    ? (contestantsById.get(occupantBId) ?? null)
                    : null;
                  const isDecided = matchup.winner_id !== null;

                  return (
                    <div
                      key={matchup.id}
                      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border p-2 ${
                        isDecided
                          ? "border-border-strong bg-surface"
                          : "border-border bg-cream"
                      }`}
                    >
                      <ResultCell option={occupantA} winnerId={matchup.winner_id} />
                      <span className="text-xs font-medium text-muted">vs</span>
                      <ResultCell option={occupantB} winnerId={matchup.winner_id} />
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function ResultCell({
  option,
  winnerId,
}: {
  option: ContestantLite | null;
  winnerId: string | null;
}) {
  const isWinner = option !== null && option.id === winnerId;

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm ${
        isWinner ? "border border-[#c3d5b3] bg-success-bg" : ""
      }`}
    >
      <span
        className={
          isWinner
            ? "font-medium text-ink"
            : option
              ? "text-ink-soft"
              : "italic text-muted"
        }
      >
        {option ? `${option.seed ? `#${option.seed} ` : ""}${option.name}` : "TBD"}
      </span>
    </div>
  );
}
