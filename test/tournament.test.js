// The tournament's rules (js/sim/tournament.js; docs/decisions.md, "Tournament"): the rising lengths, the draw, the
// match order, who must play, results (out on a loss since S18b), skipped matches with the real sim, saving and
// loading, old saves, NEW DRAW.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIZES, roundCount, roundName, roundLength, lengthsFor, entrantLabel, drawOrder, makeTournament, nextMatch,
  recordResult, skipMatch, champion, humanRecord, playOut, matchWorld, saveTournament, loadTournament, clearTournament,
  tournamentProblem, setupProblem, TOURNAMENT_KEY, SETUP_SIZES, skipBotMatches, drawFixed, newDraw }
  from '../public/hogg-squash/js/sim/tournament.js';
import { makeCpu, cpuActions, cpuRandom } from '../public/hogg-squash/js/sim/cpu.js';
import { stepWorld } from '../public/hogg-squash/js/sim/world.js';
import { MATCH_LENGTHS } from '../public/hogg-squash/js/sim/match.js';

/** @param {Partial<import('../public/hogg-squash/js/sim/tournament.js').TournamentSetup>} o */
function setup(o = {}) {
  const size = o.size ?? 8;
  return { size, humans: 1, mode: /** @type {const} */ ('same'), length: 5, level: 5,
    chars: Array.from({ length: size }, (_, i) => ['ronin', 'adam', 'ben', 'zain'][i % 4]), seed: 1234, ...o };
}

/** A memory Store. */
function memStore() {
  /** @type {Map<string, string>} */
  const m = new Map();
  return { m, getItem: (/** @type {string} */ k) => m.get(k) ?? null, setItem: (/** @type {string} */ k, /** @type {string} */ v) => { m.set(k, v); },
    removeItem: (/** @type {string} */ k) => { m.delete(k); } };
}

/** Win the next match for the given world slot, 5–3. @param {any} t @param {0 | 1} side */
const win = (t, side) => recordResult(t, side, side === 0 ? [5, 3] : [3, 5]);

test('round names come from the players left', () => {
  assert.deepEqual([32, 16, 8, 4, 2].map(roundName), ['ROUND OF 32', 'ROUND OF 16', 'QUARTER-FINAL', 'SEMI-FINAL', 'FINAL']);
  assert.deepEqual(SIZES.map(roundCount), [1, 2, 3, 4, 5]);
});

test('match lengths: Same is one length; Rising goes evenly to 11 in the final, ties up', () => {
  for (const L of MATCH_LENGTHS) for (const size of SIZES) assert.deepEqual(lengthsFor('same', L, size), Array(roundCount(size)).fill(L));
  // decisions.md's worked examples, from 5
  assert.deepEqual(lengthsFor('rising', 5, 2), [5], 'one round plays the start');
  assert.deepEqual(lengthsFor('rising', 5, 4), [5, 11]);
  assert.deepEqual(lengthsFor('rising', 5, 8), [5, 9, 11], '8 is exactly between 7 and 9: up');
  assert.deepEqual(lengthsFor('rising', 5, 16), [5, 7, 9, 11]);
  assert.deepEqual(lengthsFor('rising', 5, 32), [5, 7, 9, 9, 11]);
  // every start and size: starts at the start, ends at 11, never falls, only real lengths
  for (const start of MATCH_LENGTHS) for (const size of SIZES) {
    const ls = lengthsFor('rising', start, size), R = ls.length;
    assert.equal(ls[0], start);
    if (R > 1) assert.equal(ls[R - 1], 11);
    for (let r = 1; r < R; r++) assert.ok(ls[r] >= ls[r - 1], `${start} ${size}: ${ls}`);
    assert.ok(ls.every(L => MATCH_LENGTHS.includes(L)));
    ls.forEach((L, r) => {                                      // the nearest to the formula's value
      const x = R > 1 ? start + (11 - start) * r / (R - 1) : start;
      assert.ok(MATCH_LENGTHS.every(o => Math.abs(o - x) >= Math.abs(L - x) - 1e-9), `${start} ${size} r${r}`);
    });
  }
  assert.deepEqual(lengthsFor('rising', 7, 32), [7, 9, 9, 11, 11]);
  assert.deepEqual(lengthsFor('rising', 11, 32), [11, 11, 11, 11, 11]);
  assert.equal(roundLength('rising', 9, 0, 3), 9);
});

