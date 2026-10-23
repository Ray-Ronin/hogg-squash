// @ts-check
// Difficulty levels 1–9: the game's pace (ball speed, gravity, shot power, bounce) and the CPU's skill.
// Pure sim code: no DOM.
//
// Built from the arcade's 20 difficulty rows (squash-game-logic.md §7), smoothed into one monotonic curve
// (docs/plan.md, open question 1), then re-anchored at CP-B: level 5's pace is the pace played there (arcade
// Normal/skill 0), level 9 is the arcade's hardest row (Hardest/skill 4), and levels 1–4 carry on below level 5 in the
// same even steps. Level 1 is below anything in the arcade (power 15, bounce +1 are extrapolated).
// 1P plays the chosen level's pace; 2P versus always plays level 5's (paramsFor).
// The final table is recorded in docs/decisions.md ("CPU difficulty"). Tunables.
// CP-C found the levels felt alike and level 1 too strong, so S6b slowed the low levels' reaction and added the
// shot-quality columns (timing, aim jitter, SOFT scale, volleys): level 9 is the CPU as it was, level 1 a clumsy one.

/** Levels, 1 = easiest. */
export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** The default level, and the pace 2P versus plays at. */
export const DEFAULT_LEVEL = 5;

/**
 * One column per setting, one entry per level (index 0 = level 1).
 *  - speed:        game speed, /256 time scale (arcade 280–304)
 *  - gravity:      16.16 per frame²
 *  - powerMult:    shot depth power (latMult, the sideways one, equals it as each rally starts)
 *  - bounceOffset: restitution index offset; lower is a deader ball
 *  - cpuReaction:  frames the CPU waits before it moves to a ball
 *  - cpuErrorStep: size of the CPU's positioning error (game units)
 *  - cpuSense:     0…1, how much the CPU's HARD/SOFT choice reads where the opponent stands (chooseButton)
 *  - cpuTiming:    the CPU presses up to this many frames early or late (a fresh error each shot)
 *  - cpuAimJitter: it stands up to this far in front of or behind the contact, so timing angles its shots (0 = square)
 *  - cpuSoftScale: scales its plain SOFT chances (fewer drops at the low levels); the shot sense works on top
 *  - cpuVolley:    1 = it takes the earliest contact it can reach (volleys too); 0 = it lets the ball bounce and
 *                  takes it at a comfortable height when it can
 *  - cpuReach:     the CPU's hit zones (clean, stretch, dive) as a share of a human's: 5% smaller at level 1, 1% at
 *                  level 9 (player.js, shrinkReach)
 */
export const LEVEL_TABLE = {
  speed:        [256, 262, 268, 274, 280, 286, 292, 298, 304],
  gravity:      [0x1dc0, 0x1e30, 0x1ea0, 0x1f10, 0x1f80, 0x1ff0, 0x2060, 0x20d0, 0x2140],
  powerMult:    [15, 16, 16, 17, 17, 18, 18, 19, 19],
  bounceOffset: [1, 0, 0, -1, -1, -2, -2, -3, -3],
  cpuReaction:  [36, 31, 27, 23, 17, 14, 10, 6, 1],
  cpuErrorStep: [24, 20, 16, 16, 12, 10, 6, 4, 2],
  cpuSense:     [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
  cpuTiming:    [4, 4, 3, 3, 2, 2, 1, 1, 0],
  cpuAimJitter: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  cpuSoftScale: [0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.85, 0.9, 1],
  cpuVolley:    [0, 0, 0, 0, 0, 1, 1, 1, 1],
  cpuReach:     [0.95, 0.955, 0.96, 0.965, 0.97, 0.975, 0.98, 0.985, 0.99],
};

/**
 * Physics params (ball and shot) plus the CPU's, for one game.
 * @typedef {object} LevelParams
 * @property {number} level
 * @property {number} speed
 * @property {number} gravity
 * @property {number} bounceOffset
 * @property {number} powerMult
 * @property {number} latMult
 * @property {number} cpuReaction   frames
 * @property {number} cpuErrorStep  game units
 * @property {number} cpuSense      0…1
 * @property {number} cpuTiming     frames, ±
 * @property {number} cpuAimJitter  game units, ±
 * @property {number} cpuSoftScale  0…1
 * @property {number} cpuVolley     0 or 1
 * @property {number} cpuReach      0…1
 * @property {number | import('./player.js').Reach} [humanReach]  a human's hit zones as a share of the arcade's, one
 *   for every direction or one each (S12c: HUMAN_REACH; missing = 1); a CPU's are cpuReach of that
 */

/**
 * A human's hit zones as shares of the arcade's, by direction (S12b: 90% everywhere, the owner's pick after playing
 * 100/90/80/70%; S12c, after CP-F and the owner's play: less behind, a shorter forehand, a wider backhand with the
 * forehand's stretch and dive widths, an oval instead of a rectangle, and the dive 0.1 m wider each side; S12d, after
 * the CP-F replay: the oval squared off to power 3, the owner's pick of 2/3/4/6 in play): every level and 2P. A CPU's
 * are its cpuReach of these. ?reach= overrides them for trying sizes.
 * @type {import('./player.js').Reach}
 */
export const HUMAN_REACH = { front: 0.9, behind: 0.7, fore: 0.75, back: 1.05, even: true, oval: 3, dive: 0.1 };

/**
 * A level number from anything (a URL value, say): a whole number 1–9, else the default.
 * @param {unknown} v
 * @returns {number}
 */
export function toLevel(v) {
  const n = Number(v);
  return LEVELS.includes(n) ? n : DEFAULT_LEVEL;
}

/**
 * The params for one level.
 * @param {number} level  1–9
 * @returns {LevelParams}
 */
export function levelParams(level) {
  const t = LEVEL_TABLE, i = toLevel(level) - 1;
  return {
    level: i + 1, speed: t.speed[i], gravity: t.gravity[i], bounceOffset: t.bounceOffset[i],
    powerMult: t.powerMult[i], latMult: t.powerMult[i],
    cpuReaction: t.cpuReaction[i], cpuErrorStep: t.cpuErrorStep[i], cpuSense: t.cpuSense[i],
    cpuTiming: t.cpuTiming[i], cpuAimJitter: t.cpuAimJitter[i], cpuSoftScale: t.cpuSoftScale[i], cpuVolley: t.cpuVolley[i],
    cpuReach: t.cpuReach[i], humanReach: HUMAN_REACH,
  };
}

/**
 * The params a match plays with: 1P uses the chosen level for both the pace and the CPU; 2P versus always plays at
 * level 5's pace, whatever level is chosen (it has no CPU, so the CPU columns don't matter).
 * @param {number} level
 * @param {boolean} twoPlayer
 * @returns {LevelParams}
 */
export function paramsFor(level, twoPlayer) {
  return levelParams(twoPlayer ? DEFAULT_LEVEL : level);
}
