// The character sheet and the animation player (node:test, run by npm test). sprites.js only touches a canvas when
// drawing or building an atlas, so Node can import it. Checks player-100.json against what the game expects: every
// tag, the feet slice, and each swing's contact frame on the sim's contact step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseSheet, frameAt, createAnimator, stepAnimator, racketShift, racketSideShift, RACKET, MS_PER_FRAME } from '../public/hogg-squash/js/render/sprites.js';
import { SWING, DIVE, swingLength, makePlayer } from '../public/hogg-squash/js/sim/player.js';
import { FP } from '../public/hogg-squash/js/squash-physics.js';
import { SERVE_WINDUP } from '../public/hogg-squash/js/sim/world.js';

const json = JSON.parse(fs.readFileSync('public/hogg-squash/assets/player-100.json', 'utf8'));
const sheet = parseSheet(json);

const LOOPS = ['ready', 'run_side', 'run_up', 'run_down'];
/** Play-once tags with a contact frame, and the sim timing each must match. */
const SWINGS = { serve: { CONTACT: SERVE_WINDUP }, forehand: SWING, backhand: SWING, overhead: SWING, dive: DIVE };

test('every expected tag is in the sheet; loops loop, swings play once with a contact frame', () => {
  for (const name of LOOPS) {
    const t = sheet.tags[name];
    assert.ok(t, `tag ${name}`);
    assert.equal(t.once, false, `${name} loops`);
  }
  for (const name of Object.keys(SWINGS)) {
    const t = sheet.tags[name];
    assert.ok(t, `tag ${name}`);
    assert.equal(t.once, true, `${name} plays once`);
    assert.ok(t.contact !== null && t.contact > 0 && t.contact < t.count, `${name} has a contact frame`);
  }
});

test('the feet slice: the pivot is the ground point, on the soles of the ready pose', () => {
  const feet = json.meta.slices.find((/** @type {any} */ s) => s.name === 'feet');
  assert.ok(feet, 'feet slice');
  assert.ok(feet.keys[0].pivot, 'with a pivot');
  assert.deepEqual(sheet.pivot, { x: 73.5, y: 149 });     // pixel (73, 148): its centre across, its bottom edge
  assert.ok(sheet.pivot.x < sheet.frameW && sheet.pivot.y <= sheet.frameH);
});

test('every frame lasts at least one sim frame, so none is skipped', () => {
  for (const t of Object.values(sheet.tags)) {
    for (let i = 1; i < t.count; i++) assert.ok(t.starts[i] > t.starts[i - 1], `${t.name} frame ${i}`);
    assert.ok(t.length > t.starts[t.count - 1], `${t.name} last frame`);
  }
});

test("each swing's contact frame starts on the sim's contact step, and the tag lasts as long as the sim's swing", () => {
  for (const [name, T] of Object.entries(SWINGS)) {
    const t = sheet.tags[name];
    const c = /** @type {number} */ (t.contact);
    const ms = json.frames.slice(t.from, t.from + c).reduce((/** @type {number} */ s, /** @type {any} */ f) => s + f.duration, 0);
    assert.ok(Math.abs(ms / MS_PER_FRAME - T.CONTACT) < 0.5, `${name}: contact at ${ms} ms`);
    assert.equal(t.starts[c], T.CONTACT, `${name}: contact frame starts on sim frame ${T.CONTACT}`);
    assert.equal(frameAt(t, T.CONTACT - 1), c - 1, `${name}: the frame before contact is still showing one step earlier`);
    assert.equal(frameAt(t, T.CONTACT), c, `${name}: contact frame on the contact step`);
    assert.equal(t.length, swingLength(name === 'dive' ? 'dive' : 'swing'), `${name}: length`);
  }
});

test('frameAt: loops wrap, play-once tags hold their last frame', () => {
  const ready = sheet.tags.ready, fore = sheet.tags.forehand;
  assert.equal(frameAt(ready, 0), 0);
  assert.equal(frameAt(ready, ready.length), 0);
  assert.equal(frameAt(ready, ready.length - 1), ready.count - 1);
  assert.equal(frameAt(fore, 1000), fore.count - 1);
});

