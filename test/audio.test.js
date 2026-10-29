// The sound engine's parts that need no audio (node:test, run by npm test): the event → sound table covers every
// event type, ball collision and rally reason; a whole CPU-against-CPU match only ever asks for known sounds, in the
// order they happen; every sound has a placeholder made in code; the menus' sounds; the Effects level and Sound
// on/off saved, loaded and clamped (with localStorage mocked: working, empty, damaged, blocked and full); sfx.json
// checked; and the options' Effects item and the pause menu's Sound on/off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SOUNDS, EVENT_SOUNDS, BALL_SOUNDS, REASON_SOUNDS, soundsFor, menuSound, menuState }
  from '../public/hogg-squash/js/audio/sounds.js';
import { RECIPES, render } from '../public/hogg-squash/js/audio/synth.js';
import { SOUND_KEY, SOUND_LEVELS, clampLevel, levelGain, defaultSound, loadSound, saveSound, parseSfx }
  from '../public/hogg-squash/js/audio/audio.js';
import { makeUi, navigate, toggleSound, optionLabels, pauseLabels, EFFECTS_SEL, OPTION_ITEMS, KEY_CELLS }
  from '../public/hogg-squash/js/ui/screens.js';
import { makeWorld, stepWorld } from '../public/hogg-squash/js/sim/world.js';
import { makeCpu, cpuActions } from '../public/hogg-squash/js/sim/cpu.js';

/** A localStorage stand-in. */
function memoryStore(init = {}) {
  const data = new Map(Object.entries(init));
  return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, String(v)); } };
}

/** Every event type in world.js's WorldEvent, with one example each. */
const EXAMPLES = [
  { type: 'hit', side: 0, kind: 'swing', button: 'hard', reach: true },
  { type: 'swing', side: 0, kind: 'swing', button: 'soft', reach: false },
  { type: 'serveSwing', side: 0, button: 'hard' },
  { type: 'serve', side: 0, button: 'hard' },
  { type: 'ball', ev: 'frontWall', x: 0, y: 40, z: 0 },
  { type: 'rally', winner: 1, reason: 'down', scores: [0, 1] },
  { type: 'newRally', server: 1 },
  { type: 'match', winner: 1, scores: [0, 9] },
  { type: 'rematch', server: 0 },
];

