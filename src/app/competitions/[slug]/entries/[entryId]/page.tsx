import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isBye,
  matchupKey,
  resolveLegalOptions,
  type MatchupLite,
} from "@/lib/bracket";

interface ContestantLite {
  id: string;
  name: string;
  seed: number | null;
}

export default async function EntryPage(
  props: PageProps<"/competitions/[slug]/entries/[entryId]">
) {
  const { slug, entryId } = await props.params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (!competition) {
    if (!userId) {
      return (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
          <BackLink slug={slug} />
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>{" "}
            to view this bracket.
          </p>
        </main>
      );
    }
    notFound();
  }

  const { data: entry } = await supabase
    .from("entries")
    .select("id, user_id")
    .eq("id", entryId)
    .eq("competition_id", competition.id)
    .maybeSingle();

  if (!entry) {
    // RLS hides other people's entries until the competition locks, so a
    // missing row here is ambiguous (wrong id, or just not visible yet) —
    // rather than guess which, say so plainly instead of a bare 404.
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
        <BackLink slug={slug} />
        <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          This bracket isn&apos;t available — either the link is wrong, or
          it isn&apos;t visible until the competition locks.
        </p>
      </main>
    );
  }

  const [{ data: profile }, { data: matchups }, { data: contestants }, { data: picks }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", entry.user_id)
        .single(),
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
      supabase
        .from("picks")
        .select("matchup_id, picked_contestant_id")
        .eq("entry_id", entry.id),
    ]);

  const contestantsById = new Map<string, ContestantLite>(
    (contestants ?? []).map((c) => [c.id, c])
  );
  const matchupsList: MatchupLite[] = matchups ?? [];
  const matchupsByKey = new Map(
    matchupsList.map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const entryPicks = new Map(
    (picks ?? []).map((p) => [p.matchup_id, p.picked_contestant_id])
  );
  const rounds = [...new Set(matchupsList.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <BackLink slug={slug} />
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {profile?.display_name ?? "Bear fan"}&apos;s bracket
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {competition.name}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {rounds.map((round) => (
          <section key={round} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                        className="rounded-md border border-zinc-200 px-3 py-2 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                      >
                        <span className="font-medium text-zinc-950 dark:text-zinc-50">
                          {byeOption?.name}
                        </span>{" "}
                        received a first-round bye.
                      </p>
                    );
                  }

                  const [optionAId, optionBId] = resolveLegalOptions(
                    matchup,
                    matchupsByKey,
                    entryPicks
                  );
                  const optionA = optionAId
                    ? (contestantsById.get(optionAId) ?? null)
                    : null;
                  const optionB = optionBId
                    ? (contestantsById.get(optionBId) ?? null)
                    : null;
                  const pickedId = entryPicks.get(matchup.id) ?? null;

                  return (
                    <div
                      key={matchup.id}
                      className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
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
    </main>
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
  const marker =
    isPicked && winnerId ? (option!.id === winnerId ? "✓" : "✗") : null;

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
      <span
        className={
          isPicked
            ? "font-medium text-zinc-950 dark:text-zinc-50"
            : option
              ? "text-zinc-500 dark:text-zinc-500"
              : "italic text-zinc-400 dark:text-zinc-600"
        }
      >
        {option ? `${option.seed ? `#${option.seed} ` : ""}${option.name}` : "TBD"}
      </span>
      {marker && (
        <span
          className={
            marker === "✓"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {marker}
        </span>
      )}
    </div>
  );
}

function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/competitions/${slug}/leaderboard`}
      className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
    >
      &larr; Back to leaderboard
    </Link>
  );
}