test('labels: humans P1, P2 …, bots numbered', () => {
  const s = setup({ humans: 2 });
  assert.deepEqual([0, 1, 2, 7].map(e => entrantLabel(s, e)), ['P1', 'P2', 'BOT 1', 'BOT 6']);
});

test('the draw: fixed by the seed, every entrant once, different seeds differ', () => {
  for (const size of SIZES) {
    const a = drawOrder(size, 99);
    assert.deepEqual(a, drawOrder(size, 99));
    assert.deepEqual([...a].sort((x, y) => x - y), Array.from({ length: size }, (_, i) => i));
  }
  const draws = new Set(Array.from({ length: 20 }, (_, s) => drawOrder(32, s).join()));
  assert.equal(draws.size, 20);
  const t = makeTournament(setup({ size: 16, seed: 7 }));
  assert.deepEqual(t.order, drawOrder(16, 7));
  assert.deepEqual(t.rounds.map(r => r.length), [8, 4, 2, 1]);
});

test('a bad setup is refused', () => {
  assert.equal(setupProblem(setup()), '');
  for (const bad of [{ size: 6 }, { humans: 0 }, { humans: 9 }, { length: 6 }, { level: 10 }, { mode: 'up' }, { chars: ['a'] }, { seed: 1.5 }]) {
    assert.notEqual(setupProblem({ ...setup(), ...bad }), '', JSON.stringify(bad));
    assert.throws(() => makeTournament(/** @type {any} */ ({ ...setup(), ...bad })));
  }
});

test('the match order: bracket order, a round at a time; sides, pace and who must play', () => {
  const t = makeTournament(setup({ size: 8, humans: 2, level: 3, mode: 'rising', length: 5 }));
  const seen = [];
  for (let n = 0; n < 7; n++) {
    const m = /** @type {import('../public/hogg-squash/js/sim/tournament.js').MatchInfo} */ (nextMatch(t));
    seen.push([m.round, m.index]);
    const humans = m.players.filter(e => e < 2).length;
    assert.equal(m.mustPlay, humans > 0);
    assert.equal(m.length, [5, 9, 11][m.round]);
    assert.equal(m.name, ['QUARTER-FINAL', 'SEMI-FINAL', 'FINAL'][m.round]);
    if (humans === 1) {
      assert.ok(m.sides[0] < 2, 'against a bot the human is P1');
      assert.deepEqual(m.cpu, [false, true]);
      assert.equal(m.level, 3);
    } else {
      assert.deepEqual(m.sides, m.players, 'otherwise the upper slot is P1');
      assert.equal(m.level, humans === 2 ? 5 : 3, 'two humans play level 5\'s pace');
      assert.deepEqual(m.cpu, [humans === 0, humans === 0]);
    }
    if (m.mustPlay) win(t, 0); else skipMatch(t);
  }
  assert.deepEqual(seen, [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [2, 0]]);
  assert.equal(nextMatch(t), null);
  assert.ok(/** @type {number} */ (champion(t)) < 2, 'the humans won every match, so a human is champion');
});

/** A seed whose 4-player draw puts the two humans in different halves (so they can meet in the final). */
function splitSeed() {
  let seed = 0;
  for (;;) {
    const o = drawOrder(4, seed);
    if (Math.floor(o.indexOf(0) / 2) !== Math.floor(o.indexOf(1) / 2)) return seed;
    seed++;
  }
}

test('S18b: results: every match once; a win moves on; two humans: the loser is out', () => {
  const t = makeTournament(setup({ size: 4, humans: 2, seed: splitSeed() }));
  let m = /** @type {any} */ (nextMatch(t));
  assert.equal(m.sides[0], m.players.find((/** @type {number} */ e) => e < 2));
  assert.equal('attempt' in m, false, 'no tries any more');
  win(t, 0);
  const h0 = t.rounds[0][0].winner;
  win(t, 0);                                                   // the other human beats their bot too
  m = nextMatch(t);
  assert.equal(m.name, 'FINAL');
  assert.equal(m.mustPlay, true);
  assert.deepEqual(m.cpu, [false, false]);
  assert.equal(m.sides[0], h0, 'the upper slot is P1');
  win(t, 1);
  const champ = /** @type {number} */ (champion(t));
  assert.equal(champ, m.sides[1]);
  assert.deepEqual(humanRecord(t, h0), { wins: 1, out: 'FINAL', champion: false });
  assert.deepEqual(humanRecord(t, champ), { wins: 2, out: null, champion: true });
  assert.deepEqual(t.rounds[1][0].scores, [3, 5], 'scores kept as upper, lower');
  assert.throws(() => win(t, 0), /over/);
});

