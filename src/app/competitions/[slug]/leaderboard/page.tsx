import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { potentialRemainingPoints, scoreEntry } from "@/lib/scoring";
import { computeEliminatedContestants, type MatchupLite } from "@/lib/bracket";

export default async function LeaderboardPage(
  props: PageProps<"/competitions/[slug]/leaderboard">
) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name, status, points_per_round")
    .eq("slug", slug)
    .single();

  if (!competition) {
    if (!userId) {
      return (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
          <BackLink slug={slug} />
          <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>{" "}
            to view this leaderboard.
          </p>
        </main>
      );
    }
    notFound();
  }

  const { data: matchups } = await supabase
    .from("matchups")
    .select("id, round, slot_in_round, contestant_a_id, contestant_b_id, winner_id")
    .eq("competition_id", competition.id);

  const { data: entries } = await supabase
    .from("entries")
    .select("id, user_id")
    .eq("competition_id", competition.id);

  const entryIds = (entries ?? []).map((e) => e.id);
  const userIds = (entries ?? []).map((e) => e.user_id);

  const [{ data: profiles }, { data: picks }] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, display_name, emoji")
          .in("id", userIds)
      : Promise.resolve(
          { data: [] as { id: string; display_name: string; emoji: string | null }[] }
        ),
    entryIds.length > 0
      ? supabase
          .from("picks")
          .select("entry_id, matchup_id, picked_contestant_id")
          .in("entry_id", entryIds)
      : Promise.resolve(
          { data: [] as { entry_id: string; matchup_id: string; picked_contestant_id: string }[] }
        ),
  ]);

  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const picksByEntryId = new Map<string, Map<string, string>>();
  for (const pick of picks ?? []) {
    if (!picksByEntryId.has(pick.entry_id)) {
      picksByEntryId.set(pick.entry_id, new Map());
    }
    picksByEntryId
      .get(pick.entry_id)!
      .set(pick.matchup_id, pick.picked_contestant_id);
  }

  const matchupsList: MatchupLite[] = matchups ?? [];
  const eliminatedContestants = computeEliminatedContestants(matchupsList);

  const rows = (entries ?? [])
    .map((entry) => {
      const entryPicks = picksByEntryId.get(entry.id) ?? new Map();
      const { score, correctCount, scorableCount } = scoreEntry(
        matchupsList,
        entryPicks,
        competition.points_per_round
      );
      const potentialPoints = potentialRemainingPoints(
        matchupsList,
        entryPicks,
        eliminatedContestants,
        competition.points_per_round
      );
      const profile = profileByUserId.get(entry.user_id);
      return {
        entryId: entry.id,
        displayName: profile?.display_name ?? "Bear fan",
        emoji: profile?.emoji ?? null,
        score,
        correctCount,
        scorableCount,
        potentialPoints,
      };
    })
    .sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <BackLink slug={slug} />
        <h1 className="font-heading text-2xl font-bold text-ink">
          {competition.name} — Leaderboard
        </h1>
      </div>

      {!userId && (
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>{" "}
          to view the leaderboard.
        </p>
      )}

      {userId && competition.status === "open" && (
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
          Everyone&apos;s picks stay private until this competition locks —
          you can only see your own entry here for now.
        </p>
      )}

      {userId && rows.length === 0 && (
        <p className="text-sm text-ink-soft">No entries yet.</p>
      )}

      {userId && rows.length > 0 && (
        <ol className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <li key={row.entryId}>
              <Link
                href={`/competitions/${slug}/entries/${row.entryId}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
              >
                <span className="flex items-center gap-3">
                  <span className="w-6 text-sm text-muted">{i + 1}</span>
                  <span className="font-medium text-ink">
                    {row.emoji && <span className="mr-1">{row.emoji}</span>}
                    {row.displayName}
                  </span>
                </span>
                <span className="text-sm text-ink-soft">
                  {row.potentialPoints > 0 ? (
                    <span className="group relative cursor-help border-b border-dotted border-muted">
                      {row.score} pts
                      <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-1 hidden w-max max-w-[200px] rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-paper group-hover:block">
                        +{row.potentialPoints} more possible
                      </span>
                    </span>
                  ) : (
                    <>{row.score} pts</>
                  )}
                  {row.scorableCount > 0 && (
                    <>
                      {" "}
                      &middot; {row.correctCount}/{row.scorableCount} correct
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/competitions/${slug}`}
      className="text-sm text-muted hover:text-ink"
    >
      &larr; Back to bracket
    </Link>
  );
}
