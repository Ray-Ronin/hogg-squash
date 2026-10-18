// npm test — runs every golden test against both recorded MAME sessions.
import { execFileSync } from 'node:child_process';
const fixtures = ['test/fixtures/run2_frames.bin.gz', 'test/fixtures/run3_frames.bin.gz'];
for (const t of ['golden.test.js', 'flight.test.js', 'shot-select.test.js', 'hits.test.js']) {
  for (const f of fixtures) {
    const out = execFileSync('node', ['test/' + t, f], { encoding: 'utf8' }).split('\n')[0];
    console.log(`${t.padEnd(20)} ${f.split('/').pop().padEnd(16)} ${out}`);
  }
}
