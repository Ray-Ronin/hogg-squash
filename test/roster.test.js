// The roster (S15, S15b; node:test, run by npm test): characters.json read the way the game reads it, every entry and
// sheet checked against the contract (a broken one is left out, the rest kept), the recolours on the real sheet (skin
// everywhere, hair on the head only, the white kit still swapped), a character's own kit and front view, and each
// side's name.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseRoster, sheetProblems, sideNames, colouring, previewTag, NAME_SLOT, SHEET_CONTRACT } from '../public/hogg-squash/js/render/roster.js';
import { recolour, hairMask, parseSheet, KIT_SWAP } from '../public/hogg-squash/js/render/sprites.js';
import { parseFonts, measureWith, glyphFor } from '../public/hogg-squash/js/render/text.js';
import { SELECT_LAYOUT } from '../public/hogg-squash/js/ui/select.js';
import { readPng } from './png.js';

const A = 'public/hogg-squash/assets/';
const read = (/** @type {string} */ f) => JSON.parse(fs.readFileSync(A + f, 'utf8'));
const rosterJson = read('characters.json');
const sheetJson = read('player-100.json');
const zainJson = read('zain-100.json');

test('the roster: Ronin, Adam, Ben and Coach Zain, in that order, none left out', () => {
  const { characters, problems } = parseRoster(rosterJson);
  assert.deepEqual(problems, []);
  assert.deepEqual(characters.map(c => [c.id, c.name, c.sheet]),
    [['ronin', 'Ronin', 'player-100'], ['adam', 'Adam', 'player-100'], ['ben', 'Ben', 'player-100'], ['zain', 'Coach Zain', 'zain-100']]);
  assert.deepEqual(characters[1].skin, [], 'Adam is the sheet as drawn');
  assert.deepEqual(characters[1].hair, []);
  const zain = characters[3];
  assert.equal(zain.short, 'Zain');
  assert.deepEqual([zain.skin, zain.hair], [[], []], 'his skin and hair are drawn into his sheet');
  assert.deepEqual(zain.kit, [['#26252a', '#e6e6ea'], ['#3b3a41', '#ffffff'], ['#dcdce0', '#252429']], 'A7z\'s swap');
  assert.deepEqual(characters.slice(0, 3).map(c => [c.short, c.kit]), [[null, null], [null, null], [null, null]],
    'the recolours have neither');
});