/**
 * Step an animator through a script of player states.
 * @param {{ x: number, z: number, swing?: any, serveSwing?: boolean }[]} steps  game units
 */
function play(steps) {
  const a = createAnimator(), pl = makePlayer(0, 100);
  return steps.map(s => {
    pl.x = s.x * FP;
    pl.z = s.z * FP;
    pl.swing = s.swing ?? null;
    stepAnimator(a, sheet, pl, s.serveSwing ? { x: 18 * FP, y: 30 * FP, z: 120 * FP } : null);
    return { ...a };
  });
}

test('the animator: ready, then the run tag by direction (left mirrored), sharing one stride clock', () => {
  const r = play([
    { x: 0, z: 100 }, { x: 0, z: 100 },
    { x: 2.5, z: 100 }, { x: 5, z: 100 },          // right
    { x: 2.5, z: 100 },                             // left: same stride, mirrored
    { x: 2.5, z: 98.75 },                           // toward the front wall
    { x: 2.5, z: 100 },                             // toward the back
  ]);
  assert.deepEqual(r.map(a => a.tag), ['ready', 'ready', 'run_side', 'run_side', 'run_side', 'run_up', 'run_down']);
  assert.deepEqual(r.map(a => a.t), [1, 2, 0, 1, 2, 3, 4]);      // a new animator is already on ready's frame 0
  assert.deepEqual(r.map(a => a.mirror), [false, false, false, false, true, false, false]);
});

test('the animator: a short stop keeps running, a longer one goes to ready; a teleport is not a run', () => {
  const steps = [{ x: 0, z: 100 }, { x: 2.5, z: 100 }];
  for (let i = 0; i < 5; i++) steps.push({ x: 2.5, z: 100 });
  steps.push({ x: 60, z: 150 });
  const r = play(steps);
  assert.deepEqual(r.map(a => a.tag), ['ready', 'run_side', 'run_side', 'run_side', 'run_side', 'ready', 'ready', 'ready']);
});

test('the animator: a swing shows the sim frame since the press; a backhand dive is mirrored', () => {
  const swing = (/** @type {number} */ t, /** @type {'fore' | 'back'} */ hand, kind = 'swing') => ({ kind, t, hand });
  const r = play([
    { x: 0, z: 100, swing: swing(0, 'fore') }, { x: 0, z: 100, swing: swing(SWING.CONTACT, 'fore') },
    { x: 0, z: 100, swing: swing(SWING.CONTACT, 'back') },
    { x: 0, z: 100, swing: swing(DIVE.CONTACT, 'back', 'dive') },
  ]);
  assert.deepEqual(r.map(a => [a.tag, frameAt(sheet.tags[a.tag], a.t), a.mirror]), [
    ['forehand', 0, false], ['forehand', sheet.tags.forehand.contact, false],
    ['backhand', sheet.tags.backhand.contact, false], ['dive', sheet.tags.dive.contact, true],
  ]);
});

test('the animator: the serve starts on its first frame on the press, shows its contact frame on the launch, plays out', () => {
  const serve = sheet.tags.serve;
  const steps = [{ x: 0, z: 120, serveSwing: true }];
  for (let i = 0; i < serve.length; i++) steps.push({ x: 0, z: 120 });
  const r = play(steps);
  assert.equal(r[0].tag, 'serve');
  assert.equal(frameAt(serve, r[0].t), 0, 'the wind-up shows');
  assert.equal(frameAt(serve, r[SERVE_WINDUP - 1].t), /** @type {number} */ (serve.contact) - 1);
  assert.equal(frameAt(serve, r[SERVE_WINDUP].t), serve.contact, 'the contact frame on the launch step');
  const last = r.findLastIndex(a => a.tag === 'serve');
  assert.equal(frameAt(serve, r[last].t), serve.count - 1, 'the follow-through plays to its last frame');
  assert.equal(last, serve.length - 1);
  assert.equal(r[last + 1].tag, 'ready');
});

