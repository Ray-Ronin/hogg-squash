// Match scoring: lengths, win by 2, serve handover and boxes (node:test, run by npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_LENGTHS, makeMatch, scoreRally, firstServer, winningScore } from '../public/hogg-squash/js/sim/match.js';

/** Score a run of rally winners, e.g. '0011' = P1, P1, P2, P2. */
function play(m, winners) {
  for (const w of winners) scoreRally(m, w === '0' ? 0 : 1);
  return m;
}

/** Bring a game to a:b with the points alternating, then the leader's extra points. */
function scoreTo(m, a, b) {
  const both = Math.min(a, b);
  play(m, '01'.repeat(both));
  play(m, (a > b ? '0' : '1').repeat(Math.abs(a - b)));
  return m;
}

test('every match length: a clean win ends exactly at the target', () => {
  for (const target of MATCH_LENGTHS) {
    const m = makeMatch({ target, server: 0 });
    play(m, '0'.repeat(target - 1));
    assert.equal(m.winner, null, `${target - 1}-0 in a game to ${target}`);
    scoreRally(m, 0);
    assert.equal(m.winner, 0);
    assert.deepEqual(m.scores, [target, 0]);
  }
});

test('every match length: win by 2 from level at target - 1', () => {
  for (const target of MATCH_LENGTHS) {
    const m = scoreTo(makeMatch({ target, server: 0 }), target - 1, target - 1);
    play(m, '1');
    assert.equal(m.winner, null, `${target - 1}-${target} is not enough`);
    play(m, '0');
    assert.equal(m.winner, null, 'level again');
    play(m, '11');
    assert.equal(m.winner, 1);
    assert.deepEqual(m.scores, [target, target + 2]);
  }
});

test('8-8 in a game to 9 carries on; 9-8 does not end it; 10-8 does', () => {
  const m = scoreTo(makeMatch({ target: 9, server: 0 }), 8, 8);
  assert.deepEqual(m.scores, [8, 8]);
  assert.equal(m.winner, null);
  play(m, '0');
  assert.equal(m.winner, null, '9-8');
  play(m, '0');
  assert.equal(m.winner, 0, '10-8');
});

test('11-9 wins a game to 9 (and to 11)', () => {
  for (const target of [9, 11]) {
    const m = scoreTo(makeMatch({ target, server: 0 }), 9, 9);
    play(m, '00');
    assert.deepEqual(m.scores, [11, 9]);
    assert.equal(m.winner, 0);
  }
});

test('11-10 does not win a game to 11', () => {
  const m = scoreTo(makeMatch({ target: 11, server: 1 }), 10, 10);
  play(m, '0');
  assert.equal(m.winner, null);
});

test('no more scoring once the match is won', () => {
  const m = play(makeMatch({ target: 5, server: 0 }), '00000');
  play(m, '11');
  assert.deepEqual(m.scores, [5, 0]);
  assert.equal(m.winner, 0);
});

test('serve: the rally winner serves, a new server starts right, a holder alternates boxes', () => {
  const m = makeMatch({ target: 9, server: 0 });
  assert.deepEqual([m.server, m.box], [0, 'right']);
  play(m, '0');
  assert.deepEqual([m.server, m.box], [0, 'left'], 'server wins: keeps the serve, other box');
  play(m, '0');
  assert.deepEqual([m.server, m.box], [0, 'right']);
  play(m, '0');
  assert.deepEqual([m.server, m.box], [0, 'left']);
  play(m, '1');
  assert.deepEqual([m.server, m.box], [1, 'right'], 'handover: new server starts in the right box');
  play(m, '1');
  assert.deepEqual([m.server, m.box], [1, 'left']);
  play(m, '0');
  assert.deepEqual([m.server, m.box], [0, 'right'], 'back to P1: right box again, not where P1 left off');
});

test('first server: the human vs CPU; from the seed in 2P', () => {
  assert.equal(firstServer({ vsCpu: true }), 0);
  assert.equal(firstServer({ vsCpu: true, human: 1, seed: 12345 }), 1);
  const seen = new Set();
  for (let seed = 0; seed < 64; seed++) {
    const s = firstServer({ vsCpu: false, seed });
    assert.ok(s === 0 || s === 1);
    assert.equal(firstServer({ vsCpu: false, seed }), s, 'same seed, same server');
    seen.add(s);
  }
  assert.equal(seen.size, 2, 'both players get to serve first across seeds');
});

test('only 5, 7, 9 or 11', () => {
  for (const target of [0, 3, 10, 21]) assert.throws(() => makeMatch({ target, server: 0 }), RangeError);
});

test('winningScore: the match length until both reach length - 1, then the lower score + 2', () => {
  for (const target of MATCH_LENGTHS) {
    const at = (a, b) => winningScore(scoreTo(makeMatch({ target, server: 0 }), a, b));
    assert.equal(at(0, 0), target, `${target}: 0-0`);
    assert.equal(at(target - 2, target - 2), target, `${target}: before length - 1`);
    assert.equal(at(target - 1, target - 2), target, `${target}: one side at length - 1`);
    assert.equal(at(target - 1, target - 1), target + 1, `${target}: both at length - 1`);
    assert.equal(at(target, target - 1), target + 1, `${target}: a point ahead`);
    assert.equal(at(target - 1, target), target + 1, `${target}: a point behind`);
    assert.equal(at(target, target), target + 2, `${target}: level past length - 1`);
    assert.equal(at(target + 3, target + 3), target + 5, `${target}: well past`);
  }
  // the plan's examples
  assert.equal(winningScore(scoreTo(makeMatch({ target: 11, server: 0 }), 10, 10)), 12);
  assert.equal(winningScore(scoreTo(makeMatch({ target: 11, server: 0 }), 11, 11)), 13);
  assert.equal(winningScore(scoreTo(makeMatch({ target: 5, server: 0 }), 4, 4)), 6);
});
