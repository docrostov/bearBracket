import { isBye, type MatchupLite } from "./bracket";

export interface EntryScore {
  score: number;
  correctCount: number;
  /** Non-bye matchups with a known official winner — the denominator "correct out of ___" should use. */
  scorableCount: number;
}

/**
 * Scores one entry against the official results known so far. Only
 * matchups with a winner_id count — anything the real world hasn't decided
 * yet neither helps nor hurts, so scores update naturally as results come
 * in round by round rather than needing the whole bracket to finish.
 */
export function scoreEntry(
  matchups: MatchupLite[],
  picksByMatchupId: Map<string, string>,
  pointsPerRound: number[]
): EntryScore {
  let score = 0;
  let correctCount = 0;
  let scorableCount = 0;

  for (const matchup of matchups) {
    if (isBye(matchup)) continue;
    if (!matchup.winner_id) continue;

    scorableCount += 1;
    const pick = picksByMatchupId.get(matchup.id);
    if (pick && pick === matchup.winner_id) {
      correctCount += 1;
      score += pointsPerRound[matchup.round - 1] ?? 1;
    }
  }

  return { score, correctCount, scorableCount };
}

/**
 * The most additional points this entry could still earn: for every
 * undecided matchup where this entry picked a contestant who hasn't been
 * eliminated by official results yet, count the full points that round is
 * worth. A pick naming someone already eliminated can never come true, so
 * it contributes nothing.
 */
export function potentialRemainingPoints(
  matchups: MatchupLite[],
  picksByMatchupId: Map<string, string>,
  eliminatedContestants: Set<string>,
  pointsPerRound: number[]
): number {
  let potential = 0;

  for (const matchup of matchups) {
    if (isBye(matchup) || matchup.winner_id !== null) continue;
    const pick = picksByMatchupId.get(matchup.id);
    if (pick && !eliminatedContestants.has(pick)) {
      potential += pointsPerRound[matchup.round - 1] ?? 1;
    }
  }

  return potential;
}