test('the animator: overhead for contact types 8–9 only (mirrored for a backhand), forehand / backhand otherwise', () => {
  const swing = (/** @type {number | null} */ index, /** @type {'fore' | 'back'} */ hand, kind = 'swing') =>
    ({ kind, t: SWING.CONTACT, hand, contact: index === null ? null : { index } });
  const cases = /** @type {[number | null, 'fore' | 'back', string, string, boolean][]} */ ([
    [8, 'fore', 'swing', 'overhead', false], [9, 'fore', 'swing', 'overhead', false], [8, 'back', 'swing', 'overhead', true],
    [9, 'back', 'swing', 'overhead', true], [7, 'fore', 'swing', 'forehand', false], [0, 'back', 'swing', 'backhand', false],
    [10, 'fore', 'dive', 'dive', false], [null, 'fore', 'swing', 'forehand', false],
  ]);
  for (const [index, hand, kind, tag, mirror] of cases) {
    const [a] = play([{ x: 0, z: 100, swing: swing(index, hand, kind) }]);
    assert.deepEqual([a.tag, a.mirror], [tag, mirror], `contact ${index} ${hand} ${kind}`);
    assert.equal(frameAt(sheet.tags[a.tag], a.t), sheet.tags[a.tag].contact, 'on its contact frame');
  }
});

test('every swing tag has a racket point (the "racket <tag>" slice) inside its frame', () => {
  for (const name of Object.keys(SWINGS)) {
    const p = sheet.tags[name].racket;
    assert.ok(p, `${name} has a racket point`);
    assert.ok(p.x > 0 && p.x < sheet.frameW && p.y > 0 && p.y < sheet.pivot.y, `${name}: inside the frame, above the feet`);
  }
  assert.ok(sheet.tags.overhead.racket.y < sheet.tags.forehand.racket.y - 40, 'the overhead holds it far higher');
  assert.ok(sheet.tags.dive.racket.y > sheet.pivot.y - 30, 'the dive has it on the floor');
});

/** Run fn with the racket shift's caps set (the mechanism is tested at S8b's 12%, so the gaps aren't all capped). */
function withCaps(/** @type {number} */ max, /** @type {number} */ side, /** @type {() => void} */ fn) {
  const keep = [RACKET.MAX, RACKET.SIDE];
  [RACKET.MAX, RACKET.SIDE] = [max, side];
  try { fn(); } finally { [RACKET.MAX, RACKET.SIDE] = keep; }
}

test('the racket shift\'s caps are the owner\'s S12 pick: 1% up / down and 1% across', () => {
  assert.deepEqual([RACKET.MAX, RACKET.SIDE], [0.01, 0.01]);
});

test('the racket shift: 0 at the press, the whole gap on the contact frame (capped), 0 again RACKET.OUT frames later', () => withCaps(0.12, 0, () => {
  const fore = sheet.tags.forehand, h = 100, sy = 300;
  const racketY = sy - (sheet.pivot.y - fore.racket.y);           // at 100 px, 1:1
  const a = { ...createAnimator(), tag: 'forehand', contact: { x: 0, y: 19, z: 100 } };
  const at = (/** @type {number} */ t, /** @type {number} */ ballY) => racketShift(sheet, { ...a, t }, sy, h, ballY);
  assert.equal(at(0, racketY + 8), 0, 'nothing at the press');
  assert.equal(at(SWING.CONTACT, racketY + 8), 8, 'down to a low ball on the contact frame');
  assert.equal(at(SWING.CONTACT, racketY - 5), -5, 'up to a high one');
  assert.equal(at(SWING.CONTACT, racketY + 50), Math.round(RACKET.MAX * h), 'capped');
  assert.equal(at(SWING.CONTACT, racketY - 50), -Math.round(RACKET.MAX * h), 'capped up too');
  assert.equal(at(SWING.CONTACT + RACKET.OUT, racketY + 8), 0, 'eased out by the end');
  assert.equal(SWING.CONTACT + RACKET.OUT, swingLength('swing') - 1, '…which is the swing\'s last locked frame');
  let prev = 0;
  for (let t = 1; t <= SWING.CONTACT; t++) {
    const s = at(t, racketY + 12);
    assert.ok(s >= prev && s - prev <= 4, `t ${t}: eases in (${prev} → ${s})`);
    prev = s;
  }
  assert.equal(at(SWING.CONTACT, null), 0, 'no ball: no shift');
  assert.equal(racketShift(sheet, { ...a, contact: null, t: SWING.CONTACT }, sy, h, racketY + 8), 0, 'a miss: no shift');
}));

