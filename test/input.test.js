// Gamepad input: fake Gamepad objects mapped to actions (dead zone, stick directions, D-pad, buttons, presses),
// unplugging, and the seats that say which pad plays which player (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAD, padHeld, createPads, padName } from '../public/hogg-squash/js/input/gamepad.js';
import { padActions, combineActions, readActions, makeSeats, seatOf, joinPad, dropPad, forgetLost, swapSeats,
  DEFAULT_LAYOUTS } from '../public/hogg-squash/js/input/actions.js';

/** A fake standard-layout pad: 17 buttons, 4 axes. */
function fakePad({ index = 0, id = 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', axes = [0, 0, 0, 0], down = [], mapping = 'standard' } = {}) {
  return { index, id, connected: true, mapping, axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i), value: down.includes(i) ? 1 : 0 })) };
}
const dirs = h => ['up', 'down', 'left', 'right'].filter(k => h[k]).join(' ');

test('stick: nothing inside the dead zone, 8 directions outside it', () => {
  assert.equal(dirs(padHeld(fakePad({ axes: [0.2, -0.2] }))), '', 'inside the dead zone (push 0.28)');
  assert.equal(dirs(padHeld(fakePad({ axes: [PAD.DEAD_ZONE - 0.01, 0] }))), '');
  assert.equal(dirs(padHeld(fakePad({ axes: [0.5, 0] }))), 'right');
  assert.equal(dirs(padHeld(fakePad({ axes: [-1, 0] }))), 'left');
  assert.equal(dirs(padHeld(fakePad({ axes: [0, -0.9] }))), 'up', 'stick up is negative y');
  assert.equal(dirs(padHeld(fakePad({ axes: [0, 0.9] }))), 'down');
  assert.equal(dirs(padHeld(fakePad({ axes: [0.7, 0.7] }))), 'down right', 'a diagonal');
  assert.equal(dirs(padHeld(fakePad({ axes: [-0.7, -0.7] }))), 'up left');
  assert.equal(dirs(padHeld(fakePad({ axes: [0.9, 0.2] }))), 'right', 'a little off straight stays straight');
  assert.equal(dirs(padHeld(fakePad({ axes: [0, 0, 1, 1] }))), '', 'the right stick does nothing');
});

test('D-pad moves (with or without the stick), and Firefox-style D-pad axes on a non-standard pad', () => {
  assert.equal(dirs(padHeld(fakePad({ down: [12] }))), 'up');
  assert.equal(dirs(padHeld(fakePad({ down: [13, 15] }))), 'down right');
  assert.equal(dirs(padHeld(fakePad({ down: [14], axes: [0, -1] }))), 'up left');
  const hat = fakePad({ mapping: '', axes: [0, 0, 0, 0, 0, 0, 1, -1] });
  assert.equal(dirs(padHeld(hat)), 'up right');
  assert.equal(dirs(padHeld({ ...hat, mapping: 'standard' })), '', 'a standard pad\'s extra axes are not a D-pad');
});

test('buttons: A = HARD, B or X = SOFT, Start = pause, nothing else', () => {
  const held = down => { const h = padHeld(fakePad({ down })); return ['hard', 'soft', 'start'].filter(k => h[k]).join(' '); };
  assert.equal(held([0]), 'hard');
  assert.equal(held([1]), 'soft');
  assert.equal(held([2]), 'soft');
  assert.equal(held([9]), 'start');
  assert.equal(held([3, 4, 5, 6, 7, 8, 10, 11, 16]), '', 'Y, bumpers, triggers, Back, stick clicks, Guide');
});

test('presses: a button counts once when it goes down, not while held; movement is held', () => {
  let now = [fakePad()];
  const pads = createPads(() => now);
  const step = (opts) => { now = [fakePad(opts)]; return pads.poll().pads[0]; };
  assert.equal(pads.poll().pads.length, 1);
  let p = step({ down: [0], axes: [1, 0] });
  assert.deepEqual(padActions(p), { up: false, down: false, left: false, right: true, hard: true, soft: false });
  p = step({ down: [0], axes: [1, 0] });
  assert.deepEqual(padActions(p), { up: false, down: false, left: false, right: true, hard: false, soft: false }, 'A still held: no press');
  p = step({ down: [] });
  assert.equal(p.pressed.hard, false);
  p = step({ down: [0, 2] });
  assert.equal(p.pressed.hard && p.pressed.soft, true, 'A and X together');
  p = step({ down: [1, 2] });
  assert.equal(p.pressed.soft, false, 'B down while X is held: SOFT was already held');
  p = step({ down: [9] });
  assert.equal(p.pressed.start, true);
  assert.equal(p.any, true);
  p = step({ down: [9], axes: [1, 0] });
  assert.equal(p.any, false, 'moving the stick is not a button press');
  assert.equal(p.pressed.right, true, 'but a new direction is a press (the overlay uses it)');
  p = step({ down: [9, 3] });
  assert.equal(p.any, true, 'Y is "any button"');
});

