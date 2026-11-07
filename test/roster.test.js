// The roster (S15, node:test, run by npm test): characters.json read the way the game reads it, every entry and sheet
// checked against the contract (a broken one is left out, the rest kept), the recolours on the real sheet (skin
// everywhere, hair on the head only, the white kit still swapped), and each side's name.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseRoster, sheetProblems, sideNames, NAME_SLOT, SHEET_CONTRACT } from '../public/hogg-squash/js/render/roster.js';
import { recolour, hairMask, KIT_SWAP } from '../public/hogg-squash/js/render/sprites.js';
import { parseFonts, measureWith, glyphFor } from '../public/hogg-squash/js/render/text.js';
import { readPng } from './png.js';

const A = 'public/hogg-squash/assets/';
const read = (/** @type {string} */ f) => JSON.parse(fs.readFileSync(A + f, 'utf8'));
const rosterJson = read('characters.json');
const sheetJson = read('player-100.json');

test('the roster: Ronin, Adam, Ben and Will, in that order, all on player-100, none left out', () => {
  const { characters, problems } = parseRoster(rosterJson);
  assert.deepEqual(problems, []);
  assert.deepEqual(characters.map(c => [c.id, c.name, c.sheet]),
    [['ronin', 'Ronin', 'player-100'], ['adam', 'Adam', 'player-100'], ['ben', 'Ben', 'player-100'], ['will', 'Will', 'player-100']]);
  assert.deepEqual(characters[1].skin, [], 'Adam is the sheet as drawn');
  assert.deepEqual(characters[1].hair, []);
});

test('every name is in the fonts it is drawn in and fits the score panel\'s name slot', () => {
  const fonts = parseFonts(read('font.json'));
  for (const c of parseRoster(rosterJson).characters) {
    for (const font of ['large-white', 'large-red', 'small', 'small-dark']) {
      for (const ch of `${c.name} ${c.name.toUpperCase()}'s point`) if (ch !== ' ') assert.ok(glyphFor(fonts[font], ch), `${font} has ${ch}`);
    }
    assert.ok(measureWith(fonts, 'large-white', c.name) <= NAME_SLOT, `${c.name} fits ${NAME_SLOT} px`);
    assert.ok(measureWith(fonts, 'large-white', `${c.name.toUpperCase()} WINS 11–9`) <= 306, `${c.name}'s result line`);
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
  ] });
  assert.deepEqual(characters.map(c => c.id), ['adam', 'ok2']);
  assert.equal(problems.length, 6);
  assert.match(problems[0], /used twice/);
  assert.match(problems[1], /lower-case/);
  assert.match(problems[2], /no name/);
  assert.match(problems[3], /sheet/);
  assert.match(problems[4], /kit red/);
  assert.match(problems[5], /pair/);
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

test('names: the characters\', or P1 / P2 / CPU without a roster, when one doesn\'t fit, or in a mirror match', () => {
  const fits = (/** @type {string} */ n) => n.length <= 6;
  assert.deepEqual(sideNames(['Ronin', 'Adam'], [false, true], fits), ['Ronin', 'Adam']);
  assert.deepEqual(sideNames(['Ronin', 'Ronin'], [false, true], fits), ['P1', 'CPU'], 'a mirror match');
  assert.deepEqual(sideNames(['Ben', 'Ben'], [false, false], fits), ['P1', 'P2']);
  assert.deepEqual(sideNames([null, null], [false, false], fits), ['P1', 'P2'], 'no roster');
  assert.deepEqual(sideNames(['Bartholomew', 'Will'], [false, true], fits), ['P1', 'CPU'], 'a name too wide');
});
