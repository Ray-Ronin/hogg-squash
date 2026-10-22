// Character height by depth (node:test, run by npm test). actors.js only draws when called, so Node can import it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heightAt, exactHeightAt, boxEdges, CHARACTER_HEIGHT } from '../public/hogg-squash/js/render/actors.js';
import { project } from '../public/hogg-squash/js/render/projection.js';
import { PLAYER_LIMITS } from '../public/hogg-squash/js/sim/player.js';
import { PLAYER } from '../public/hogg-squash/js/squash-physics.js';

const STEP = PLAYER.RUN_SPEED * PLAYER.Z_FACTOR / 65536;     // 1.25 units per frame, running in depth

test('true to scale: a 1.75 m player, ≈57 px at the front wall to 117 at the back', () => {
  assert.equal(heightAt(PLAYER_LIMITS.zMin), 57);
  assert.equal(heightAt(100), 78);
  assert.equal(heightAt(PLAYER_LIMITS.zMax), 117);
  for (const z of [12, 70, 130, 155]) {
    const s = project(0, 0, z).scale;
    assert.ok(Math.abs(exactHeightAt(z) - 1.75 * s) < 1e-9, `z ${z}`);
    assert.ok(exactHeightAt(z) < 1.78 * s, `z ${z}: the head is under the service line`);
  }
});

test('?curve=half is the CP-B half-strength curve, ≈70 px at the front wall to 100 at the back', () => {
  const half = { curve: /** @type {const} */ ('half') };
  assert.deepEqual([PLAYER_LIMITS.zMin, 100, PLAYER_LIMITS.zMax].map(z => heightAt(z, half)), [70, 82, 100]);
  for (const z of [12, 70, 130, 155]) {
    const want = 100 * Math.sqrt(project(0, 0, z).scale / project(0, 0, 179).scale);
    assert.ok(Math.abs(exactHeightAt(z, half) - want) < 1e-9, `z ${z}`);
  }
});

test('running in depth: the height grows the whole way (no flat ends), at most 1 px per frame', () => {
  let prev = exactHeightAt(PLAYER_LIMITS.zMin), prevPx = heightAt(PLAYER_LIMITS.zMin);
  for (let z = PLAYER_LIMITS.zMin + STEP; z <= PLAYER_LIMITS.zMax; z += STEP) {
    const h = exactHeightAt(z), px = heightAt(z);
    assert.ok(h > prev, `z ${z}: still growing`);
    assert.ok(px >= prevPx && px - prevPx <= 1, `z ${z}: ${prevPx} → ${px}`);
    prev = h;
    prevPx = px;
  }
  assert.ok(heightAt(PLAYER_LIMITS.zMin + 15) > heightAt(PLAYER_LIMITS.zMin), 'growing at the front wall');
  assert.ok(heightAt(PLAYER_LIMITS.zMax - 5) < heightAt(PLAYER_LIMITS.zMax), 'and at the back');
});

test('no wobble: walking in depth, each edge of the box moves one way only', () => {
  for (const x of [-134, -100, -60, -20, 0, 20, 60, 100, 134]) {
    /** @type {number[] | null} */
    let prev = null;
    const dirs = [0, 0];
    for (let z = PLAYER_LIMITS.zMin; z <= PLAYER_LIMITS.zMax; z += STEP) {
      const e = boxEdges(project(x, 0, z).sx, exactHeightAt(z));
      const edges = [e.x, e.x + e.w];
      if (prev) edges.forEach((v, i) => {
        const d = Math.sign(v - prev[i]);
        assert.ok(!(d && dirs[i] && d !== dirs[i]), `x ${x}, z ${z}: the ${i ? 'right' : 'left'} edge turned back`);
        if (d) dirs[i] = d;
      });
      prev = edges;
    }
  }
});

test('?h= scales the whole curve, and ?curve=old is the S3 curve', () => {
  assert.equal(heightAt(179, { backHeight: 120 }), 120);
  assert.equal(heightAt(12, { backHeight: 120 }), Math.round(exactHeightAt(12) * 120 / exactHeightAt(179)));
  const old = { curve: /** @type {const} */ ('old') };
  assert.deepEqual([12, 39, 100, 155, 179].map(z => heightAt(z, old)), [68, 68, 84, 100, 100]);
  assert.equal(heightAt(155, { curve: 'old', backHeight: 120 }), 120);
  assert.equal(CHARACTER_HEIGHT.OLD_POINTS.length, 3);
});
