// @ts-check
// A player: movement and the swing state machine, with the arcade's contact classifier and shot tables.
// Pure sim code: no DOM, canvas or input devices, so Node tests can import it.
//
// Swing:  press ─(wind-up, CONTACT frames)→ contact ─(recovery)→ ready
//  - The press classifies the contact 7 frames ahead (the arcade's look-ahead), so the racket meets the ball exactly
//    CONTACT frames after the press. A press with the ball out of reach (or when it isn't your ball) still swings,
//    and misses.
//  - A contact in the classifier's "special" band (flag 0x10, contact types 10–11: the ball just beyond a stretch)
//    is a dive: the player lunges, plays the dive shot, and lies on the floor until the dive's recovery ends.
//  - Presses during a swing or dive are ignored. Movement uses MOVE_SPEED while swinging.
// Timings were measured in the MAME recordings (test/fixtures): every human swing kept the player planted for its
// whole animation (contact 7 frames after the press, moving again about 18 frames after it), and every dive was a
// special contact that left the player down for 143–153 frames (shortened to 115 at CP-B). The art in A3 matches these constants.
// SOFT from the front court is a short drop (CP-C): shotFor caps its power and lift (DROP). This departs from the
// arcade's tables on purpose; SHOT_TABLES and the physics file stay as they are.
import { FP, PLAYER, movePlayer, classifyContact, SHOT_TABLES, shotEntry, applyShot, aimFromTiming } from '../squash-physics.js';

export const SWING = {
  CONTACT: 7,          // frames from the press to the racket meeting the ball (the classifier's look-ahead)
  RECOVERY: 11,        // frames from contact (included) until ready: ready on frame 18 after the press (≈ 0.31 s)
  MOVE_SPEED: 0,       // run speed while swinging: planted, as in the arcade (0xC000 would allow a slow shuffle)
};

export const DIVE = {
  CONTACT: 7,          // same look-ahead as a swing
  RECOVERY: 108,       // frames from contact (included) until back up: 115 frames in all (≈ 2.0 s; the arcade is 2.5 s, CP-B)
  MOVE_SPEED: 0,       // locked in place
};

/**
 * A SOFT struck in the FRONT zone is a short drop (CP-C). Some of the arcade's front-court SOFT rows are hit at twice
 * the drop's power, so the ball ran on to its second bounce near the back wall. shotFor caps their depth power and
 * lift (SHOT_TABLES itself is untouched: the golden tests replay it). Lift ÷ power sets the launch angle: 1280 ÷ 32 is
 * about the arcade's row #0 (3072 ÷ 80), at 40% of its power. Measured in S6b: the second bounce lands in front of the
 * short line (nearly all off a fast ball), but more drops fall short of the front wall (docs/decisions.md, "Hitting").
 * Tunables.
 */
export const DROP = {
  POWER_MAX: 32,       // depth power (the arcade's front-court SOFT rows are 80–160)
  LIFT_MAX: 1280,      // lift (the rows are 3072–6144)
};

/**
 * Contact types 8–9 (overheads: the ball above y 48) keep the arcade's entry. They are hit downward (negative lift),
 * and at a drop's power the ball falls into the tin before it reaches the wall (measured in S6b: 40–56% of them, none
 * with the arcade's entry). The animator plays the `overhead` tag for them (S8b).
 */
export const OVERHEAD = [8, 9];

/** Classifier flag for the dive band ("special": volley/lunge, contact types 10–11). */
export const DIVE_FLAG = 0x10;

/** Where a player's feet may go, in game units: about a body's half-width from the side walls, and up to the glass. */
export const PLAYER_LIMITS = { xMin: -134, xMax: 134, zMin: 12, zMax: 179 };

/**
 * Per-player actions for one sim step. hard/soft are true only on the step the button was pressed.
 * @typedef {{ up: boolean, down: boolean, left: boolean, right: boolean, hard: boolean, soft: boolean }} Actions
 */

/** @typedef {import('../squash-physics.js').Contact} Contact */

/**
 * @typedef {object} Swing
 * @property {'swing' | 'dive'} kind
 * @property {number} t                  frames since the press (0 on the press step)
 * @property {'hard' | 'soft'} button
 * @property {'fore' | 'back'} hand      which side of the body the ball is on (classifier flag 4 = backhand)
 * @property {Contact | null} contact    null when the swing can't make contact (out of reach, or not your ball)
 * @property {boolean} hit               contact has been made
 * @property {boolean} [cramped]         the ball is met too close to the body (CRAMP): a weaker, wilder shot
 */

/**
 * x, z are 16.16 fixed point; flags1b holds the player's high flag bits (0x40 = CPU), as in the arcade.
 * @typedef {{ x: number, z: number, flags1b: number, swing: Swing | null }} Player
 */

