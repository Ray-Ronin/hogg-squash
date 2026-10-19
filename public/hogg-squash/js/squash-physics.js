// @ts-check
// Hogg Squash — ball physics ported from Gaelco's Squash (1992), 68000 routines 0x80C6 (integrate),
// 0x81C2 (collide) and 0x82D2 (restitution). Integer 16.16 fixed point, so every browser computes
// identical results (deterministic: the tests, replays and the CPU's ball prediction rely on it).
// Verified frame by frame against the arcade (npm test). Don't simplify the maths or convert it to floats.
//
// Units: x -144..144 (side walls), y = height (0 floor, back glass 75 high), z = depth (0 front wall .. 183 back wall).
// A position/velocity value v means v/65536 game units (per frame for velocities).

/**
 * The ball. x, y, z and vx, vy, vz are 16.16 fixed point (velocities in units per frame).
 * @typedef {object} Ball
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} vx
 * @property {number} vy
 * @property {number} vz
 * @property {number} bounces  floor bounces counted by collide()
 * @property {boolean} out     set by integrate() once the ball passes z = 293 (it has left the court)
 */

/** @typedef {'sideWall' | 'frontWall' | 'floor' | 'backGlass'} BallEvent  what collide() reports */

/**
 * Physics params for the ball: gameSpeed (/256 time scale), gravity (16.16 per frame²) and the restitution offset.
 * @typedef {{ speed: number, gravity: number, bounceOffset: number }} BallParams
 */

/**
 * Shot params: depth power multiplier and sideways multiplier. In the recordings latMult equals powerMult when each
 * rally starts (17 at Normal, 16 at Easy) and creeps up during play, so the game passes latMult = powerMult.
 * @typedef {{ powerMult: number, latMult: number }} ShotParams
 */

/**
 * One row of the difficulty table (see DIFFICULTY).
 * @typedef {object} DifficultyParams
 * @property {number} speed
 * @property {number} gravity
 * @property {number} bounceOffset
 * @property {number} powerMult
 * @property {number} cpuReaction   frames
 * @property {number} cpuErrorStep
 */

/** @typedef {{ lift: number, side: number, power: number }} ShotEntry  lift int16, side uint8, power uint8 */

export const FP = 65536;
export const COURT = { SIDE: 0x90, BACK: 0xb7, GLASS_H: 0x4b, OUT_Z: 0x125 };

// restitution numerator (/256) by impact-speed index 0..31 (ROM 0x819C)
export const RESTITUTION = [173,169,164,159,155,150,146,142,138,134,130,126,123,119,116,113,
                            110,107,104,101,99,96,94,92,90,88,86,84,83,81,80,79];

// Per-difficulty constants (ROM tables 0x1F9E, 0x1FB2, 0x1FC6, 0x1FDA, 0x1FEE, 0x2016 [encrypted]).
// index = dipDifficulty*5 + skillLevel   (dip: 0 Normal, 1 Easy, 2 Hard, 3 Hardest; skill 0..4)
export const DIFFICULTY = {
  bounceOffset: [-1,-2,-2,-3,-3, 0,-1,-2,-2,-2, -2,-2,-3,-3,-3, -2,-2,-3,-3,-3],
  powerMult:    [17,18,18,19,19, 16,17,18,18,19, 18,18,19,19,19, 18,19,19,19,19],
  cpuReaction:  [16,8,7,6,4, 20,12,8,5,4, 16,8,5,3,2, 10,6,4,2,1],
  cpuErrorStep: [16,12,10,8,4, 20,16,10,7,5, 16,12,8,6,3, 12,10,6,4,2],
  speed:        [280,284,288,288,292, 280,284,288,292,292, 280,284,288,292,296, 288,288,292,296,304],
  gravity:      [0x1f80,0x1fb8,0x1ff0,0x2028,0x2060, 0x1f80,0x1fb8,0x1ff0,0x2028,0x2060,
                 0x1f80,0x1fb8,0x1ff0,0x2060,0x2100, 0x1f80,0x1ff0,0x2140,0x2060,0x2140],
};

