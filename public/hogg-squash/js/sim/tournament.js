// @ts-check
// The tournament (docs/decisions.md, "Tournament", settled at CP-I): a knockout bracket of 2, 4, 8 or 16 players (32
// too for one saved before S18),
// some of them humans and the rest bots (CPUs), drawn at random from a seed when it starts and then played match by
// match in bracket order, a round at a time.
//  - Entrants are numbered 0 … size − 1: the humans first (P1, P2 …), then the bots (BOT 1, BOT 2 …). Each has a
//    character (looks only; the sim never sees them). `order` is the draw: the entrant in each bracket slot.
//  - Round r's match i is between slots 2i and 2i + 1 (round 0) or the winners of the previous round's matches 2i and
//    2i + 1; the first of the two is the "upper" one.
//  - A human's match has to be played; a bots' match can be watched or skipped. Skipping plays the real match
//    instantly (world.js and cpu.js, both sides CPU at the bots' level, from a seed made from the tournament's seed and
//    the match's place), so a tournament always skips to the same results, and a watched one ends the same way.
//  - A human who loses to a bot replays the match (a try is counted); a human who loses to a human is out. So a human
//    always wins a tournament with humans in it, and the final always has one.
// Pure sim code: no DOM. Saving goes through a Store (localStorage, or null when the browser blocks it), as the keymap's.
import { makeWorld, stepWorld } from './world.js';
import { makeCpu, cpuActions, cpuRandom } from './cpu.js';
import { paramsFor, LEVELS, DEFAULT_LEVEL } from './difficulty.js';
import { MATCH_LENGTHS } from './match.js';

/** The bracket sizes a tournament can have (a 32 saved before S18 still loads and plays to its end). */
export const SIZES = [2, 4, 8, 16, 32];
/** The sizes the setup offers (A12, the owner's call: no 32-player bracket). */
export const SETUP_SIZES = [2, 4, 8, 16];
/** Rising lengths always reach this in the final. */
export const FINAL_LENGTH = 11;
/** How a tournament's match lengths are set: one length for all, or rising to FINAL_LENGTH in the final. */
export const LENGTH_MODES = /** @type {const} */ (['same', 'rising']);
/** The setup screen's starting choices: 8 players, 1 human, Same at first to 11 (Rising from 5), bots at level 5. */
export const TOURNAMENT_DEFAULTS = Object.freeze({ size: 8, humans: 1, mode: /** @type {LengthMode} */ ('same'),
  same: 11, start: 5, level: DEFAULT_LEVEL });
/** Where the tournament is saved, and the save's version (an older or newer one is ignored). */
export const TOURNAMENT_KEY = 'hogg-squash.tournament';
export const TOURNAMENT_VERSION = 1;
/** A skipped match gives up after this many frames (about 10 hours of play; a real one takes well under 40,000). */
const MAX_FRAMES = 2_000_000;
/** Random-number purposes. */
const SALT = { DRAW: 101, MATCH: 102 };

/** @typedef {'same' | 'rising'} LengthMode */
/**
 * @typedef {object} TournamentSetup
 * @property {number} size      2, 4, 8, 16 or 32
 * @property {number} humans    1 … size: entrants 0 … humans − 1 are people
 * @property {LengthMode} mode
 * @property {number} length    Same: every match's length; Rising: the first round's
 * @property {number} level     1–9, every bot's (a match between two humans plays level 5's pace)
 * @property {string[]} chars   each entrant's character id
 * @property {number} seed      the draw's and the skipped matches' seed (a 32-bit integer)
 */
/**
 * One match's outcome so far. scores are [upper's, lower's]; losses: times a human lost it to a bot (replayed).
 * @typedef {{ winner: number | null, scores: [number, number] | null, skipped: boolean, losses: number }} Played
 */
/**
 * @typedef {object} Tournament
 * @property {number} version
 * @property {TournamentSetup} setup
 * @property {number[]} order    the draw: the entrant in each bracket slot
 * @property {Played[][]} rounds  each round's matches, in bracket order
 */
/**
 * A match to play, as the screens and the match need it.
 * @typedef {object} MatchInfo
 * @property {number} round
 * @property {number} index        its place in the round
 * @property {string} name         the round's name (QUARTER-FINAL …)
 * @property {[number, number]} players  upper, lower (entrants)
 * @property {[number, number]} sides    who plays each world slot: P1 (red, P1's controls) then P2 / the CPU
 * @property {[boolean, boolean]} cpu    which slots a bot plays
 * @property {number} length       first to …
 * @property {number} level        the pace and the bots' level (level 5 for two humans)
 * @property {boolean} mustPlay    a human is in it (else it can be watched or skipped)
 * @property {number} seed         the match's seed (a skipped or watched bots' match is the same every time)
 * @property {number} attempt      1, or more after a human lost it to a bot
 */