test('the table covers every event type, ball collision and rally reason, with known sound names', () => {
  const world = fs.readFileSync('public/hogg-squash/js/sim/world.js', 'utf8');
  const types = [...world.matchAll(/\{ type: '([a-zA-Z]+)'(?: \| '([a-zA-Z]+)')?/g)].flatMap(m => [m[1], m[2]]).filter(Boolean);
  assert.deepEqual(new Set(types), new Set(Object.keys(EVENT_SOUNDS)), 'WorldEvent types = the table');
  assert.deepEqual(Object.keys(BALL_SOUNDS).sort(), ['backGlass', 'floor', 'frontWall', 'sideWall']);
  assert.deepEqual(Object.keys(REASON_SOUNDS).sort(), ['down', 'notUp', 'out', 'tin']);
  for (const e of EXAMPLES) for (const s of soundsFor([/** @type {any} */ (e)])) assert.ok(SOUNDS.includes(s), s);
  for (const s of [...Object.values(BALL_SOUNDS), ...Object.values(REASON_SOUNDS)]) {
    if (s) assert.ok(SOUNDS.includes(s), s);
  }
});

test('the sounds by what happened: HARD / SOFT / dive hits, misses, the serve, the walls, the tin, the jingles', () => {
  const one = e => soundsFor([e]);
  assert.deepEqual(one({ type: 'hit', kind: 'swing', button: 'hard', reach: true }), ['hit-hard']);
  assert.deepEqual(one({ type: 'hit', kind: 'swing', button: 'soft', reach: true }), ['hit-soft']);
  assert.deepEqual(one({ type: 'hit', kind: 'dive', button: 'hard', reach: true }), ['hit-dive']);
  assert.deepEqual(one({ type: 'swing', kind: 'swing', button: 'hard', reach: false }), ['swing-hard']);
  assert.deepEqual(one({ type: 'swing', kind: 'swing', button: 'soft', reach: true }), [], 'its hit sounds on contact');
  assert.deepEqual(one({ type: 'swing', kind: 'dive', button: 'soft', reach: true }), ['dive']);
  assert.deepEqual(one({ type: 'serveSwing', button: 'hard' }), [], 'the serve sounds on the launch');
  assert.deepEqual(one({ type: 'serve', button: 'soft' }), ['serve']);
  for (const [ev, s] of Object.entries(BALL_SOUNDS)) assert.deepEqual(one({ type: 'ball', ev }), [s]);
  // a rally's end: the reason's sound replaces the ball's on that step, then the callout's jingle
  const end = (ev, reason) => soundsFor([{ type: 'ball', ev }, { type: 'rally', reason, winner: 0, scores: [1, 0] }]);
  assert.deepEqual(end('frontWall', 'tin'), ['tin', 'point']);
  assert.deepEqual(end('sideWall', 'out'), ['out', 'point']);
  assert.deepEqual(end('floor', 'down'), ['floor', 'point']);
  assert.deepEqual(end('floor', 'notUp'), ['floor', 'point']);
  assert.deepEqual(soundsFor([{ type: 'rally', reason: 'out', winner: 0, scores: [1, 0] }]), ['out', 'point'],
    'out with no collision that step (over the back glass)');
  assert.deepEqual(one({ type: 'match', winner: 0, scores: [9, 3] }), ['game']);
  assert.deepEqual(one({ type: 'newRally', server: 0 }), []);
});

test('a whole CPU match: only known sounds; each hit before its front wall; a point gets its jingle; nothing in the freeze', () => {
  const w = makeWorld({ target: 5, seed: 7, cpu: [true, true] });
  const cpus = [makeCpu(w, 0), makeCpu(w, 1)];
  const heard = [];
  let points = 0, hits = 0, freezeSounds = 0;
  for (let i = 0; i < 200000 && w.phase !== 'over'; i++) {
    const frozen = w.phase === 'point';
    const events = stepWorld(w, cpuActions(cpus[0], w), cpuActions(cpus[1], w));
    const s = soundsFor(events);
    for (const n of s) assert.ok(SOUNDS.includes(n), n);
    if (frozen) freezeSounds += s.filter(n => n !== 'game').length;
    points += events.filter(e => e.type === 'rally').length;
    hits += events.filter(e => e.type === 'hit').length;
    heard.push(...s);
  }
  assert.equal(w.phase, 'over', 'the match finished');
  assert.equal(heard.filter(n => n === 'point').length, points, 'one callout jingle per point');
  assert.equal(heard.filter(n => n === 'game').length, 1);
  assert.equal(heard.filter(n => n.startsWith('hit-')).length, hits);
  assert.equal(freezeSounds, 0, 'only the jingles in the point freeze');
  // after every racket hit or serve, the next ball sound is the front wall (or the tin / out that replaced it), or the
  // rally ended first
  for (let i = 0; i < heard.length; i++) {
    if (!heard[i].startsWith('hit-') && heard[i] !== 'serve') continue;
    const next = heard.slice(i + 1).find(n => ['wall-front', 'wall-side', 'floor', 'glass', 'tin', 'out', 'point'].includes(n));
    assert.ok(['wall-front', 'wall-side', 'glass', 'tin', 'out', 'point'].includes(next ?? 'none'), `after ${heard[i]}: ${next}`);
  }
});

test('every sound has a placeholder made in code: short, not silent, never clipping', () => {
  assert.deepEqual(Object.keys(RECIPES).sort(), [...SOUNDS].sort());
  for (const name of SOUNDS) {
    const s = render(RECIPES[name], 48000);
    const peak = s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    assert.ok(s.length > 0 && s.length < 48000 * 1.5, `${name}: ${s.length} samples`);
    assert.ok(peak > 0.05 && peak <= 0.9 + 1e-6, `${name}: peak ${peak}`);
    assert.ok(s.every(Number.isFinite), name);
    assert.ok(Math.abs(s[s.length - 1]) < 0.01, `${name} ends at silence`);
  }
  assert.deepEqual(render(RECIPES['hit-hard'], 44100), render(RECIPES['hit-hard'], 44100), 'the same every time');
});

test('menu sounds: a tick for a move, OK on, back back, nothing if nothing changed, silent into the pause menu', () => {
  const st = (screen, sel = 0, listen = false) => ({ screen, sel, listen });
  assert.equal(menuSound('down', st('title', 0), st('title', 1), null), 'menu-move');
  assert.equal(menuSound('ok', st('title', 0), st('length', 2), null), 'menu-ok');
  assert.equal(menuSound('back', st('length', 2), st('title', 0), null), 'menu-back');
  assert.equal(menuSound('left', st('length', 0), st('length', 0), null), null, 'at the end of the row');
  assert.equal(menuSound('ok', st('options', 0), st('options', 0, true), null), 'menu-ok', 'waiting for a key');
  assert.equal(menuSound('right', st('options', EFFECTS_SEL), st('options', EFFECTS_SEL), 'sound'), 'menu-move');
  assert.equal(menuSound('back', st('match'), st('pause'), null), null);
  assert.equal(menuSound('ok', st('assign'), st('match'), 'start'), 'menu-ok');
  const ui = makeUi();
  assert.deepEqual(menuState(ui), { screen: 'title', sel: 0, listen: false });
});

test('the sound settings: defaults, saved and loaded, clamped; damaged, blocked or full storage never throws', () => {
  assert.deepEqual(defaultSound(), { level: 7, on: true });
  assert.equal(SOUND_LEVELS.DEFAULT, 7);
  for (const [v, want] of [[0, 0], [10, 10], [15, 10], [-3, 0], [6.6, 7], ['4', 4], ['x', 7], [NaN, 7], [null, 7],
    [undefined, 7], ['', 7]]) {
    assert.equal(clampLevel(v), want, String(v));
  }
  assert.equal(levelGain(0), 0);
  assert.equal(levelGain(10), 1);
  assert.ok(levelGain(7) > levelGain(6) && levelGain(7) < levelGain(8));

  const store = memoryStore();
  assert.deepEqual(loadSound(store), defaultSound(), 'empty storage');
  assert.equal(saveSound(store, { level: 3, on: false }), true);
  assert.deepEqual(loadSound(store), { level: 3, on: false });
  assert.deepEqual(JSON.parse(store.data.get(SOUND_KEY)), { version: 1, level: 3, on: false });
  assert.deepEqual(loadSound(memoryStore({ [SOUND_KEY]: JSON.stringify({ version: 1, level: 99, on: true }) })),
    { level: 10, on: true }, 'a saved level out of range is clamped');
  assert.deepEqual(loadSound(memoryStore({ [SOUND_KEY]: '{not json' })), defaultSound(), 'damaged');
  assert.deepEqual(loadSound(memoryStore({ [SOUND_KEY]: JSON.stringify({ version: 2, level: 1 }) })), defaultSound(),
    'another version');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadSound(blocked), defaultSound());
  assert.equal(saveSound(blocked, defaultSound()), false);
  assert.equal(saveSound(null, defaultSound()), false);
  assert.deepEqual(loadSound(null), defaultSound());
});