test('the animator keeps the contact: the ghost ball for a swing, the held ball for a serve, none when running', () => {
  const ghost = { x: 30 * FP, y: 12 * FP, z: 90 * FP };
  const [sw] = play([{ x: 0, z: 100, swing: { kind: 'swing', t: 0, hand: 'fore', contact: { index: 3, ghost } } }]);
  assert.deepEqual(sw.contact, { x: 30, y: 12, z: 90 });
  const [miss] = play([{ x: 0, z: 100, swing: { kind: 'swing', t: 0, hand: 'fore', contact: null } }]);
  assert.equal(miss.contact, null);
  const r = play([{ x: 0, z: 120, serveSwing: true }, { x: 0, z: 120 }, { x: 0, z: 120 }]);
  assert.deepEqual(r.map(a => a.contact), Array(3).fill({ x: 18, y: 30, z: 120 }));
  const run = play([{ x: 0, z: 100 }, { x: 2.5, z: 100 }]);
  assert.equal(run[1].contact, null);
});

test('the racket shift on a serve is back to 0 before a running server can cut the follow-through short', () => withCaps(0.12, 0, () => {
  const serve = sheet.tags.serve, h = 100, sy = 300;
  const racketY = sy - (sheet.pivot.y - serve.racket.y);
  const a = { ...createAnimator(), tag: 'serve', contact: { x: 18, y: 30, z: 120 } };
  const cut = serve.starts[/** @type {number} */ (serve.contact) + 1];
  assert.equal(racketShift(sheet, { ...a, t: SERVE_WINDUP }, sy, h, racketY + 30), Math.round(RACKET.MAX * h));
  assert.equal(racketShift(sheet, { ...a, t: cut - 1 }, sy, h, racketY + 30), 0, 'the last frame before the cut');
}));

test('the sideways racket shift: off while RACKET.SIDE is 0; else towards the ball, capped, eased like the height', () => {
  const fore = sheet.tags.forehand, h = 100, sx = 320;
  const racketX = sx + (fore.racket.x - sheet.pivot.x);          // at 100 px, 1:1
  const a = { ...createAnimator(), tag: 'forehand', contact: { x: 0, y: 19, z: 100 }, t: SWING.CONTACT };
  const side = RACKET.SIDE;
  try {
    RACKET.SIDE = 0;
    assert.equal(racketSideShift(sheet, a, sx, h, racketX + 5), 0, 'off');
    RACKET.SIDE = 0.06;
    assert.equal(racketSideShift(sheet, a, sx, h, racketX + 4), 4, 'right to a ball beyond the racket');
    assert.equal(racketSideShift(sheet, a, sx, h, racketX - 50), -6, 'capped at 6% of the height');
    const m = { ...a, mirror: true }, mirroredX = sx - (fore.racket.x - sheet.pivot.x);
    assert.equal(racketSideShift(sheet, m, sx, h, mirroredX - 3), -3, 'mirrored: the racket is on the other side');
    assert.equal(racketSideShift(sheet, { ...a, t: 0 }, sx, h, racketX + 4), 0, 'nothing at the press');
    assert.equal(racketSideShift(sheet, { ...a, t: SWING.CONTACT + RACKET.OUT }, sx, h, racketX + 4), 0, 'eased out');
    assert.equal(racketSideShift(sheet, { ...a, contact: null }, sx, h, racketX + 4), 0, 'a miss: none');
  } finally {
    RACKET.SIDE = side;
  }
});