test('S18b: a human who loses to a bot is out, the bot goes on, and the tournament plays on to a bot champion', () => {
  // one human, 8 players: out in the first round, then every bots' match is skipped to the end
  const t = makeTournament(setup({ size: 8, humans: 1, seed: 31 }));
  for (let m = nextMatch(t); m && !m.mustPlay; m = nextMatch(t)) skipMatch(t);
  const m = /** @type {any} */ (nextMatch(t)), bot = m.sides[1];
  assert.equal(m.sides[0], 0);
  win(t, 1);                                                   // the bot wins
  const played = t.rounds[m.round][m.index];
  assert.equal(played.winner, bot, 'the bot goes on');
  assert.equal(played.losses, 0, 'no replay counted');
  assert.notDeepEqual([nextMatch(t)?.round, nextMatch(t)?.index], [m.round, m.index], 'not the same match again');
  const left = t.rounds.flat().filter(r => r.winner === null).length;
  const skipped = skipBotMatches(t);
  assert.equal(skipped.length, left, 'SKIP BOT MATCHES runs to the end');
  assert.ok(skipped.every(n => !n.mustPlay && !n.players.includes(0)), 'every match left is a bots\' one; the human is out');
  assert.equal(nextMatch(t), null);
  const champ = /** @type {number} */ (champion(t));
  assert.ok(champ >= 1, 'a bot is champion');
  assert.deepEqual(humanRecord(t, 0), { wins: m.round, out: roundName(8 >> m.round), champion: false });
  assert.equal(humanRecord(t, champ).champion, true);

  // two humans, 4 players, both lose to bots in the first round
  const two = makeTournament(setup({ size: 4, humans: 2, seed: splitSeed() }));
  win(two, 1);
  win(two, 1);
  assert.deepEqual(two.rounds[0].map(r => r.winner).every(w => w !== null && w >= 2), true, 'both bots go on');
  const fin = /** @type {any} */ (nextMatch(two));
  assert.equal(fin.mustPlay, false);
  assert.equal(skipBotMatches(two).length, 1, 'the final, skipped');
  assert.ok(/** @type {number} */ (champion(two)) >= 2);
  for (const h of [0, 1]) assert.deepEqual(humanRecord(two, h), { wins: 0, out: 'SEMI-FINAL', champion: false });
});

test('S18b: with every human out, SKIP BOT MATCHES gives the same bracket as skipping one by one', () => {
  for (const [size, seed] of [[16, 4242], [8, 9], [4, 3], [16, 77]]) {
    const s = setup({ size, humans: 2, level: 6, seed });
    const one = makeTournament(s), all = makeTournament(s);
    for (let guard = 0; nextMatch(all) && guard < 100; guard++) {
      const m = /** @type {any} */ (nextMatch(all));
      if (m.mustPlay) {                                        // every human loses (to a bot, or to the other human)
        const loseSide = m.cpu[1] ? 1 : 0;
        win(all, loseSide);
        win(one, loseSide);
        continue;
      }
      const skipped = skipBotMatches(all);
      for (const k of skipped) {
        const n = /** @type {any} */ (nextMatch(one));
        assert.deepEqual([n.round, n.index], [k.round, k.index]);
        skipMatch(one);
      }
      assert.deepEqual(one.rounds, all.rounds, `${size}: the same bracket`);
    }
    assert.equal(nextMatch(all), null, `${size}: played to the end`);
    assert.ok(/** @type {number} */ (champion(all)) >= 2, `${size}: a bot is champion`);
  }
});

test('S18b: the matches\' seeds are as before (losses still 0)', () => {
  const t = makeTournament(setup({ size: 8, humans: 1, seed: 555 }));
  for (let m = nextMatch(t); m; m = nextMatch(t)) {
    assert.equal(m.seed, Math.floor(cpuRandom(555, 102, m.round, m.index, 0) * 2 ** 32) | 0);
    if (m.mustPlay) win(t, 1); else skipMatch(t);
  }
});

