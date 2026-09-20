import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BracketBoard from "@/components/BracketBoard";

export default async function MyBracketPage(
  props: PageProps<"/competitions/[slug]/bracket">
) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, slug, name, year, status, bracket_size")
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
      .select("id, name, seed, image_url")
      .eq("competition_id", competition.id),
  ]);

  let initialPicks: { matchupId: string; contestantId: string }[] = [];
  let initialEntryId: string | null = null;
  let needsProfileSetup = false;

  if (userId) {
    const [{ data: entry }, { data: profile }] = await Promise.all([
      supabase
        .from("entries")
        .select("id")
        .eq("competition_id", competition.id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("display_name, emoji")
        .eq("id", userId)
        .single(),
    ]);

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

    // Only nudge someone whose profile is still the untouched default —
    // a name with no emoji is a deliberate choice (it's optional), not
    // something to nag about.
    needsProfileSetup =
      profile?.display_name === "New Bear Fan" && profile?.emoji === null;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-ink">
          {competition.name}
        </h1>
        <p className="text-sm text-ink-soft">
          {competition.year} &middot; {competition.status}
        </p>
      </div>

      {!userId && (
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
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

      {needsProfileSetup && (
        <p className="text-sm text-ink-soft">
          Want to show up as more than &quot;New Bear Fan&quot; on the leaderboard?{" "}
          <Link href="/profile" className="font-medium underline">
            Set your name and emoji
          </Link>
          .
        </p>
      )}
    </main>
  );
}
