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
  /** The official real-world result, filled in round by round as the actual competition plays out. Null until decided. */
  winner_id: string | null;
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
 * A matchup with only one contestant seeded (the other side null) is a bye:
 * nothing to vote on, that contestant advances automatically — e.g. Fat Bear
 * Week's real bracket has 12 contestants with 4 first-round byes, seeded
 * into a 16-slot bracket shape.
 */
export function isBye(matchup: MatchupLite): boolean {
  return (
    (matchup.contestant_a_id !== null) !== (matchup.contestant_b_id !== null)
  );
}

export function byeContestantId(matchup: MatchupLite): string | null {
  if (!isBye(matchup)) return null;
  return matchup.contestant_a_id ?? matchup.contestant_b_id;
}

/** The contestant who wins this matchup in a user's predicted bracket: automatic for a bye, otherwise whatever they picked. */
function effectiveWinner(
  matchup: MatchupLite,
  picksByMatchupId: Map<string, string>
): string | null {
  if (isBye(matchup)) return byeContestantId(matchup);
  return picksByMatchupId.get(matchup.id) ?? null;
}

/**
 * The two contestant ids a user could legally pick for this matchup: from
 * the official round-1 bracket, or from that user's own picks (or an
 * automatic bye) on the round-(r-1) matchups that feed this slot.
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
    matchupA ? effectiveWinner(matchupA, picksByMatchupId) : null,
    matchupB ? effectiveWinner(matchupB, picksByMatchupId) : null,
  ];
}

/** The contestant who actually won this matchup in real life: automatic for a bye, otherwise the official result (null until decided). */
export function realWinner(matchup: MatchupLite): string | null {
  if (isBye(matchup)) return byeContestantId(matchup);
  return matchup.winner_id;
}

/**
 * Same shape as resolveLegalOptions, but tracing official results instead of
 * any one entry's picks — who's actually confirmed to be playing in this
 * matchup, independent of what anyone predicted. Used both to figure out
 * who's still mathematically alive, and to render the official results page.
 */
export function officialOccupants(
  matchup: MatchupLite,
  matchupsByKey: Map<string, MatchupLite>
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
    matchupA ? realWinner(matchupA) : null,
    matchupB ? realWinner(matchupB) : null,
  ];
}

/**
 * Contestants eliminated by official results so far. In single elimination,
 * losing anywhere rules a contestant out of every later slot too — used to
 * tell whether an entry's still-undecided pick is still mathematically
 * possible, independent of what that entry itself predicted for earlier
 * rounds.
 */
export function computeEliminatedContestants(
  matchups: MatchupLite[]
): Set<string> {
  const matchupsByKey = new Map(
    matchups.map((m) => [matchupKey(m.round, m.slot_in_round), m])
  );
  const eliminated = new Set<string>();

  for (const matchup of matchups) {
    if (isBye(matchup) || matchup.winner_id === null) continue;
    const [a, b] = officialOccupants(matchup, matchupsByKey);
    for (const occupant of [a, b]) {
      if (occupant !== null && occupant !== matchup.winner_id) {
        eliminated.add(occupant);
      }
    }
  }

  return eliminated;
}
