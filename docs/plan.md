# Hogg Squash v1: build plan

Written 2026-10-18 from `CLAUDE.md`, everything in `docs/` and `docs/research/`, `public/hogg-squash/js/squash-physics.js` and the tests in `test/`.
The work is split into small Claude Code sessions. Each one leaves the game working, tests passing and its work committed.

## Status

Tick a line (`[x]`) when its session or checkpoint is finished. **The next session to run is the first unticked line.**
Lines marked *(you)* are things the owner does. Lines marked 💳 are SpriteCook spend approvals: the art session after it stops and waits for your OK before generating anything.

- [x] **P0** Prerequisites *(you)*: install Node.js LTS (and optionally Git)
- [x] **S1** Canvas test: court, ball, placeholder player
- [ ] **CP-A** Checkpoint *(you)*: plain Canvas or Phaser? Character size and camera
- [ ] **S2** Rally rules and scoring (headless, tested) + `npm test` that can fail
- [ ] **S3** Playable 2-player rally on one keyboard
- [ ] **S4** Hitting and ball feel
- [ ] **CP-B** Play-test 1 *(you)*: 2-player rallies
- [ ] **S5** CPU opponent: movement and hitting
- [ ] **S6** Difficulty 1–9 and game pace
- [ ] **CP-C** Play-test 2 *(you)*: vs CPU at levels 1, 5 and 9
- [ ] **S7** Gamepads
- [ ] 💳 Approve SpriteCook spend for A1 *(you)*
- [ ] **A1** Art: palette and style test sprite
- [ ] 💳 Approve SpriteCook spend for A2 *(you)*
- [ ] **A2** Art: character animations, part 1 (ready, run, serve)
- [ ] 💳 Approve SpriteCook spend for A3 *(you)*
- [ ] **A3** Art: character animations, part 2 (swings, dive, get-up)
- [ ] **S8** Sprite and animation engine; the character goes into the game
- [ ] **CP-D** Play-test 3 *(you)*: the character in motion
- [ ] 💳 Approve SpriteCook spend for A4 *(you)*
- [ ] **A4** Art: court background, ball and effects
- [ ] 💳 Approve SpriteCook spend for A5 *(you)*
- [ ] **A5** Art: font, callouts, score panel, title art
- [ ] **S9** Court, ball and HUD art in the game
- [ ] **CP-E** Play-test 4 *(you)*: the look
- [ ] **S10** Screens, match flow and pause menu
- [ ] **S11** Options: key remapping and key test
- [ ] **S12** Polish and release prep
- [ ] **CP-F** Release play-test and go-live *(you)*

---

## Rules for every session

1. **Start:** read `CLAUDE.md`, `docs/decisions.md` and this file. Check the status list: every line above your session must be ticked. If one isn't, stop and ask.
2. **Baseline:** run `npm test` before changing anything and note the result.
3. **Stay in scope.** Do what's under "In scope" and nothing under "Not in scope". If something outside scope turns out to be needed, stop and ask. Don't start the next session's work.
4. **Code style:** plain JavaScript ES modules, `// @ts-check` at the top of every new `.js` file, JSDoc types, no build step, no npm runtime dependencies. The simulation (`js/sim/`) never touches the DOM, canvas or input devices, so Node tests can import it directly.
5. **Physics file:** don't change the fixed-point maths in `squash-physics.js`. New rules go in new modules that *use* it. Run `npm test` after any edit to the physics file, even a comment.
6. **Check in the browser** with `npm run dev` (Wrangler, http://localhost:8787/hogg-squash/). Fallback if Wrangler gives trouble: `npx http-server public -p 8080 -c-1`, then http://localhost:8080/hogg-squash/. No console errors.
7. **IP:** never commit or upload (to SpriteCook or anywhere else) the ROM, MAME, ROM extracts, MAME screenshots or anything traced from them. They stay in `../Research Info/`.
8. **Finish:**
   - `npm test` passes;
   - every "Done when" item has been checked, and you say which ones were checked in the browser and which only by tests;
   - tick the session's line in the status list and add a few lines to the **Session log** at the bottom of this file (what changed, any numbers measured, anything left for later);
   - commit with the message `Sx: <session name>`.
9. **Never push without asking.** A push to `main` deploys to https://roninray.com/hogg-squash/. At the end, ask whether to push.
10. **Git:** if `git` isn't on the PATH, use GitHub Desktop's copy: `C:\Users\ronin\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe` (the version folder changes when GitHub Desktop updates).
11. **Hand-off:** the last thing every session does, after committing, is write the owner a ready-to-paste prompt for the **next unticked line**, and suggest an effort level for it.
    - **The prompt:** start from that line's starter prompt in this file. Update it with anything this session learned, such as changed file names, a new fix-up item, or a question the owner still has to answer.
    - **If the next line is a checkpoint** *(you)*: give a short list of what to play-test, then that checkpoint's planning prompt with the `<notes>` placeholders left for the owner.
    - **If the next line is a 💳 approval:** give the art session's prompt. That prompt already begins with the spend gate.
    - **Effort level:** suggest one of `low`, `medium`, `high`, `xhigh` or `max`, with one line of reasoning. Start from the guide below and adjust if this session found the next one harder or easier than planned.

    | Suggested effort | Sessions |
    |---|---|
    | `high` | S1, S2, S3, S4, S5, S8: new foundations, the rules, or porting arcade logic, where mistakes are costly |
    | `medium` | S6, S7, S9, S10, S11, S12, A1–A5: building on settled code or art work driven by the shared rules |
    | `medium` | Checkpoint planning sessions (CP-A … CP-E): editing this plan from your notes |

---

## Decisions made while writing this plan (2026-10-18)

Asked and answered before writing:
- **Node.js** isn't installed on this PC yet. The owner installs Node.js LTS before Session 1 (P0).
- **Serving is arcade-simple.** The server stands in a service box (alternating sides) and presses HARD or SOFT, and the ball leaves on the arcade's fixed serve trajectory (`SERVE` in the physics file). A serve can lose only the way any shot can (tin, out, not reaching the front wall). No service-box faults.
- **The live page shows the game as it grows.** The game is built in `public/hogg-squash/index.html` from Session 1 onward, replacing "Coming soon". The owner decides when each version goes live by approving pushes.

Settled by the plan (say so if you disagree):
- **Court lines in game units.** The arcade's units are ≈45 per metre across (x), ≈35.2 per metre in height (y) and ≈18.8 per metre in depth (z). The back glass being 75 units high matches the real 2.13 m back-wall out-line, which supports the height scale. Real squash heights then give: tin **17**, service line **63**, front-wall out-line **161**, side-wall out-line sloping from **161** at the front wall to **75** at the back, short line at **z = 103**, service boxes 72 units wide × 30 deep (z 103–133). These are a starting point, approved at the end of S2.
- **The projection works in metres** (x/45, y/35.2, z/18.8), so the court looks like a real 6.4 × 9.75 m court even though the arcade's units aren't to scale. The camera constants live in one object.
- **The court is a fixed background.** The camera never moves, so the court can be drawn once. From A4 onward it is a painted 640×360 image, painted over an export of our own projected court so that the lines match the physics exactly. **This means the camera is frozen after CP-D.** Moving it later means repainting the court.
- **The tests don't fail at the moment.** `test/run-all.js` prints each test's first line and always exits 0, so a regression would go unnoticed. S2 makes `npm test` compare against recorded baselines and exit 1 if any number drops. This is test code only.
- **`squash-physics.js` has no `// @ts-check` yet.** S2 adds it and JSDoc comments, with no change to any expression. If a type error could only be fixed by changing code, it is left alone and noted.
- **`latMult` isn't in `difficultyParams()`.** The tests take it from the recording, and `docs/research/physics-core.md` uses 17. S2 checks which value the fixtures hold, and the game passes it in alongside `difficultyParams`.
- **Where the docs disagree, `decisions.md` wins.** `squash-game-logic.md` §8 still lists faults as lives, a 5-round ladder, rubber-banding and online play, and `squash-1992-research.md` says the joystick aims. None of these apply: the decisions, the code and the tests all agree that aim comes from timing.

## Open questions: how this plan settles them

1. **Difficulty 1–9 mapping:** use the default. Proposed starting table, smooth and monotonic in every column, built from the arcade's rows (level 1 is extrapolated below the arcade's Easy start, and level 9 equals Hardest at skill 4). S6 implements it and CP-C tunes it.

   | Level | Like arcade… | CPU reaction (frames) | CPU error step | Game speed | Power mult | Bounce offset | Gravity |
   |---|---|---|---|---|---|---|---|
   | 1 | below Easy 0 | 24 | 24 | 272 | 16 | 0 | 0x1F48 |
   | 2 | Easy 0 | 20 | 20 | 280 | 16 | 0 | 0x1F80 |
   | 3 | Normal 0 | 16 | 16 | 280 | 17 | −1 | 0x1F80 |
   | 4 | Easy 1 | 12 | 16 | 284 | 17 | −1 | 0x1FB8 |
   | 5 | Normal 1 | 8 | 12 | 284 | 18 | −2 | 0x1FB8 |
   | 6 | Normal 2 | 6 | 10 | 288 | 18 | −2 | 0x1FF0 |
   | 7 | Hard 2–3 | 4 | 6 | 292 | 19 | −3 | 0x2028 |
   | 8 | Hardest 3 | 2 | 4 | 296 | 19 | −3 | 0x2060 |
   | 9 | Hardest 4 | 1 | 2 | 304 | 19 | −3 | 0x2140 |