/**
 * The difficulty row for one arcade index. latMult isn't in the table: pass it in alongside (see ShotParams).
 * @param {number} index  dipDifficulty*5 + skillLevel, 0..19
 * @returns {DifficultyParams}
 */
export function difficultyParams(index) {
  const d = DIFFICULTY;
  return { speed: d.speed[index], gravity: d.gravity[index], bounceOffset: d.bounceOffset[index],
           powerMult: d.powerMult[index], cpuReaction: d.cpuReaction[index], cpuErrorStep: d.cpuErrorStep[index] };
}

/** @type {(v: number) => number} */
const s16 = v => ((v & 0xffff) << 16) >> 16;          // low word as signed 16-bit (68000 muls.w operand)
/** @type {(v: number) => number} */
const s32 = v => v | 0;                                // wrap to signed 32-bit
/** @type {(v: number) => number} */
const hi  = v => v >> 16;                              // integer part (signed) of a 16.16 value
/** @type {(v: number) => number} */
const asr8 = v => Math.floor(v / 256);                 // arithmetic shift right 8 (v is int32)
/** @type {(a: number, b: number) => number} */
const mulsw = (a, b) => Math.imul(s16(a), s16(b));     // 68000 MULS.W

/**
 * A ball at rest at the origin, with any fields overridden.
 * @param {Partial<Ball>} [o]
 * @returns {Ball}
 */
export function makeBall(o = {}) {
  return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, bounces: 0, out: false, ...o };
}

// restitution for an impact of speed v (16.16); offset = bounceOffset
/**
 * @param {number} v       impact speed, 16.16
 * @param {number} offset  bounceOffset
 * @returns {number}       restitution numerator (/256)
 */
export function restitution(v, offset) {
  let a = Math.abs(v);
  let idx = s16(((a << 1) >>> 16) & 0xffff) - offset;
  if (idx < 0) idx = 0; else if (idx > 31) idx = 31;
  return RESTITUTION[idx];
}

// one frame of motion (0x80C6). p = { speed, gravity }
/**
 * @param {Ball} b
 * @param {{ speed: number, gravity: number }} p
 */
export function integrate(b, p) {
  let d0 = b.vx;
  if (d0 <= 0x4000 && d0 >= -0x4000) b.vx = 0;
  b.x = s32(b.x + mulsw(asr8(d0), p.speed));
  d0 = b.vz;
  if (d0 <= 0x4000 && d0 >= -0x4000) b.vz = 0;
  b.z = s32(b.z + mulsw(asr8(d0), p.speed));
  if (hi(b.z) >= COURT.OUT_Z) b.out = true;
  b.y = s32(b.y + mulsw(asr8(b.vy), p.speed));
  if (b.y > 0) {
    b.vy = s32(b.vy - p.gravity);
  } else {                                   // on the floor: rolling friction 0x1000 per frame
    b.vx = b.vx >= 0 ? Math.max(0, b.vx - 0x1000) : Math.min(0, b.vx + 0x1000);
    b.vz = b.vz >= 0 ? Math.max(0, b.vz - 0x1000) : Math.min(0, b.vz + 0x1000);
  }
}

// one collision check (0x81C2). Returns event name or null. p = { bounceOffset }
/**
 * @param {Ball} b
 * @param {{ bounceOffset: number }} p
 * @returns {BallEvent | null}
 */
export function collide(b, p) {
  let ev = null, c, cz;
  if (hi(b.x) <= -COURT.SIDE && b.vx < 0) { b.vx = -b.vx; c = cz = restitution(b.vx, p.bounceOffset); ev = 'sideWall'; }
  else if (hi(b.x) >= COURT.SIDE && b.vx > 0) { b.vx = -b.vx; c = cz = restitution(b.vx, p.bounceOffset); ev = 'sideWall'; }
  else if (b.z <= 0 && b.vz < 0) { b.vz = -b.vz; c = cz = restitution((b.vz * 2) | 0, p.bounceOffset); ev = 'frontWall'; }
  else if (b.y <= 0 && b.vy < 0) {
    let d = -b.vy; if (d <= 0x4000) d = 0; b.vy = d;
    c = restitution(d, p.bounceOffset); cz = c + (c >> 1);
    b.bounces++; ev = 'floor';
  }
  else if (hi(b.z) >= COURT.BACK && hi(b.y) <= COURT.GLASS_H && b.vz > 0) {
    b.vz = -b.vz; c = cz = restitution(b.vz, p.bounceOffset); ev = 'backGlass';
  }
  if (ev) {
    b.vz = mulsw(asr8(b.vz), cz);
    b.vx = mulsw(asr8(b.vx), c);
    b.vy = mulsw(asr8(b.vy), c);
  }
  return ev;
}

