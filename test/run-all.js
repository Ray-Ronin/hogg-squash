// npm test: runs every golden test against both recorded MAME sessions and compares each summary line with
// test/baselines.json, then runs the unit tests (node:test). Exits 1 if any number drops or a unit test fails.
// `node test/run-all.js --record` rewrites the baselines from the current results (only do this on purpose).
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const BASELINES = 'test/baselines.json';
const fixtures = ['test/fixtures/run2_frames.bin.gz', 'test/fixtures/run3_frames.bin.gz'];
const UNIT_TESTS = ['test/rules.test.js', 'test/match.test.js', 'test/world.test.js', 'test/actors.test.js', 'test/player.test.js', 'test/cpu.test.js', 'test/difficulty.test.js', 'test/input.test.js', 'test/sprites.test.js', 'test/hud.test.js', 'test/screens.test.js', 'test/keymap.test.js'];

/** Read numbers out of each golden test's first line, and say which must not change and which must not drop. */
const GOLDEN = {
  'golden.test.js': {
    re: /frames tested (\d+), exact match (\d+)/, names: ['tested', 'exact'], same: ['tested'], atLeast: ['exact'],
  },
  'flight.test.js': {
    re: /flights (\d+), ended only by a racket hit \/ rally end: (\d+), frames simulated with zero error: (\d+), longest flight (\d+)/,
    names: ['flights', 'explained', 'frames', 'longest'], same: [], atLeast: ['flights', 'frames', 'longest'],
    extra: (v, out) => [
      v.explained !== v.flights && `${v.flights - v.explained} flights diverged without a racket hit`,
      /unexplained divergences/.test(out) && 'unexplained divergences reported',
    ],
  },
  'shot-select.test.js': {
    re: /shot loads (\d+), classifier reproduced (\d+)/, names: ['loads', 'reproduced'], same: ['loads'], atLeast: [],
    extra: v => [v.reproduced !== v.loads && `classifier reproduced ${v.reproduced}/${v.loads}, not 100%`],
  },
  'hits.test.js': {
    re: /hits (\d+), formula matched exactly (\d+)/, names: ['hits', 'matched'], same: ['hits'], atLeast: ['matched'],
  },
};

const record = process.argv.includes('--record');
const baselines = record ? {} : JSON.parse(fs.readFileSync(BASELINES, 'utf8')).results;
const failures = [];
let checks = 0;

for (const [t, spec] of Object.entries(GOLDEN)) {
  for (const f of fixtures) {
    const name = f.split('/').pop();
    let out;
    try { out = execFileSync('node', ['test/' + t, f], { encoding: 'utf8' }); }
    catch (e) { failures.push(`${t} ${name}: crashed\n${e.stderr || e.message}`); console.log(`${t.padEnd(20)} ${name.padEnd(16)} CRASHED`); continue; }
    const first = out.split('\n')[0];
    const m = first.match(spec.re);
    const problems = [];
    if (!m) problems.push(`summary line not recognised: ${first}`);
    else {
      /** @type {Record<string, number>} */
      const v = Object.fromEntries(spec.names.map((n, i) => [n, Number(m[i + 1])]));
      if (record) (baselines[t] ??= {})[name] = v;
      else {
        const base = baselines[t]?.[name];
        if (!base) problems.push('no baseline recorded');
        else {
          for (const k of spec.same) if (v[k] !== base[k]) problems.push(`${k} ${v[k]}, baseline ${base[k]}`);
          for (const k of spec.atLeast) if (v[k] < base[k]) problems.push(`${k} dropped to ${v[k]} from ${base[k]}`);
        }
      }
      if (spec.extra) problems.push(.../** @type {string[]} */ (spec.extra(v, out).filter(Boolean)));
    }
    checks++;
    console.log(`${t.padEnd(20)} ${name.padEnd(16)} ${problems.length ? 'FAIL' : 'ok  '} ${first}`);
    for (const p of problems) failures.push(`${t} ${name}: ${p}`);
  }
}

if (record) {
  const doc = {
    note: 'Golden-test results that npm test must not drop below. Written by `node test/run-all.js --record`.',
    recorded: new Date().toLocaleDateString('sv'),      // local date as YYYY-MM-DD
    results: baselines,
  };
  fs.writeFileSync(BASELINES, JSON.stringify(doc, null, 2) + '\n');
  console.log(`\nBaselines written to ${BASELINES}.`);
  process.exit(failures.length ? 1 : 0);
}

// unit tests (node:test); the spec reporter's summary gives the counts, and its failure section the details
const unit = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...UNIT_TESTS], { encoding: 'utf8' });
const count = (/** @type {string} */ k) => Number((unit.stdout.match(new RegExp(`^ℹ ${k} (\\d+)`, 'm')) ?? [])[1] ?? NaN);
const pass = count('pass'), fail = count('fail');
checks++;
console.log(`${'unit tests'.padEnd(37)} ${unit.status === 0 ? 'ok  ' : 'FAIL'} ${pass} passed, ${fail} failed (${UNIT_TESTS.map(f => f.split('/').pop()).join(', ')})`);
if (unit.status !== 0) {
  failures.push(`unit tests: exit code ${unit.status}, ${fail} failed`);
  const at = unit.stdout.indexOf('✖ failing tests');
  console.log(at >= 0 ? unit.stdout.slice(at) : unit.stdout);
  if (unit.stderr) console.log(unit.stderr);
}

console.log('');
if (failures.length) {
  console.log(`FAILED: ${failures.length} problem(s) in ${checks} checks`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`All ${checks} checks passed (golden numbers at or above test/baselines.json, unit tests green).`);
