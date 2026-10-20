// @ts-check
// Difficulty levels 1–9: the game's pace (ball speed, gravity, shot power, bounce) and the CPU's skill.
// Pure sim code: no DOM.
//
// Built from the arcade's 20 difficulty rows (squash-game-logic.md §7), smoothed into one monotonic curve
// (docs/plan.md, open question 1), then re-anchored at CP-B: level 5's pace is the pace played there (arcade
// Normal/skill 0), level 9 is the arcade's hardest row (Hardest/skill 4), and levels 1–4 carry on below level 5 in the
// same even steps. Level 1 is below anything in the arcade (power 15, bounce +1 are extrapolated).
// 1P plays the chosen level's pace; 2P versus always plays level 5's (paramsFor).
// The final table is recorded in docs/decisions.md ("CPU difficulty"). Tunables for CP-C.

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
 */
export const LEVEL_TABLE = {
  speed:        [256, 262, 268, 274, 280, 286, 292, 298, 304],
  gravity:      [0x1dc0, 0x1e30, 0x1ea0, 0x1f10, 0x1f80, 0x1ff0, 0x2060, 0x20d0, 0x2140],
  powerMult:    [15, 16, 16, 17, 17, 18, 18, 19, 19],
  bounceOffset: [1, 0, 0, -1, -1, -2, -2, -3, -3],
  cpuReaction:  [24, 20, 16, 12, 8, 6, 4, 2, 1],
  cpuErrorStep: [24, 20, 16, 16, 12, 10, 6, 4, 2],
  cpuSense:     [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
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
 */

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