// The game checks collisions first, then moves the ball (verified frame-by-frame against MAME).
/**
 * One sim frame for the ball. Returns the collision event, if any (it happened at the position before the move).
 * @param {Ball} b
 * @param {BallParams} p
 * @returns {BallEvent | null}
 */
export function step(b, p) { const ev = collide(b, p); integrate(b, p); return ev; }

// Predict the ball forward (what the game's "ghost ball" does for the landing arrow / CPU).
/**
 * Steps a copy of the ball until its second bounce, until it leaves the court, or for maxFrames.
 * @param {Ball} ball
 * @param {BallParams} p
 * @param {number} [maxFrames]
 * @returns {{ i: number, x: number, y: number, z: number, ev: BallEvent | null }[]}  i = frames ahead
 */
export function predict(ball, p, maxFrames = 200) {
  const g = { ...ball }, path = [];
  for (let i = 1; i <= maxFrames; i++) {
    const ev = step(g, p);
    path.push({ i, x: g.x, y: g.y, z: g.z, ev });
    if (g.bounces >= 2 || g.out) break;
  }
  return path;
}

// ---------------------------------------------------------------------------------------------
// Racket hit (ROM 0x6EF2 → 0x6FAE..0x7142). Computes the ball's new velocity.
//   shot      : 32-bit shot entry {lift:int16, side:uint8, power:uint8} (from the zone/contact tables)
//   aim       : 0..7 (player +0x20 low bits; in the arcade it follows timing, not the joystick: see aimFromTiming)
//   hitter    : { z: player depth (16.16), flags1b, isCpu }
//   rng       : frame counter value (screen RAM 0x102414)
//   p         : { powerMult, latMult }
/**
 * Unpack a 32-bit shot-table entry.
 * @param {number} long
 * @returns {ShotEntry}
 */
export function shotEntry(long) { return { lift: (long >> 16) << 16 >> 16, side: (long >> 8) & 0xff, power: long & 0xff }; }

/**
 * Set the ball's velocity for a racket hit (mutates and returns the ball).
 * @param {Ball} ball
 * @param {ShotEntry} shot
 * @param {number} aim  0..7
 * @param {{ z: number, flags1b: number, isCpu?: boolean }} hitter  z 16.16; flags1b = the contact flags
 * @param {number} rng  frame counter
 * @param {ShotParams} p
 * @param {number} [ballFlags1b]  the ball's +0x1B flags (bit 0 reverses the depth direction)
 * @returns {Ball}
 */
export function applyShot(ball, shot, aim, hitter, rng, p, ballFlags1b = 0) {
  const pz = hi(hitter.z);
  const midCourt = pz > 0x48 && pz <= 0x88;
  if (midCourt && hi(ball.x) <= 0x40 && hi(ball.x) >= -0x40) {     // centre of court: limit aim choices
    if (aim <= 3) aim = aim === 3 ? 2 : 0; else aim = aim === 4 ? 5 : 7;
  }
  // sideways
  let d2 = shot.side;
  d2 = (d2 - (((d2 * aim) & 0xffff) >>> 2)) & 0xffff; d2 = s16(d2);
  if (!(hitter.flags1b & 0x80) && (hitter.flags1b & 0x04)) d2 = -d2;
  // depth
  let d5 = (shot.power << 8) * p.powerMult;                       // MULU.W (shot.power<<8 fits 16 bits)
  if (!(ballFlags1b & 1)) d5 = -d5;                               // toward the front wall
  // vertical: DIVS.W lift/power, then swap+asr 4 (keeps the remainder in the low bits)
  const q = Math.trunc(shot.lift / shot.power), r = shot.lift - q * shot.power;
  ball.vy = s32((((q & 0xffff) << 16) | (r & 0xffff)) >> 4);
  d2 = Math.imul(d2, s16(p.latMult)) << 8;
  let vx = (ball.vx >> 1);
  if (hitter.isCpu) {                                             // CPU never aims into a near side wall
    if (hi(ball.x) > 0x7c && d2 > 0) d2 = 0;
    if (hi(ball.x) < -0x7c && d2 < 0) d2 = 0;
  }
  ball.vx = s32(vx + d2);
  let d0 = s32(-(ball.vz >> 2) + d5);
  const rnd = ((rng & 0xffff) >>> 1) & 7;                         // 0..7 from the frame counter
  const d2b = Math.imul(s16(asr8(d0)), rnd) << 4;
  ball.vz = s32(d0 - (d0 >> 2) + d2b);                            // ×0.75 … ×1.19
  return ball;
}