/** @typedef {{ getItem(k: string): string | null, setItem(k: string, v: string): void, removeItem?(k: string): void }} Store */

/** @param {number} size */
export const roundCount = size => Math.round(Math.log2(size));

/** A round's name, from the players left in it. @param {number} players */
export function roundName(players) {
  if (players === 2) return 'FINAL';
  if (players === 4) return 'SEMI-FINAL';
  if (players === 8) return 'QUARTER-FINAL';
  return `ROUND OF ${players}`;
}

/** The name of round r of a bracket. @param {number} size @param {number} r */
export const roundNameOf = (size, r) => roundName(size >> r);

/**
 * A round's match length. Same: the length. Rising: from the start to FINAL_LENGTH in even steps, round r of R playing
 * start + (11 − start) × r ÷ (R − 1), rounded to the nearest of 5, 7, 9, 11 (a tie goes up); one round plays the start.
 * Worked in whole numbers (everything × (R − 1)), so the ties are exact.
 * @param {LengthMode} mode @param {number} length @param {number} r @param {number} rounds
 */
export function roundLength(mode, length, r, rounds) {
  if (mode === 'same' || rounds <= 1) return length;
  const d = rounds - 1, n = length * d + (FINAL_LENGTH - length) * r;
  let best = MATCH_LENGTHS[0];
  for (const L of MATCH_LENGTHS) if (Math.abs(L * d - n) <= Math.abs(best * d - n)) best = L;
  return best;
}

/** Every round's length. @param {LengthMode} mode @param {number} length @param {number} size */
export const lengthsFor = (mode, length, size) =>
  Array.from({ length: roundCount(size) }, (_, r) => roundLength(mode, length, r, roundCount(size)));

/** @param {TournamentSetup} s @param {number} e */
export const isHuman = (s, e) => e < s.humans;

/** An entrant's label, so repeated characters can be told apart: P1, P2 … for humans, BOT 1, BOT 2 … for bots. @param {TournamentSetup} s @param {number} e */
export const entrantLabel = (s, e) => (isHuman(s, e) ? `P${e + 1}` : `BOT ${e - s.humans + 1}`);

const isInt = (/** @type {unknown} */ v) => Number.isInteger(v);

/** What's wrong with a setup ('' if nothing). @param {any} s @returns {string} */
export function setupProblem(s) {
  if (!s || typeof s !== 'object') return 'no setup';
  if (!SIZES.includes(s.size)) return `size ${s.size}`;
  if (!isInt(s.humans) || s.humans < 1 || s.humans > s.size) return `humans ${s.humans}`;
  if (!LENGTH_MODES.includes(s.mode)) return `mode ${s.mode}`;
  if (!MATCH_LENGTHS.includes(s.length)) return `length ${s.length}`;
  if (!LEVELS.includes(s.level)) return `level ${s.level}`;
  if (!Array.isArray(s.chars) || s.chars.length !== s.size || !s.chars.every((/** @type {unknown} */ c) => typeof c === 'string' && c))
    return 'chars';
  if (!isInt(s.seed)) return `seed ${s.seed}`;
  return '';
}

