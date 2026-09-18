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