test('a pad first seen with a button down counts it as a press; an unplugged pad is reported once', () => {
  /** @type {any[]} */
  let now = [];
  const pads = createPads(() => now);
  assert.deepEqual(pads.poll(), { pads: [], gone: [] });
  now = [null, fakePad({ index: 1, down: [3] })];
  let r = pads.poll();
  assert.equal(r.pads[0].index, 1);
  assert.equal(r.pads[0].any, true, 'the press that made the browser show it');
  now = [null, { ...fakePad({ index: 1 }), connected: false }];
  r = pads.poll();
  assert.deepEqual([r.pads.length, r.gone], [0, [1]]);
  assert.deepEqual(pads.poll().gone, [], 'reported once');
  now = [null, fakePad({ index: 1, down: [0] })];
  assert.equal(pads.poll().pads[0].pressed.hard, true, 'plugged back in: its first press counts');
});

test('seats: pads join P1 then P2; 1P has one seat; a full house turns pads away', () => {
  const two = makeSeats([false, false]);
  assert.equal(joinPad(two, 3), 0);
  assert.equal(joinPad(two, 3), 0, 'joining again changes nothing');
  assert.equal(joinPad(two, 0), 1);
  assert.equal(joinPad(two, 1), -1);
  assert.deepEqual([seatOf(two, 3), seatOf(two, 0), seatOf(two, 1)], [0, 1, -1]);
  const one = makeSeats([false, true]);
  assert.equal(one[1], null, 'the CPU has no seat');
  assert.equal(joinPad(one, 0), 0);
  assert.equal(joinPad(one, 1), -1);
});

test('seats: an unplugged pad\'s seat waits and the next pad to press a button takes it, or the keyboard carries on', () => {
  const seats = makeSeats([false, false]);
  joinPad(seats, 0);
  joinPad(seats, 1);
  assert.equal(dropPad(seats, 0), 0);
  assert.deepEqual(seats[0], { pad: null, lost: true });
  assert.equal(dropPad(seats, 7), -1, 'a pad that wasn\'t playing');
  assert.equal(joinPad(seats, 2), 0, 'any pad can replace it');
  assert.deepEqual(seats[0], { pad: 2, lost: false });
  dropPad(seats, 1);
  forgetLost(seats);
  assert.deepEqual(seats[1], { pad: null, lost: false }, 'P2 carries on with the keyboard');
  const one = makeSeats([true, false]);
  joinPad(one, 0);
  dropPad(one, 0);
  joinPad(one, 0);
  assert.deepEqual(one[1], { pad: 0, lost: false }, 'P2 in a CPU-on-P1 game');
});

test('seats: a pad changes sides in 2P (swapping with the other pad), never in 1P', () => {
  const seats = makeSeats([false, false]);
  joinPad(seats, 0);
  assert.equal(swapSeats(seats, 0), true);
  assert.deepEqual(seats.map(s => s.pad), [null, 0], 'keyboard P1, pad P2');
  joinPad(seats, 1);
  assert.deepEqual(seats.map(s => s.pad), [1, 0]);
  swapSeats(seats, 1);
  assert.deepEqual(seats.map(s => s.pad), [0, 1]);
  const one = makeSeats([false, true]);
  joinPad(one, 0);
  assert.equal(swapSeats(one, 0), false);
  assert.equal(one[0].pad, 0);
});

test('keyboard and pad together: either moves, either hits', () => {
  const kb = { isHeld: code => code === 'KeyA' };
  const keys = readActions(/** @type {any} */ (kb), DEFAULT_LAYOUTS[0], new Set(['KeyG']));
  const pads = createPads(() => [fakePad({ down: [0], axes: [0, -1] })]);
  const pad = padActions(pads.poll().pads[0]);
  assert.deepEqual(combineActions(keys, pad), { up: true, down: false, left: true, right: false, hard: true, soft: true });
  const idle = padActions(createPads(() => [fakePad()]).poll().pads[0]);
  assert.deepEqual(combineActions(keys, idle), keys, 'an idle pad changes nothing');
});

test('pad names: the browser\'s id without its details', () => {
  assert.equal(padName('Xbox 360 Controller (XInput STANDARD GAMEPAD)'), 'Xbox 360 Controller');
  assert.equal(padName('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)'), 'DualSense Wireless Controller');
  assert.equal(padName('054c-0ce6-DualSense Wireless Controller'), 'DualSense Wireless Controller', 'Firefox');
  assert.equal(padName(''), 'Controller');
});