test('sfx.json: known names with files are taken; the rest are warnings, not errors; the shipped one is valid', () => {
  const { sounds, warnings } = parseSfx({ version: 1, sounds: {
    'hit-hard': { files: ['hit-hard-1.mp3', 'hit-hard-2.mp3'], level: 0.8 },
    floor: { files: ['floor.mp3'] },
    tin: { files: ['tin.mp3'], level: 3 },
    nope: { files: ['x.mp3'] },
    serve: { files: [] },
  } });
  assert.deepEqual([...sounds.keys()].sort(), ['floor', 'hit-hard', 'tin']);
  assert.deepEqual(sounds.get('hit-hard'), { files: ['hit-hard-1.mp3', 'hit-hard-2.mp3'], level: 0.8 });
  assert.equal(sounds.get('floor')?.level, 1, 'level defaults to 1');
  assert.equal(sounds.get('tin')?.level, 1, 'and is clamped to 0–1');
  assert.equal(warnings.length, 2);
  assert.deepEqual(parseSfx(null).sounds.size, 0);
  const shipped = parseSfx(JSON.parse(fs.readFileSync('public/hogg-squash/assets/sfx/sfx.json', 'utf8')));
  assert.deepEqual(shipped.warnings, []);
  for (const [name, { files }] of shipped.sounds) {
    for (const f of files) assert.ok(fs.existsSync(`public/hogg-squash/assets/sfx/${f}`), `${name}: ${f} is shipped`);
  }
});

test('options: the Effects item, Off or 1–10; pause: Sound on/off; both report a sound change', () => {
  const ui = makeUi();
  navigate(ui, 'down'); navigate(ui, 'down'); navigate(ui, 'ok');           // OPTIONS
  ui.sel = EFFECTS_SEL;
  assert.equal(OPTION_ITEMS[EFFECTS_SEL - KEY_CELLS], 'EFFECTS');
  assert.equal(optionLabels(ui)[EFFECTS_SEL - KEY_CELLS], 'EFFECTS 7');
  assert.equal(navigate(ui, 'right'), 'sound');
  assert.equal(ui.sound.level, 8);
  for (let i = 0; i < 5; i++) navigate(ui, 'right');
  assert.equal(ui.sound.level, 10);
  assert.equal(navigate(ui, 'right'), null, 'stops at 10');
  assert.equal(navigate(ui, 'ok'), 'sound', 'OK steps on, wrapping to Off (for taps)');
  assert.equal(ui.sound.level, 0);
  assert.equal(optionLabels(ui)[EFFECTS_SEL - KEY_CELLS], 'EFFECTS OFF');
  assert.equal(navigate(ui, 'left'), null, 'stops at Off');
  navigate(ui, 'ok');
  assert.equal(ui.sound.level, 1);
  navigate(ui, 'down');
  assert.equal(OPTION_ITEMS[ui.sel - KEY_CELLS], 'BACK');

  const m = makeUi({}, 'match');
  navigate(m, 'back');
  navigate(m, 'down'); navigate(m, 'down');
  assert.equal(pauseLabels(m)[m.sel], 'SOUND ON');
  assert.equal(navigate(m, 'ok'), 'sound');
  assert.equal(m.sound.on, false);
  assert.equal(m.screen, 'pause', 'stays on the pause menu');
  assert.equal(pauseLabels(m)[2], 'SOUND OFF');
  assert.equal(navigate(m, 'right'), 'sound');
  assert.equal(m.sound.on, true);
  assert.equal(toggleSound(m), 'sound', 'the speaker button');
  assert.equal(m.sound.on, false);
});