2. **Pace by difficulty:** use the default. 1P uses the level's pace. 2P versus uses level 5's pace (speed 284, power 18, bounce −2, gravity 0x1FB8).
3. **Rubber band:** use the default and leave it out. **One change I recommend:** the arcade also grows the CPU's positioning error after *every point* (§6 step 5). Over a game to 11 this makes the CPU steadily sloppier, so level 5 at 10–10 would play worse than level 5 at 0–0. The plan makes the error a fresh random offset each rally, sized by the level's error step, that doesn't build up. A level then means the same thing all match.
4. **Character height:** settled at CP-A from the S1 placeholder, starting at 100 px. S1 also shows whether one fixed sprite size looks right at the front and the back of the court (arcade-style), or whether we need a few pre-scaled sizes.
5. **Hogg colour shades:** chosen in A1 and written into `docs/theme.md`.
6. **Logo on a public site:** there is no default for this, so the plan keeps it safe. **The school's shield logo stays out of the live game until you've confirmed with the school.** Until then the game uses the colours, a "HOGG RAZORBACKS" wordmark and our own original boar mascot. S9 leaves a single logo slot, so adding the logo later is a one-file change.
7. **"Missing pieces" from the decompiled code:** only one of the five was actually found in the ROM.
   - **CPU movement** is documented (§6) and is ported in S5.
   - **Tin and out-line checks** weren't found. They are designed in S2 from real court heights (above).
   - **Serve rules** weren't found. Serving is arcade-simple (decided above).
   - **CPU-only shot adjustments** weren't found (the CPU's hits differ from the plain formula 34 times in 70). The CPU uses the same shot formula as a human. This is accepted rather than guessed at.
   - **Dive range** wasn't found. A dive is triggered by the classifier's existing "stretch" band, with a recovery lockout tuned in play-testing (S4).

   So `squash-physics.js` keeps its maths as it is, and the new rules live in `js/sim/`.

## Target file layout

```
public/hogg-squash/
  index.html                 the game page (replaces "Coming soon" in S1)
  js/squash-physics.js       existing verified physics (maths untouched)
  js/main.js                 boot: wires loop, sim, input and renderer
  js/engine/loop.js          fixed 57.4 Hz step with an accumulator
  js/engine/screen.js        640×360 back buffer, crisp integer scaling
  js/engine/assets.js        image + JSON loader (S8)
  js/sim/                    pure, deterministic, Node-testable
    court-rules.js rally.js match.js player.js world.js cpu.js difficulty.js
  js/input/                  keyboard.js gamepad.js actions.js (per-player left/right/up/down/hard/soft)
  js/render/                 projection.js court.js actors.js effects.js hud.js text.js sprites.js debug.js
  js/ui/                     screens.js + one file per screen (S10–S11)
  assets/                    exported PNG + JSON from Aseprite
art/                         .aseprite sources, palette, SpriteCook manifest (not deployed)
test/                        existing golden tests + new unit tests
```

---

## P0: Prerequisites *(you)*

- Install **Node.js LTS**, for example `winget install OpenJS.NodeJS.LTS`, then open a new terminal and check that `node --version` prints v18 or higher.
- Optional: install **Git for Windows** (`winget install Git.Git`) so `git` works in any terminal. Without it, sessions use GitHub Desktop's copy (rule 10).
- From the repo root, run `npm test` once. It should print results for golden, flight, shot-select and hits on both fixtures.

---

## S1: Canvas test (court, ball, placeholder player)

**Goal:** the test from `docs/research/canvas-vs-phaser.md` ("The test"). A crisp 640×360 page showing the projected court, the real physics ball with its shadow, and a box player that moves and hits with the arcade's shot tables. It is kept and built on.

**In scope**
- `index.html` becomes the game page: one canvas, loading `js/main.js` as a module.
- A 640×360 back buffer scaled up by the largest whole number that fits the window, with a border and smoothing off. Below 1× it falls back to fitting the window. Resizing is handled.
- A fixed-step loop at 57.4 Hz using an accumulator, with catch-up capped at about 5 steps. Rendering draws the latest state (no interpolation).
- `projection.js`: game units → metres (x/45, y/35.2, z/18.8) → a pinhole camera behind the back wall. `project(x, y, z)` returns screen x, screen y and a scale. All camera constants are in one object.
- The court drawn with plain shapes: white front wall, slightly shaded side walls, light wood floor, red lines (front-wall out-line, service line, tin band, sloping side-wall out-lines, short line, half-court line, service boxes) and a thin floor line where the back glass is. Spare width at the sides is left empty for the HUD.
- The ball: `makeBall` + `step` with `difficultyParams(0)` plus `latMult: 17`, drawn as a circle sized by depth, with a dark shadow on the floor. Ball and player are drawn in depth order.
- The placeholder player: a box with its feet at (x, z), drawn at a **fixed pixel height** (start at 100 px, tunable) as sprites will be. It moves with WASD through `movePlayer` and is kept inside the court.
- Hitting: F = HARD, G = SOFT. On a press, `classifyContact` looks 7 frames ahead. If the ball is out of reach (flag 0x20) the swing misses. Otherwise the shot entry is stored and `applyShot` is applied 7 frames later, with `aimFromTiming` and the sim frame counter as `rng`. The player moves at 0xC000 while swinging.
- Test controls: Space feeds a ball (a serve-like feed toward the player), R resets. The backquote key toggles a debug overlay showing sim steps per second, ball position and speed, the last physics event, and the last contact (flags, zone, index, aim).
- `.claude/launch.json` running `npm run dev` on port 8787, so Claude's browser pane can open the page.

