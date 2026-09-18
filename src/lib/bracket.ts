// A user's predicted bracket is derived entirely from their own picks, not
// from matchups.contestant_a_id/contestant_b_id for rounds after the first.
// Those columns hold the *official* real-world bracket, which is only known
// round by round as the actual competition plays out (an admin fills them
// in). For round 2+, "who is playing in this slot" in a user's own bracket
// means "who did this user pick to win the two round-(r-1) matchups that
// feed this slot" — independent of whether the real world has caught up yet.

export interface MatchupLite {
  id: string;
  round: number;
  slot_in_round: number;
  contestant_a_id: string | null;
  contestant_b_id: string | null;
}

export function matchupKey(round: number, slotInRound: number): string {
  return `${round}:${slotInRound}`;
}

/** The two round-(r-1) slot numbers that feed into round r's given slot. Null for round 1 (no feeders). */
export function feederSlots(round: number, slotInRound: number): [number, number] | null {
  if (round <= 1) return null;
  return [slotInRound * 2 - 1, slotInRound * 2];
}

/**
 * The two contestant ids a user could legally pick for this matchup: from
 * the official round-1 bracket, or from that user's own picks on the
 * round-(r-1) matchups that feed this slot.
 */
export function resolveLegalOptions(
  matchup: MatchupLite,
  matchupsByKey: Map<string, MatchupLite>,
  picksByMatchupId: Map<string, string>
): [string | null, string | null] {
  if (matchup.round === 1) {
    return [matchup.contestant_a_id, matchup.contestant_b_id];
  }

  const feeders = feederSlots(matchup.round, matchup.slot_in_round);
  if (!feeders) return [null, null];

  const [slotA, slotB] = feeders;
  const matchupA = matchupsByKey.get(matchupKey(matchup.round - 1, slotA));
  const matchupB = matchupsByKey.get(matchupKey(matchup.round - 1, slotB));

  return [
    matchupA ? (picksByMatchupId.get(matchupA.id) ?? null) : null,
    matchupB ? (picksByMatchupId.get(matchupB.id) ?? null) : null,
  ];
}