/** The draw: the entrants shuffled from the seed (Fisher–Yates, cpu.js's hash). @param {number} size @param {number} seed */
export function drawOrder(size, seed) {
  const order = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(cpuRandom(seed, SALT.DRAW, i) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * A new tournament: the setup checked, the draw made, no match played.
 * @param {TournamentSetup} setup @returns {Tournament}
 */
export function makeTournament(setup) {
  const bad = setupProblem(setup);
  if (bad) throw new RangeError(`bad tournament setup: ${bad}`);
  const s = { ...setup, chars: [...setup.chars], seed: setup.seed | 0 };
  return {
    version: TOURNAMENT_VERSION, setup: s, order: drawOrder(s.size, s.seed),
    rounds: Array.from({ length: roundCount(s.size) }, (_, r) =>
      Array.from({ length: s.size >> (r + 1) }, () => ({ winner: null, scores: null, skipped: false, losses: 0 }))),
  };
}

/**
 * The two entrants of round r's match i, upper first; null for one not decided yet.
 * @param {Tournament} t @param {number} r @param {number} i @returns {[number | null, number | null]}
 */
export function playersOf(t, r, i) {
  if (r === 0) return [t.order[2 * i], t.order[2 * i + 1]];
  return [t.rounds[r - 1][2 * i].winner, t.rounds[r - 1][2 * i + 1].winner];
}

/** The match's seed: the tournament's, its place and the attempt, hashed. @param {Tournament} t @param {number} r @param {number} i */
function matchSeed(t, r, i) {
  return Math.floor(cpuRandom(t.setup.seed, SALT.MATCH, r, i, t.rounds[r][i].losses) * 2 ** 32) | 0;
}

/**
 * Everything about round r's match i (both players must be known).
 * @param {Tournament} t @param {number} r @param {number} i @returns {MatchInfo}
 */
export function matchInfo(t, r, i) {
  const s = t.setup, [a, b] = playersOf(t, r, i);
  if (a === null || b === null) throw new RangeError(`round ${r} match ${i} isn't decided yet`);
  const ha = isHuman(s, a), hb = isHuman(s, b);
  /** @type {[number, number]} */
  const sides = !ha && hb ? [b, a] : [a, b];             // against a bot the human is P1; otherwise the upper one
  /** @type {[boolean, boolean]} */
  const cpu = [!isHuman(s, sides[0]), !isHuman(s, sides[1])];
  return {
    round: r, index: i, name: roundNameOf(s.size, r), players: [a, b], sides, cpu,
    length: roundLength(s.mode, s.length, r, t.rounds.length),
    level: cpu[0] || cpu[1] ? s.level : DEFAULT_LEVEL,
    mustPlay: ha || hb, seed: matchSeed(t, r, i), attempt: t.rounds[r][i].losses + 1,
  };
}

/** The next match to play, in bracket order a round at a time (null once there is a champion). @param {Tournament} t */
export function nextMatch(t) {
  for (const [r, round] of t.rounds.entries()) {
    const i = round.findIndex(m => m.winner === null);
    if (i >= 0) return matchInfo(t, r, i);
  }
  return null;
}

/** The winner of the final, or null. @param {Tournament} t */
export const champion = t => t.rounds[t.rounds.length - 1][0].winner;

/**
 * The next match's result. A human's loss to a bot keeps the match to be replayed (a try more); anything else decides
 * it: the winner goes on, and the loser is out (a human beaten by a human too).
 * @param {Tournament} t
 * @param {0 | 1} winnerSide  the world slot that won
 * @param {[number, number]} scores  by world slot
 * @param {boolean} [skipped]  it was skipped (all of it, or the rest of it)
 * @returns {'replay' | 'decided'}
 */
export function recordResult(t, winnerSide, scores, skipped = false) {
  const info = nextMatch(t);
  if (!info) throw new RangeError('the tournament is over');
  if (!(scores[winnerSide] > scores[1 - winnerSide])) throw new RangeError(`the winner must have more points: ${scores}`);
  const m = t.rounds[info.round][info.index], s = t.setup;
  const winner = info.sides[winnerSide], loser = info.sides[1 - winnerSide];
  if (isHuman(s, loser) && !isHuman(s, winner)) {
    m.losses++;
    return 'replay';
  }
  const upperSide = info.sides[0] === info.players[0] ? 0 : 1;
  m.winner = winner;
  m.scores = [scores[upperSide], scores[1 - upperSide]];
  m.skipped = skipped;
  return 'decided';
}

/**
 * The world a match plays in (main.js builds the same one, with its own params when ?reach is tried).
 * @param {MatchInfo} info @param {ReturnType<typeof paramsFor>} [params]
 */
export function matchWorld(info, params = paramsFor(info.level, !info.cpu[0] && !info.cpu[1])) {
  return makeWorld({ target: info.length, seed: info.seed, params, cpu: info.cpu });
}

/**
 * Play a bots' match (or the rest of one) to the end at once, with the CPUs as they stand.
 * @param {import('./world.js').World} w @param {(import('./cpu.js').Cpu | null)[]} cpus  one for each slot
 * @returns {import('./match.js').Match}
 */
export function playOut(w, cpus) {
  const [c0, c1] = cpus;
  if (!c0 || !c1) throw new RangeError('only a match between two bots can be played out');
  for (let n = 0; w.phase !== 'over'; n++) {
    if (n >= MAX_FRAMES) throw new Error('a skipped match never ended');
    stepWorld(w, cpuActions(c0, w), cpuActions(c1, w));
  }
  return w.match;
}

/**
 * Skip the next match (two bots): play it instantly with the real sim and record it.
 * @param {Tournament} t @returns {MatchInfo} the match that was skipped
 */
export function skipMatch(t) {
  const info = nextMatch(t);
  if (!info || info.mustPlay) throw new RangeError('only a match between two bots can be skipped');
  const w = matchWorld(info);
  const m = playOut(w, [makeCpu(w, 0), makeCpu(w, 1)]);
  recordResult(t, /** @type {0 | 1} */ (m.winner), [m.scores[0], m.scores[1]], true);
  return info;
}

/**
 * SKIP BOT MATCHES (A12): skip every bots' match in bracket order up to the next match with a human in it (or the
 * end), each exactly as skipMatch does it (the real sim, its own seed), so the bracket is the same as skipping them
 * one by one.
 * @param {Tournament} t @returns {MatchInfo[]} the matches skipped, in order
 */
export function skipBotMatches(t) {
  /** @type {MatchInfo[]} */
  const done = [];
  for (let m = nextMatch(t); m && !m.mustPlay; m = nextMatch(t)) done.push(skipMatch(t));
  return done;
}

/**
 * A human's tournament so far: matches won, tries (matches played to the end, the lost ones replayed included), and
 * the round a human knocked them out in (null if not out).
 * @param {Tournament} t @param {number} h
 * @returns {{ wins: number, tries: number, out: string | null }}
 */
export function humanRecord(t, h) {
  let wins = 0, tries = 0, out = null;
  t.rounds.forEach((round, r) => round.forEach((m, i) => {
    const [a, b] = playersOf(t, r, i);
    if (a !== h && b !== h) return;
    tries += m.losses;
    if (m.winner === null) return;
    tries++;
    if (m.winner === h) wins++;
    else out = roundNameOf(t.setup.size, r);
  }));
  return { wins, tries, out };
}

/** What's wrong with a saved tournament ('' if nothing). @param {any} t @returns {string} */
export function tournamentProblem(t) {
  if (!t || typeof t !== 'object' || t.version !== TOURNAMENT_VERSION) return 'not a tournament of this version';
  const bad = setupProblem(t.setup);
  if (bad) return bad;
  const size = t.setup.size;
  if (!Array.isArray(t.order) || t.order.length !== size || [...t.order].sort((x, y) => x - y).some((e, i) => e !== i))
    return 'order';
  if (!Array.isArray(t.rounds) || t.rounds.length !== roundCount(size)) return 'rounds';
  for (const [r, round] of t.rounds.entries()) {
    if (!Array.isArray(round) || round.length !== size >> (r + 1)) return `round ${r}`;
    for (const [i, m] of round.entries()) {
      if (!m || typeof m !== 'object' || !isInt(m.losses) || m.losses < 0 || typeof m.skipped !== 'boolean')
        return `round ${r} match ${i}`;
      const [a, b] = playersOf(t, r, i);
      if (m.winner === null) {
        if (m.scores !== null) return `round ${r} match ${i}: scores without a winner`;
        continue;
      }
      if (a === null || b === null || (m.winner !== a && m.winner !== b)) return `round ${r} match ${i}: winner`;
      const sc = m.scores;
      if (!Array.isArray(sc) || sc.length !== 2 || !sc.every(n => isInt(n) && n >= 0) || sc[m.winner === a ? 0 : 1] <= sc[m.winner === a ? 1 : 0])
        return `round ${r} match ${i}: scores`;
    }
  }
  return '';
}

/** Save the tournament (false if the browser blocks storage). @param {Store | null} store @param {Tournament} t */
export function saveTournament(store, t) {
  if (!store) return false;
  try {
    store.setItem(TOURNAMENT_KEY, JSON.stringify(t));
    return true;
  } catch {
    return false;
  }
}

/** The saved tournament, or null (none, blocked, broken or another version). @param {Store | null} store @returns {Tournament | null} */
export function loadTournament(store) {
  try {
    const raw = store?.getItem(TOURNAMENT_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    return tournamentProblem(t) ? null : t;
  } catch {
    return null;
  }
}

/** Forget the saved tournament. @param {Store | null} store */
export function clearTournament(store) {
  try {
    if (store?.removeItem) store.removeItem(TOURNAMENT_KEY);
    else store?.setItem(TOURNAMENT_KEY, '');
  } catch {
    // blocked: nothing was saved
  }
}