/**
 * @typedef {object} SwingEvent
 * @property {'swing' | 'hit'} type
 * @property {'swing' | 'dive'} kind
 * @property {'hard' | 'soft'} button
 * @property {number} flags
 * @property {string} zone
 * @property {number} index
 * @property {boolean} reach           false = a miss (out of reach, or not this player's turn)
 * @property {number} [aim]             set on 'hit'
 * @property {boolean} [cramped]         set on 'swing' and 'hit': the ball is too close to the body (CRAMP)
 * @property {{ x: number, y: number, z: number, vx: number, vy: number, vz: number }} [ball]  set on 'hit': the ball
 *   at contact, with its new velocity (16.16)
 */

/** @typedef {'ready' | 'windup' | 'recovery' | 'dive'} SwingPhase */

/**
 * @param {number} x  game units
 * @param {number} z  game units
 * @returns {Player}
 */
export function makePlayer(x, z) {
  return { x: x * FP, z: z * FP, flags1b: 0, swing: null };
}

/**
 * The shot-table entry a contact plays: the arcade's, except that a SOFT in the FRONT zone is capped to a short drop
 * (DROP), overheads apart.
 * @param {'FRONT' | 'MID' | 'BACK'} zone
 * @param {'hard' | 'soft'} button
 * @param {number} index  contact type 0..11
 * @returns {import('../squash-physics.js').ShotEntry}
 */
export function shotFor(zone, button, index) {
  const e = shotEntry(SHOT_TABLES[zone][button][index]);
  if (zone !== 'FRONT' || button !== 'soft' || OVERHEAD.includes(index)) return e;
  return { lift: Math.min(e.lift, DROP.LIFT_MAX), side: e.side, power: Math.min(e.power, DROP.POWER_MAX) };
}

/**
 * A reach by direction (S12c): shares of the arcade's hit zones in front of the feet (towards the front wall), behind
 * them, on the forehand side and on the backhand side (everyone is right-handed, as in the arcade: the classifier's
 * backhand is the ball left of x + 20, for P1 and P2 alike). With `even` (the owner's call after the S12c map), the
 * backhand's stretch and dive bands are as wide as the forehand's (the arcade's are both 24 and 20 units wide, scaled by
 * the forehand share), its outer edge stays at the backhand share, and the rest inside is a clean hit. With `oval` (the
 * owner's call too: "I don't want to be able to hit the shots at the extreme corners"), the reach is an oval through the
 * same four outer edges instead of a rectangle: a ball outside it is out of reach; inside, the bands are as before.
 * A number for `oval` (S12d, the owner's CP-F replay: "more like a rectangle with curved corners") squares it off: the
 * reach is |across ÷ edge|ⁿ + |depth ÷ edge|ⁿ ≤ 1, where n = 2 (or `true`) is S12c's oval and a bigger n cuts less off
 * each corner; the four edges stay where they are.
 * `dive` (metres, the owner's call after the oval) widens the dive band outwards on both sides by that much, so the
 * reach across grows by it too.
 * @typedef {{ front: number, behind: number, fore: number, back: number, even?: boolean, oval?: boolean | number, dive?: number }} Reach
 */

/**
 * The arcade classifier's band edges across, in whole units from the feet (forehand to the right, backhand to the
 * left): clean below the first, then stretch, dive, and out of reach beyond the last.
 */
const EDGES = { fore: [52, 76, 96], back: [20, 44, 64] };
/** …and in depth: out of reach this many units in front or behind. */
const DEPTH_OUT = 40;
/** Game units per metre across (court-rules.js). */
const ACROSS_PER_M = 45;

/**
 * The band edges across on one side for a reach (see Reach), in whole units from the feet.
 * @param {Reach} r @param {boolean} back  the backhand side
 * @returns {number[]}
 */
function bandEdges(r, back) {
  const e = back ? EDGES.back : EDGES.fore, s = back ? r.back : r.fore, f = EDGES.fore;
  const out = e[2] * s + (r.dive ?? 0) * ACROSS_PER_M;
  if (!back || !r.even) return [e[0] * s, e[1] * s, out];
  const dive = e[2] * s - (f[2] - f[1]) * r.fore;      // the forehand's dive width (plus the same `dive` outwards)
  return [dive - (f[1] - f[0]) * r.fore, dive, out];   // …and its stretch width; clean inside
}

/**
 * Where a ball `a` units from the feet lands on the arcade's bands for one side: the wanted edges are mapped
 * piecewise onto the arcade's ones.
 * @param {number} a @param {number[]} want @param {number[]} arcade
 */
function toArcadeBands(a, want, arcade) {
  if (a < want[0]) return a * arcade[0] / want[0];
  for (let i = 1; i < 3; i++) {
    if (a < want[i]) return arcade[i - 1] + (a - want[i - 1]) * (arcade[i] - arcade[i - 1]) / (want[i] - want[i - 1]);
  }
  return arcade[2] + (a - want[2]);
}

