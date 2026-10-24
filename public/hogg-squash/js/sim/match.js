// @ts-check
// Match scoring (docs/decisions.md, "Match rules"): one game, rally scoring, first to 5/7/9/11, win by 2.
// The rally winner serves. A new server starts in the right-hand box and alternates boxes while keeping the serve.
// Pure sim code: no DOM.

/** @typedef {import('./rally.js').Side} Side */
/** @typedef {import('./court-rules.js').BoxSide} BoxSide */

export const MATCH_LENGTHS = [5, 7, 9, 11];

/**
 * @typedef {object} Match
 * @property {number} target         points needed to win (with a 2-point lead)
 * @property {[number, number]} scores
 * @property {Side} server
 * @property {BoxSide} box           the box the server serves from
 * @property {Side | null} winner
 */

/**
 * The first server. Vs CPU the human serves first; in 2P it comes from the seed (so a match can be replayed).
 * @param {{ vsCpu: boolean, human?: Side, seed?: number }} o
 * @returns {Side}
 */
export function firstServer({ vsCpu, human = 0, seed = 0 }) {
  if (vsCpu) return human;
  // one round of a 32-bit integer hash, so neighbouring seeds don't simply alternate
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return /** @type {Side} */ (h & 1);
}

/**
 * @param {{ target: number, server: Side }} o
 * @returns {Match}
 */
export function makeMatch({ target, server }) {
  if (!MATCH_LENGTHS.includes(target)) throw new RangeError(`match length must be one of ${MATCH_LENGTHS.join('/')}, not ${target}`);
  return { target, scores: [0, 0], server, box: 'right', winner: null };
}

/**
 * Score a rally. Does nothing once the match is won.
 * @param {Match} m
 * @param {Side} winner  the rally winner
 * @returns {Match}
 */
export function scoreRally(m, winner) {
  if (m.winner !== null) return m;
  m.scores[winner]++;
  if (winner === m.server) m.box = m.box === 'right' ? 'left' : 'right';
  else { m.server = winner; m.box = 'right'; }
  const [a, b] = m.scores;
  if (Math.max(a, b) >= m.target && Math.abs(a - b) >= 2) m.winner = a > b ? 0 : 1;
  return m;
}

/**
 * The score that wins the match from here (S12e): the match length, or once both sides reach length − 1 (win by 2),
 * the lower score + 2. In a game to 11: 10–9 → 11, 10–10 → 12, 11–10 → 12, 11–11 → 13.
 * @param {Match} m
 * @returns {number}
 */
export function winningScore(m) {
  const low = Math.min(m.scores[0], m.scores[1]);
  return low >= m.target - 1 ? low + 2 : m.target;
}