**Not in scope:** rules and scoring, a second player, CPU, gamepads, landing marker, sprites or art, menus, sound, and any change to `squash-physics.js` or `test/`.

**Depends on:** P0.

**Main files:** `public/hogg-squash/index.html`, `js/main.js`, `js/engine/loop.js`, `js/engine/screen.js`, `js/render/projection.js`, `js/render/court.js`, `js/render/debug.js`, `js/sim/player.js`, `.claude/launch.json`.

**Done when…**
- `npm test` prints exactly what it printed before, and `git diff` shows no change to `squash-physics.js` or `test/`.
- At http://localhost:8787/hogg-squash/ the court reads as a squash court seen from behind. Pixels stay sharp at 1280×720 and full-screen 1920×1080, and while the window is resized.
- Space feeds a ball. It flies, hits the front wall, comes off much slower, bounces with its shadow, and rolls to a stop.
- The debug overlay shows about 57.4 sim steps per second, whatever the monitor's refresh rate.
- The box moves visibly faster sideways than in depth (2.5 against 1.25 units per frame).
- A well-timed F or G sends the ball back to the front wall, and HARD and SOFT clearly differ. Early and late hits change the angle. Pressing with the ball far away misses.
- No console errors. Every new file starts with `// @ts-check`.
- The Session log notes: lines of plumbing written, anything about plain Canvas that felt awkward, and the box height chosen.

**You check or decide at the end:** play with it for 10 minutes, then go to CP-A.

**Starter prompt**
```text
We're doing Session S1 of docs/plan.md: "Canvas test: court, ball, placeholder player".
Read CLAUDE.md, docs/decisions.md, docs/research/canvas-vs-phaser.md ("The test") and docs/plan.md (the "Rules for every session" and the S1 section).
Check that P0 is done (node --version, npm test). Then build exactly S1's "In scope" list, nothing under "Not in scope".
Don't change squash-physics.js or anything in test/. Use .claude/launch.json + the browser pane to check the page yourself.
Finish by going through S1's "Done when" list, ticking S1 in the status list, adding a Session log entry, and committing. Ask me before pushing.
```

---

## CP-A: Checkpoint: plain Canvas or Phaser? *(you)*

Play the S1 page for 10–15 minutes, then answer:
1. **Renderer:** is plain Canvas pleasant to build on, or did the plumbing already feel heavy (read S1's Session log)? Pick **Canvas** (carry on) or **Phaser**.
2. **Camera:** does the court look right? Is the front wall too big or too small, and is the floor too steep or too flat?
3. **Character height:** is 100 px right? Does one fixed size look OK both at the front and at the back of the court, or do we need 2–3 pre-scaled sizes? Record the answer in `docs/decisions.md` (open question 4).
4. **Ball feel:** does the ball feel like the arcade?

**If you choose Phaser**, add a session **S1b: Phaser port of the test** before S2. In S1b, Phaser 4 is loaded as one pinned script file, with physics off. Our 57.4 Hz accumulator runs inside its `update`, and `engine/` and `render/court.js` are replaced while `projection.js`, `sim/` and the physics are kept. Then adjust S8 (use `createFromAseprite`), S10 (use Scenes) and S12. Everything in `js/sim/` stays the same either way.

**Starter prompt** (planning-only session to apply your answers)
```text
Planning only: change no files except docs/plan.md and docs/decisions.md.
Read docs/plan.md and its Session log. My CP-A answers: renderer = <Canvas/Phaser>; camera = <notes>; character height = <px, fixed or scaled>; ball feel = <notes>.
Record the decisions in docs/decisions.md, update the plan (add S1b if Phaser), tick CP-A, and commit. Don't push.
```

---

## S2: Rally rules and scoring (headless, tested)

**Goal:** deterministic, unit-tested modules for the rules of a rally and a match, and an `npm test` that actually fails when something regresses. Nothing visible changes on the page.

**In scope**
- **Test harness:** `test/run-all.js` reads each golden test's summary line and compares it with `test/baselines.json`, recorded in this session from the current results (flight: no unexplained divergences; shot-select: 100%; hits and golden: at least today's counts). It exits 1 on any drop. New unit tests use Node's built-in `node:test` / `node:assert` (no dependencies) and are run by `npm test` too.
- Prove the harness works: temporarily change one restitution number, see `npm test` fail, put it back, and see it pass. Record this in the Session log.
- **`squash-physics.js`:** add `// @ts-check` and JSDoc typedefs/comments only, with no change to any expression. Run the tests before and after; the output must be identical.
- **Check `latMult`** in the fixtures and note the value. The game passes it into the params.
- `js/sim/court-rules.js`: the line constants from "Decisions made while writing this plan". `frontWallVerdict(y)` returns `tin`, `out` or `good`. `sideWallVerdict(y, z)` returns `out` or `good`. A ball above the glass at the back counts as out, as does the physics `out` flag.
- `js/sim/rally.js`: a rally state machine fed by physics events each step.
  - After a strike, the ball must reach the front wall (above the tin, below the out-line) before touching the floor. Side walls and the back glass are allowed on the way.
  - After a good front-wall hit it is the other player's turn. One floor bounce is allowed and the second loses the rally.
  - A player may only strike on their turn, and only once the ball has hit the front wall since the last strike.
  - The ball's bounce count is reset on each strike.
  - The rally result gives the winner and a reason (`tin`, `out`, `down` = floor before front wall, `notUp` = second bounce).
  - Serves follow the same rules (arcade-simple).
- `js/sim/match.js`: rally scoring, first to 5/7/9/11, win by 2, and the rally winner serves. Vs CPU the human serves first. In 2P the first server comes from a seed passed in. A new server starts in the right-hand box and alternates boxes while keeping the serve.
- Tests: `test/rules.test.js` fires scripted balls through the real physics into the tin, above the out-line, a good return, a double bounce and a floor-before-wall. `test/match.test.js` covers 8–8 in a game to 9 continuing, 11–9 winning, every match length, and serve handover and sides.

**Not in scope:** any change to the page, rendering or input (S3), CPU, and any change to the physics maths.

**Depends on:** S1, CP-A.

**Main files:** `test/run-all.js`, `test/baselines.json`, `test/rules.test.js`, `test/match.test.js`, `js/sim/court-rules.js`, `js/sim/rally.js`, `js/sim/match.js`, `js/squash-physics.js` (comments only).

**Done when…**
- `npm test` runs the golden tests and the new unit tests, prints a summary and exits 0.
- The deliberate break made `npm test` exit 1, and it was reverted.
- `git diff` on `squash-physics.js` shows only comment lines.
- The page still works exactly as after S1.

**You check or decide at the end:**
- Approve the tin and out-line heights, or adjust them.
- Optional: allow a `npm run typecheck` script using `npx -p typescript tsc --noEmit --allowJs --checkJs`. It is a check only, with no build output and no runtime dependency, but it is a TypeScript tool, so it's your call.

**Starter prompt**
```text
We're doing Session S2 of docs/plan.md: "Rally rules and scoring (headless, tested)".
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md and docs/plan.md (rules + "Decisions made while writing this plan" + S2).
Run npm test first and save today's numbers as the baselines. Build S2's "In scope" list only. Don't change any expression in squash-physics.js (comments and JSDoc only) and run npm test after every edit to it.
Show me the deliberate-break check failing and passing. Then go through "Done when", tick S2, add a Session log entry, and commit. Ask me before pushing.
```

---

## S3: Playable 2-player rally on one keyboard