// ---------------------------------------------------------------------------------------------
// Shot selection (ROM 0x726A classify, 0x74F6 index, tables 0x77EC/0x778C/0x784C — decrypted).
// Each entry: lift(int16) << 16 | side(uint8) << 8 | power(uint8). index = contact type 0..11.
export const SHOT_TABLES = {
  FRONT: { hard: [0x38006870, 0x40008070, 0x38006070, 0x48007870, 0x38006060, 0x40008070, 0x30006070, 0x38007080, 0x40004090, 0x40004090, 0x18005070, 0x15005070],
          soft: [0x0c00a050, 0x1000c0a0, 0x1000b060, 0x1000a0a0, 0x10009060, 0x1000c0a0, 0x10009060, 0x100090a0, 0xfe00a080, 0xfe00a070, 0x18005070, 0x15005070] },
  MID: { hard: [0x25008870, 0x2800a080, 0x28008078, 0x30006088, 0x28007868, 0x2800a080, 0x20006068, 0x20006080, 0xfe80d0c0, 0xfe80d0b0, 0x18005070, 0x15005070],
          soft: [0x10009060, 0x1000a080, 0x10009060, 0x1000a080, 0x10009060, 0x1000a080, 0x10009070, 0x10008780, 0x05009080, 0x05009080, 0x18005070, 0x15005070] },
  BACK: { hard: [0x26007070, 0x26009090, 0x26006078, 0x26006090, 0x26006870, 0x26009090, 0x26006078, 0x26006090, 0x200050c0, 0x200050b0, 0x18005070, 0x15005070],
          soft: [0x18006060, 0x18008060, 0x18005060, 0x18005060, 0x18005060, 0x18005050, 0x18005060, 0x18005060, 0x10005070, 0x10005070, 0x18005070, 0x18005070] },
};

// Classify a contact the way the game does at swing time: simulate a ghost ball 7 frames ahead
// (integrate THEN collide in this routine), then set flags:
//  1 = ball high (>24)  2 = stretching  4 = ball on the other side  8 = overhead (>48)
//  0x10 = special (volley/approach shot, only in some cases)  0x20 = out of reach (no shot)
/**
 * @typedef {object} Contact
 * @property {number} flags   the flag bits above, plus the player's 0xC0 bits
 * @property {'FRONT' | 'MID' | 'BACK'} zone  shot table, from the ghost ball's depth
 * @property {number} index   contact type 0..11 (row in the shot table)
 * @property {Ball} ghost     the ball 7 frames ahead
 */
/**
 * @param {Ball} ball
 * @param {{ x: number, z: number, flags1b?: number }} player  x, z 16.16
 * @param {BallParams} p
 * @param {{ ballFlags1b?: number, isP1?: boolean, turnIsP1?: boolean }} [opts]  turn info enables the special flag
 * @returns {Contact}
 */
