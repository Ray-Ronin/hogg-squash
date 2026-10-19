// Character height by depth (node:test, run by npm test). actors.js only draws when called, so Node can import it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heightAt, CHARACTER_HEIGHT } from '../public/hogg-squash/js/render/actors.js';
import { PLAYER_LIMITS } from '../public/hogg-squash/js/sim/player.js';
import { PLAYER } from '../public/hogg-squash/js/squash-physics.js';

test('the CP-A sizes sit at the middle of their old bands, and the ends hold', () => {
  assert.equal(heightAt(39), 68);
  assert.equal(heightAt(100), 84);
  assert.equal(heightAt(155), 100);
  assert.equal(heightAt(PLAYER_LIMITS.zMin), 68);
  assert.equal(heightAt(PLAYER_LIMITS.zMax), 100);
});

test('running in depth changes the height smoothly: never down, at most 1 px per frame', () => {
  const step = PLAYER.RUN_SPEED * PLAYER.Z_FACTOR / 65536;     // 1.25 units per frame
  let prev = heightAt(PLAYER_LIMITS.zMin), changes = 0;
  for (let z = PLAYER_LIMITS.zMin + step; z <= PLAYER_LIMITS.zMax; z += step) {
    const h = heightAt(z);
    assert.ok(h >= prev && h - prev <= 1, `z ${z}: ${prev} → ${h}`);
    if (h !== prev) changes++;
    prev = h;
  }
  assert.equal(changes, 100 - 68, 'every whole pixel from 68 to 100 is used');
});

test('?h= scales the whole curve', () => {
  assert.equal(heightAt(155, 120), 120);
  assert.equal(heightAt(39, 120), Math.round(68 * 1.2));
  assert.equal(CHARACTER_HEIGHT.POINTS.length, 3);
});