/**
 * Outside the oval reach (see Reach): the real ball's distance from the feet against the oval (or the squarer shape of
 * power `oval`) through the outer edges of the quarter it's in.
 * @param {{ x: number, z: number }} g  the ball 7 frames ahead
 * @param {Player} pl @param {Reach} r @param {boolean} back  on the backhand side
 */
function outsideOval(g, pl, r, back) {
  const ax = (g.x - pl.x) / FP, dz = (g.z - pl.z) / FP;
  const across = bandEdges(r, back)[2], depth = DEPTH_OUT * (dz > 0 ? r.behind : r.front);
  const n = r.oval === true ? 2 : Number(r.oval);
  return Math.abs(ax / across) ** n + Math.abs(dz / depth) ** n > 1;
}

/**
 * A reach from one share for every direction (S12b's form), a Reach, or nothing (the arcade's: 1).
 * @param {number | Reach | undefined} r
 * @returns {Reach}
 */
export function toReach(r) {
  if (r === undefined) return { front: 1, behind: 1, fore: 1, back: 1 };
  if (typeof r === 'number') return { front: r, behind: r, fore: r, back: r };
  return r;
}

/**
 * A different reach: a human's (params.humanReach, S12b; by direction since S12c), and a CPU's as params.cpuReach of
 * that. The contact is classified as if the ball 7 frames ahead were further from its feet by 1 ÷ share, across by the
 * forehand or backhand share and in depth by the front or behind one, so every band of the arcade's classifier (clean,
 * stretch, dive, out of reach) shrinks around it by that share (or grows, for a share above 1). The arcade's classifier
 * does the work: it is run again on a still ball at the scaled spot (game speed 0, so the 7 look-ahead frames don't
 * move it). The scaled ball is kept on its real side, so the forehand/backhand split never moves. The shot table zone
 * stays the real one.
 * @param {Contact} c  the contact as classified for the real ball
 * @param {Player} pl
 * @param {any} p
 * @param {{ isP1: boolean, turnIsP1: boolean }} opts
 * @param {Reach} reach
 * @returns {Contact}
 */
function shrinkReach(c, pl, p, opts, reach) {
  const g = c.ghost;
  const split = ((pl.x >> 16) + 0x14) * FP;            // the classifier's backhand: the ball's x (whole units) below this
  const back = g.x < split;
  const side = back ? -1 : 1, a = side * (g.x - pl.x) / FP;
  const sx = pl.x + side * toArcadeBands(a, bandEdges(reach, back), back ? EDGES.back : EDGES.fore) * FP;
  const x = Math.round(back ? Math.min(sx, split - 1) : Math.max(sx, split));
  const z = Math.round(pl.z + (g.z - pl.z) / (g.z > pl.z ? reach.behind : reach.front));
  const s = classifyContact({ ...g, x, z, vx: 0, vy: 0, vz: 0 }, pl, { ...p, speed: 0 }, opts);
  const flags = reach.oval && outsideOval(g, pl, reach, back) ? s.flags | 0x20 : s.flags;
  return { ...s, flags, zone: c.zone, ghost: g };
}

/**
 * The highest ball a player can reach (S12b, the owner's call): 84 game units = 2.4 m, a 1.75 m player's arm and racket
 * stretched up. The arcade's classifier has no top limit (anything above y 48 is an overhead), so a ball above this is
 * a miss here. The CPU never plans contacts this high (CPU.CONTACT_Y_MAX, 1.6 m), so only humans notice.
 */
export const REACH_TOP = 84;

/**
 * A cramped shot (S12b, the owner's call; in squash a ball met too close to the body is "jammed": no room for a full
 * swing). When the ball at contact passes within WIDTH units across of the player's feet (9 = 0.2 m: through the body;
 * first 0.3 m, made a little smaller after play), the shot still goes but with POWER of its pace and its aim (0–7, set by timing) moved by up to ±WOBBLE
 * steps. A ball at ABOVE units (53 = 1.5 m) or higher is never cramped: the player reaches up and plays it normally.
 * Humans and the CPU alike; the CPU stands SIDE_OFFSET (0.7 m) to the side, so it is cramped only when its
 * positioning is off.
 */
export const CRAMP = { WIDTH: 9, ABOVE: 53, POWER: 0.8, WOBBLE: 2 };

/**
 * The cramped aim: the timing's aim moved by −WOBBLE…+WOBBLE steps, picked from the frame (deterministic), kept 0–7.
 * @param {number} aim @param {number} frame
 */
export function crampedAim(aim, frame) {
  const n = 2 * CRAMP.WOBBLE + 1, k = (Math.imul(frame + 1, 0x9e3779b1) >>> 0) % n - CRAMP.WOBBLE;
  return Math.max(0, Math.min(7, aim + k));
}