export function classifyContact(ball, player, p, opts = {}) {
  const g = { ...ball, bounces: 0 };
  for (let i = 0; i < 7; i++) { integrate(g, p); collide(g, p); }
  let f = (player.flags1b ?? 0) & 0xc0;
  const px = hi(player.x), pz = hi(player.z), gx = hi(g.x), gy = hi(g.y), gz = hi(g.z);
  if (gy > 0x18) { f |= 1; if (gy > 0x30) f |= 8; }
  const dz = pz - gz;
  if (dz >= 0x28 || -dz >= 0x28) f |= 0x20;
  const ballF = opts.ballFlags1b ?? 0;
  const special = () => {                       // 0x7394
    if (f & 0x20 || f & 0x08) return;
    if (opts.turnIsP1 === undefined) return;
    if (opts.turnIsP1 ? !opts.isP1 : opts.isP1) return;
    f |= 0x10;
  };
  if (px + 0x14 > gx) {                         // ball on the "left" (0x7358)
    if (!(ballF & 8)) f |= 4;
    const d = gx - px;
    if (d > -0x14) {}
    else if (d < -0x40) f |= 0x20;
    else if (d < -0x2c) { if (px >= -0x54) special(); }
    else if (!(ballF & 0x10)) f |= 2;
  } else {
    const d = gx - px;
    if (d < 0x34) {}
    else if (d > 0x60) f |= 0x20;
    else if (d > 0x4c) { if (px <= 0x34) special(); }
    else { f |= 2; if (f & 0x80 && px <= 0x34) special(); }
  }
  const zone = gz <= 0x48 ? 'FRONT' : gz <= 0x88 ? 'MID' : 'BACK';
  return { flags: f, zone, index: contactIndex(f), ghost: g };
}

/**
 * Contact type 0..11 from the classifier flags.
 * @param {number} f
 * @returns {number}
 */
export function contactIndex(f) {               // 0x74F6
  if (f & 0x10) return 0x0a | ((f >> 2) & 1);
  if (f & 0x08) return 0x08 | ((f >> 2) & 1);
  return f & 7;
}

// Aim (0..7) — measured from the arcade (not read from code): it is NOT the joystick. It follows timing, i.e. where
// the ball is in depth relative to the player when struck (dz = ball z - player z, game units):
//   ball behind the player (late, dz +8..+24) → 0..2 · level (dz ≈ 0) → 3..4 (straight) · ball in front (early, dz −8..−24) → 5..7
// The arcade value scatters ±1–2 around this trend; this is a fitted approximation.
/**
 * @param {number} ballZ    16.16
 * @param {number} playerZ  16.16
 * @returns {number}  aim 0..7
 */
export function aimFromTiming(ballZ, playerZ) {
  const dz = hi(ballZ) - hi(playerZ);
  const a = dz >= 0 ? 4 - dz / 5 : 4 + (-dz) / 10;
  return Math.max(0, Math.min(7, Math.round(a)));
}

// Player movement (measured): run speed field = 0x14000 (1.25). Moving left/right covers 2× that per frame
// (2.5 units), moving up/down (depth) covers 1× (1.25 units); diagonals combine both at full speed.
// Joystick UP = toward the front wall (z decreases). Speed drops to 0xC000 (0.75) in some states (swing/recover).
export const PLAYER = { RUN_SPEED: 0x14000, X_FACTOR: 2, Z_FACTOR: 1 };
/**
 * @param {{ x: number, z: number }} pl  16.16, moved in place
 * @param {{ up?: boolean, down?: boolean, left?: boolean, right?: boolean }} joy
 * @param {number} [speed]  16.16 run speed
 */
export function movePlayer(pl, joy, speed = PLAYER.RUN_SPEED) {   // joy: {up,down,left,right}
  if (joy.left)  pl.x = s32(pl.x - speed * PLAYER.X_FACTOR);
  if (joy.right) pl.x = s32(pl.x + speed * PLAYER.X_FACTOR);
  if (joy.up)    pl.z = s32(pl.z - speed * PLAYER.Z_FACTOR);
  if (joy.down)  pl.z = s32(pl.z + speed * PLAYER.Z_FACTOR);
}

// Serve: the arcade uses a fixed serve trajectory (seen 24× in the log): vx = 0, vz = −9.0 units/frame,
// vy ≈ 6.5–6.6 units/frame (0x68086 / 0x6A006), i.e. a straight, high serve toward the front wall.
export const SERVE = { vx: 0, vz: -589824, vy: [426118, 434182] };
