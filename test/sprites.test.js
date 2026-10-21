// The character sheet and the animation player (node:test, run by npm test). sprites.js only touches a canvas when
// drawing or building an atlas, so Node can import it. Checks player-100.json against what the game expects: every
// tag, the feet slice, and each swing's contact frame on the sim's contact step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseSheet, frameAt, createAnimator, stepAnimator, MS_PER_FRAME } from '../public/hogg-squash/js/render/sprites.js';
import { SWING, DIVE, swingLength, makePlayer } from '../public/hogg-squash/js/sim/player.js';
import { FP } from '../public/hogg-squash/js/squash-physics.js';

const json = JSON.parse(fs.readFileSync('public/hogg-squash/assets/player-100.json', 'utf8'));
const sheet = parseSheet(json);

const LOOPS = ['ready', 'run_side', 'run_up', 'run_down'];
/** Play-once tags with a contact frame, and the sim timing each must match. */
const SWINGS = { serve: SWING, forehand: SWING, backhand: SWING, overhead: SWING, dive: DIVE };

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
 * @param {{ x: number, z: number, swing?: any, served?: boolean }[]} steps  game units
 */
function play(steps) {
  const a = createAnimator(), pl = makePlayer(0, 100);
  return steps.map(s => {
    pl.x = s.x * FP;
    pl.z = s.z * FP;
    pl.swing = s.swing ?? null;
    stepAnimator(a, sheet, pl, !!s.served);
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

test('the animator: the serve starts on its contact frame (the sim has no wind-up) and plays out', () => {
  const serve = sheet.tags.serve;
  const steps = [{ x: 0, z: 120, served: true }];
  for (let i = 0; i < serve.length; i++) steps.push({ x: 0, z: 120 });
  const r = play(steps);
  assert.equal(r[0].tag, 'serve');
  assert.equal(frameAt(serve, r[0].t), serve.contact);
  const last = r.findLastIndex(a => a.tag === 'serve');
  assert.equal(frameAt(serve, r[last].t), serve.count - 1, 'the follow-through plays to its last frame');
  assert.equal(last, serve.length - serve.starts[/** @type {number} */ (serve.contact)] - 1);
  assert.equal(r[last + 1].tag, 'ready');
});
