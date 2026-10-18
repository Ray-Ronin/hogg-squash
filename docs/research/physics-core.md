# Hogg Squash — physics core (verified against the 1992 arcade)

`public/hogg-squash/js/squash-physics.js` (moved from `prototype/src/` on 2026-10-18) is a dependency-free JavaScript port of the ball physics and shot system of Gaelco's Squash (1992),
reverse-engineered from the ROM and **checked frame-by-frame against the real game running in MAME**.

It uses integer 16.16 fixed-point maths like the original 68000 code, so every browser gets bit-identical results.
That's what makes deterministic online play (lockstep / rollback netcode) possible.

## Run the tests
```
npm test
```
Run from the repo root. Needs Node 18+. The tests replay two recorded MAME sessions (`test/fixtures/*.bin.gz`, about 92,000 frames of real
gameplay logged by `mame_run/squash_probe2.lua` / `squash_probe3.lua`, which live in `../Research Info/`). The fixtures are recorded game-state numbers (ball and player positions per frame), not the game's art or sound.

| Test | What it checks | Result |
|---|---|---|
| `flight.test.js` | Start from the ball state after a hit and simulate the whole flight with **no corrections**; every frame must equal the arcade | **458 flights, 29,634 frames, zero error** |
| `golden.test.js` | One-frame steps over every live frame | 99.4% exact; every mismatch is a racket hit (handled by the next tests) |
| `shot-select.test.js` | Contact classification + shot-table lookup at swing time | **244 / 244 identical** |
| `hits.test.js` | Racket-hit velocity formula | human hits 87/98 exact (+24 serves from a fixed serve table); CPU hits 36/70 (CPU has extra adjustments) |

## API sketch
```js
import { makeBall, step, predict, difficultyParams, classifyContact, SHOT_TABLES,
         applyShot, shotEntry, aimFromTiming, movePlayer } from './js/squash-physics.js';

const p = { ...difficultyParams(0), latMult: 17 };     // Normal, skill 0 (speed, gravity, bounceOffset, powerMult …)
const ball = makeBall({ x: 0, y: 40 << 16, z: 150 << 16, vz: -(8 << 16) });
step(ball, p);                                          // one 1/57.4 s frame: collide, then integrate
const path = predict(ball, p);                          // ghost ball for the landing marker / CPU

// a swing: classify 7 frames ahead, look up the shot, apply it
const c = classifyContact(ball, player, p, { isP1: true, turnIsP1: true });
const entry = shotEntry(SHOT_TABLES[c.zone][hardButton ? 'hard' : 'soft'][c.index]);
applyShot(ball, entry, aimFromTiming(ball.z, player.z), player, frameCounter, p);
```

## Key facts confirmed by the recordings
- Per frame the game **checks collisions first, then moves the ball**.
- **Button 1 = HARD table, Button 2 = SOFT table** (100% of recorded swings).
- **Aim is not the joystick.** Shot angle comes from timing: whether the ball is behind, level with or in front of
  the player when struck. `aimFromTiming` is a fitted approximation of the arcade's behaviour.
- Players move 2.5 units/frame sideways and 1.25 units/frame in depth (joystick UP = toward the front wall).
- Serves use a fixed straight trajectory (vz −9.0, vy ≈ 6.5 units/frame).

## Not done yet
- The CPU-only shot adjustments and the special "approach" shots (ROM `0x7404`).
- Front-wall tin / out-line checks, the serve rules, and the CPU movement code (documented in `Squash_Game_Logic.md` but not ported).
- Rendering, input and netcode. This is the simulation core only.