/** @param {'swing' | 'dive'} kind */
const timing = kind => (kind === 'dive' ? DIVE : SWING);

/**
 * Frames a swing or dive lasts, from the press to ready.
 * @param {'swing' | 'dive'} kind
 */
export function swingLength(kind) {
  const T = timing(kind);
  return T.CONTACT + T.RECOVERY;
}

/**
 * What the player is doing, for drawing (and the art later).
 * @param {Player} pl
 * @returns {SwingPhase}
 */
export function swingPhase(pl) {
  const s = pl.swing;
  if (!s) return 'ready';
  if (s.kind === 'dive') return 'dive';
  return s.t < SWING.CONTACT ? 'windup' : 'recovery';
}

/**
 * One sim step for a player. Call it before the ball's physics step.
 * @param {Player} pl
 * @param {Actions} act
 * @param {ReturnType<typeof import('../squash-physics.js').makeBall>} ball
 * @param {any} p       physics params: difficultyParams(...) plus latMult
 * @param {number} frame  sim frame counter (the shot's random number)
 * @param {{ isP1: boolean, turnIsP1: boolean, mayStrike: boolean }} [turn]  whose turn it is (the classifier's
 *   special flag needs it). A press while mayStrike is false is a miss, like a press with the ball out of reach.
 * @returns {SwingEvent | null}
 */
export function stepPlayer(pl, act, ball, p, frame, turn = { isP1: true, turnIsP1: true, mayStrike: true }) {
  /** @type {SwingEvent | null} */
  let event = null;
  const s = pl.swing;
  if (s) {
    s.t++;
    const T = timing(s.kind);
    if (s.t === T.CONTACT && s.contact) {
      const c = s.contact;
      const timed = aimFromTiming(ball.z, pl.z);
      const aim = s.cramped ? crampedAim(timed, frame) : timed;
      const e = shotFor(c.zone, s.button, c.index);
      // power sets the depth pace; the height speed is lift ÷ power, so lift is cut by the same share to keep it
      const entry = s.cramped ? { ...e, lift: Math.round(e.lift * CRAMP.POWER), power: Math.round(e.power * CRAMP.POWER) } : e;
      applyShot(ball, entry, aim, { z: pl.z, flags1b: c.flags, isCpu: !!(pl.flags1b & 0x40) }, frame, p);
      s.hit = true;
      event = { type: 'hit', kind: s.kind, button: s.button, flags: c.flags, zone: c.zone, index: c.index, reach: true,
                aim, cramped: !!s.cramped, ball: { x: ball.x, y: ball.y, z: ball.z, vx: ball.vx, vy: ball.vy, vz: ball.vz } };
    }
  } else if (act.hard || act.soft) {
    const button = act.hard ? 'hard' : 'soft';
    const opts = { isP1: turn.isP1, turnIsP1: turn.turnIsP1 };
    const c0 = classifyContact(ball, pl, p, opts);
    // a human's reach (S12b, by direction since S12c), and a CPU's as its share of that
    const r = toReach(p.humanReach), k = pl.flags1b & 0x40 ? p.cpuReach : 1;
    const share = { front: r.front * k, behind: r.behind * k, fore: r.fore * k, back: r.back * k, even: r.even, oval: r.oval,
                    dive: (r.dive ?? 0) * k };
    const c = share.even || share.oval || share.dive || [share.front, share.behind, share.fore, share.back].some(v => v !== 1)
      ? shrinkReach(c0, pl, p, opts, share) : c0;
    const tooHigh = (c.ghost.y >> 16) > REACH_TOP;
    const reach = turn.mayStrike && !(c.flags & 0x20) && !tooHigh;
    const kind = reach && (c.flags & DIVE_FLAG) ? 'dive' : 'swing';
    const cramped = reach && Math.abs((c0.ghost.x >> 16) - (pl.x >> 16)) <= CRAMP.WIDTH && (c0.ghost.y >> 16) < CRAMP.ABOVE;
    pl.swing = { kind, t: 0, button, hand: c.flags & 4 ? 'back' : 'fore', contact: reach ? c : null, hit: false, cramped };
    event = { type: 'swing', kind, button, flags: c.flags, zone: c.zone, index: c.index, reach, cramped };
  }

  const sw = pl.swing;
  movePlayer(pl, act, sw ? timing(sw.kind).MOVE_SPEED : PLAYER.RUN_SPEED);
  const L = PLAYER_LIMITS;
  pl.x = Math.max(L.xMin * FP, Math.min(L.xMax * FP, pl.x));
  pl.z = Math.max(L.zMin * FP, Math.min(L.zMax * FP, pl.z));
  if (sw && sw.t >= swingLength(sw.kind) - 1) pl.swing = null;   // that was the last locked frame
  return event;
}