test('S18b: an old save with a lost match waiting for its replay loads and plays it once more', () => {
  const store = memStore();
  const t = makeTournament(setup({ size: 8, humans: 1, seed: 21 }));
  for (let m = nextMatch(t); m && !m.mustPlay; m = nextMatch(t)) skipMatch(t);
  const m = /** @type {any} */ (nextMatch(t));
  t.rounds[m.round][m.index].losses = 2;                       // as S17 saved it: lost twice to the bot, to replay
  saveTournament(store, t);
  const back = /** @type {any} */ (loadTournament(store));
  assert.ok(back, 'it loads');
  const again = /** @type {any} */ (nextMatch(back));
  assert.deepEqual([again.round, again.index], [m.round, m.index], 'the same match, once more');
  assert.equal(again.seed, Math.floor(cpuRandom(21, 102, m.round, m.index, 2) * 2 ** 32) | 0, 'with the seed it had');
  assert.equal(drawFixed(back), true, 'its draw is fixed');
  win(back, 1);                                                // lost again: now the human is out
  assert.equal(back.rounds[m.round][m.index].winner, m.sides[1]);
  assert.notDeepEqual([nextMatch(back)?.round, nextMatch(back)?.index], [m.round, m.index]);
});

test('S18b: NEW DRAW keeps the setup and characters, changes the order and seeds, only before the first result', () => {
  const t = makeTournament(setup({ size: 16, humans: 2, seed: 1 }));
  const before = structuredClone(t);
  assert.equal(drawFixed(t), false);
  newDraw(t, 2);
  assert.deepEqual({ ...t.setup, seed: 0 }, { ...before.setup, seed: 0 }, 'the setup and characters kept');
  assert.equal(t.setup.seed, 2);
  assert.deepEqual(t.order, drawOrder(16, 2));
  assert.notDeepEqual(t.order, before.order, 'a different draw');
  assert.deepEqual(t.rounds, before.rounds, 'nothing played');
  assert.notEqual(nextMatch(t)?.seed, nextMatch(before)?.seed, 'new match seeds');
  const store = memStore();
  saveTournament(store, t);
  assert.deepEqual(loadTournament(store)?.order, t.order, 'saved');
  if (nextMatch(t)?.mustPlay) win(t, 0); else skipMatch(t);
  assert.equal(drawFixed(t), true);
  assert.throws(() => newDraw(t, 3), /fixed/);
});

test('a result must have a winner with more points', () => {
  const t = makeTournament(setup());
  assert.throws(() => recordResult(t, 0, [3, 5]));
  assert.throws(() => recordResult(t, 0, [5, 5]));
});

test('skipping: only bots\' matches, with the real sim, and the same results on a second run', () => {
  const s = setup({ size: 16, humans: 1, level: 7, mode: 'rising', length: 5, seed: 4242 });
  const runs = [0, 1].map(() => {
    const t = makeTournament(s);
    const out = [];
    for (let m = nextMatch(t); m; m = nextMatch(t)) {
      if (m.mustPlay) {
        assert.throws(() => skipMatch(t), /two bots/);
        win(t, 0);
      } else {
        skipMatch(t);
        const p = t.rounds[m.round][m.index];
        assert.equal(p.skipped, true);
        const [a, b] = /** @type {[number, number]} */ (p.scores);
        assert.ok(Math.max(a, b) >= m.length && Math.abs(a - b) >= 2, `a real finish: ${a}–${b} in a game to ${m.length}`);
      }
      out.push(JSON.stringify(t.rounds[m.round][m.index]));
    }
    return out;
  });
  assert.deepEqual(runs[0], runs[1]);
  assert.equal(runs[0].length, 15);
});