**Goal:** the first real game. Two people on one keyboard play a full match to 9, with serving, rules, score and callouts, using placeholder graphics.

**In scope**
- `js/input/keyboard.js` + `js/input/actions.js`: per-player actions read from `KeyboardEvent.code`, with the default layouts from `docs/controls.md` (P1 WASD + F/G, P2 arrows + Numpad 0 / Numpad .).
  - `preventDefault` on game keys.
  - All held keys cleared when the window loses focus.
  - Actions are sampled once per sim step, with press detection for HARD and SOFT.
- `js/sim/world.js`: owns the ball, both players, the frame counter, the rally and the match. `step(p1Actions, p2Actions)` returns events. `main.js` keeps no game logic.
- **Serving (arcade-simple):** the server stands in the right or left box, as `match.js` says, and the receiver stands in the opposite back quarter. The server holds the ball, then HARD or SOFT launches the `SERVE` trajectory from the server's position.
- **Turns:** only the player whose turn it is can make contact. The other player's swing misses (`classifyContact` turn options).
- A second box player in another colour, with everything drawn in depth order.
- A **landing marker** from `predict()`: where the ball will first bounce after the front wall, drawn on the floor.
- **After a rally:** the game freezes for about 1.5 s and shows the callout (OUT / TIN / DOWN / NOT UP), then "POINT" and the score painted on the front wall in plain canvas text, then the next serve.
  - At match end: "P1 WINS 9–6" and "HARD to play again".
  - Match length comes from `?to=5|7|9|11` (default 9) until the menus exist.
- **Simple HUD** in the side margins: both scores and who is serving.
- **Basic freeze:** Esc toggles a freeze and losing focus freezes the game. The proper pause menu comes in S10.
- `test/world.test.js`: the same scripted inputs run twice give an identical final state (determinism), and a scripted rally gives the expected point.

**Not in scope:** CPU, gamepads, difficulty levels, swing timing polish and dive (S4), art, menus, remapping.

**Depends on:** S2.

**Main files:** `js/input/keyboard.js`, `js/input/actions.js`, `js/sim/world.js`, `js/sim/player.js`, `js/render/actors.js`, `js/render/hud.js`, `js/main.js`, `test/world.test.js`.

**Done when…**
- `npm test` passes, including the determinism test.
- In the browser, a full game to 9 can be played with both keyboard layouts at once, and the score is right.
- Tin, out, down and not-up each give the point to the right player, with the reason shown and confirmed in the debug overlay.
- `?to=5` ends a game at 5–3 but carries on from 4–4 to 6–4.
- Arrow keys don't scroll the page. Alt-tab freezes the game.
- No console errors.

**You check or decide at the end:** do the rules feel right? Should this first playable version go live (push)?

**Starter prompt**
```text
We're doing Session S3 of docs/plan.md: "Playable 2-player rally on one keyboard".
Read CLAUDE.md, docs/decisions.md, docs/controls.md and docs/plan.md (rules + S3). Check S1, CP-A and S2 are ticked.
Build S3's "In scope" list only, keeping all game logic in js/sim/ (no DOM there) and input in js/input/.
Play-check it in the browser pane, go through "Done when", tick S3, add a Session log entry, and commit. Ask me before pushing.
```

---

## S4: Hitting and ball feel

**Goal:** make hitting feel like the arcade: a clear swing rhythm, reach, stretching and diving, recovery and visual feedback. The ball physics itself doesn't change.

**In scope**
- A swing state machine in `js/sim/player.js`: wind-up, then the contact frame 7 frames after the press, then follow-through/recovery at 0xC000 move speed. Durations are named constants that the art in A3 will match.
- **Dive:** a stretch contact (flag 2) plays a dive. The player is locked in place until recovery ends (start at about 45 frames ≈ 0.8 s, tunable). The dive range is the classifier's stretch band, which is how the arcade does it.
- Overhead and "special" contacts (indexes 8–11) checked to work.
- Player court limits tuned.
- **Placeholder feedback:** a front-wall impact ring, a contact flash, a forehand/backhand side marker on the box, and a tidier landing marker.
- **Tuning tools:**
  - `?slow=4` slow motion;
  - the debug overlay also shows a log of the last 5 shots (zone, contact index, button, speed in m/s, front-wall height in m), to compare with the tables in `squash-game-logic.md` §9.
- `test/player.test.js`: swing timing (contact exactly 7 frames after the press), dive lockout, and no movement while locked.

**Not in scope:** CPU, art, sound, and any change to the physics maths. If the ball itself feels wrong, write it down as a question for CP-B; don't "fix" the physics.

**Depends on:** S3.

**Main files:** `js/sim/player.js`, `js/sim/world.js`, `js/render/actors.js`, `js/render/effects.js`, `js/render/debug.js`, `test/player.test.js`.

**Done when…**
- `npm test` passes.
- In the browser:
  - drives, drops and boasts can be hit on purpose;
  - early against late timing visibly changes the angle;
  - a stretch makes the player dive and leaves them stuck for a moment;
  - out of reach is a clear miss;
  - slow motion works.
- The shot log's speeds and wall heights are in the same range as §9.

**You check or decide at the end:** go straight on to CP-B.

**Starter prompt**
```text
We're doing Session S4 of docs/plan.md: "Hitting and ball feel".
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md (§4, §5, §9) and docs/plan.md (rules + S4). Check S3 is ticked.
Build S4's "In scope" list only. Don't change the physics maths: if the ball feels off, note it for CP-B instead.
Go through "Done when", tick S4, add a Session log entry with the shot-log numbers, and commit. Ask me before pushing.
```

---

## CP-B: Play-test 1: 2-player rallies *(you)*

