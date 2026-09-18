import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BracketBoard from "@/components/BracketBoard";

export default async function CompetitionPage(
  props: PageProps<"/competitions/[slug]">
) {
  const { slug } = await props.params;
  const supabase = await createClient();

  // RLS hides competitions entirely from signed-out requests, so a missing
  // row here is ambiguous: either the slug is genuinely wrong, or it exists
  // but this visitor isn't signed in to see it. Check auth first so we can
  // tell those apart instead of showing a flat 404 to a signed-out visitor.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name, year, status, bracket_size")
    .eq("slug", slug)
    .single();

  if (!competition) {
    if (!userId) {
      return (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            &larr; All competitions
          </Link>
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>{" "}
            to view this competition.
          </p>
        </main>
      );
    }
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

  let initialPicks: { matchupId: string; contestantId: string }[] = [];
  let initialEntryId: string | null = null;

  if (userId) {
    const { data: entry } = await supabase
      .from("entries")
      .select("id")
      .eq("competition_id", competition.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (entry) {
      initialEntryId = entry.id;
      const { data: picks } = await supabase
        .from("picks")
        .select("matchup_id, picked_contestant_id")
        .eq("entry_id", entry.id);
      initialPicks = (picks ?? []).map((p) => ({
        matchupId: p.matchup_id,
        contestantId: p.picked_contestant_id,
      }));
    }
  }

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

      <BracketBoard
        competitionSlug={competition.slug}
        canPick={Boolean(userId) && competition.status === "open"}
        matchups={matchups ?? []}
        contestants={contestants ?? []}
        initialPicks={initialPicks}
        initialEntryId={initialEntryId}
      />
    </main>
  );
}