test('S18: SKIP BOT MATCHES gives the same bracket as skipping one by one, and stops at a human\'s match', () => {
  for (const [size, humans, seed] of [[16, 1, 4242], [16, 2, 77], [8, 1, 9], [4, 1, 3], [2, 1, 5], [32, 1, 11]]) {
    const s = setup({ size, humans, level: 6, mode: 'rising', length: 5, seed });
    const one = makeTournament(s), all = makeTournament(s);
    let presses = 0;
    for (let guard = 0; nextMatch(all) && guard < 100; guard++) {
      const m = /** @type {any} */ (nextMatch(all));
      if (m.mustPlay) {                                        // the human wins, in both
        win(all, 0);
        win(one, 0);
        continue;
      }
      const skipped = skipBotMatches(all);
      presses++;
      assert.ok(skipped.length >= 1);
      assert.ok(!nextMatch(all) || nextMatch(all)?.mustPlay, 'it stops at the next human\'s match (or the end)');
      for (const k of skipped) {                               // the same matches, one by one
        const n = /** @type {any} */ (nextMatch(one));
        assert.deepEqual([n.round, n.index], [k.round, k.index]);
        skipMatch(one);
      }
      assert.deepEqual(one.rounds, all.rounds, `${size} players: the same bracket`);
    }
    assert.ok(champion(all) !== null && champion(all) === champion(one));
    assert.ok(presses <= roundCount(size), `${size}: one press a round at most (${presses})`);
  }
  // nothing to skip before a human's match
  const t = makeTournament(setup({ size: 2, humans: 2 }));
  assert.deepEqual(skipBotMatches(t), []);
  assert.equal(SETUP_SIZES.includes(32), false, 'the setup no longer offers 32');
  assert.deepEqual(SETUP_SIZES, [2, 4, 8, 16]);
  assert.ok(SIZES.includes(32), 'a 32 saved before S18 still loads');
});

test('a watched bots\' match ends as a skipped one does, and can be played out partway', () => {
  const t = makeTournament(setup({ size: 4, humans: 1, seed: 77 }));
  if (nextMatch(t)?.mustPlay) win(t, 0);
  const info = /** @type {any} */ (nextMatch(t));
  assert.equal(info.mustPlay, false);
  const skipped = structuredClone(t);
  skipMatch(skipped);
  const w = matchWorld(info), cpus = [makeCpu(w, 0), makeCpu(w, 1)];
  for (let i = 0; i < 3000; i++) stepWorld(w, cpuActions(cpus[0], w), cpuActions(cpus[1], w));   // watched for a while
  playOut(w, cpus);                                            // "Skip match" from the pause menu
  recordResult(t, /** @type {0 | 1} */ (w.match.winner), [w.match.scores[0], w.match.scores[1]], true);
  assert.deepEqual(t.rounds[info.round][info.index], skipped.rounds[info.round][info.index]);
});

test('saving: a tournament saved and loaded back; a broken, old or missing save is ignored', () => {
  const store = memStore();
  assert.equal(loadTournament(store), null);
  const t = makeTournament(setup({ size: 8, humans: 3 }));
  win(t, 0);
  assert.equal(saveTournament(store, t), true);
  assert.deepEqual(loadTournament(store), t);
  for (const raw of ['{', 'null', '[]', JSON.stringify({ ...t, version: 0 }), JSON.stringify({ ...t, order: [0, 0, 1, 2, 3, 4, 5, 6] }),
    JSON.stringify({ ...t, rounds: t.rounds.slice(1) }),
    JSON.stringify({ ...t, rounds: [[{ ...t.rounds[0][0], winner: 99 }, ...t.rounds[0].slice(1)], ...t.rounds.slice(1)] }),
    JSON.stringify({ ...t, rounds: [[{ ...t.rounds[0][0], scores: [0, 5] }, ...t.rounds[0].slice(1)], ...t.rounds.slice(1)] }),
    JSON.stringify({ ...t, setup: { ...t.setup, size: 3 } })]) {
    store.m.set(TOURNAMENT_KEY, raw);
    assert.equal(loadTournament(store), null, raw.slice(0, 60));
  }
  assert.equal(tournamentProblem(t), '');
  clearTournament(store);
  assert.equal(store.m.has(TOURNAMENT_KEY), false);
  // blocked storage
  assert.equal(saveTournament(null, t), false);
  assert.equal(loadTournament(null), null);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(saveTournament(throwing, t), false);
  assert.equal(loadTournament(throwing), null);
  clearTournament(throwing);
});

test('all humans: every match must be played; 2 players: the final only', () => {
  const t = makeTournament(setup({ size: 4, humans: 4 }));
  for (let m = nextMatch(t); m; m = nextMatch(t)) {
    assert.equal(m.mustPlay, true);
    assert.equal(m.level, 5);
    win(t, 1);
  }
  const two = makeTournament(setup({ size: 2, humans: 1, mode: 'rising', length: 7 }));
  assert.equal(nextMatch(two)?.name, 'FINAL');
  assert.equal(nextMatch(two)?.length, 7);
});
