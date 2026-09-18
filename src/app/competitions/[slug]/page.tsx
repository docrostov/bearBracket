import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { matchupKey, resolveLegalOptions, type MatchupLite } from "@/lib/bracket";
import MatchupPicker from "@/components/MatchupPicker";

export default async function CompetitionPage(
  props: PageProps<"/competitions/[slug]">
) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name, year, status, bracket_size")
    .eq("slug", slug)
    .single();

  if (!competition) notFound();

  const [{ data: matchups }, { data: contestants }, { data: claims }] =
    await Promise.all([
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
      supabase.auth.getClaims(),
    ]);

  const userId = claims?.claims.sub;

  const contestantsById = new Map((contestants ?? []).map((c) => [c.id, c]));
  const matchupsByKey = new Map<string, MatchupLite>(
    (matchups ?? []).map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );

  let picksByMatchupId = new Map<string, string>();

  if (userId) {
    const { data: entry } = await supabase
      .from("entries")
      .select("id")
      .eq("competition_id", competition.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (entry) {
      const { data: picks } = await supabase
        .from("picks")
        .select("matchup_id, picked_contestant_id")
        .eq("entry_id", entry.id);
      picksByMatchupId = new Map(
        (picks ?? []).map((p) => [p.matchup_id, p.picked_contestant_id])
      );
    }
  }

  const rounds = [...new Set((matchups ?? []).map((m) => m.round))].sort(
    (a, b) => a - b
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          &larr; All competitions
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {competition.name}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {competition.year} &middot; {competition.status}
        </p>
      </div>

      {!userId && (
        <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>{" "}
          to submit your bracket.
        </p>
      )}

      <div className="flex flex-col gap-10">
        {rounds.map((round) => (
          <section key={round} className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Round {round}
            </h2>
            <div className="flex flex-col gap-3">
              {(matchups ?? [])
                .filter((m) => m.round === round)
                .map((matchup) => {
                  const [optionAId, optionBId] = resolveLegalOptions(
                    matchup,
                    matchupsByKey,
                    picksByMatchupId
                  );
                  const optionA = optionAId
                    ? (contestantsById.get(optionAId) ?? null)
                    : null;
                  const optionB = optionBId
                    ? (contestantsById.get(optionBId) ?? null)
                    : null;
                  const pickedId = picksByMatchupId.get(matchup.id) ?? null;

                  return (
                    <MatchupPicker
                      key={matchup.id}
                      competitionSlug={competition.slug}
                      matchupId={matchup.id}
                      optionA={optionA}
                      optionB={optionB}
                      pickedId={pickedId}
                      canPick={Boolean(userId) && competition.status === "open"}
                    />
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