Play several games to 9, with a friend or with both hands. Note answers to:
1. Is the view readable? Can you judge depth from the shadow and the landing marker?
2. Pace: too fast or too slow? (This is level 5's pace later.)
3. Reach and timing: do hits feel fair? Do misses feel like your fault?
4. Does the dive lockout last the right time?
5. Rules: any call that felt wrong (tin height, out-lines, double bounce)?
6. Placeholder height and camera, now that you've played properly.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md (and docs/decisions.md for settled decisions).
Read docs/plan.md and its Session log. Here's my CP-B play-test feedback: <notes>.
Turn it into changes to the remaining sessions (add small fix-up items to the right session, or a short fix-up session if needed), tick CP-B, and commit. Don't push.
```

---

## S5: CPU opponent: movement and hitting

**Goal:** port the arcade's CPU (`squash-game-logic.md` §6), so one player can play a full game against the computer.

**In scope**
- `js/sim/cpu.js` produces the **same six actions as a human**, so it plugs into a player slot. Its states:
  1. When it becomes its turn, wait for the reaction delay.
  2. Read the predictor and pick the **earliest reachable intercept**: run time at 2.5/1.25 units per frame plus the delay, against frames until the ball arrives. If none is reachable, take the best one.
  3. Stand 32 units to the racket side, kept within x −147…104 and z 22…178.
  4. Press so that the contact frame (7 frames after the press) lands on the planned contact.
  5. Recover toward the T (z ≈ 96), offset by the positioning error.
- **Positioning error:** a fresh deterministic random offset each rally, sized by the error step and not accumulated (see open question 3).
- **CPU serve:** after about 1 s, it serves.
- **CPU button choice:** the arcade's logic isn't known, so it is a simple, tunable rule in one function (for example SOFT from the front court when the opponent is deep, otherwise HARD, with some randomness).
- `isCpu` is passed to `applyShot`, so the CPU never aims into a near side wall.
- **Modes:** the page defaults to 1P vs CPU with the human serving first, and `?mode=2p` gives versus. The CPU uses Normal/skill 0 parameters until S6.
- Debug overlay: the CPU's chosen intercept and current state.
- `test/cpu.test.js`: 200 headless CPU-against-CPU rallies are deterministic and always end with a valid reason, with no NaN or out-of-court players. Against a set of fed balls, the CPU returns a reasonable share.

**Not in scope:** the 1–9 levels (S6), rubber-banding (left out), CPU-only shot adjustments (not found in the ROM), and art.

**Depends on:** S4, CP-B.

**Main files:** `js/sim/cpu.js`, `js/sim/world.js`, `js/main.js`, `js/render/debug.js`, `test/cpu.test.js`.

**Done when…**
- `npm test` passes.
- In the browser, a full game against the CPU can be played. The CPU:
  - runs to where the ball is going;
  - returns most balls but sometimes misses;
  - never leaves the court or jitters on the spot;
  - recovers toward the T.
- `?mode=2p` still works.

**You check or decide at the end:** does the CPU feel like a real opponent at this one level? Anything odd about its movement?

**Starter prompt**
```text
We're doing Session S5 of docs/plan.md: "CPU opponent: movement and hitting".
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md (§4 landing arrow, §6 CPU) and docs/plan.md (rules, open question 3, S5). Check S4 and CP-B are ticked.
Build S5's "In scope" list only. The CPU must output the same per-player actions as a human, and stay deterministic.
Go through "Done when", tick S5, add a Session log entry, and commit. Ask me before pushing.
```

---

## S6: Difficulty 1–9 and game pace

**Goal:** the 1–9 difficulty table drives both the CPU's skill and the game's pace in 1P. 2P uses one fixed pace.

**In scope**
- `js/sim/difficulty.js`: the table from open question 1. `levelParams(level)` returns the physics params (speed, gravity, bounce offset, power mult, `latMult`) and the CPU params (reaction delay, error step).
- 1P uses the chosen level for both. 2P uses level 5's pace.
- `?level=1..9` (default 5), plus a debug key that changes the level between rallies.
- CPU shot choice may get a little smarter at higher levels (for example choosing HARD or SOFT based on where the human is standing), kept in the same tunable function.
- `test/difficulty.test.js`:
  - every column is monotonic;
  - every level gives sane ball flights (time to the front wall and to the bounce, within broad ranges around the arcade timings);
  - in headless CPU-against-CPU play, rallies get longer as the level rises.
- Record the final table in `docs/decisions.md`.

**Not in scope:** menus for picking the level (S10), rubber-banding.

**Depends on:** S5.

**Main files:** `js/sim/difficulty.js`, `js/sim/world.js`, `js/sim/cpu.js`, `test/difficulty.test.js`, `docs/decisions.md`.

**Done when…**
- `npm test` passes.
- In the browser, `?level=1` is clearly slower and the CPU is beatable. `?level=9` is fast, and the CPU reacts almost at once.
- `?mode=2p` plays at level 5's pace whatever `?level` says.

**You check or decide at the end:** go to CP-C.

**Starter prompt**
```text
We're doing Session S6 of docs/plan.md: "Difficulty 1–9 and game pace".
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md (§7 difficulty table) and docs/plan.md (rules, open questions 1–3, S6). Check S5 is ticked.
Build S6's "In scope" list only, starting from the proposed table in the plan.
Go through "Done when", tick S6, add a Session log entry, and commit. Ask me before pushing.
```

---

## CP-C: Play-test 2: vs CPU *(you)*

Play at levels 1, 5 and 9, and one 2P game. Note:
1. Could a beginner win at level 1? Is level 9 brutal but fair?
2. Do the steps between levels feel even, or is there a jump?
3. Does the CPU ever do something silly (stand still, run the wrong way, always the same shot)?
4. Is the 2P pace right?

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md and docs/decisions.md.
Read docs/plan.md and its Session log. My CP-C feedback: <notes>.
Update the difficulty table and the remaining sessions as needed, tick CP-C, and commit. Don't push.
```

---

## S7: Gamepads

**Goal:** two gamepads (or a keyboard and a pad) work, one per player, using the browser's Gamepad API.

**In scope**
- `js/input/gamepad.js`, polled once per sim step: left stick (with a dead zone) or D-pad to move, A/Cross = HARD, B/Circle or X/Square = SOFT, Start = freeze/pause.
- A temporary "Press any button to join" overlay that assigns pads to P1 and P2. The proper screen comes in S10.
- Keyboard and pad can be mixed.
- A pad unplugged mid-match freezes the game with "Controller disconnected".
- Chrome and Edge are the targets, with Firefox best effort.
- `test/input.test.js`: maps a fake gamepad object to actions (dead zone, D-pad, buttons, press detection).

**Not in scope:** remapping pads (only keys are remappable, in S11), menus, vibration.

**Depends on:** CP-C.

**Main files:** `js/input/gamepad.js`, `js/input/actions.js`, `js/main.js`, `test/input.test.js`.

**Done when…**
- `npm test` passes.
- A 2P game can be played on two pads, and with keyboard + pad.
- 1P works on a pad.
- Unplugging a pad freezes the game, and plugging it back in plus a button press carries on.

**You check or decide at the end:** tell the session which controllers you tested with, and whether any button felt wrong.

**Starter prompt**
```text
We're doing Session S7 of docs/plan.md: "Gamepads".
Read CLAUDE.md, docs/controls.md and docs/plan.md (rules + S7). Check CP-C is ticked.
Build S7's "In scope" list only. I'll test with real controllers, so tell me what to try and when.
Go through "Done when", tick S7, add a Session log entry, and commit. Ask me before pushing.
```

---

## Art sessions: shared rules

These apply to A1–A5:
- **No game code changes.** Art sessions only touch `art/`, `public/hogg-squash/assets/` and art docs. Reading the code (for example the swing timings) is fine.
- **Spend gate:** step 1 is to check the SpriteCook balance and list every planned generation with its model, quality and estimated credits, plus a total. Then **stop and wait for the owner's OK**. If an extra generation is needed beyond the approved list, ask again.
- **IP:** never upload or reference the ROM extracts, MAME screenshots or Gaelco art. Describe the style in words, and use only our own images (earlier SpriteCook output, our own game's screenshots) as references.
- **Manifest:** every SpriteCook asset ID, prompt, model and credit cost goes in `art/spritecook-manifest.md`.
- **Cleanup in Aseprite** (by Claude, through the Aseprite connection):
  - lock everything to the shared palette;
  - the same height in every frame, with feet lined up and a `feet` slice/pivot;
  - no stray pixels or blur;
  - tags for each animation;
  - export as spritesheet PNG + JSON (array, with tags and slices) to `public/hogg-squash/assets/`.
- Source `.aseprite` files go in `art/`.
- **Needs:** the SpriteCook connector signed in and credits on the account (the account had 0 credits on 2026-10-18), plus Aseprite and its connection.
- **Order:** A1–A3 only touch art files, so they can be run earlier, in parallel with S2–S7, if you like. They need the CP-A height, and A3 needs the S4 swing timings.

## A1: Art: palette and style test sprite

**Goal:** lock the look. Make a shared palette with the Hogg red, black and white plus court neutrals, and one cleaned sprite of the player from behind in the ready stance at the CP-A height, shown on our court.

**In scope**
- After the spend gate, use SpriteCook to make concept images of an adult player in red and black seen from behind, pick one, and keep it as the style reference for everything later.
- In Aseprite:
  - build the palette (32–48 colours) and save it as `art/palette/hogg-squash.gpl`;
  - clean one ready-stance frame;
  - make a palette-swapped version (for example a white-and-black kit) to prove the swap.
- A mockup PNG of the sprite on a screenshot of our own court.
- Record the chosen hex colours in `docs/theme.md` (open question 5) and the height in `docs/art-style-guide.md`.

**Not in scope:** animations, court art, the logo, game code.

**Depends on:** CP-A (height), and the 💳 approval line above it.

**Main files:** `art/palette/hogg-squash.gpl`, `art/character/player.aseprite`, `art/mockups/a1-court-mockup.png`, `art/spritecook-manifest.md`, `docs/theme.md`, `docs/art-style-guide.md`.

**Done when…**
- You've seen and approved the palette, the sprite and the swapped kit.
- The manifest shows credits spent within the approved amount.
- `npm test` still passes, and the page still works because nothing in it changed.

**You check or decide at the end:** approve the look and the P2/CPU kit colours, or ask for changes (each change is another spend approval).

**Starter prompt**
```text
We're doing Session A1 of docs/plan.md: "Art: palette and style test sprite".
Read CLAUDE.md, docs/decisions.md, docs/art-style-guide.md, docs/theme.md and docs/plan.md ("Art sessions: shared rules" + A1).
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK before generating anything.
No game code changes. Never use ROM/MAME/Gaelco images as references. Finish with "Done when", tick A1, add a Session log entry, and commit. Ask me before pushing.
```

## A2: Art: character animations, part 1 (ready, run, serve)

**Goal:** the movement animations, cleaned and exported in a form the game can load.

**In scope**
- After the spend gate, animate from the A1 base in SpriteCook: ready/idle, run sideways (one direction, mirrored for the other), run toward the front wall, run toward the back, and serve.
- Aseprite cleanup as in the shared rules. Tags: `ready`, `run_side`, `run_up`, `run_down`, `serve`. Add a `feet` slice. Set frame timings.
- Export `public/hogg-squash/assets/player.png` + `player.json`.

**Not in scope:** swings and dive (A3), game code.

**Depends on:** A1, and the 💳 approval line above it.

**Main files:** `art/character/player.aseprite`, `public/hogg-squash/assets/player.png`, `public/hogg-squash/assets/player.json`, `art/spritecook-manifest.md`.

**Done when…**
- Each tag loops cleanly in Aseprite's preview with no height jumps or foot sliding.
- The JSON contains the tags and the `feet` slice.
- The manifest is updated, and `npm test` passes.

**You check or decide at the end:** approve the run and serve animations.

**Starter prompt**
```text
We're doing Session A2 of docs/plan.md: "Art: character animations, part 1 (ready, run, serve)".
Read CLAUDE.md, docs/art-style-guide.md and docs/plan.md ("Art sessions: shared rules" + A2), plus art/spritecook-manifest.md from A1.
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK.
No game code changes. Finish with "Done when", tick A2, add a Session log entry, and commit. Ask me before pushing.
```

## A3: Art: character animations, part 2 (swings, dive, get-up)

**Goal:** the hitting animations, timed to match the game's swing so that the racket meets the ball on the contact frame.

**In scope**
- After the spend gate, animate in SpriteCook: forehand, backhand, overhead, and dive (left and right) + get-up. Celebrate and dejected only if the budget allows.
- **Timing:** read the swing constants in `js/sim/player.js` (from S4). The contact frame must start 7 sim frames (≈122 ms) after the swing begins, and the recovery must last as long as the sim's recovery. Mark the contact frame (frame user data `contact`, or a `contact` tag).
- Cleanup, tags, `feet` slice. Re-export `player.png` / `player.json` with all tags.

**Not in scope:** game code, court art.

**Depends on:** A2, S4, and the 💳 approval line above it.

**Main files:** `art/character/player.aseprite`, `public/hogg-squash/assets/player.png`, `public/hogg-squash/assets/player.json`, `art/spritecook-manifest.md`.

**Done when…**
- In Aseprite, each swing's contact frame is at 122 ms ± one frame and its total length matches the sim.
- All tags are in the JSON. The manifest is updated, and `npm test` passes.

**You check or decide at the end:** approve the swings and the dive.

**Starter prompt**
```text
We're doing Session A3 of docs/plan.md: "Art: character animations, part 2 (swings, dive, get-up)".
Read CLAUDE.md, docs/art-style-guide.md, docs/plan.md ("Art sessions: shared rules" + A3), art/spritecook-manifest.md, and the swing timing constants in public/hogg-squash/js/sim/player.js (read only).
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK.
No game code changes. Finish with "Done when", tick A3, add a Session log entry, and commit. Ask me before pushing.
```

---

## S8: Sprite and animation engine; the character goes into the game

**Goal:** replace the placeholder boxes with the animated character, with P2 and the CPU in the swapped kit.

**In scope**
- `js/engine/assets.js`: loads images and JSON, with a simple loading state.
- `js/render/sprites.js`: reads Aseprite JSON (frames, durations, tags, slices/pivot) and runs a per-player animation player. Animation is chosen from sim state (ready, run direction, swing type, dive, serve, recovery). Animation time counts in sim frames, so the contact frame lines up with the hit.
- Palette swap done once at load: an offscreen canvas recolours the sheet from a colour→colour table.
- Sprites drawn at the CP-A size (fixed, or pre-scaled sizes if CP-A asked for them), positioned at the projected feet point, in depth order.
- Placeholder boxes kept behind a debug toggle.
- `test/sprites.test.js`: parses the exported `player.json` and checks that all expected tags exist and that the contact frame timing matches the sim constants.

**Not in scope:** court, ball and HUD art (S9), menus.

**Depends on:** A3, S7.

**Main files:** `js/engine/assets.js`, `js/render/sprites.js`, `js/render/actors.js`, `js/main.js`, `test/sprites.test.js`.

**Done when…**
- `npm test` passes.
- In the browser, both players animate correctly while running, swinging, diving and serving, and P2/CPU wears the swapped kit.
- In slow motion (`?slow=4`) the racket visibly meets the ball on the contact frame.
- The page still runs at a steady 57.4 sim steps per second.

**You check or decide at the end:** go to CP-D.

**Starter prompt**
```text
We're doing Session S8 of docs/plan.md: "Sprite and animation engine; the character goes into the game".
Read CLAUDE.md, docs/decisions.md, docs/art-style-guide.md and docs/plan.md (rules + S8). Check A3 and S7 are ticked.
Build S8's "In scope" list only. Animation timing must follow sim frames, not wall-clock time.
Go through "Done when", tick S8, add a Session log entry, and commit. Ask me before pushing.
```

## CP-D: Play-test 3: the character in motion *(you)*

1. Does the character read clearly against the floor at the front and the back of the court?
2. Do the swings look like they hit the ball?
3. Is the palette swap distinct enough?
4. **Last chance for the camera:** after this, the camera is frozen because A4 paints the court to match it.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md and docs/decisions.md.
Read docs/plan.md and its Session log. My CP-D feedback: <notes>. Camera is final: <yes / change X first>.
Update the remaining sessions, tick CP-D, and commit. Don't push.
```

---

## A4: Art: court background, ball and effects

**Goal:** the in-match art apart from the character and the UI.

**In scope**
- **Court background:** export a 640×360 PNG of our own code-drawn court, using the frozen camera, and paint over it in Aseprite. That gives white walls, red lines, the tin band, light wood boards, and the side margins prepared for the HUD. SpriteCook may supply a wood texture, wall texture or wall boards (spend gate first).
- Side-wall boards with "HOGG RAZORBACKS" and an optional Mission Success nod: ask the owner first. **No school logo** (open question 6).
- Small sprites hand-drawn in Aseprite (no credits): the ball at 5–7 sizes by depth, shadow, landing marker, front-wall impact ring, and contact sparkle.
- Export `assets/court.png`, `assets/fx.png` + `assets/fx.json`.

**Not in scope:** font and UI (A5), game code.

**Depends on:** CP-D, and the 💳 approval line above it.

**Main files:** `art/court/court.aseprite`, `art/fx/fx.aseprite`, `public/hogg-squash/assets/court.png`, `public/hogg-squash/assets/fx.png`, `public/hogg-squash/assets/fx.json`, `art/spritecook-manifest.md`.

**Done when…**
- The painted court lines up exactly with the code-drawn lines when one is laid over the other (show a comparison).
- The ball stands out against the walls and the floor at every size.
- The manifest is updated, and `npm test` passes.

**You check or decide at the end:** approve the court look and whether to use wall boards.

**Starter prompt**
```text
We're doing Session A4 of docs/plan.md: "Art: court background, ball and effects".
Read CLAUDE.md, docs/art-style-guide.md, docs/theme.md and docs/plan.md ("Art sessions: shared rules", open question 6, A4).
First check my SpriteCook balance and list any planned generations with estimated credits (hand-drawn Aseprite work needs no credits), then STOP and wait for my OK.
No game code changes. No school logo. Finish with "Done when", tick A4, add a Session log entry, and commit. Ask me before pushing.
```

## A5: Art: font, callouts, score panel, title art

**Goal:** the UI art the game and menus need.

**In scope**
- **A bitmap font:** our own, drawn in Aseprite. Or an open-licence pixel font, but only with your OK and its licence file committed next to it.
- Callouts: POINT, OUT, TIN, DOWN, NOT UP, GAME, "WINS".
- A score panel frame and a serve indicator.
- Title art: a "HOGG SQUASH" logotype and an original cartoon razorback mascot (SpriteCook, spend gate), but no school logo.
- Menu panel/cursor pieces.
- Export to `assets/font.png` + `font.json`, `assets/ui.png` + `ui.json`, `assets/title.png`.

**Not in scope:** game code, the school logo.

**Depends on:** A4, and the 💳 approval line above it.

**Main files:** `art/ui/*.aseprite`, `public/hogg-squash/assets/font.*`, `public/hogg-squash/assets/ui.*`, `public/hogg-squash/assets/title.png`, `art/spritecook-manifest.md`.

**Done when…**
- The font covers A–Z, 0–9 and `- : . ! ?` and the en dash used in scores.
- All callouts and the title art have been approved by you.
- The manifest is updated, and `npm test` passes.

**You check or decide at the end:** approve the title art and the font.

**Starter prompt**
```text
We're doing Session A5 of docs/plan.md: "Art: font, callouts, score panel, title art".
Read CLAUDE.md, docs/art-style-guide.md, docs/theme.md and docs/plan.md ("Art sessions: shared rules", open question 6, A5).
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK.
No game code changes. No school logo. Finish with "Done when", tick A5, add a Session log entry, and commit. Ask me before pushing.
```

---

## S9: Court, ball and HUD art in the game

**Goal:** the match looks finished: the painted court, ball sprites, effects, bitmap text, HUD and callouts.

**In scope**
- Draw `court.png` as the background (the code-drawn court is kept behind a debug toggle for checking alignment).
- Ball sprite size picked by depth band. Shadow, landing marker, impact ring and sparkle from `fx.json`.
- `js/render/text.js`: a bitmap-font text renderer. All in-game text switches to it.
- The HUD in the side margins (score panel, serve indicator), and callouts and the score painted on the front wall.
- **One logo slot:** a single asset path and flag, off by default, so the school logo can be added later as a one-file change once it's confirmed.

**Not in scope:** menus (S10), options (S11), sound.

**Depends on:** A5, S8.

**Main files:** `js/render/court.js`, `js/render/effects.js`, `js/render/hud.js`, `js/render/text.js`, `js/render/actors.js`.

**Done when…**
- `npm test` passes.
- In the browser, a full 1P game and a 2P game look complete, with no plain canvas text left in the match.
- The ball is easy to follow everywhere on court.
- The debug toggle shows the painted lines matching the physics lines.
- No console errors.

**You check or decide at the end:** go to CP-E.

**Starter prompt**
```text
We're doing Session S9 of docs/plan.md: "Court, ball and HUD art in the game".
Read CLAUDE.md, docs/decisions.md, docs/art-style-guide.md and docs/plan.md (rules, open question 6, S9). Check A5 and S8 are ticked.
Build S9's "In scope" list only. No school logo: just the off-by-default slot.
Go through "Done when", tick S9, add a Session log entry, and commit. Ask me before pushing.
```

## CP-E: Play-test 4: the look *(you)*

1. Is everything readable at 1280×720 and full screen?
2. Is the ball always visible?
3. Is the HUD clear without being distracting?
4. Anything that looks off? List it for S12.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md.
Read docs/plan.md and its Session log. My CP-E feedback: <notes>.
Add the fixes to S10–S12 (or a small fix-up session), tick CP-E, and commit. Don't push.
```

---

## S10: Screens, match flow and pause menu

**Goal:** the full flow from `decisions.md`: title → 1P/2P → match length → difficulty (1P only) → controller assignment → match → result → rematch or menu, plus the pause menu.

**In scope**
- `js/ui/screens.js`: a small state machine, with one file per screen in `js/ui/`.
- Menus are driven by the same input actions (arrows/WASD + Enter/Space, D-pad + A).
- **Controller assignment:** keyboard P1/P2 by default, and pads join with "Press any button". This replaces the S7 overlay.
- **Pause menu** (Resume / Restart match / Quit to title) on Esc or Start. It also pauses automatically on window blur, on the tab being hidden, and on leaving fullscreen.
- The result screen shows the final score, with Rematch (same settings) or Menu.
- The URL parameters stay as debug shortcuts only.
- `test/screens.test.js`: the pure screen transitions (for example 2P skips difficulty; Rematch keeps the settings).

**Not in scope:** the options screen (S11), sound, any new gameplay.

**Depends on:** CP-E.

**Main files:** `js/ui/screens.js`, `js/ui/title.js`, `js/ui/setup.js`, `js/ui/assign.js`, `js/ui/pause.js`, `js/ui/result.js`, `js/main.js`, `test/screens.test.js`.

**Done when…**
- `npm test` passes.
- In the browser, every path through the flow works: 1P at each match length and several levels, 2P on keyboard and on pads, rematch, back to the menu.
- Pause works from Esc, from Start, on alt-tab and on leaving fullscreen.

**You check or decide at the end:** menu wording, the order of options, and the defaults (suggested defaults: first to 9, level 5).

**Starter prompt**
```text
We're doing Session S10 of docs/plan.md: "Screens, match flow and pause menu".
Read CLAUDE.md, docs/decisions.md (Screens), docs/controls.md and docs/plan.md (rules + S10). Check CP-E is ticked.
Build S10's "In scope" list only. Keep screen logic out of js/sim/.
Go through "Done when", tick S10, add a Session log entry, and commit. Ask me before pushing.
```

---

## S11: Options: key remapping and key test

**Goal:** the options screen from `decisions.md`: remap any key for either player, and a key test for checking ghosting.

**In scope**
- Options reached from the title screen.
- **Remapping:** remap each of the 6 actions for P1 and P2 by pressing a key (`KeyboardEvent.code`).
  - Refuse Ctrl, Alt, Meta, Tab and Esc, and warn about duplicates.
  - Include "Reset to defaults" and a "Laptop (no numpad)" preset for P2's hit keys (`.` and `/`, or K and L).
- **Key test screen:** lights up every key being held, so players can find combinations their keyboard can't register.
- Saved in `localStorage` (wrapped in try/catch, so the game falls back to defaults if storage is blocked).
- `test/keymap.test.js`: validation rules, presets, and saving/loading with storage mocked.

**Not in scope:** gamepad remapping, sound settings.

**Depends on:** S10.

**Main files:** `js/ui/options.js`, `js/ui/keytest.js`, `js/input/keymap.js`, `js/input/keyboard.js`, `test/keymap.test.js`.

**Done when…**
- `npm test` passes.
- In the browser, a remapped key works in a match and is still there after a reload. Ctrl is refused. The laptop preset works.
- The key test shows WASD + F/G + arrows + Numpad keys held together (or shows where your keyboard drops them).

**You check or decide at the end:** try it on the laptop or keyboard you'll actually play on.

**Starter prompt**
```text
We're doing Session S11 of docs/plan.md: "Options: key remapping and key test".
Read CLAUDE.md, docs/controls.md and docs/plan.md (rules + S11). Check S10 is ticked.
Build S11's "In scope" list only.
Go through "Done when", tick S11, add a Session log entry, and commit. Ask me before pushing.
```

---

## S12: Polish and release prep

**Goal:** make v1 ready to share. Fix the CP-E list and tidy the rough edges. No new features.

**In scope**
- The fix list from CP-E.
- A fullscreen toggle (button or key), a loading screen, and a favicon.
- A short "How to play" card on the title screen (HARD/SOFT; timing sets the angle; the landing marker).
- Small effects: a flash on a point, and the celebrate/dejected animations if A3 made them.
- **Caching:** check that a new deploy isn't stuck behind cached old JS modules. If it is, add `public/_headers` (Workers static assets) or version query strings on the module imports.
- Check in Chrome, Edge and Firefox, at 60 Hz and at a high refresh rate if available.
- Update `README.md` and the status line in `CLAUDE.md`.

**Not in scope:** anything listed as "Not in v1" in `decisions.md` (tournament, more characters, audio, crowd, back wall, high scores).

**Depends on:** S11.

**Main files:** various, plus `public/_headers` if needed, `README.md`, `CLAUDE.md`.

**Done when…**
- `npm test` passes.
- Everything on the CP-E list is fixed or explicitly deferred with a reason.
- The game works in all three browsers.
- No console errors from a cold load to the end of a match.

**You check or decide at the end:** go to CP-F.

**Starter prompt**
```text
We're doing Session S12 of docs/plan.md: "Polish and release prep".
Read CLAUDE.md, docs/decisions.md and docs/plan.md (rules, the CP-E notes in the Session log, S12). Check S11 is ticked.
Build S12's "In scope" list only. No new features.
Go through "Done when", tick S12, add a Session log entry, and commit. Ask me before pushing.
```

## CP-F: Release play-test and go-live *(you)*

1. Play a full 1P match and a full 2P match from the title screen, the way a new player would.
2. Decide about the school logo (open question 6). If the school is happy, a tiny session turns the logo slot on.
3. Approve the push. Afterwards, check https://roninray.com/hogg-squash/ in a private window.
4. Pick what comes after v1 (more characters, audio, crowd, tournament…) for a new plan.

---

## Session log

Each session adds a few lines here: date, what changed, numbers measured, anything left for later.

- 2026-10-18, planning: wrote this plan. Decisions from the planning session are recorded above under "Decisions made while writing this plan".
- 2026-10-18, P0: Node.js v24.20.0 / npm 11.19.0 installed (`C:\Program Files\nodejs`). `npm test` baseline (run2 + run3): golden 12309/12390 + 17452/17563 exact; flight 164 + 294 flights, all ended by a hit or rally end, 12274 + 17360 frames with zero error; shot-select 100/100 + 144/144; hits matched 67/81 + 73/111 (human and CPU hits counted together). Shells started before the install may not see `node` until they're reopened.
- 2026-10-18, S1: the page is now the Canvas test. New: `index.html`, `js/main.js`, `js/engine/loop.js` + `screen.js`, `js/render/projection.js` + `court.js` + `actors.js` (ball, shadow, box; not in the S1 file list, but it keeps drawing out of `main.js`) + `debug.js`, `js/sim/player.js` (imports in Node), `.claude/launch.json`. `squash-physics.js` and `test/` unchanged, and `npm test` prints exactly the P0 baseline.
  - **Plumbing written:** about 150 lines (loop 32, screen 48, debug overlay 49, about 20 lines of keyboard handling in `main.js`). The game-specific code (projection 43, court 111, actors 43, player 92, the rest of main) is about 370 lines. All 518 lines include comments.
  - **Plain Canvas, what felt awkward:** not much. (1) Crisp scaling has to be worked out in *device* pixels, or 125%/150% Windows scaling gives uneven pixels. `screen.js` draws into a 640×360 back buffer and copies it at a whole-number scale. (2) Resizing a canvas silently resets `imageSmoothingEnabled`. (3) `fillText` at 10 px is antialiased, so the debug and help text look soft once scaled up; the bitmap font in S9 fixes that. (4) Polygon edges are antialiased in the back buffer, so the court lines have soft edge pixels; the A4 painted court replaces them. (5) A hidden tab gets no animation frames; the 5-step catch-up cap handles the return.
  - **Checked in the browser:** at 1280×720 and 1920×1080 the canvas is exactly 2× and 3×, and every 2×2 / 3×3 block of the visible canvas is a single colour. A 1000×300 window falls back to 533×300. The overlay reads 56.9–58.1 steps/s per 1-second window, and only the pane's own display rate could be tried. Feed: about 32 m/s into the front wall, 11 m/s off it, 7 floor bounces, then it rolls to a stop. HARD came off the racket at 34.9 m/s and SOFT at 18.7 m/s, with the same timing. Aim: early 6 (angled left), on time 3–4 (straight), late 0 (angled right, into the side wall). A press with the ball far away shows MISS. Holding D+W moved the box 100 units across and 50 in depth over the same steps (2.5 vs 1.25).
  - **Box height: 100 px** (default; `?h=<px>` tries other sizes without editing code). It looks about right at the back of the court. At the front wall the same 100 px box reaches above the service line and looks like a 3 m giant. So one fixed size probably isn't enough with this camera: CP-A should choose between 2–3 pre-scaled sizes and a flatter camera (a longer `behindBack` + `focal`).
  - **Camera** (`CAMERA` in `projection.js`): 8.1 m behind the back wall, 4.0 m high, focal 557 px, eye line at y 70. On screen the front wall is 200 × 143 px (up to the out-line) and the floor is 150 px deep. The court spans x 100–540 at its widest, so each side margin is 100 px.
  - **Small extras:** the box turns pink while swinging (so a press is visible), there's a one-line key hint under the court, and the overlay also shows the player's x/z. There's also a launch config outside the repo: the desktop app looks for `.claude/launch.json` in its session folder (`C:\Hogg Squash`, the repo's parent), so an uncommitted copy there runs `npm --prefix hogg-squash run dev`.
  - **For later:** the feed (the arcade's `SERVE` from the box's racket side) comes back to about the short line, so you have to step forward to hit it. Ball and shadow are drawn as plain circles. There's no landing marker yet (S3).