test('every name is in the fonts it is drawn in, and the name each side shows fits the score panel\'s name slot', () => {
  const fonts = parseFonts(read('font.json'));
  const fits = (/** @type {string} */ n) => measureWith(fonts, 'large-white', n) <= NAME_SLOT;
  for (const c of parseRoster(rosterJson).characters) {
    for (const name of [c.name, c.short ?? c.name]) {
      for (const font of ['large-white', 'large-red', 'small', 'small-dark']) {
        for (const ch of `${name} ${name.toUpperCase()}'s point`) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch}`);
      }
    }
    const [shown] = sideNames([c, { name: 'Other' }], [false, true], fits);
    assert.equal(shown, fits(c.name) ? c.name : c.short, `${c.name} is named, not P1`);
    assert.ok(fits(shown), `${shown} fits ${NAME_SLOT} px`);
    assert.ok(measureWith(fonts, 'large-white', `${shown.toUpperCase()} WINS 11–9`) <= 306, `${shown}'s result line`);
  }
  assert.ok(!fits('Coach Zain'), 'the full name doesn\'t fit the slot: that is why he has a short one');
  for (const c of parseRoster(rosterJson).characters) {
    assert.ok(measureWith(fonts, 'small', c.name) <= SELECT_LAYOUT.CARD_W - 2 * 3, `${c.name} fits inside a picked card's frame`);
    assert.ok(measureWith(fonts, 'small', c.name) < SELECT_LAYOUT.CARD_STEP, `${c.name} stays off the next card`);
  }
});

test('a broken entry is left out with a reason, and the rest are kept', () => {
  const good = rosterJson.characters[1];
  const { characters, problems } = parseRoster({ characters: [
    good,
    { ...good },                                              // the same id again
    { id: 'Bad Id', name: 'X', sheet: 'player-100' },
    { id: 'noname', sheet: 'player-100' },
    { id: 'nosheet', name: 'N', sheet: '../x' },
    { id: 'red', name: 'R', sheet: 'player-100', hair: [['#3b261c', '#e8202a']] },   // a kit red
    { id: 'notcolour', name: 'C', sheet: 'player-100', skin: [['#f7ad7c']] },
    { id: 'ok2', name: 'Ok', sheet: 'player-100', skin: [['#f7ad7c', '#fbc6a0']] },
    { id: 'kitcolour', name: 'K', sheet: 'player-100', kit: [['#26252a', 'white']] },
    { id: 'kittwice', name: 'K', sheet: 'player-100', kit: [['#26252a', '#e6e6ea'], ['#26252a', '#ffffff']] },
    { id: 'kitempty', name: 'K', sheet: 'player-100', kit: [] },
    { id: 'kitword', name: 'K', sheet: 'player-100', kit: 'white' },
    { id: 'shortempty', name: 'K', short: ' ', sheet: 'player-100' },
    { id: 'shortnumber', name: 'K', short: 5, sheet: 'player-100' },
  ] });
  assert.deepEqual(characters.map(c => c.id), ['adam', 'ok2']);
  assert.equal(problems.length, 12);
  assert.match(problems[0], /used twice/);
  assert.match(problems[1], /lower-case/);
  assert.match(problems[2], /no name/);
  assert.match(problems[3], /sheet/);
  assert.match(problems[4], /kit red/);
  assert.match(problems[5], /pair/);
  assert.match(problems[6], /kit has .*pair/);
  assert.match(problems[7], /kit lists #26252a twice/);
  assert.match(problems[8], /kit isn't/);
  assert.match(problems[9], /kit isn't/);
  assert.match(problems[10], /short name/);
  assert.match(problems[11], /short name/);
  assert.deepEqual(parseRoster({}).characters, []);
  assert.equal(parseRoster(null).problems.length, 1);
});

test('player-100 keeps the sheet contract; a sheet that breaks it says how', () => {
  assert.deepEqual(sheetProblems(sheetJson), []);
  assert.deepEqual(Object.keys(SHEET_CONTRACT).sort(), sheetJson.meta.frameTags.map((/** @type {any} */ t) => t.name).sort());
  const broken = structuredClone(sheetJson);
  broken.meta.frameTags = broken.meta.frameTags.filter((/** @type {any} */ t) => t.name !== 'overhead');
  const fore = broken.meta.frameTags.find((/** @type {any} */ t) => t.name === 'forehand');
  fore.data = 'contact=2';
  broken.meta.slices = broken.meta.slices.filter((/** @type {any} */ s) => s.name !== 'racket dive');
  assert.deepEqual(sheetProblems(broken), ['forehand\'s contact frame is 2, not 3', 'no overhead tag', 'no "racket dive" slice']);
  const noFeet = structuredClone(sheetJson);
  noFeet.meta.slices = noFeet.meta.slices.filter((/** @type {any} */ s) => s.name !== 'feet');
  assert.match(sheetProblems(noFeet)[0], /can't be read.*feet/);
});

test('a character\'s own kit replaces the standard swap, for the P2 / CPU kit only', () => {
  const [ronin, adam, , zain] = parseRoster(rosterJson).characters;
  assert.deepEqual(colouring(zain, 0).swap, [], 'kit 0 is his sheet as drawn');
  assert.deepEqual(colouring(zain, 1).swap, zain.kit, 'kit 1 is his own swap');
  assert.deepEqual(colouring(adam, 0).swap, []);
  assert.equal(colouring(adam, 1).swap, KIT_SWAP, 'no kit: the standard swap');
  assert.equal(colouring(ronin, 1).swap, KIT_SWAP, 'the recolours are unchanged');
  assert.deepEqual(colouring(ronin, 1).skin, ronin.skin);
  const { characters, problems } = parseRoster({ characters: [
    { id: 'reds', name: 'R', sheet: 'player-100', kit: [['#e8202a', '#1f4fa8']] },
  ] });
  assert.deepEqual(problems, [], 'unlike a recolour, a kit may take a kit red: it replaces the swap that owns them');
  assert.deepEqual(characters[0].kit, [['#e8202a', '#1f4fa8']]);
});

test('front_ready is optional; a broken one says how, and the select screen plays it when it is there', () => {
  assert.equal(previewTag(parseSheet(sheetJson)), 'ready', 'player-100 has none: `ready` from the back');
  assert.equal(previewTag(parseSheet(zainJson)), 'front_ready');
  const tagOf = (/** @type {any} */ j) => j.meta.frameTags.find((/** @type {any} */ t) => t.name === 'front_ready');
  const once = structuredClone(zainJson);
  tagOf(once).repeat = '1';
  assert.deepEqual(sheetProblems(once), ['front_ready should loop']);
  const empty = structuredClone(zainJson);
  tagOf(empty).to = tagOf(empty).from - 1;
  assert.deepEqual(sheetProblems(empty), ['front_ready has no frames']);
  const outside = structuredClone(zainJson);
  tagOf(outside).to = 999;
  assert.match(sheetProblems(outside)[0], /can't be read/);
});

test('Zain\'s sheet keeps the contract, with the same timings as player-100 and an 8-frame front view', () => {
  assert.deepEqual(sheetProblems(zainJson), []);
  const zain = parseSheet(zainJson), player = parseSheet(sheetJson);
  assert.deepEqual([zain.frameW, zain.frameH, zain.pivot], [player.frameW, player.frameH, player.pivot]);
  for (const name of Object.keys(SHEET_CONTRACT)) {
    assert.deepEqual([zain.tags[name].starts, zain.tags[name].length], [player.tags[name].starts, player.tags[name].length],
      `${name}: the contact frame shows on the sim's contact step`);
  }
  assert.equal(zain.tags.front_ready.count, 8);
});

test('Zain\'s white kit on every frame: the shirt and print are gone, and nothing but them changes', () => {
  const img = readPng(A + 'zain-100.png');
  const cells = zainJson.frames.map((/** @type {any} */ f) => ({ x: f.frame.x, y: f.frame.y }));
  const zain = parseRoster(rosterJson).characters[3];
  const rgb = (/** @type {string} */ h) => parseInt(h.slice(1), 16);
  const px = (/** @type {Uint8Array} */ d, /** @type {number} */ i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
  const swap = new Map((zain.kit ?? []).map(([f, t]) => [rgb(f), rgb(t)]));
  const white = new Uint8Array(img.data), red = new Uint8Array(img.data);
  recolour(white, img.w, cells, 150, 150, colouring(zain, 1));
  recolour(red, img.w, cells, 150, 150, colouring(zain, 0));
  assert.deepEqual(red, img.data, 'the black shirt is the sheet as drawn');
  cells.forEach((/** @type {{ x: number, y: number }} */ cell, fi) => {
    let shirt = 0;
    for (let y = 0; y < 150; y++) {
      for (let x = 0; x < 150; x++) {
        const i = ((cell.y + y) * img.w + cell.x + x) * 4;
        if (!img.data[i + 3]) continue;
        const was = px(img.data, i), now = px(white, i);
        if (swap.has(was)) shirt++;
        assert.ok(!swap.has(now), `frame ${fi}: no shirt colour left at ${x},${y}`);
        assert.equal(now, swap.get(was) ?? was, `frame ${fi}: ${x},${y} takes the swap, or stays`);
      }
    }
    assert.ok(shirt > 150, `frame ${fi} has a shirt (${shirt} px)`);
  });
});

test('every kit swap and recolour uses colours that are real: on the character\'s sheet, and in the palette', () => {
  const palette = new Set();
  for (const l of fs.readFileSync('art/palette/hogg-squash.gpl', 'utf8').split(/\r?\n/)) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s/.exec(l);
    if (m) palette.add(`#${[m[1], m[2], m[3]].map(v => Number(v).toString(16).padStart(2, '0')).join('')}`);
  }
  for (const c of parseRoster(rosterJson).characters) {
    const img = readPng(`${A}${c.sheet}.png`), seen = new Set();
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i + 3]) seen.add(`#${[0, 1, 2].map(k => img.data[i + k].toString(16).padStart(2, '0')).join('')}`);
    }
    for (const [what, list] of /** @type {const} */ ([['kit', c.kit ?? []], ['skin', c.skin], ['hair', c.hair]])) {
      for (const [from, to] of list) {
        assert.ok(seen.has(from), `${c.id}'s ${what}: ${from} isn't on ${c.sheet}, so the swap would do nothing`);
        assert.ok(palette.has(to), `${c.id}'s ${what}: ${to} isn't in the palette`);
      }
    }
  }
});

test('the recolours on the real sheet: skin everywhere, hair on the head only, the kit swap as before', () => {
  const img = readPng(A + 'player-100.png');
  const cells = sheetJson.frames.map((/** @type {any} */ f) => ({ x: f.frame.x, y: f.frame.y }));
  const ronin = parseRoster(rosterJson).characters[0];
  const rgb = (/** @type {string} */ h) => parseInt(h.slice(1), 16);
  const px = (/** @type {Uint8Array} */ d, /** @type {number} */ i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
  const hairFrom = new Set(ronin.hair.map(([f]) => rgb(f)));
  const skin = new Map(ronin.skin.map(([f, t]) => [rgb(f), rgb(t)]));
  const hair = new Map(ronin.hair.map(([f, t]) => [rgb(f), rgb(t)]));
  const kit = new Map(KIT_SWAP.map(([f, t]) => [rgb(f), rgb(t)]));
  const dive = sheetJson.meta.frameTags.find((/** @type {any} */ t) => t.name === 'dive');
  for (const white of [false, true]) {
    const d = new Uint8Array(img.data);
    recolour(d, img.w, cells, 150, 150, { swap: white ? KIT_SWAP : [], skin: ronin.skin, hair: ronin.hair });
    let hairPx = 0, kept = 0;
    cells.forEach((/** @type {{ x: number, y: number }} */ cell, fi) => {
      const mask = hairMask(img.data, img.w, cell, 150, 150, hairFrom);
      let n = 0, bottom = 0, sumX = 0;
      for (let y = 0; y < 150; y++) {
        for (let x = 0; x < 150; x++) {
          const i = ((cell.y + y) * img.w + cell.x + x) * 4;
          if (!img.data[i + 3]) continue;
          const was = px(img.data, i), now = px(d, i);
          if (mask[y * 150 + x]) {
            n++; bottom = Math.max(bottom, y); sumX += x;
            assert.equal(now, hair.get(was), 'the head\'s hair takes the hair colours');
          } else if (hairFrom.has(was)) {
            assert.equal(now, was, 'hair colours off the head (the shorts\' shading) stay');
            kept++;
          } else {
            assert.equal(now, skin.get(was) ?? (white ? kit.get(was) : undefined) ?? was, `frame ${fi}: skin, kit or unchanged`);
          }
        }
      }
      hairPx += n;
      assert.ok(n >= 25 && n <= 90, `frame ${fi}: the head's hair is one head's worth (${n} px)`);
      // the body stands from y 48 to the soles at 148: the hair is in its top quarter, or leads the dive to the right
      if (fi >= dive.from && fi <= dive.to) assert.ok(sumX / n > 73, `frame ${fi}: the dive's head end`);
      else assert.ok(bottom < 75, `frame ${fi}: on the head (bottom ${bottom})`);
    });
    assert.ok(hairPx > 3000 && kept > 5000, `hair recoloured ${hairPx}, shading kept ${kept}`);
  }
});

test('names: the character\'s, else its short one, or P1 / P2 / CPU without a roster, when neither fits, or in a mirror match', () => {
  const fits = (/** @type {string} */ n) => n.length <= 6;
  const ch = (/** @type {string} */ name, /** @type {string} [short] */ short) => ({ name, short });
  assert.deepEqual(sideNames([ch('Ronin'), ch('Adam')], [false, true], fits), ['Ronin', 'Adam']);
  assert.deepEqual(sideNames([ch('Ronin'), ch('Ronin')], [false, true], fits), ['P1', 'CPU'], 'a mirror match');
  assert.deepEqual(sideNames([ch('Ben'), ch('Ben')], [false, false], fits), ['P1', 'P2']);
  assert.deepEqual(sideNames([null, null], [false, false], fits), ['P1', 'P2'], 'no roster');
  assert.deepEqual(sideNames([ch('Bartholomew'), ch('Ben')], [false, true], fits), ['P1', 'CPU'], 'a name too wide');
  assert.deepEqual(sideNames([ch('Coach Zain', 'Zain'), ch('Ben')], [false, true], fits), ['Zain', 'Ben'], 'the short name');
  assert.deepEqual(sideNames([ch('Ben'), ch('Coach Zain', 'Zain')], [false, true], fits), ['Ben', 'Zain'], 'as P2 / CPU too');
  assert.deepEqual(sideNames([ch('Zain', 'Z'), ch('Ben')], [false, true], fits), ['Zain', 'Ben'], 'the full name first, if it fits');
  assert.deepEqual(sideNames([ch('Coach Zain', 'Coach Z.'), ch('Ben')], [false, true], fits), ['P1', 'CPU'], 'neither fits');
  assert.deepEqual(sideNames([ch('Coach Zain', 'Zain'), ch('Coach Zain', 'Zain')], [false, true], fits), ['P1', 'CPU'], 'a Zain mirror match');
  assert.deepEqual(sideNames([ch('Coach Zain', 'Ben'), ch('Ben')], [false, false], fits), ['P1', 'P2'], 'two characters who would read the same');
});
