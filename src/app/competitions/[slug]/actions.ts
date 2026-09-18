"use server";

import { createClient } from "@/lib/supabase/server";
import {
  matchupKey,
  resolveLegalOptions,
  type MatchupLite,
} from "@/lib/bracket";

// The UI applies picks optimistically and doesn't wait on a full page
// re-render, so this doesn't call revalidatePath — the client already
// reflects the change locally, and the next real navigation will read the
// current database state anyway.
export async function submitPick(
  competitionSlug: string,
  matchupId: string,
  contestantId: string,
  knownEntryId: string | null
): Promise<{ entryId: string }> {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) {
    throw new Error("Sign in to submit picks.");
  }

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, status")
    .eq("slug", competitionSlug)
    .single();

  if (!competition || competition.status !== "open") {
    throw new Error("This competition isn't open for picks.");
  }

  const { data: matchups } = await supabase
    .from("matchups")
    .select("id, round, slot_in_round, contestant_a_id, contestant_b_id")
    .eq("competition_id", competition.id);

  const matchup = (matchups ?? []).find((m) => m.id === matchupId);
  if (!matchup) {
    throw new Error("Matchup not found.");
  }

  // Skip the entry lookup entirely once the client already knows it —
  // saves a round trip on every pick after the user's first.
  let entryId = knownEntryId;
  if (!entryId) {
    const { data: existingEntry } = await supabase
      .from("entries")
      .select("id")
      .eq("competition_id", competition.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingEntry) {
      entryId = existingEntry.id;
    } else {
      const { data: newEntry, error: entryError } = await supabase
        .from("entries")
        .insert({ competition_id: competition.id, user_id: userId })
        .select("id")
        .single();
      if (entryError || !newEntry) {
        throw new Error(entryError?.message ?? "Could not create an entry.");
      }
      entryId = newEntry.id;
    }
  }

  const { data: existingPicks } = await supabase
    .from("picks")
    .select("matchup_id, picked_contestant_id")
    .eq("entry_id", entryId);

  const matchupsByKey = new Map<string, MatchupLite>(
    (matchups ?? []).map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const picksByMatchupId = new Map(
    (existingPicks ?? []).map((p) => [p.matchup_id, p.picked_contestant_id])
  );

  const [optionA, optionB] = resolveLegalOptions(
    matchup,
    matchupsByKey,
    picksByMatchupId
  );
  if (contestantId !== optionA && contestantId !== optionB) {
    throw new Error("That contestant isn't a legal pick for this matchup.");
  }

  const { error } = await supabase.from("picks").upsert(
    {
      entry_id: entryId,
      matchup_id: matchupId,
      picked_contestant_id: contestantId,
    },
    { onConflict: "entry_id,matchup_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return { entryId };
}
