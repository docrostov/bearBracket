import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReadOnlyBracket, {
  type ContestantLite,
} from "@/components/ReadOnlyBracket";
import type { MatchupLite } from "@/lib/bracket";

export default async function EntryPage(
  props: PageProps<"/competitions/[slug]/entries/[entryId]">
) {
  const { slug, entryId } = await props.params;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (!competition) {
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
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
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

  const matchupsList: MatchupLite[] = matchups ?? [];
  const contestantsList: ContestantLite[] = contestants ?? [];
  const entryPicks = new Map(
    (picks ?? []).map((p) => [p.matchup_id, p.picked_contestant_id])
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <BackLink slug={slug} />
        <h1 className="font-heading text-2xl font-bold text-ink">
          {profile?.display_name ?? "Bear fan"}&apos;s bracket
        </h1>
        <p className="text-sm text-ink-soft">{competition.name}</p>
      </div>

      <ReadOnlyBracket
        matchups={matchupsList}
        contestants={contestantsList}
        picks={entryPicks}
      />
    </main>
  );
}

function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/competitions/${slug}/leaderboard`}
      className="text-sm text-muted hover:text-ink"
    >
      &larr; Back to leaderboard
    </Link>
  );
}
