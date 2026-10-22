# Hogg Squash v1: build plan

Written 2026-10-18 from `CLAUDE.md`, everything in `docs/` and `docs/research/`, `public/hogg-squash/js/squash-physics.js` and the tests in `test/`.
The work is split into small Claude Code sessions. Each one leaves the game working, tests passing and its work committed.

## Status

Tick a line (`[x]`) when its session or checkpoint is finished. **The next session to run is the first unticked line.**
Lines marked *(you)* are things the owner does. Lines marked 💳 are SpriteCook spend approvals: the art session after it stops and waits for your OK before generating anything.

- [x] **P0** Prerequisites *(you)*: install Node.js LTS (and optionally Git)
- [x] **S1** Canvas test: court, ball, placeholder player
- [x] **CP-A** Checkpoint *(you)*: plain Canvas or Phaser? Character size and camera
- [x] **S2** Rally rules and scoring (headless, tested) + `npm test` that can fail
- [x] **S3** Playable 2-player rally on one keyboard
- [x] **S4** Hitting and ball feel
- [x] **CP-B** Play-test 1 *(you)*: 2-player rallies
- [x] **S4b** CP-B fix-ups: aimed serve, 2 s dive, one smooth height curve
- [x] **S5** CPU opponent: movement and hitting
- [x] **S6** Difficulty 1–9 and game pace
- [x] **CP-C** Play-test 2 *(you)*: vs CPU at levels 1, 5 and 9
- [x] **S6b** CP-C fix-ups: a gentler CPU at low levels, shot quality by level, short SOFT drops
- [x] **S7** Gamepads
- [x] 💳 Approve SpriteCook spend for A1 *(you)*
- [x] **A1** Art: palette and style test sprite
- [x] 💳 Approve SpriteCook spend for A2 *(you)*
- [x] **A2** Art: character animations, part 1 (ready, run, serve)
- [x] 💳 Approve SpriteCook spend for A3 *(you)*
- [x] **A3** Art: character animations, part 2 (swings, dive, get-up)
- [x] **S8** Sprite and animation engine; the character goes into the game
- [x] **CP-D** Play-test 3 *(you)*: the character in motion
- [x] **S8b** CP-D fix-ups: a wider court (camera frozen), racket height at contact, serve wind-up, overhead
- [x] 💳 Approve SpriteCook spend for A4 *(you)*
- [x] **A4** Art: court background, ball and effects
- [x] 💳 Approve SpriteCook spend for A5 *(you)*
- [x] **A5** Art: font, callouts, score panel, title art
- [ ] **S9** Court, ball and HUD art in the game
- [ ] **CP-E** Play-test 4 *(you)*: the look
- [ ] **S10** Screens, match flow and pause menu
- [ ] **S11** Options: key remapping and key test
- [ ] **S11b** Touch controls (mobile mode): on-screen buttons, Auto / On / Off setting
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
   - `npm test` passes, and so does `npm run typecheck` (added after S2);
   - every "Done when" item has been checked, and you say which ones were checked in the browser and which only by tests;
   - tick the session's line in the status list and add a few lines to the **Session log** at the bottom of this file (what changed, any numbers measured, anything left for later);
   - commit with the message `Sx: <session name>`, ending with a plain-English `Build-log:` line for https://roninray.com/build/ (see "Commit messages" in `CLAUDE.md`).
9. **Never push without asking.** A push to `main` deploys to https://roninray.com/hogg-squash/. At the end, ask whether to push.
10. **Git:** if `git` isn't on the PATH, use GitHub Desktop's copy: `C:\Users\ronin\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe` (the version folder changes when GitHub Desktop updates).
11. **Hand-off:** the last thing every session does, after committing, is write the owner a ready-to-paste prompt for the **next unticked line**, and suggest an effort level for it.
    - **The prompt:** start from that line's starter prompt in this file. Update it with anything this session learned, such as changed file names, a new fix-up item, or a question the owner still has to answer.
    - **If the next line is a checkpoint** *(you)*: give a short list of what to play-test, then that checkpoint's planning prompt with the `<notes>` placeholders left for the owner.
    - **If the next line is a 💳 approval:** give the art session's prompt. That prompt already begins with the spend gate.
    - **Effort level:** suggest one of `low`, `medium`, `high`, `xhigh` or `max`, with one line of reasoning. Start from the guide below and adjust if this session found the next one harder or easier than planned.

    | Suggested effort | Sessions |
    |---|---|
    | `high` | S1, S2, S3, S4, S4b, S5, S6b, S8, S8b: new foundations, the rules, or porting arcade logic, where mistakes are costly |
    | `medium` | S6, S7, S9, S10, S11, S11b, S12, A1–A5: building on settled code or art work driven by the shared rules |
    | `medium` | Checkpoint planning sessions (CP-A … CP-E): editing this plan from your notes |

---

## Decisions made while writing this plan (2026-10-18)

Asked and answered before writing:
- **Node.js** isn't installed on this PC yet. The owner installs Node.js LTS before Session 1 (P0).
- **Serving is arcade-simple.** The server stands in a service box (alternating sides) and presses HARD or SOFT, and the ball leaves on the arcade's fixed serve trajectory (`SERVE` in the physics file). *(Changed 2026-10-19: same height and depth, but angled across the court. Changed again at CP-B: the server's spot in the box aims it and HARD/SOFT sets its depth (S4b). See `docs/decisions.md`.)* A serve can lose only the way any shot can (tin, out, not reaching the front wall). No service-box faults.
- **The live page shows the game as it grows.** The game is built in `public/hogg-squash/index.html` from Session 1 onward, replacing "Coming soon". The owner decides when each version goes live by approving pushes.

Settled by the plan (say so if you disagree):
- **Court lines in game units.** The arcade's units are ≈45 per metre across (x), ≈35.2 per metre in height (y) and ≈18.8 per metre in depth (z). The back glass being 75 units high matches the real 2.13 m back-wall out-line, which supports the height scale. Real squash heights then give: tin **17**, service line **63**, front-wall out-line **161**, side-wall out-line sloping from **161** at the front wall to **75** at the back, short line at **z = 103**, service boxes 72 units wide × 30 deep (z 103–133). These are a starting point, approved at the end of S2.
- **The projection works in metres** (x/45, y/35.2, z/18.8), so the court looks like a real 6.4 × 9.75 m court even though the arcade's units aren't to scale. The camera constants live in one object.
- **The court is a fixed background.** The camera never moves, so the court can be drawn once. From A4 onward it is a painted 640×360 image, painted over an export of our own projected court so that the lines match the physics exactly. **This means the camera is frozen after CP-D.** Moving it later means repainting the court. *(Changed at CP-D: the owner wants the court a little wider, so the camera is frozen at the end of S8b instead, once the owner has picked the wider view.)*
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

   **Changed at CP-B:** the owner played at the game's current pace (`defaultParams()` = arcade index 0, Normal skill 0: speed 280, power 17, bounce −1, gravity 0x1F80) and said it's right for level 5. That is this table's *level 3* row, so S6 re-anchors the pace columns: level 5 = the CP-B pace, level 9 stays Hardest 4, and levels 1–4 get slower in even steps below it. The CPU columns (reaction, error step) stay as they are.

2. **Pace by difficulty:** use the default. 1P uses the level's pace. 2P versus uses level 5's pace, which since CP-B is the pace played there (speed 280, power 17, bounce −1, gravity 0x1F80; see open question 1).
3. **Rubber band:** use the default and leave it out. **One change I recommend:** the arcade also grows the CPU's positioning error after *every point* (§6 step 5). Over a game to 11 this makes the CPU steadily sloppier, so level 5 at 10–10 would play worse than level 5 at 0–0. The plan makes the error a fresh random offset each rally, sized by the level's error step, that doesn't build up. A level then means the same thing all match.
4. **Character height:** settled at CP-A: **three pre-scaled sizes**, 100 px at the back (z ≥ 130), 84 px in the middle (70 ≤ z < 130) and 68 px at the front (z < 70), picked from the feet z with a little hysteresis. The camera is unchanged. Details in `docs/decisions.md` ("Camera and character size"). S3 draws the boxes this way and CP-B confirms the numbers. **Changed after S3:** the steps were jarring, so the boxes now change height smoothly through the same three sizes (68 / 84 / 100 px at z 39 / 100 / 155). A1 decides how the sprites do the same. **Changed at CP-B:** the 68–100 px range is right, but the growth didn't look natural (it stops growing near both walls and bends at mid-court). S4b replaces it with one smooth curve over the whole court, and the owner leans towards one sprite scaled to fit (A1 still compares).
5. **Hogg colour shades:** chosen in A1 and written into `docs/theme.md`.
6. **Logo on a public site:** there is no default for this, so the plan keeps it safe. **The school's shield logo stays out of the live game until you've confirmed with the school.** Until then the game uses the colours, a "HOGG RAZORBACKS" wordmark and our own original boar mascot. S9 leaves a single logo slot, so adding the logo later is a one-file change. *(Changed in A5, 2026-10-22, the owner's call: the school's shield is on the title screen, in place of the mascot. See `docs/decisions.md`, Theme.)*
7. **"Missing pieces" from the decompiled code:** only one of the five was actually found in the ROM.
   - **CPU movement** is documented (§6) and is ported in S5.
   - **Tin and out-line checks** weren't found. They are designed in S2 from real court heights (above).
   - **Serve rules** weren't found. Serving is arcade-simple (decided above).
   - **CPU-only shot adjustments** weren't found (the CPU's hits differ from the plain formula 34 times in 70). The CPU uses the same shot formula as a human. This is accepted rather than guessed at.
   - **Dive range** wasn't found. A dive is triggered by the classifier's existing "stretch" band, with a recovery lockout tuned in play-testing (S4). **Found in S4:** in the MAME recordings every dive (16, all by the CPU) followed a *special* contact (flag 0x10, contact types 10–11, the band just beyond a stretch), and nearly every ordinary swing had the stretch flag. So the game dives on the special band, as the arcade does (see the S4 Session log).

   So `squash-physics.js` keeps its maths as it is, and the new rules live in `js/sim/`.

## Target file layout

```
public/hogg-squash/
  index.html                 the game page (replaces "Coming soon" in S1)
  js/squash-physics.js       existing verified physics (maths untouched)
  js/main.js                 boot: wires loop, sim, input and renderer
  js/engine/loop.js          fixed 57.4 Hz step with an accumulator
  js/engine/screen.js        640×360 back buffer, fills the window (sharp-bilinear; ?scale=int for whole numbers)
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
- **Fix-up from CP-A: sized by depth band.** Both boxes are drawn at 100 / 84 / 68 px for the back / middle / front band (edges at z 130 and 70), picked from the feet z with about 4 units of hysteresis. Sizes, edges and hysteresis are named constants in one place in `js/render/actors.js`, so S8 reuses them for the sprites. This replaces the single `?h=` box height (`?h=` may stay as an override for the back size). The debug overlay shows each player's band.
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
- Walking a box from the back wall to the front wall steps it down 100 → 84 → 68 px, and standing still on a band edge doesn't flicker.
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
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md (§4, §5, §9) and docs/plan.md (rules + S4, and the S3 Session log entries). Check S3 is ticked.
Build S4's "In scope" list only. Don't change the physics maths: if the ball feels off, note it for CP-B instead.
The swing state machine goes in js/sim/player.js. Keep stepPlayer's turn argument ({ isP1, turnIsP1, mayStrike }); world.js gates turns at the press with canStrike. Add new tunables as named constants. Add test/player.test.js to UNIT_TESTS in test/run-all.js.
The browser pane may be throttled: use ?dev (window.hogg.step(n), dispatched KeyboardEvents) to drive the game, and say what couldn't be checked in real time.
Go through "Done when", tick S4, add a Session log entry with the shot-log numbers, and commit. Ask me before pushing.
```

---

## CP-B: Play-test 1: 2-player rallies *(you)*

Play several games to 9, with a friend or with both hands. Note answers to:
1. Is the view readable? Can you judge depth from the shadow and the landing marker?
2. Pace: too fast or too slow? (This is level 5's pace later.)
3. Reach and timing: do hits feel fair? Do misses feel like your fault? Since S4 a swing plants you for its whole 18 frames (0.31 s), as in the arcade recordings. Too stiff? (`SWING.MOVE_SPEED` 0 → 0xC000 would allow a slow shuffle.)
4. Dive: S4 copies the arcade, so a dive happens when the ball is just *beyond* stretching reach (the classifier's "special" band), and you stay down for 143 frames (2.5 s). Does the dive come at the right moments, and is 2.5 s right? (`DIVE.RECOVERY` in `js/sim/player.js`; the plan's first guess was about 45 frames.)
5. Rules: any call that felt wrong (tin height, out-lines, double bounce)? Two rulings from S3 to judge in particular:
   - ~~the arcade serve flies straight (vx 0)~~ settled 2026-10-19: the serve now crosses the court and lands behind the opposite box (`docs/decisions.md`). Does its depth feel right?
   - a swing only counts if it's your ball when you press, so a press before the ball has reached the front wall misses.
6. Placeholder sizes and camera, now that you've played properly. The boxes now grow smoothly from 68 px (front) through 84 to 100 px (back). Is that range right, and does the growth look natural? **This confirms the heights A1 to A3 work to.**
7. Screen: the game now fills the window (sharp-bilinear, slightly soft pixel edges at in-between sizes; exact at 3× in 1920×1080 fullscreen with F11). Is it sharp enough in a normal window, or should whole-number scaling (`?scale=int`) be the default?

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md (and docs/decisions.md for settled decisions).
Read docs/plan.md and its Session log (the S4 entry, and the two after it: PAUSED on the court, and the cross-court serve). Here's my CP-B play-test feedback: <notes>.
Turn it into changes to the remaining sessions (add small fix-up items to the right session, or a short fix-up session if needed), tick CP-B, and commit. Don't push.
```

**Answers (2026-10-19):** 1 view readable, yes. 2 pace right for level 5 (it's actually the plan's level 3 row; see open question 1). 3 the planted swing feels fine. 4 the dive comes at the right moments, but 2 s on the ground, not 2.5. 5 the serve should land in a different spot depending on where the server stands in the box, and go to different depths for HARD and SOFT; a press before the ball reaches the front wall stays a miss. 6 the height range is right but the growth doesn't look natural: one size that grows smoothly all the way forward and back. 7 sharp enough in a normal window; sharp-bilinear stays the default. The fixes are S4b; the details are in the Session log.

---

## S4b: CP-B fix-ups (aimed serve, 2 s dive, one smooth height curve)

**Goal:** the three changes from CP-B, before the CPU is built on top of them. Small, but the serve touches the rules, so it gets its own session and tests.

**In scope**
- **Dive: 2 s on the ground.** `DIVE.RECOVERY` 136 → 108 in `js/sim/player.js`, so a dive lasts 115 frames in all (contact on frame 7; 115 / 57.4 ≈ 2.00 s). Update `test/player.test.js` (143 → 115) and the comment.
- **Aimed serve.** Replace "always the centre of the opposite box" in `js/sim/world.js`:
  - **Where the server stands aims it.** The held ball's place across the server's box maps to the first bounce's place across the opposite back quarter, as a mirror image: near the centre line → near the centre line, near the side wall → near the side wall. Default target range: |x| 36 to 120 (keep the first bounce clear of the side wall; check the widest one doesn't hit the side wall first, and narrow the range if it does).
  - **HARD and SOFT set the depth.** Default first-bounce depth: HARD z ≈ 168 (deep, about where it lands now, then off the back glass), SOFT z ≈ 140 (just behind the service box, shorter and slower). The server's depth in the box nudges it by up to ±8 units (front of the box shorter, back deeper). All of these are named constants for CP-C to tune.
  - **Solve it with the real physics,** as `serveVx` does now: extend it (or add `serveAim`) to find the velocity whose first bounce lands on the target (x and z), keeping the arcade's `SERVE.vy` per button and solving sideways and depth speed (or say in the Session log if varying height works better). It must still work at any pace, since S6 changes the pace. `squash-physics.js` doesn't change.
  - **Every serve stays legal:** it hits the front wall between the service line (63) and the out-line (161) and lands in the opposite back quarter (behind the short line, z > 103, on the receiver's side). A serve has no special faults, as now.
  - The landing marker shows the target as soon as the serve is struck (it already uses `landingSpot`). The receiver's start spot stays at x ±72, z 150.
- **One smooth height curve.** Replace the three-point line in `heightAt` (`js/render/actors.js`) with one smooth curve over the whole court, with no flat ends and no bend. Default: height = 100 × √(perspective scale at z ÷ scale at z 179), using `project()`'s scale, rounded to whole pixels. That is a "half-strength" perspective: ≈70 px at the front wall (z 12), 77 at z 70, 82 at z 100, 87 at z 130, 93 at z 155, 100 at the back (z 179). It keeps `?h=`. Also check that nothing wobbles: when the width (0.36 × height) changes, rounding can make one edge step back and forth, so keep the box's feet centre and both edges moving smoothly. Add `?curve=old` to show the S3 curve, so the owner can compare at CP-C.
- **Tests:** player (dive length), world (from several spots in each box and both buttons: the first bounce lands on its target within a few units, HARD deeper than SOFT, every serve legal; the existing cross-court test updated), actors (the new curve: ≈70 at z 12, 100 at z 179, never shrinking as z grows, never more than 1 px a frame while running).

**Not in scope:** CPU serving (S5 uses this), difficulty levels (S6), art, changes to the swing.

**Depends on:** CP-B.

**Main files:** `js/sim/player.js`, `js/sim/world.js`, `js/render/actors.js`, `js/render/debug.js` (show the serve target), `test/player.test.js`, `test/world.test.js`, `test/actors.test.js`, `docs/decisions.md` (the final serve and height numbers).

**Done when…**
- `npm test` and `npm run typecheck` pass.
- In the browser:
  - serves from the inner and outer edges of each box land in visibly different places, and HARD lands deeper than SOFT;
  - a dive keeps the player down for about 2 s;
  - walking from the back wall to the front wall shrinks the box smoothly the whole way, with no flat stretch, bend or wobble.

**You check or decide at the end:** go straight on to S5. The serve numbers and the curve get their real test at CP-C.

**Starter prompt**
```text
We're doing Session S4b of docs/plan.md: "CP-B fix-ups (aimed serve, 2 s dive, one smooth height curve)".
Read CLAUDE.md, docs/decisions.md and docs/plan.md (rules, S4b, and the CP-B answers and Session log entry). Check CP-B is ticked.
Build S4b's "In scope" list only. Don't change squash-physics.js: solve the serve with the real physics in js/sim/world.js, as serveVx does now. New tunables are named constants.
The browser pane may be throttled: use ?dev (window.hogg.step(n), dispatched KeyboardEvents) to drive the game, and say what couldn't be checked in real time.
Go through "Done when", tick S4b, add a Session log entry with the serve landing spots and the new heights, and commit. Ask me before pushing.
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
- **CPU serve:** after about 1 s, it serves. Since S4b the serve is aimed by where the server stands and HARD/SOFT sets its depth, so the CPU picks a spot in its box and a button (a simple, varied, tunable choice, so it doesn't serve the same way every time), walks there, then serves. As receiver it reads the landing spot like any other ball.
- **CPU button choice:** the arcade's logic isn't known, so it is a simple, tunable rule in one function (for example SOFT from the front court when the opponent is deep, otherwise HARD, with some randomness).
- `isCpu` is passed to `applyShot`, so the CPU never aims into a near side wall.
- **Modes:** the page defaults to 1P vs CPU with the human serving first, and `?mode=2p` gives versus. The CPU uses Normal/skill 0 parameters until S6.
- Debug overlay: the CPU's chosen intercept and current state.
- `test/cpu.test.js`: 200 headless CPU-against-CPU rallies are deterministic and always end with a valid reason, with no NaN or out-of-court players. Against a set of fed balls, the CPU returns a reasonable share.

**Not in scope:** the 1–9 levels (S6), rubber-banding (left out), CPU-only shot adjustments (not found in the ROM), and art.

**Depends on:** S4b.

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
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md (§4 landing arrow, §6 CPU) and docs/plan.md (rules, open question 3, S5). Check S4b is ticked.
Build S5's "In scope" list only. The CPU must output the same per-player actions as a human, and stay deterministic.
Go through "Done when", tick S5, add a Session log entry, and commit. Ask me before pushing.
```

---

## S6: Difficulty 1–9 and game pace

**Goal:** the 1–9 difficulty table drives both the CPU's skill and the game's pace in 1P. 2P uses one fixed pace.

**In scope**
- `js/sim/difficulty.js`: the table from open question 1, **re-anchored at CP-B**: level 5's pace columns are the pace played at CP-B (speed 280, power 17, bounce −1, gravity 0x1F80, today's `defaultParams()`), level 9 stays Hardest 4, levels 1–4 get slower in even steps below level 5, and every column stays monotonic. The CPU columns stay as proposed. A 2P game at level 5 then plays exactly as at CP-B. `levelParams(level)` returns the physics params (speed, gravity, bounce offset, power mult, `latMult`) and the CPU params (reaction delay, error step).
- 1P uses the chosen level for both. 2P uses level 5's pace.
- `?level=1..9` (default 5), plus a debug key that changes the level between rallies.
- CPU shot choice may get a little smarter at higher levels (for example choosing HARD or SOFT based on where the human is standing), kept in the same tunable function.
- `test/difficulty.test.js`:
  - every column is monotonic;
  - every level gives sane ball flights (time to the front wall and to the bounce, within broad ranges around the arcade timings);
  - the aimed serve (S4b) still works at every level: from the inner and outer edges of each box, with HARD and SOFT, the first bounce lands on its target in the opposite back quarter and the serve is legal (the solver recomputes for the pace);
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
Read CLAUDE.md, docs/decisions.md, docs/research/squash-game-logic.md (§7 difficulty table) and docs/plan.md (rules, open questions 1–3, S6, and the S5 Session log entry). Check S5 is ticked.
Build S6's "In scope" list only, starting from the proposed table in the plan, re-anchored as open question 1 says (level 5 = the CP-B pace).
Go through "Done when", tick S6, add a Session log entry, and commit. Ask me before pushing.
```

---

## CP-C: Play-test 2: vs CPU *(you)*

Play at levels 1, 5 and 9, and one 2P game. Note:
1. Could a beginner win at level 1? Is level 9 brutal but fair?
2. Do the steps between levels feel even, or is there a jump?
3. Does the CPU ever do something silly (stand still, run the wrong way, always the same shot)?
4. Is the 2P pace right?
5. Serves (S4b): do the spots and depths feel right, for you and the CPU? Is SOFT short enough and HARD deep enough? Is 2 s on the ground after a dive right?
6. Height (S4b): does the box now grow naturally from front to back? Compare with `?curve=old` once.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md and docs/decisions.md.
Read docs/plan.md and its Session log. My CP-C feedback: <notes>.
Update the difficulty table and the remaining sessions as needed, tick CP-C, and commit. Don't push.
```

**Answers (2026-10-20):**
1. **No.** The owner lost 4–9 to the level 1 CPU. Its reaction should be a little slower, and it hits shots that are too good: how well it hits should scale with the level.
2. **Levels 1, 5 and 9 felt about the same.** Level 9 a little harder than level 1, level 5 in between and close to both. Only the pace (±8–9% from level 5) and the reaction time changed between levels, and that isn't enough to feel.
3. **No.** Nothing silly seen.
4. **No verdict.** The owner wasn't sure what the levels change. Explained: in 1P the level sets the ball's pace and the CPU's skill; 2P has no CPU and always plays level 5's pace (the CP-B pace). Kept as it is.
5. **SOFT in a rally goes too deep.** SOFT pressed with the ball in the front court should be a short drop, but it often runs to the back of the court. Serves and the 2 s dive got no complaints, so they stay.
6. **Height is natural.** The difference couldn't be seen while moving. Keep the S4b curve; `?curve=old` can go in S12.

---

## S6b: CP-C fix-ups (a gentler CPU at low levels, shot quality by level, short SOFT drops)

**Goal:** the levels feel clearly different, a beginner can beat level 1, and SOFT from the front court is a short drop.

**Measured while planning (level 5 pace, every front-court SOFT row at aims 1/3/5, from contacts at y 8 and y 30, z 50):** every first bounce lands in front of the short line (z 14–93), so the drop *starts* short. But rows #1, #3, #5 and #7 (high contacts) leave the racket at depth power 160, twice row #0's 80, so the ball is still travelling at its second bounce: z 123–173, near the back wall. Even row #0 reaches z 123 from a waist-high contact. That's the "goes pretty far back".

**In scope**
- **Slower CPU reaction at the low levels.** Default `cpuReaction` 36, 30, 24, 18, 12, 8, 5, 3, 1 (level 1 = 0.63 s, was 0.42 s; level 9 unchanged).
- **CPU shot quality scales with the level** (new columns in `LEVEL_TABLE`, monotonic, level 9 = today's CPU). Defaults, all tunable:
  - **Timing error:** the CPU presses up to ±N frames off its planned press (fresh per shot, deterministic): N = 4, 3, 3, 2, 2, 1, 1, 0, 0. Off-timing changes the aim the way it does for a human (`aimFromTiming`) and can turn a clean contact into a stretch or a miss.
  - **Placement:** at low levels it doesn't pick angles: no `AIM_JITTER` (it stands square, so most shots come back down the middle), growing to today's ±8 at level 9.
  - **Drops and kills:** fewer SOFTs at low levels. The plain SOFT chances in `chooseButton` scale down (default ×0.3 at level 1, ×1 at level 9), on top of the existing shot sense.
  - **Takes the ball later at low levels:** prefer a comfortable contact (after the bounce, waist height) over the earliest one (volleys, half-volleys), when both are reachable. Default: volleys allowed from level 6.
- **SOFT from the front court is a short drop**, for the human and the CPU. In `js/sim/` where the shot entry is chosen (`player.js`), not in `squash-physics.js` or `SHOT_TABLES` (the golden tests use them): for the FRONT zone, a SOFT's depth power is capped (default 64) and its lift too (default row #0's, 3072), as named constants. Tune them so that from any front-court contact up to y 30, at every level's pace, the **second bounce is in front of the short line (z < 103)** and the drop gets no more tins than today. Report the same numbers for MID-court SOFTs (not changed unless they also run deep).
- **A human-like reference player for the tests:** a scripted opponent that plays like a beginner, not like a second CPU: a 15-frame reaction (≈ 0.26 s), aims at the ball's *current* landing marker rather than the predictor's exact contact, ±3 frames of press timing, ±16 units of positioning error. The S6 browser check used a CPU brain with a 12-frame reaction and perfect prediction, which beat level 1 by 9–2, while the owner lost 4–9. The new player is meant to be closer to a person.
- `test/difficulty.test.js`: keep the S6 tests (monotonic columns, flights, serves; "rallies get longer as the level rises" may be replaced if the new columns break it, but say so). Add:
  - the reference player's share of points falls with the level, roughly: **≥ 60% at level 1, 35–55% at level 5, ≤ 20% at level 9** (starting targets; say what was measured);
  - the CPU's shot quality at level 1 is measurably worse than at level 9: more swings missed or stretched, fewer angled shots, fewer SOFTs;
  - the front-court SOFT test above (second bounce before the short line, tins no worse).
- Record the new table and the drop numbers in `docs/decisions.md`.

**Not in scope:** the pace columns (unchanged: the CPU's skill should make the difference; widen the pace only if the owner asks after this session), menus (S10), rubber-banding, serves, the dive.

**Depends on:** CP-C.

**Main files:** `js/sim/difficulty.js`, `js/sim/cpu.js`, `js/sim/player.js`, `test/difficulty.test.js`, `test/cpu.test.js`, `docs/decisions.md`.

**Done when…**
- `npm test` passes, and the golden numbers are exactly the P0 baseline (the drop change must not touch `squash-physics.js`).
- In the browser (driven with `?dev` if the pane is throttled), the reference player wins a game at `?level=1` and loses one at `?level=9`, and the debug overlay shows the CPU's timing error and the level's shot-quality settings.
- A SOFT from the front court takes its second bounce in front of the short line.

**You check or decide at the end:** play levels 1, 5 and 9 again (`[` / `]` switch between rallies). Can you beat level 1 now? Do the three feel clearly different? Is SOFT from the front a proper drop? If the levels still feel too close, say whether to widen the pace too.

**Starter prompt**
```text
We're doing Session S6b of docs/plan.md: "CP-C fix-ups (a gentler CPU at low levels, shot quality by level, short SOFT drops)".
Read CLAUDE.md, docs/decisions.md and docs/plan.md (rules, the CP-C answers, S6b, and the S6 and CP-C Session log entries). Check CP-C is ticked.
Build S6b's "In scope" list only. Don't change squash-physics.js or SHOT_TABLES: the drop change goes where player.js picks the shot entry. New tunables are named constants or LEVEL_TABLE columns, and the CPU stays deterministic.
The browser pane may be throttled: use ?dev (window.hogg.step(n), dispatched KeyboardEvents; hogg.cpus has the CPU) to drive the game. A hidden pane auto-pauses: unpause with a dispatched Escape. Say what couldn't be checked in real time.
Go through "Done when", tick S6b, add a Session log entry, and commit. Ask me before pushing.
```

---

## S7: Gamepads

**Goal:** two gamepads (or a keyboard and a pad) work, one per player, using the browser's Gamepad API.

**In scope**
- `js/input/gamepad.js`, polled once per sim step: left stick (with a dead zone) or D-pad to move, A/Cross = HARD, B/Circle or X/Square = SOFT, Start = pause (the same toggle as Esc; the court shows PAUSED).
- A temporary "Press any button to join" overlay that assigns pads to P1 and P2. The proper screen comes in S10.
- Keyboard and pad can be mixed.
- A pad unplugged mid-match pauses the game with "Controller disconnected".
- Chrome and Edge are the targets, with Firefox best effort.
- `test/input.test.js`: maps a fake gamepad object to actions (dead zone, D-pad, buttons, press detection).

**Not in scope:** remapping pads (only keys are remappable, in S11), menus, vibration, touch controls (S11b).

**Keep in mind for S11b:** gamepads go through `js/input/actions.js` like the keyboard, so the game never knows which device is in use. Touch buttons plug into the same actions later.

**Depends on:** S6b.

**Main files:** `js/input/gamepad.js`, `js/input/actions.js`, `js/main.js`, `test/input.test.js`.

**Done when…**
- `npm test` passes.
- A 2P game can be played on two pads, and with keyboard + pad.
- 1P works on a pad.
- Unplugging a pad pauses the game, and plugging it back in plus a button press carries on.

**You check or decide at the end:** tell the session which controllers you tested with, and whether any button felt wrong.

**Starter prompt**
```text
We're doing Session S7 of docs/plan.md: "Gamepads".
Read CLAUDE.md, docs/controls.md and docs/plan.md (rules + S7). Check S6b is ticked.
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
- **One size, scaled smoothly (A1, 2026-10-20; replaces "Three sizes" and "Smooth height" below):** every character animation is made and cleaned **at 100 px only**, one sheet `player-100.png` + `.json` (tags, durations, `feet` slice). The game scales it to `heightAt(z)` at draw time with smoothing on (method 1b; `docs/decisions.md`, "Sprites: one 100 px sheet, scaled smoothly"). No 84 or 68 px sheets. Style reference for every character generation: A1's concept 4 (`art/spritecook-manifest.md`). First-pass cleanup: `art/tools/pixel-lib.lua`.
- *(Superseded by A1)* **Three sizes (CP-A):** every character animation is generated once at 100 px. It is then downscaled to 84 and 68 px in Aseprite and cleaned up again at each size, with no extra SpriteCook credits. Each size is its own sheet (`player-100`, `player-84`, `player-68`, each a `.png` + `.json`) with identical tags, frame counts, durations and `feet` slice. This takes about three times the cleanup work of one size.
- *(Settled by A1)* **Smooth height (after S3):** in the game the character's height now changes smoothly with depth (68 → 100 px), not in three steps. A1 tries three ways for the sprites to follow it and the owner picks one: scaling the 100 px art at draw time, exporting many sizes (about every 2–4 px) downscaled automatically, or scaling the nearest of the three hand-cleaned sizes (see `docs/decisions.md`). A2 and A3 then export whatever A1 picked. The "Three sizes" rule above applies until then, and is replaced if A1 picks otherwise.
- **After CP-B:** the 68–100 px range is confirmed, and since S4b the height follows one smooth curve (`heightAt`: ≈70 px at the front wall to 100 at the back, no flat ends). The owner leans towards **one sprite, scaled to fit** (method 1, the least art work), but wants to see real pixel art first, so A1 still shows all three methods, method 1 first.
- **Order:** A1–A3 only touch art files, so they can be run earlier, in parallel with S2–S7, if you like. A1 can run any time after CP-A. A2 and A3 wait for A1's method (CP-B has confirmed the range). A3 also needs the swing and dive timings (S4, and S4b's 2 s dive).

## A1: Art: palette and style test sprite

**Goal:** lock the look. Make a shared palette with the Hogg red, black and white plus court neutrals, and one cleaned sprite of the player from behind in the ready stance at the CP-A height, shown on our court.

**In scope**
- After the spend gate, use SpriteCook to make concept images of an adult player in red and black seen from behind, pick one, and keep it as the style reference for everything later.
- In Aseprite:
  - build the palette (32–48 colours) and save it as `art/palette/hogg-squash.gpl`;
  - clean one ready-stance frame at 100 px;
  - downscale it to 84 and 68 px and clean those too, to show the smaller sizes still read;
  - make a palette-swapped version (for example a white-and-black kit) to prove the swap.
- **Smooth-height test:** show the ready frame at every height on the game's curve (`heightAt` after S4b: about 70 to 100 px) done the three ways, starting with method 1, the owner's lean, in "Art sessions: shared rules" ("Smooth height"): a strip of sizes per method, plus a GIF made in Aseprite that walks it from the back to the front (art sessions don't change game code, so draw-time scaling is imitated by resizing in Aseprite: nearest-neighbour or smooth). The owner picks one. Record the choice in `docs/decisions.md` and `docs/art-style-guide.md`, and update A2, A3 and S8 to match.
- A mockup PNG of the sprite on a screenshot of our own court, at the back, middle and front.
- Record the chosen hex colours in `docs/theme.md` (open question 5) and the character heights (68 → 100 px) and the chosen smooth-height method in `docs/art-style-guide.md`.

**Not in scope:** animations, court art, the logo, game code.

**Depends on:** CP-A (height), and the 💳 approval line above it.

**Main files:** `art/palette/hogg-squash.gpl`, `art/character/player.aseprite`, `art/mockups/a1-court-mockup.png`, `art/spritecook-manifest.md`, `docs/theme.md`, `docs/art-style-guide.md`.

**Done when…**
- You've seen and approved the palette, the sprite at all three sizes and the swapped kit, and picked the smooth-height method.
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
- 100 px only (A1 picked one sheet, scaled smoothly in the game): no 84 or 68 px sizes.
- Export `public/hogg-squash/assets/player-100.png` + `player-100.json`.

**Not in scope:** swings and dive (A3), game code.

**Depends on:** A1 (the smooth-height method), CP-B (range confirmed), and the 💳 approval line above it.

**Main files:** `art/character/player.aseprite`, `public/hogg-squash/assets/player-100.png`, `public/hogg-squash/assets/player-100.json`, `art/spritecook-manifest.md`.

**Done when…**
- Each tag loops cleanly in Aseprite's preview with no height jumps or foot sliding.
- The JSON contains every tag with its frame durations, and the `feet` slice.
- The manifest is updated, and `npm test` passes.

**You check or decide at the end:** approve the run and serve animations.

**Starter prompt**
```text
We're doing Session A2 of docs/plan.md: "Art: character animations, part 1 (ready, run, serve)".
Read CLAUDE.md, docs/decisions.md ("Camera and character size"), docs/art-style-guide.md and docs/plan.md ("Art sessions: shared rules" + A2), plus art/spritecook-manifest.md from A1. Check A1 and CP-B are ticked. A1 settled the sizes: one 100 px sheet only (the game scales it smoothly), with concept 4 as the style reference and art/tools/pixel-lib.lua for the first cleanup pass.
First check my SpriteCook balance and list the planned generations with estimated credits, then STOP and wait for my OK.
No game code changes. Finish with "Done when", tick A2, add a Session log entry, and commit. Ask me before pushing.
```

## A3: Art: character animations, part 2 (swings, dive, get-up)

**Goal:** the hitting animations, timed to match the game's swing so that the racket meets the ball on the contact frame.

**In scope**
- After the spend gate, animate in SpriteCook: forehand, backhand, overhead, and dive (left and right) + get-up. Celebrate and dejected only if the budget allows.
- **Timing:** read the swing constants in `js/sim/player.js` (from S4). The contact frame must start 7 sim frames (≈122 ms) after the swing begins, and the recovery must last as long as the sim's recovery. Mark the contact frame (frame user data `contact`, or a `contact` tag). As built in S4 and S4b (check `SWING` and `DIVE`): a swing is 18 frames in all (contact on frame 7, ≈0.31 s), and a dive is 115 frames (contact on frame 7, then about 1.9 s lying down and getting up; 2 s in all, set at CP-B).
- Cleanup, tags, `feet` slice, at 100 px only (A1's method). Re-export `player-100.png` / `.json` with all tags.

**Not in scope:** game code, court art.

**Depends on:** A2, S4b (the 2 s dive), and the 💳 approval line above it.

**Main files:** `art/character/player.aseprite`, `public/hogg-squash/assets/player-100.png`, `public/hogg-squash/assets/player-100.json`, `art/spritecook-manifest.md`.

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
- Palette swap done once at load: an offscreen canvas recolours the 100 px sheet from a colour→colour table (the six reds → whites in `docs/art-style-guide.md` §2).
- Sprites drawn at the smooth height from `heightAt` in `js/render/actors.js`, by A1's method: the 100 px frame scaled to that height with `imageSmoothingEnabled = true` and `imageSmoothingQuality = 'high'`, for the player sprites only (smoothing off again for everything else). Place the `feet` pivot on the projected feet point. They're positioned at the projected feet point, in depth order. A change of size keeps the current tag and frame, so the animation doesn't restart.
- Placeholder boxes kept behind a debug toggle.
- `test/sprites.test.js`: parses `player-100.json` and checks that every expected tag exists, that it has the `feet` slice, and that the contact frame timing matches the sim constants.

**Not in scope:** court, ball and HUD art (S9), menus.

**Depends on:** A3, S7.

**Main files:** `js/engine/assets.js`, `js/render/sprites.js`, `js/render/actors.js`, `js/main.js`, `test/sprites.test.js`.

**Done when…**
- `npm test` passes.
- In the browser, both players animate correctly while running, swinging, diving and serving, and P2/CPU wears the swapped kit.
- Running from the back to the front shrinks the character smoothly, without the animation jumping.
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

1. Does the character read clearly against the floor at the front and the back of the court? Does the smooth change of size look clean while running in depth?
2. Do the swings look like they hit the ball?
3. Is the palette swap distinct enough?
4. **Last chance for the camera:** after this, the camera is frozen because A4 paints the court to match it.

**Starter prompt** (planning-only session)
```text
Planning only: change no files except docs/plan.md and docs/decisions.md.
Read docs/plan.md and its Session log. My CP-D feedback: <notes>. Camera is final: <yes / change X first>.
Update the remaining sessions, tick CP-D, and commit. Don't push.
```

**Answers (2026-10-21):** the owner answered the three open points from the S8 Session log ("For CP-D") and the camera question. No notes were given on questions 1 and 3 (readability against the floor, the palette swap).
- **Racket height at contact:** fix it with a small sprite offset by ball height, not new art.
- **The serve:** give the sim serve a 7-frame wind-up (the ball leaves 0.12 s after the press, like a swing), so the serve tag's 3 wind-up frames show. It's a gameplay change.
- **Overhead:** wire it, by the rule proposed in S8.
- **Camera:** not final yet. "I want to make the court a little wider." The camera is frozen at the end of S8b, once the owner has picked the wider view there.

The fixes are S8b.

---

## S8b: CP-D fix-ups (a wider court, racket height at contact, serve wind-up, overhead)

**Goal:** the four changes from CP-D, before A4 paints the court. Afterwards the camera is frozen.

**In scope**
- **A little wider court (the owner picks in this session).** All the court drawing goes through `project()`, so this is a change to `CAMERA` in `js/render/projection.js`. Build two candidates, switchable with `?cam=wide|zoom|old`, then **stop and ask the owner to pick** (or adjust the amount) before the tests and the freeze:
  - `wide` (the default proposal): stretch across only, with a new `CAMERA.widen` (default 1.10) multiplying the screen x offset. Measured while planning: the front wall goes from 200 × 143 px to 220 × 143, the floor at the glass from 440 to 484 px wide, and each side margin from 100 to 78 px. Heights and depths don't change, nor does `heightAt` (it uses `scale`, which is unchanged). The court reads about 10% wider than a real one, which is fine: the arcade's units aren't to scale either.
  - `zoom`: a ~10% larger `focal` (557 → about 612), with the eye line `cy` raised so the floor at the glass stays on screen (at focal 612 and cy 70 it ends at y 372, off the 360 px screen). The front wall is about 220 × 157 px and the margins are about 78 px. Everything gets bigger, not just wider, except the players: their heights are set in pixels (57 → 100), so they look about 10% smaller against the court.
  - The player sprites keep their size (`heightAt`), and the sprites are never stretched. The ball, shadow, landing marker and effects follow `project()`.
  - The placeholder HUD's `MARGIN_W` (`js/render/hud.js`, 100 px "with the S1 camera") is computed from the camera, and the scores and serve marker still fit the narrower margins.
  - After the pick, record the final camera in `docs/decisions.md` ("Camera and character size"): the constants, the front-wall size, the floor depth and the margin width. **The camera is then frozen.** `?cam=old` may stay until S12 for comparison, but A4 paints only the chosen camera.
- **Racket height at contact: a sprite offset by ball height.** The contact frames hold the racket at shoulder height, but S8 measured the ball at y 8–27 units for the middle half of hits (median 19, max 55), so the racket meets the ball from above.
  - Record the racket head's point on the contact frame of every swing tag (forehand, backhand, overhead, serve, dive). Prefer a `racket` slice in the character's Aseprite source, re-exported to `player-100.json`, with no SpriteCook. A named table in `js/render/sprites.js` is the fallback; say which in the Session log.
  - Draw the swinging sprite shifted up or down so that, on the contact frame, the racket head's screen y meets the ball's projected y at contact. The shift eases in over the wind-up (0 at the press, full on the contact frame) and out over the follow-through (0 by the swing's end), so it reads as reaching down or up rather than a jump. Up for overheads and high balls, down for low ones. It's vertical only; across stays as it is.
  - The shift is capped (`RACKET_SHIFT_MAX`, default 12% of the drawn height, ≈12 px at the back), so the feet never move far from the shadow. The cap and easing are named constants.
  - The ball height comes from the planned contact. The swing already keeps the classifier's `contact`. If the ball's y at contact isn't available, predict it in the renderer, or add it to the swing as a render-only field (no rule changes).
  - `?racket=off` turns the shift off for comparison.
- **Serve wind-up in the sim (a gameplay change).** Pressing HARD or SOFT to serve starts a serve swing. The ball stays held for `SERVE_WINDUP` = 7 frames (= `SWING.CONTACT`; the serve tag's wind-up frames, 40 + 40 + 42 ms, are exactly 7 sim frames) and then launches with the button that was pressed.
  - The server is locked in place during the wind-up, and further presses are ignored. The aim (`serveTarget`, `serveAim`) is computed at the launch from the held ball, which hasn't moved. The receiver moves as before. The phase stays `serve` until the launch, and the rally starts at the launch.
  - The CPU server presses as now. Check that `SERVE_WAIT` and anything else timed from the press still make sense with the 7 frames added.
  - Animator: the serve tag plays from its first frame on the press, so its contact frame is on screen on the launch step. Remove S8's special case that starts it on the contact frame.
  - Check the serve's contact frame against the held ball in slow motion. S8 saw the racket swing across to the left at the shoulder while the ball is waist-high on the server's right (`SERVE_SPOT`). The racket shift above handles height. If they're still far apart across, note it for CP-E. Don't move `SERVE_SPOT`, because it aims the serve.
  - Record the wind-up in `docs/decisions.md` (match rules, serving).
- **Overhead wired.** In `stepAnimator`, play `overhead` instead of forehand/backhand when the swing's contact is one of the classifier's overhead types (index 8–9, the ball above y 48, the same test `shotFor` uses). Mirror it for a backhand, as the dive is.
- **Tests:**
  - world: the serve launches exactly 7 frames after the press; the ball and the server don't move before it; the button comes from the press; serves stay legal and on target (the existing serve tests updated for the delay); determinism.
  - cpu: the existing tests still pass with the wind-up.
  - sprites: the serve tag's contact frame starts on `SERVE_WINDUP`; overhead is chosen for contacts 8–9 and not for others; every contact frame has a racket point.
  - projection / actors: the chosen camera puts the court corners where `decisions.md` says; `heightAt` is still 57 → 100 px, with the head under the service line at every depth.

**Not in scope:** new art or SpriteCook spend (the `racket` slice is a data edit in Aseprite), painting the court (A4), HUD art, changing `SERVE_SPOT` or the serve's aim, and any change to `squash-physics.js`.

**Depends on:** CP-D.

**Main files:** `js/render/projection.js`, `js/render/court.js`, `js/render/hud.js`, `js/render/sprites.js`, `js/render/actors.js`, `js/sim/world.js`, `js/sim/player.js` (the serve swing, if it lives there), `js/sim/cpu.js`, `art/character/` + `assets/player-100.json` (the `racket` slice), `test/world.test.js`, `test/cpu.test.js`, `test/sprites.test.js`, `docs/decisions.md`.

**Done when…**
- `npm test` and `npm run typecheck` pass. `squash-physics.js` is unchanged, and the golden numbers are exactly the P0 baseline.
- In the browser:
  - the owner has picked the camera, and the court is wider, with nothing cut off at the screen edges and the HUD inside the margins;
  - in slow motion the racket head meets the ball on the contact frame for low, waist-high and overhead balls (give the measured gap in px before and after, over 20+ hits);
  - a serve shows its wind-up and the ball leaves on the contact frame;
  - a high ball plays the overhead.
- The final camera is in `docs/decisions.md`, marked frozen.

**You check or decide at the end:** pick the camera during the session. At the end, play a few rallies and serves at full speed, then approve the SpriteCook spend for A4.

**Starter prompt**
```text
We're doing Session S8b of docs/plan.md: "CP-D fix-ups (a wider court, racket height at contact, serve wind-up, overhead)".
Read CLAUDE.md, docs/decisions.md, docs/art-style-guide.md and docs/plan.md (rules, the CP-D answers, S8b, and the S8 and CP-D Session log entries). Check CP-D is ticked.
Build S8b's "In scope" list only. Start with the camera: build ?cam=wide|zoom|old, show me screenshots of each, and STOP until I pick. Don't change squash-physics.js.
The browser pane may be throttled: use ?dev (window.hogg.step(n), dispatched KeyboardEvents) and ?slow, and say what couldn't be checked in real time.
Go through "Done when", tick S8b, add a Session log entry (the chosen camera, the racket gaps before and after, the serve timing), and commit. Ask me before pushing.
```

---

## A4: Art: court background, ball and effects

**Goal:** the in-match art apart from the character and the UI.

**In scope**
- **Court background:** export a 640×360 PNG of our own code-drawn court, using the frozen camera (picked in S8b; `docs/decisions.md`, not `?cam=old`), and paint over it in Aseprite. That gives white walls, red lines, the tin band, light wood boards, and the side margins prepared for the HUD. SpriteCook may supply a wood texture, wall texture or wall boards (spend gate first).
- Side-wall boards with "HOGG RAZORBACKS" and an optional Mission Success nod: ask the owner first. **No school logo** (open question 6).
- Small sprites hand-drawn in Aseprite (no credits): the ball at 5–7 sizes by depth, shadow, landing marker, front-wall impact ring, and contact sparkle.
- Export `assets/court.png`, `assets/fx.png` + `assets/fx.json`.

**Not in scope:** font and UI (A5), game code.

**Depends on:** S8b (the frozen camera), and the 💳 approval line above it.

**Main files:** `art/court/court.aseprite`, `art/fx/fx.aseprite`, `public/hogg-squash/assets/court.png`, `public/hogg-squash/assets/fx.png`, `public/hogg-squash/assets/fx.json`, `art/spritecook-manifest.md`.

**Done when…**
- The painted court lines up exactly with the code-drawn lines when one is laid over the other (show a comparison).
- The ball stands out against the walls and the floor at every size.
- The manifest is updated, and `npm test` passes.

**You check or decide at the end:** approve the court look and whether to use wall boards.

**Starter prompt**
```text
We're doing Session A4 of docs/plan.md: "Art: court background, ball and effects".
Read CLAUDE.md, docs/decisions.md (the frozen camera), docs/art-style-guide.md, docs/theme.md and docs/plan.md ("Art sessions: shared rules", open question 6, A4). Check S8b is ticked.
First check my SpriteCook balance and list any planned generations with estimated credits (hand-drawn Aseprite work needs no credits), then STOP and wait for my OK.
No game code changes. No school logo. Finish with "Done when", tick A4, add a Session log entry, and commit. Ask me before pushing.
```

## A5: Art: font, callouts, score panel, title art

**Goal:** the UI art the game and menus need.

**In scope**
- **A bitmap font:** our own, drawn in Aseprite. Or an open-licence pixel font, but only with your OK and its licence file committed next to it.
- Callouts: POINT, OUT, TIN, DOWN, NOT UP, GAME, "WINS".
- A score panel frame and a serve indicator, sized to fit the side margins the S8b camera leaves (the width is in `docs/decisions.md`; about 78 px if `wide` was picked, not the old 100).
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
- Ball sprite size picked by depth (the ball is tiny, so a few sizes chosen by depth is fine; check it doesn't pop next to the smoothly sizing character). Shadow, landing marker, impact ring and sparkle from `fx.json`.
- `js/render/text.js`: a bitmap-font text renderer. All in-game text switches to it.
- The HUD in the side margins (score panel, serve indicator), and callouts and the score painted on the front wall.
- **One logo slot:** a single asset path and flag, off by default, so the school logo can be added later as a one-file change once it's confirmed.
- **From A5:** the title already carries the school shield (`assets/title.png`; the owner's call), and the callout for the reason `notUp` is the `callout DOUBLE BOUNCE` slice (the owner's wording), so the HUD text "NOT UP" goes. Font, UI slices and their layout notes: `docs/art-style-guide.md` §3.

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
5. **The racket at contact (from S8b):** the shift is capped at 12% of the height, so low balls still meet the racket well below its head (median 46 px), and the serve's racket swings across at the left shoulder while the ball is on the right. Is it good enough, or should the cap go up, or low-contact art be added (a SpriteCook spend)? See the S8b Session log.

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

## S11b: Touch controls (mobile mode)

**Goal:** the game can be played on a phone or tablet with on-screen buttons, and those buttons never show up for someone playing on a computer.

**In scope**
- `js/input/touch.js`: on-screen controls drawn as HTML over the canvas (not inside it): a D-pad or thumb stick on the left for moving, HARD and SOFT buttons on the right.
  - The buttons set the same actions as the keyboard and pads (`js/input/actions.js`), so nothing in `js/sim/` changes.
  - Uses `touchstart`/`touchend` (or pointer events), not `click`, so moving and hitting work with two fingers at once.
- **When the controls show (setting "Touch controls: Auto / On / Off", default Auto):**
  - **Auto:** hidden at start. Shown on the first touch of the screen; hidden again when a key is pressed or a gamepad is used. `matchMedia('(pointer: coarse)')` may show them from the start on phones.
  - **On:** always shown. **Off:** never shown.
  - The setting lives on the S11 options screen and is saved in `localStorage` with the other options (try/catch, falls back to Auto).
- Menus from S10 and S11 can be worked by tapping.
- **Touch is 1P vs CPU only.** While the touch controls are showing, the 1P/2P screen offers 1P only (2P is hidden or greyed out with "2 players needs a keyboard or gamepads"). If a key or pad is used, 2P comes back.
- **Mobile page setup:** `touch-action: none` on the game area and a viewport meta tag so the page doesn't scroll or zoom during play; a "Turn your phone sideways" message in portrait; the S12 fullscreen toggle works by tap.
- `test/touch.test.js`: the Auto/On/Off logic (touch shows, key or pad hides, On/Off override), 2P unavailable while touch is showing, and saving/loading the setting with storage mocked.

**Not in scope:** 2-player on a touchscreen (decided 2026-10-20: touch is 1P vs CPU only), remapping or moving the on-screen buttons, vibration, an app-store or installable (PWA) version.

**Depends on:** S11.

**Main files:** `js/input/touch.js`, `js/input/actions.js`, `js/ui/options.js`, `public/hogg-squash/index.html` (viewport tag, overlay markup), `test/touch.test.js`.

**Done when…**
- `npm test` passes.
- On a phone: the controls appear, a full 1P match can be played from the title screen, and the page never scrolls or zooms.
- On a computer: the controls never appear with Auto, even after a reload.
- On and Off work, and the setting is still there after a reload.
- With the touch controls showing, 2P can't be picked; after pressing a key, it can.

**You check or decide at the end:** play a match on your own phone and say whether the button size and position feel right.

**Starter prompt**
```text
We're doing Session S11b of docs/plan.md: "Touch controls (mobile mode)".
Read CLAUDE.md, docs/decisions.md (Mobile and touch), docs/controls.md (Touch controls) and docs/plan.md (rules + S11b). Check S11 is ticked.
Build S11b's "In scope" list only. Touch must set the same actions as the keyboard and pads; nothing in js/sim/ changes.
I'll test on my phone, so tell me how to open the local build on it and what to try.
Go through "Done when", tick S11b, add a Session log entry, and commit. Ask me before pushing.
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
- Check in Chrome, Edge and Firefox, at 60 Hz and at a high refresh rate if available, plus a phone browser (touch controls from S11b).
- Update `README.md` and the status line in `CLAUDE.md`.

**Not in scope:** anything listed as "Not in v1" in `decisions.md` (tournament, more characters, audio, crowd, back wall, high scores).

**Depends on:** S11b.

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
Read CLAUDE.md, docs/decisions.md and docs/plan.md (rules, the CP-E notes in the Session log, S12). Check S11b is ticked.
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
- 2026-10-18, CP-A (planning only): owner's answers recorded in `docs/decisions.md`.
  - **Renderer:** plain Canvas, confirmed. No S1b.
  - **Camera:** kept as in S1. No fix-up item needed.
  - **Character height (open question 4):** three pre-scaled sizes: 100 px for z ≥ 130, 84 px for 70 ≤ z < 130, 68 px for z < 70, with hysteresis. They come from the S1 camera's scale (67 px/m at z 178, 45 at z 103, 33 at z 22): true perspective would halve the height from back to front, and these sizes split the difference.
  - **Ball feel:** like the arcade. **Feed depth:** fine as it is.
  - **Plan changes:** S3 gets a fix-up item to draw the boxes by depth band; CP-B question 6 confirms the sizes; the art shared rules, A1, A2 and A3 now produce three sizes (generate once at 100 px, downscale and clean in Aseprite), and A2/A3 wait for CP-B; S8 picks the sheet by band and tests all three; CP-D question 1 checks the size steps.
- 2026-10-18, S2: rules and scoring as headless modules, and an `npm test` that fails. The page is unchanged.
  - **Baseline before any change:** exactly the P0 numbers (golden 12309/12390 + 17452/17563; flight 164 + 294, all explained, 12274 + 17360 frames; shot-select 100/100 + 144/144; hits 67/81 + 73/111). Recorded in `test/baselines.json`.
  - **Harness (`test/run-all.js`):** compares each golden summary line with the baselines and exits 1 if a match count drops (golden exact, flight frames/flights/longest, hits matched), if a denominator changes (frames tested, shot loads, hits found; a physics change shows up there too), if a flight diverges without a racket hit, or if shot-select isn't 100%. It then runs the `node:test` unit tests (`rules.test.js`, `match.test.js`: 24 tests) and prints one summary line. `node test/run-all.js --record` rewrites the baselines, and should only be used on purpose.
  - **Deliberate break:** `RESTITUTION[16]` 110 → 111 made `npm test` exit 1 with 3 problems (run3: golden exact 17452 → 17450, flight frames 17360 → 17358, hits found 111 → 113). That index is used on only 2 frames of run3, and it was still caught. Reverting it gave exit 0 and the pre-S2 output again. A second check, `LINES.TIN` 17 → 18 in `court-rules.js`, failed the line-sync unit test (exit 1), and was reverted.
  - **`squash-physics.js`:** `// @ts-check` plus JSDoc typedefs (`Ball`, `BallEvent`, `BallParams`, `ShotParams`, `DifficultyParams`, `ShotEntry`, `Contact`) and `@param`/`@returns` on every export. The diff is 130 added lines, all comment or blank, plus 2 reworded comment lines: the header no longer mentions online play, and the `aim` note no longer says "joystick-driven". The full output of all 8 golden runs (every line, not just the summaries) was byte-identical after every edit. No type checker was run (no `tsc`; see the typecheck question below), so the JSDoc hasn't been machine-checked.
  - **`latMult`:** in both fixtures it equals `powerMult` when each rally starts (run2, Normal: 17; run3, Easy: 16). It creeps up by 1 now and then during a rally (up to 27 in run2 and 20 in run3) and drops back at the next serve. The game passes `latMult = powerMult` (S1's 17 at Normal is right). The creep isn't reproduced; if wide angles feel tame in long rallies, raise it at CP-B.
  - **New:** `js/sim/court-rules.js` (`LINES`, `frontWallVerdict`, `sideOutHeight`/`sideWallVerdict`, `serviceBox`), `js/sim/rally.js` (`makeRally`, `canStrike`, `rallyStrike`, `rallyEvent`, `stepBall`), `js/sim/match.js` (`MATCH_LENGTHS`, `firstServer`, `makeMatch`, `scoreRally`), `test/rules.test.js`, `test/match.test.js`, `test/baselines.json`.
  - **Rulings made in the code** (say if any feel wrong): the lines count against the ball (front wall y ≤ 17 is tin, y ≥ 161 is out; a side wall on or above the sloping line is out). Out anywhere loses for whoever struck last. "Over the back glass" means crossing z 183 above y 75 while moving back. A second front-wall touch without a strike (e.g. back off the glass) is ignored unless it is out. A ball whose bounce dies (vy snapped to 0) counts as having bounced again; otherwise it would roll with no second floor event and the rally would never end. The receiver is known at the strike, but may only strike after the front wall.
  - **Scripted-ball numbers:** the arcade serve from the right box hits the front wall at y 106 (3.0 m), bounces at z 167, comes off the back glass and bounces again at z 151. A receiver standing at the ghost-ball point 4 frames after the glass returns it to the front wall with a real HARD swing (`stepPlayer`).
  - **For S3:** `render/court.js` still has its own copy of `LINES` (the page wasn't touched). A unit test keeps the two equal, and S3 can switch `court.js` to import from `court-rules.js`. The world step order is `stepPlayer` → on a `hit` event `rallyStrike` → `stepBall` (in place of `step`), with turns gated by `canStrike`. `firstServer({ vsCpu, human, seed })` picks the server.
  - **Checked in the browser:** the page loads with no console errors; the court, ball and box draw; Space feeds a ball; the debug overlay works; and the three new sim modules import and run in the browser. The pane was hidden, so it got about 1.3 animation frames/s (5 sim steps/s with the catch-up cap), and the 57.4 steps/s figure wasn't re-measured. The loop code is unchanged. (The browser automation's backquote key arrives with an empty `e.code`, so the overlay had to be toggled with a dispatched `Backquote` event. That's an automation quirk, not a game bug.)
  - **For the owner:** approve the tin (17) and out-line (161 front, sloping to 75) heights, and decide on the optional `npm run typecheck` script.
- 2026-10-18, after S2 (owner's answers): **line heights approved** as they are (recorded in `docs/decisions.md`, "Match rules"). **Type check: yes.** `npm run typecheck` runs `npx -y -p typescript@7.0.2 tsc -p tsconfig.json`; `tsconfig.json` checks `public/hogg-squash/js/**/*.js` with no output and `strict` off (the physics file can't change code to satisfy strict mode). First run: 12 files, **0 errors**, so the S2 JSDoc in `squash-physics.js` needed no code changes. A probe file with 4 planted mistakes (a wrong return type, `makeRally(2)`, a string coordinate, missing physics params) gave 4 errors and exit 1, and was deleted. It isn't part of `npm test` (the first run downloads TypeScript); rule 8 now asks every session to run both. Git for Windows is now installed, and pushing from Claude's shell works (S2 was pushed).
- 2026-10-18, S3: the first playable game. Two players on one keyboard play a full match with serving, rules, score, callouts and a landing marker, using placeholder boxes.
  - **New:** `js/input/keyboard.js` (keys by `KeyboardEvent.code`, `preventDefault` on game keys, everything cleared on blur, presses kept between samples) + `js/input/actions.js` (the two default layouts from `docs/controls.md`, read once per sim step). `js/sim/world.js` (`makeWorld`, `stepWorld(world, p1Actions, p2Actions)` → events; phases serve → rally → point → … → over; `landingSpot`). `js/render/hud.js` (scores and server in the margins, callouts and the score on the front wall, the match result, the freeze notice). `test/world.test.js` (7 tests). About 800 new lines with comments, tests included.
  - **Changed:** `main.js` now only wires the loop, keyboard, world and renderer (the S1 feed and reset keys are gone). `player.js`: `stepPlayer` takes the turn (`isP1`, `turnIsP1`, `mayStrike`); a press when it isn't your ball is a miss, and the classifier's special flag now gets real turn info. `render/court.js` imports `LINES` from `sim/court-rules.js`, so the line-sync unit test was removed (unit tests: 24 − 1 + 7 = 30). `actors.js` draws both boxes and the ball in depth order, plus the landing cross. `debug.js` shows both players and their bands, the rally (turn, striker, needFront, bounces), the match and the last result. The world's params are `difficultyParams(0)` with `latMult = powerMult` (17). `squash-physics.js` is unchanged.
  - **Rulings made in the code** (say if any feel wrong):
    - The server stands so the held ball is mid-box (ball 18 units to the server's right, y 30) and may move inside the box before serving. HARD serves with the higher `SERVE.vy`, SOFT with the lower one. The receiver starts at x ∓72, z 150.
    - Turns are checked **at the press** with `canStrike`. A press before the ball has reached the front wall is a miss, even if contact (7 frames later) would come after it.
    - The freeze after a rally is 43 frames of callout, then 43 frames of POINT and the score (1.5 s in all). P1 is red, P2 a placeholder blue.
    - A rematch picks its first server from `seed + matchNo`. `?seed=` fixes the seed (default random); `?dev` exposes `window.hogg` (world, keyboard, `step(n)`, `render`, `frozen`, `bands`) for testing.
    - Depth bands: a player changes band only once their feet are 4 units past an edge (back → middle at z < 126, middle → back at z ≥ 134, middle → front at z < 66, front → middle at z ≥ 74).
  - **Checked in the browser** (http://localhost:8788/hogg-squash/; Wrangler took 8788 because 8787 was busy). The pane only got about 1.5 animation frames a second (the app window wasn't in view), so real-time play wasn't possible. Instead the `?dev` hook ran the real loop step (keyboard → actions → world) and the renderer, driven by `KeyboardEvent`s dispatched with real codes on all 12 keys of both layouts:
    - a full game to 9 ended 9–4, and an independent tally of rally winners matched the score;
    - over 6 more matches (74 rallies) all four reasons occurred (not up 32, out 24, down 11, tin 7), with no point given to the wrong player;
    - TIN and POINT 5–6 were seen on the front wall, with the reason confirmed in the debug overlay;
    - `?to=5` ended at 5–3, and from 4–4 went on to 5–4 and ended at 6–4;
    - arrows, F and Numpad 0 are prevented and don't scroll (real arrow presses too), and blur freezes the game and clears held keys;
    - Esc toggles the freeze;
    - walking a box from the back wall to the front wall stepped 100 → 84 → 68 px (at z 125 and 65), and standing on or rocking across an edge never changed the band;
    - no console errors.
  - **Not checked in the browser:** real-time feel, two humans at once on one keyboard (ghosting), and 57.4 steps/s, which wasn't re-measured (the loop is unchanged).
  - **Tests only:** determinism (6000 steps of two ball-chasing scripted players, run twice, give identical worlds and events), serve setup, the box clamp, turns, a scripted good return, the landing marker matching the real first bounce, and a match to 5 with a rematch.
  - **For CP-B:** the arcade serve is straight (vx 0), so it comes back down the server's own side and the receiver has to run across the court for it. That's what the plan specified; say at CP-B if it feels wrong. Text is still soft canvas `fillText` (the bitmap font comes in S9).
- 2026-10-18, after S3 (owner's request): **the game fills the window.** At the owner's 1878×915 browser window the old whole-number scaling gave a 2× box (1280×720), because 3× needs 1920×1080. `js/engine/screen.js` now defaults to sharp-bilinear fill: the 640×360 buffer is scaled up by the next whole number with no smoothing, then shrunk smoothly to the window's exact fit. `?scale=int` keeps the old behaviour. `index.html`'s background now matches the court margin (#16161a), with no outline.
  - **Checked in the browser** (sizes emulated in the pane): at 1878×915 the canvas is 1627×915 (2.54×), and 97.1% of screen pixels exactly match their game pixel's centre colour (plain bilinear from 640×360 would manage 94.4%). At 1920×1080 it's exactly 3× with smoothing off and 100% exact pixels. `?scale=int` at 1878×915 gives the old 1280×720. A 500×400 window fills its width with no page scroll. No console errors.
- 2026-10-18, after S3 (owner's request): **smooth character height.** The three sizes were right, but stepping between them was jarring. The boxes now change height smoothly with the feet z: a straight line through 68 px at z 39, 84 at z 100 and 100 at z 155 (the middle of each old band), rounded to whole pixels and holding 68 in front and 100 behind. `CHARACTER_HEIGHT` and `heightAt` in `js/render/actors.js` replace `DEPTH_BANDS`, `nextBand` and the hysteresis. The debug overlay and `?dev` show each player's height in px (`hogg.heights`). `?h=` scales the whole curve.
  - **Tests:** new `test/actors.test.js` (3 tests): the three sizes and both ends; running in depth goes through every pixel from 68 to 100, never down and never more than 1 px a frame; `?h=` scaling. Unit tests: 33.
  - **Checked in the browser:** walking P1 from the back wall (z 180) to the front wall (z 8) with W went 100 → 68 px through all 33 heights, never more than 1 px a frame. The height holds when standing still. No console errors.
  - **Plan changes:** how the *sprites* get smooth sizes is now an open choice, settled in A1 from the test sprite: scale the 100 px art at draw time, export many auto-downscaled sizes, or scale the nearest of three hand-cleaned sizes (`docs/decisions.md`, "Smooth height"). The art shared rules, A1, S8, CP-B question 6 and CP-D question 1 were updated to match. The "three sizes" rule stands until A1 picks.
- 2026-10-18, S4: hitting and ball feel. A swing state machine with arcade-measured timings, dives, placeholder hit feedback, slow motion and a shot log. `squash-physics.js` is unchanged.
  - **Measured first, in the MAME recordings** (scratch scripts over `test/fixtures`, not committed). Two of the plan's starting guesses didn't match the arcade, so the arcade values were used (say at CP-B if you want the plan's):
    - **Swing:** contact 7 frames after the press (the plan's number, confirmed). The ~15-frame swing animation starts ~3 frames after the press, and in all 142 human swings the player **didn't move at all** while it played, then ran at full speed straight away. There's no slower 0xC000 recovery (that walk speed only shows up before a player's first swing of a rally, probably the serve phase). So `SWING` = contact on frame 7, ready on frame 18 (≈0.31 s), `MOVE_SPEED` 0 (planted from the press).
    - **Dive:** all 16 recorded dives (all by the CPU) came from the classifier's **special** flag (0x10, contact types 10–11: the ball 44–64 units to the left or 76–96 to the right, just beyond a stretch, on your turn only). None came from the stretch flag, which nearly every ordinary swing has, so diving on stretch would have made almost every shot a dive. Each dive left the player still for **143–153 frames**. So `DIVE` = contact on frame 7, back up on frame 143 (≈2.5 s, the arcade's, not the plan's 45), locked in place.
  - **New:** `js/render/effects.js` (front-wall ring, contact flash, a MISS label shown when the racket would have met the ball; effects age by sim frames, so they slow in `?slow` and stop when frozen). `test/player.test.js` (10 tests: contact exactly 7 frames after the press with the table's shot; ready on frame 18; planted while swinging; out of reach and not-your-ball misses; stretch isn't a dive; dives on both sides with a 143-frame lock; no dive on the other player's turn; overheads 8–9; court limits). Unit tests: 33 → 43, plus `npm run typecheck` clean.
  - **Changed:** `sim/player.js`: `SWING`, `DIVE`, `DIVE_FLAG`, `swingLength`, `swingPhase`; the swing keeps `kind`, `t`, `hand` (fore/back from classifier flag 4) and `contact`. Presses during a swing are ignored, and a miss plays the whole swing. `stepPlayer` keeps its turn argument. The `hit` event now carries the ball's position and new velocity. `PLAYER_LIMITS` is x ±134 (about a body's half-width from the walls; the box no longer pokes into the side margin) and z 12–179 (179 = the furthest back a human got in the recordings). `sim/world.js`: `ball` events carry the collision position. `render/actors.js`: a racket stub shows the swing side (right = forehand, left = backhand), raised in the wind-up, level at contact, low in the recovery; a diving box lies on the floor on the dive side; the landing cross is now a 0.3 m ring with a centre dot. `render/debug.js`: each player's swing phase, and the last 5 shots. `main.js`: `?slow=<n>` (the sim runs n times slower, with "SLOW ×n" shown) and `hogg.shots` / `hogg.debug` for testing. `test/world.test.js`: one wait lengthened from 10 to 20 frames, because a swing now lasts 18.
  - **Shot log against §9** (a scripted player stood next to the 7-frame look-ahead ball and pressed real keys; m/s is depth speed off the racket, which includes the ×0.75–1.19 random factor and a quarter of the incoming ball's speed, so it spreads more than §9's single estimate):

    | Shot | Measured (m/s, front-wall height) | §9 |
    |---|---|---|
    | BACK HARD #1 (drive, ball ~0.85 m high) | 28–41, 1.7–2.5 m | 32, 1.8 m |
    | BACK HARD #0 (drive, low ball) | 20–30, 2.4–3.5 m | 25, 2.8 m |
    | BACK SOFT #1 / #4 | 19–26, 2.0–2.8 m | 21, 2.1 m |
    | MID HARD #0 | 29–33, 2.1–2.5 m | 25, 2.1 m |
    | MID SOFT #0 | 17–29, 1.4–1.5 m | 21, 1.1 m |
    | FRONT SOFT #0 (drop) | 14, 0.54 m from z 12; 18–23, 1.1–1.3 m from z 56–66 | 18, 0.8 m |
    | FRONT HARD #1 / SOFT #1 | 20, 2.2 m / 37, 1.5 m | 25, 2.0 m / 36, 0.5 m |
    | FRONT overhead #8 (HARD/SOFT) | 23–30, 1.4–2.6 m | 32, 1.3 m / 28, 0.2 m |
    | DIVE BACK #10 / #11 | 27–31, 1.9 m | 25, 1.6 m |

    Speeds are in range. Front-court overheads and SOFT #1 hit the wall higher than §9 because those contacts were high (ball 1.3–2.6 m up, where §9 assumes a typical lower contact). The same physics, so not a CP-B question unless they feel wrong.
  - **Checked in the browser** (http://localhost:8788/hogg-squash/; the pane was hidden, so it had no animation frames, and the `?dev` hook drove the real loop step with dispatched `KeyboardEvent`s; for still screenshots `?slow=100000` stopped the real loop):
    - drives (BACK/MID HARD), drops (FRONT SOFT, 0.54 m) and boasts (a late forehand near the right wall hit the side wall first, then the front wall at 0.65 m) were all hit on purpose;
    - timing changes the angle: the same ball struck from 18 units early to 18 late gave aim 6 → 5 → 4 → 2 → 1 and sideways speed −6.7 → −3.3 → 0 → +6.7 → +10.0 m/s (forehand; the backhand mirrors it);
    - the special band dives (DIVE BACK #10 and #11 seen), the box lies down on the dive side, and it stayed put with run keys held until the rally ended;
    - out of reach shows MISS over the box and the ball flies on; overheads (#8) and dives (#10–11) both work;
    - the racket stub, flash, wall ring and new landing ring were checked in screenshots; walking into the corners stops at (−134, 179) and (134, 12) with the box inside the court;
    - no console errors.
  - **Not checked in real time:** feel at full speed, and `?slow=4` on screen (the hidden pane gives no animation frames). The loop itself was checked in Node with a fake 60 Hz clock: 57.3 steps/s normally, 14.3 with `hz / 4`.
  - **For CP-B:** questions 3 and 4 now ask about the planted swing and the arcade dive (trigger and 2.5 s). The research note (`squash-game-logic.md` §5) records the measurements. A3's timing line now gives the swing (18 frames) and dive (143 frames) lengths.
- 2026-10-19, after S4 (owner's request): **the serve crosses the court.** It used to fly straight (the arcade's vx 0) and come back down the server's own side. The owner chose to keep the arcade's height and depth and angle it across. `serveVx` in `js/sim/world.js` bisects for the sideways speed (with the real physics, so it holds at any pace) that makes the first bounce land at the opposite box's centre x. From the right box it's vx −6.74 (HARD) / −6.81 (SOFT) units/frame: front wall at x 20, 3.0 m up; first bounce at x −108, z 167–170 (about 1.9 m behind the left box); off the back glass; second bounce near the left side wall at z 150. The left box mirrors it. `squash-physics.js` is unchanged (`SERVE` keeps the arcade's vx 0).
  - **Tests:** new world test: from each box the landing marker is in line with the opposite box and behind it, the plain physics bounces there, and the serve stays live to its first bounce. Unit tests: 44.
  - **Checked in the browser:** a HARD serve from the right box came off the front wall heading left, and the landing ring showed in the back-left behind the left box, by the receiver. No console errors.
- 2026-10-19, after S4 (owner's request): **the court says PAUSED, not FROZEN**, and the key hint says "Esc pause" (`render/hud.js`, `main.js`; the code's `frozen` flag is unchanged). Plan check after this and the serve change: S6 gets a test that the serve still crosses the court at every level (`serveVx` already holds at levels 1, 5 and 9: x −108, z 159–171); S7 says "pause" instead of "freeze"; the CP-B prompt points at these entries. Nothing else in the remaining sessions depended on the straight serve or the word FROZEN.
- 2026-10-19, CP-B (planning only): owner's play-test answers (listed under CP-B) turned into a new fix-up session, **S4b**, before S5.
  - **Kept as they are:** the view and depth cues, the planted swing (`SWING.MOVE_SPEED` 0), the dive trigger (special band), "a press before the front wall is a miss", and sharp-bilinear fill as the default scaling.
  - **Dive:** 2 s on the ground, not 2.5: `DIVE.RECOVERY` 136 → 108 (115 frames in all). In S4b; A3's timing line updated.
  - **Serve:** where the server stands in the box aims the first bounce (a mirror image across the opposite back quarter, default |x| 36–120), and HARD/SOFT sets the depth (default HARD z ≈ 168, SOFT z ≈ 140, ±8 from the server's depth in the box), solved with the real physics and always legal. In S4b. S5's CPU now picks a spot and a button before serving; S6's every-level serve test now covers the aimed serves; CP-C asks about spots and depths.
  - **Height:** the 68–100 px range is right, but the S3 curve is flat for the last 27 units at the front (z 12–39) and the last 24 at the back (z 155–179), and bends at z 100, so the box stops growing near both walls. S4b replaces it with one smooth curve: 100 × √(scale(z) ÷ scale(179)) from `project()`, measured now as 69.5 px at z 12, 76.8 at z 70, 81.5 at z 100, 87.3 at z 130, 93.1 at z 155 and 100 at z 179 (the S3 curve gives 68, 76, 84, 93, 100, 100). S4b also checks that rounding the width doesn't make an edge wobble, and adds `?curve=old` for comparing at CP-C. The owner leans towards one sprite scaled to fit, but wants to see real pixel art first, so A1 still compares the three methods, method 1 first; A2 and A3 now wait for A1's method, not CP-B's "three sizes".
  - **Pace:** the owner says today's pace is right for level 5. Today's pace is `defaultParams()` = arcade index 0 (speed 280, power 17, bounce −1, gravity 0x1F80), which is the *level 3* row of open question 1's table. So S6 re-anchors the pace columns (level 5 = this pace, level 9 = Hardest 4, levels 1–4 slower below it), and 2P keeps playing at exactly the CP-B pace.
  - **Effort for S4b:** `high` (the serve solver touches the rules and needs careful tests).
- 2026-10-19, S4b: the three CP-B fix-ups. `squash-physics.js` unchanged; `npm test` golden/flight/shot/hit numbers exactly as the P0 baseline; unit tests 44 → 47.
  - **Dive:** `DIVE.RECOVERY` 136 → 108, so a dive is 115 frames (contact on frame 7), 2.00 s.
  - **Aimed serve** (`SERVE_AIM`, `serveTarget`, `serveAim` in `js/sim/world.js`): the held ball's place across its reach in the box picks the first bounce's |x|, 36 (centre-line edge) to 120 (side-wall edge); HARD aims at z 168, SOFT at 140, ±8 from the server's depth in the box. `serveAim` keeps the arcade's `SERVE.vy` per button, tries depth speeds 4–11 units/frame (1/64 steps), ranks them by how close the first bounce lands to the target depth, and takes the first whose sideways speed (`serveVx`) gives a legal serve on target. About 1–2 ms per serve.
    - **Why depth isn't exact:** the first bounce happens on a whole frame, so as the depth speed changes, the landing depth moves in steps of a few units, not smoothly (a faster serve also hits the wall lower). A serve lands within 4 units of its depth target (worst 3.8 over all 20 arcade paces) and within 2 of its x. Varying the height speed wasn't needed.
    - **Fixed on the way:** `serveVx` now counts a ball that touches a side wall before bouncing as "too far". Its bisection assumed the landing x keeps moving with the sideways speed, but off the side wall it comes back, so wide, slow SOFT serves landed up to 16 units short.
    - **Server's start spot:** mid-reach in the box (was mid-box), so an untouched serve goes to the middle of its range from both boxes (x ∓78). Mid-box put the ball 1/3 across its reach in the right box but 4/5 in the left (the feet stop at x −134).
    - **Landing spots at the CP-B pace**, right box (the left box mirrors it), feet x 72 = inner edge, 126 = outer edge:

      | Server's spot | HARD: first bounce, wall height | SOFT: first bounce, wall height |
      |---|---|---|
      | inner, front of box (z 103) | x −36, z 161.7, wall 102 | x −36, z 132.0, wall 128 |
      | inner, back of box (z 133) | x −36, z 175.1, wall 108 | x −36, z 147.0, wall 128 |
      | mid (start spot, z 118) | x −78, z 166.8, wall 96 | x −78, z 140.3, wall 123 |
      | outer, front of box (z 103) | x −120, z 161.7, wall 102 | x −120, z 132.0, wall 128 |
      | outer, back of box (z 133) | x −120, z 175.1, wall 108 | x −120, z 147.0, wall 128 |

      Depth speeds: HARD 8.6–11 units/frame (36.7 m/s off the racket at mid-box, 2.7–3.1 m up the front wall), SOFT 6.2–8.1 (20.8 m/s, 3.6 m up). HARD at mid-box and behind uses the top of the range (11), so it is a little faster than the arcade serve (9). The service line is at 63 and the out-line at 161, so every serve is well inside both.
    - The debug overlay (`) shows where a serve from the current spot would be aimed (HARD and SOFT) and, once served, where it was aimed and where it will land.
  - **Height** (`heightAt`, `exactHeightAt`, `boxEdges` in `js/render/actors.js`): 100 × √(scale(z) ÷ scale(179)) from `project()`: **70 px at z 12, 73 at z 39, 77 at z 70, 82 at z 100, 87 at z 130, 93 at z 155, 100 at z 179** (S3 curve: 68, 68, 76, 84, 93, 100, 100). Rounding the width first (as S3 did) made an edge step back and forth 4 times on a walk front to back near the centre line (x ±20, ±60); each edge is now rounded on its own from the unrounded size, and neither turns back. `?h=` still scales the curve; `?curve=old` shows the S3 curve. `effects.js` (the MISS label) and `main.js` take the size options.
  - **Tests:** player (dive 115 frames); world (the start-spot serve, the aimed serve from the four corners of each box with both buttons: on target, the marker is where it bounces, legal, inner near the centre line, outer near the wall, HARD > 15 units deeper than SOFT, back of the box deeper than the front; and `serveAim` on target and legal at all 20 arcade paces from 9 spots per box, ≈1 s); actors (the curve's values, growing the whole way with no flat ends, ≤ 1 px per running frame, no edge turning back at 9 x positions, `?h=`, `?curve=old`).
  - **Checked in the browser** (http://localhost:8787/hogg-squash/?dev&seed=3&slow=100000; the pane was hidden, so the real loop was stopped and `window.hogg.step` drove it with dispatched `KeyboardEvent`s; the auto-pause on a hidden window was dispatched off for the screenshots):
    - eight serves, from the inner and outer edges at the front and back of both boxes, HARD and SOFT: each landed exactly on its marker and within the numbers above, and the screenshots show the ring near the centre line just behind the short line (inner, front, SOFT) against the far back corner by the side wall (outer, back, HARD);
    - a real dive (DIVE BACK #10, found by placing the receiver): down and locked in place for 115 frames (2.00 s) with a run key held (the ball was held in the air after contact so the rally stayed live that long);
    - walking from the back wall to the front: 100 px → 70 px, 1 px at a time, never growing, longest gap between steps 7 frames (at the front, where the curve is gentlest); `?curve=old` gives the old flat ends (100 behind z 155, 68 in front of z 39);
    - no console errors.
  - **Not checked in real time:** how the serves and the shrinking box look at full speed (the hidden pane gives no animation frames). Edge smoothness was checked by the unit test on `boxEdges`, the function `drawBox` uses, not by reading pixels.
  - **For S5:** the CPU serves by walking to a spot in its box and pressing a button; `serveTarget(box, ballX, ballZ, button)` says where that will land. **For S6:** the every-pace serve test already runs over the 20 arcade paces; point it at `levelParams` once the table exists.
- 2026-10-19, S5: the CPU opponent. The page now defaults to 1 player against the CPU (P2), the human serving first; `?mode=2p` gives versus. `squash-physics.js` unchanged; `npm test` golden/flight/shot/hit numbers exactly as the P0 baseline; unit tests 47 → 54; `npm run typecheck` clean.
  - **New:** `js/sim/cpu.js` (`CPU` tunables, `makeCpu(world, side)`, `cpuActions(cpu, world)` → the same six actions as keys, `planContact`, `chooseButton`, `chooseServe`, `moveToward`, `runFrames`, `cpuRandom`), `test/cpu.test.js` (7 tests). **Changed:** `sim/world.js` (`makeWorld({ cpu: [p1, p2] })`; a CPU slot's player gets the arcade's CPU flag `CPU_FLAG` 0x40, so `applyShot` never aims it into a near side wall; vs CPU the human serves first, rematches too; `serverArea` exported), `main.js` (CPU actions replace P2's keys unless `?mode=2p`; key hint per mode; `hogg.cpus`), `render/hud.js` (the CPU's slot says CPU), `render/debug.js` (CPU lines and markers), `test/run-all.js`.
  - **How it plays** (§6): when it becomes its turn it waits the reaction delay (16 frames at Normal/skill 0, from `params.cpuReaction`), then runs the predictor once and picks the earliest contact it can reach (2.5 units/frame across, 1.25 in depth, both at once) by the press frame, which is 7 frames before contact and after the ball has reached the front wall. If none is reachable it takes the one it misses by the least, and presses anyway on the planned frame (that's where its misses, stretches and dives come from). It stands 32 to the ball's left (a clean forehand), inside x −134…104, z 22…178 (the arcade's −147 is outside our player limits). After its shot it recovers to the T (x 0, z 96) plus a fresh error each rally: up to ±16 across and ±8 in depth (the error step, half in depth), never accumulated. If a swing misses and the ball is still its own, it plans again. It moves only while more than half a step away on each axis, so it can't step back and forth.
  - **Rulings made in the code** (tunables in `CPU`, for CP-C):
    - **Aim:** it stands up to 8 units in front of or behind the contact (random per shot, `AIM_JITTER`), so timing angles its shots (aim ≈ 3–5) instead of always hitting straight. Not from the ROM.
    - **Highest contact it plans for:** y 56 (1.6 m; `CONTACT_Y_MAX`). Lower overheads are fine.
    - **Button (`chooseButton`):** SOFT 60% for a contact in the front court (z ≤ 72), 40% when the opponent stands deep (z ≥ 130), else 15%; otherwise HARD.
    - **Serve (`chooseServe`):** a random spot in its box and a random button (HARD 60%), kept if `serveTarget` says it lands at least 24 units across from the receiver (up to 4 tries, else the furthest). It walks there, stands still for 57 frames (1 s) and serves. Comparing running time instead favoured HARD (deeper) almost every time, and "furthest across" picked the side-wall edge almost every time; with this rule, 24 test serves (12 from each box) were HARD 17 / SOFT 7 and inner half 9 / outer half 15, first bouncing at |x| 39–52 or 92–120 (the receiver stands at 72).
    - **Randomness:** a hash of the world's seed, the slot, the purpose and the frame (or rally number), so a game replays exactly from `?seed=`.
  - **Measured headless** (Normal/skill 0, 12 CPU-against-CPU games to 11, 222 rallies): 13.0 hits a rally on average (median 8, longest 135); ended by not up 147, tin 64, down 8, out 3. Of its ~3300 planned contacts, 45% weren't fully reachable in time, but most of those were short by a few frames and still in reach. About 10% of its swings missed and 6% of its hits were dives. Against 743 fed balls (5 spots across × 3 depths × HARD/SOFT × 5 shot rows × 5 aims, the CPU starting at the T) it returned **92%**: all HARD front-court feeds, 82% of SOFT front-court ones (drops), 89–97% of the rest. 208 rallies ran in 0.36 s.
  - **Checked in the browser** (http://localhost:8787/hogg-squash/?dev&slow=100000; the pane got no animation frames, so `hogg.step` drove the real loop step, and a scripted "human" P1, a second CPU brain with a 28-frame reaction and ±30 error, played through dispatched WASD/F/G `KeyboardEvent`s):
    - two full games to 9 against the CPU: CPU won 9–5 (14 rallies, 6 of its 75 swings missed) and 9–6 (15 rallies, 6 of 78 missed). The human won points by the CPU's tin (3), down (1) and not reaching the ball (5);
    - it runs to where the ball is going: a planned contact at x −106, z 149 had it standing at x −134 (the wall limit), z 154; it pressed on the planned frame and hit 7 frames later (SOFT BACK #0, aim 5);
    - over the 9–6 game, 0 step-back-and-forth reversals and 0 frames outside the court; recoveries ended within 1.5 units of its home spot (once 30 units short, because the next ball came first); one traced recovery went from (−126, 151) to (1, 100) in 52 frames;
    - its serve: SOFT from the back outer corner of the right box, standing still 57 frames, landing at x −113.2, z 145.3 on the aimed (−113, 145.3), with the receiver at x −72;
    - a rematch (F) gave the serve to the human again, the CPU still flagged; `?mode=2p` has no CPU, labels P1/P2, P2 walks with the arrows and P1 serves with F;
    - the debug overlay (`) shows each CPU's state, reaction countdown, home spot, plan (button, frames to the press, contact, stand spot, in time or late) or chosen serve, and draws the contact (cyan ring joined to the floor) and the stand or serve spot (cyan cross);
    - no console errors.
  - **Not checked in real time:** how the CPU feels at full speed, and a real person playing it (the pane gave 0 animation frames in 3 s, even when reported visible).
  - **For CP-C:** two CPUs at this level can rally a long time (135 hits), and from the T it returns 92% of a spread of fed balls, so at level 5 it may feel strong. The knobs are the reaction delay and error step (S6's table) and `CPU` in `cpu.js`. **For S6:** `makeCpu` reads `cpuReaction` and `cpuErrorStep` from the world's params, so `levelParams` only has to supply them; `test/cpu.test.js`'s CPU-against-CPU helper is a starting point for "rallies get longer as the level rises".
- 2026-10-19, S6: difficulty levels 1–9. `squash-physics.js` unchanged; `npm test` golden/flight/shot/hit numbers exactly as the P0 baseline; unit tests 54 → 59; `npm run typecheck` clean.
  - **New:** `js/sim/difficulty.js` (`LEVEL_TABLE`, `levelParams(level)`, `paramsFor(level, twoPlayer)`, `toLevel`, `DEFAULT_LEVEL` 5), `test/difficulty.test.js` (5 tests). **Changed:** `sim/world.js` (`defaultParams()` is now `levelParams(5)`: same pace as before, but the CPU fields are level 5's, reaction 8 and error 12, not the arcade's 16/16), `sim/cpu.js` (re-reads reaction, error step and the new shot sense from the world's params as each rally starts; `chooseButton` takes the sense), `main.js` (`?level=`, `[` / `]`, the level in the key hint, `hogg.nextLevel`), `render/debug.js` (a level/pace line; the CPU line shows its sense), `test/run-all.js`.
  - **The table** (recorded in `docs/decisions.md`, "CPU difficulty"): level 5 = the CP-B pace (280, 0x1F80, power 17, bounce −1), level 9 = Hardest 4 (304, 0x2140, 19, −3). Speed and gravity step evenly through all nine levels (+6, +0x70), so level 1 is speed 256 (1.00×) and gravity 0x1DC0. Power goes 15, 16, 16, 17, 17, 18, 18, 19, 19 and bounce +1, 0, 0, −1, −1, −2, −2, −3, −3. Level 1's power 15 and bounce +1 are below the arcade's range. The CPU columns are the plan's proposal (reaction 24 → 1, error 24 → 2).
  - **Flights** (every shot-table entry at aims 1/3/5 from mid-zone, averaged): to the front wall 15.6 frames at level 1, 12.9 at 5, 10.9 at 9 (the arcade's 20 rows: 10.9–13.8); to the bounce 56.3, 50.5, 46.3 (arcade 46.3–51.6). Wall heights and tin counts stay in the arcade's range at every level. Level 1 tested with power 16 / bounce 0 as well: 14.7 and 54.8 frames, so the extrapolated values add about 6% more time.
  - **Serves at every level:** on target and legal from the inner and outer edges, front and back of each box, HARD and SOFT (the test). A mid-box HARD serve takes 1.29 s to its first bounce at level 1, 1.20 s at 5, 1.15 s at 9. Its speed off the racket isn't monotonic (the solver picks a depth speed per pace, so level 5's HARD uses the top of the range, 36.7 m/s, and level 9's 32.7), but its flight time is.
  - **CPU shot sense** (new column, 0 at level 1 → 1 at level 9, in `CPU` in `cpu.js`): moves the HARD/SOFT chances toward reading the situation: SOFT 90% from the front court with the opponent deep, 30% with them further up; 60% elsewhere with them deep; 5% when they're up the court (z < 100); and **5% for a contact below y 4**, wherever they are. Why the last one: in CPU-against-CPU play the tin was mostly front-court SOFTs struck at the floor (y < 0): 363 of 797 went into the tin at level 5, 433 of 653 at level 9. With it, rallies at levels 5–9 got about 25–70% longer and tins per rally fell.
  - **Rallies by level** (CPU against CPU, 400 rallies each, the test): hits per rally 16.9, 17.4, 19.1, 19.5, 25.1, 26.1, 32.9, 37.1, 39.7. The CPU's misses and failures to reach fall steadily with the level (1500 rallies: "not up" per hit 4.8% at level 1 → 1.6% at 9). Before the shot sense, rallies weren't monotonic (level 1: 16.4, level 2: 15.9, level 6 shorter than 5), because faster paces gave more tins.
  - **Checked in the browser** (http://localhost:8789/hogg-squash/?dev&seed=3&level=…; the pane got no animation frames, so `hogg.step` drove the real loop step, and a scripted P1, a second CPU brain with its own reaction and error, played through dispatched WASD/F/G `KeyboardEvent`s):
    - `?level=1`: a scripted player with a 28-frame reaction and ±30 error lost 5–9 (5 of its points from the CPU not reaching the ball); one with a 12-frame reaction and ±12 error **won 9–2**. The CPU's reaction measured 24 frames (it starts to move on the 25th);
    - `?level=9`: the same 12-frame player **lost 0–9**; the CPU starts to move 1 frame after each shot;
    - `[` during a rally at level 9 queued level 7 ("next 7"); the next rally played speed 292 with the CPU at reaction 4, error 6, sense 0.75. The overlay shows the level and pace, and the key hint shows the level;
    - `?mode=2p`, `?mode=2p&level=1` and `?mode=2p&level=9` all play level 5's pace (speed 280, power 17), identical serve flights, no CPU; `[` / `]` do nothing in 2P;
    - no console errors.
  - **Not checked in real time:** how levels 1, 5 and 9 feel at full speed with a real person playing (the pane gave no animation frames). "Clearly slower" at level 1 rests on the numbers above.
  - **For CP-C:** level 5's CPU is now quicker than S5's (reaction 8, not 16; error 12, not 16), as the plan's table says, and the shot sense makes it drop less often at the floor, so level 5 may feel stronger than at the end of S5. Knobs: `LEVEL_TABLE` in `difficulty.js` and the `SENSE_*` values in `CPU`. `[` / `]` change the level between rallies, which makes comparing levels in one sitting quick. The world test of the serve over the 20 arcade paces is kept; the difficulty test covers the nine levels.
- 2026-10-20, CP-C (planning only): owner's play-test answers (listed under CP-C) turned into a new fix-up session, **S6b**, before S7.
  - **Level 1 too strong:** the owner lost 4–9 to it, though S6's scripted player (a CPU brain with a 12-frame reaction and perfect prediction) beat it 9–2. So S6b tests against a more human reference player (15-frame reaction, follows the landing marker, ±3 frames of timing, ±16 units of position) with targets of ≥ 60% of points at level 1, 35–55% at 5 and ≤ 20% at 9.
  - **Levels felt alike:** only the pace (±8–9%) and the reaction time differed. S6b slows the low levels' reaction (level 1: 36 frames, was 24) and adds CPU shot quality by level: press-timing error (±4 frames at level 1 → 0), no angling at low levels (`AIM_JITTER` 0 → ±8), fewer SOFTs at low levels, and no volleys below level 6. Level 9's CPU stays as it is, and the pace columns are unchanged unless the owner asks after S6b.
  - **SOFT from the front court runs deep** (measured at level 5's pace: first bounce z 14–93, but rows #1/#3/#5/#7 at depth power 160 take their second bounce at z 123–173, and row #0 reaches z 123 from a waist-high contact). S6b caps the front-court SOFT's power (default 64) and lift (3072) in `player.js`, so the second bounce is in front of the short line. This departs from the arcade's tables on purpose; `squash-physics.js` and `SHOT_TABLES` stay as they are.
  - **Kept:** the 2P pace (the owner had no complaint once it was explained), serves, the 2 s dive, the S4b height curve (no difference seen while moving; `?curve=old` can go in S12). The CPU was never seen doing anything silly.
  - **Effort for S6b:** `high` (it changes the hit rules and needs a new reference player and careful tests).
- 2026-10-20, S6b: CP-C fix-ups. `squash-physics.js` and `SHOT_TABLES` unchanged; `npm test` golden/flight/shot/hit numbers exactly as the P0 baseline; unit tests 59 → 65; `npm run typecheck` clean.
  - **New:** `test/reference-player.js` (`REF`, `makeRef`, `refActions`: a beginner-like opponent for the tests). **Changed:** `sim/player.js` (`DROP`, `shotFor`: the front-court SOFT cap, applied where the shot entry is picked), `sim/difficulty.js` (reaction column; new columns `cpuTiming`, `cpuAimJitter`, `cpuSoftScale`, `cpuVolley`), `sim/cpu.js` (reads the new columns as each rally starts; `planContact` adds the timing error (`Plan.timing`) and, without volleys, prefers the reachable contact after the bounce nearest `COMFORT_Y` 20; `chooseButton` takes the SOFT scale; `AIM_JITTER` moved into the table), `render/debug.js` (a "shots:" line with the level's timing, aim jitter, SOFT scale and volleys; the plan line says how early or late this press is), `test/difficulty.test.js`, `test/cpu.test.js`, `test/player.test.js`. Final table and drop numbers in `docs/decisions.md`.
  - **The levels** (tables in `docs/decisions.md`): reaction 36, 31, 27, 23, 17, 14, 10, 6, 1 (the plan's default gave level 5 31%, just under its 35–55% target); timing error ±4, 4, 3, 3, 2, 2, 1, 1, 0 (the plan's default stepped on the same levels as the pace columns); aim jitter 0 → 8 by 1; SOFT scale 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.85, 0.9, 1; volleys from level 6. Level 9 is the CPU as it was.
  - **Reference player** (15-frame reaction; runs SIDE 32 left of and BEHIND 12 behind the landing marker, then level with the ball once it has bounced; presses when the ball will come level, or at its closest if it won't, ±3 frames; ±16 across and ±8 deep of position error, fresh each shot; HARD mostly, SOFT 30% in the front court and 10% elsewhere). Against the S6 level 1 it wins 34% of points (the owner lost 4–9, 31%). Against the new table: **78, 71, 67, 54, 43, 29, 14, 10, 5%** at levels 1–9 (1000 rallies each). A first version that waited for the ball to come level never swung at a ball dying in front of it, and won only 19% against the S6 level 1.
  - **CPU shot quality, level 1 → 5 → 9** (against the reference, 1000 rallies): swings missed 7.4 → 3.7 → 0.7%, stretched 11.5 → 7.7 → 3.7%; SOFT 5.2 → 19.3 → 30.0% of its shots; volleys 32 → 37 → 82%; placement (its well-timed shots off straight) 4.7 → 20.0 → 55.0%. Counting every shot, level 1 hits *more* angled shots (aim 0–2 or 6–7: 13.5% against 6.1% at level 9): those are mistimed hits, not placement, so the test checks the well-timed ones.
  - **CPU against CPU** (hits a rally, 400 rallies): 12.7, 12.6, 15.9, 13.6, 21.7, 15.9, 22.4, 29.7, 43.8. They now step with the pace columns (power and bounce change every second level), so the S6 test "longer at every level" was replaced, as the plan allowed: levels in threes get longer (1–3 < 4–6 < 7–9) and level 9 rallies over twice level 1's.
  - **The drop** (`DROP` 32 / 1280, overheads excluded; numbers in `docs/decisions.md`): off a ball coming at up to 3 units/frame every front-court drop's second bounce is in front of the short line, off a fast one 94–100%, the deepest at z 112 (the arcade's rows: about 70% past it). Tins fall from about 22% to 8%, but about 14% now fall short of the front wall instead (a quarter from the back of the front court). The plan's default (64 / 3072) still left 25–40% past the short line. Capping the overheads as well put 40–56% of them in the tin, so they keep the arcade's entry. MID-court SOFT unchanged (61% past the short line, mean z 114).
  - **Found, not fixed: the CPU's search stops at the first bounce.** In `planContact`, "rolling: the rally is over" (`ball.y <= 0` after a bounce) is also true on the bounce step itself, where the ball is still below the floor, so a plan made before the bounce never looks past it. The CPU plans an after-the-bounce contact only when the ball has already bounced (after a slow reaction, or a miss and re-plan). This has been so since S5 and is part of how every level played at CP-C. Letting the search go past the bounce made the CPU return almost everything (misses 0%, the reference at 2% against level 9, CPU-against-CPU rallies that never end), which would mean retuning every level, so it stays, with a comment. The no-volley rule still works through the slow reaction (volleys 32% at level 1 against 82% at level 9). Worth a look if the CPU ever feels like it misses balls it should reach.
  - **Checked in the browser** (http://localhost:8787/hogg-squash/?dev&seed=3&level=1&slow=100000; the pane was hidden, so `hogg.step(1)` drove the real loop step, a dispatched Escape unpaused it, and the reference player, loaded into the page as a module from the game's own module URLs, played P1 through dispatched WASD/F/G `KeyboardEvent`s):
    - `?level=1`: the reference player **won 9–1** (the CPU lost 8 points by not reaching the ball, one tin);
    - `]` ×8 and F for a rematch at level 9 (speed 304; the CPU re-read reaction 1, timing 0, jitter 8, SOFT ×1, volleys): it **lost 0–9**;
    - level 5: lost 7–9. Every front-court SOFT in that game (both players) was checked with the game's predictor right after the hit: second bounces at z 46–86, one fell short of the front wall, and one overhead (#8, unchanged) reached z 124;
    - the debug overlay shows the CPU's "shots: timing ±4 aim jitter ±0 soft ×0.3 volleys no" at level 1, and the plan line "press in 13 (1 early)";
    - `?mode=2p&level=1` plays level 5's pace with no CPU; no console errors.
  - **Not checked in real time:** how the levels and the new drop feel at full speed with a person playing (the pane gave no animation frames). "Beatable at level 1" rests on the reference player, which is calibrated to one result (the owner's 4–9).
  - **For the owner's check:** levels 1, 5 and 9 with `[` / `]`. Drops from the front court are now short and slow, and from near the short line some fall short of the front wall: if that feels wrong, raise `DROP.POWER_MAX` (40 lets fewer fall short and a few more run past the short line). If the levels still feel too close, the next knobs are the pace columns (as the plan says) or the CPU's search past the bounce (above).
- 2026-10-20, after S6b: the owner's play-test answers, and a smaller CPU reach.
  - **Answers:** level 1 can be beaten now, but should be a little easier, by making the CPU worse (not the player better). Levels 1, 5 and 9 feel clearly different. Front-court SOFT is "perfect" as a drop. The level 1 CPU rarely fails to reach a ball, though it reacts more slowly than the owner.
  - **The hitbox, shown:** the classifier's bands (from the ball 7 frames after the press to the feet; across: clean −20…52, stretch to −44 / 76, dive to −64 / 96, else out of reach; in depth within ±40) were drawn on the court floor around both players in a screenshot (a one-off drawing in the browser, not in the game).
  - **Change:** new `LEVEL_TABLE` column `cpuReach` (0.95 at level 1 → 0.99 at 9) and `shrinkReach` in `sim/player.js`: every CPU's bands shrink around it by that share; the human's stay the arcade's. A player test checks the bands for a human and a CPU at full and 95% reach. Unit tests 65 → 66; golden numbers as the P0 baseline; reference player 79, 74, 68, 52, 45, 28, 15, 10, 5% at levels 1–9 (it was 78, 71, 67, 54, 43, 29, 14, 10, 5).
  - **For later:** if level 1 should be easier still, the knobs are `cpuReach` (bigger cuts), the reaction and timing columns, and the CPU's search past the bounce (S6b log).
- 2026-10-20, S7: gamepads. `squash-physics.js` unchanged; `npm test` golden/flight/shot/hit numbers exactly as the P0 baseline; unit tests 66 → 76; `npm run typecheck` clean.
  - **New:** `js/input/gamepad.js` (`PAD` mapping and dead zone, `padHeld`, `createPads(getPads).poll()` → each pad's held buttons, presses and "any button", plus the pads unplugged since the last poll; `padName`), `js/render/pads.js` (the temporary controller overlay, `drawPadOverlay`), `test/input.test.js` (10 tests). **Changed:** `input/actions.js` (`padActions`, `combineActions`, and the seats: `makeSeats`, `seatOf`, `joinPad`, `dropPad`, `forgetLost`, `swapSeats`), `main.js` (pads polled once per sim step, frozen or not; the overlay; Start = Esc; a hint line for controllers; `hogg.seats`, `hogg.joining`), `render/hud.js` ("Esc or Start to carry on"), `test/run-all.js`.
  - **How it works:** stick (radial dead zone 0.3, then 8 directions) or D-pad moves; A = HARD, B or X = SOFT, Start pauses; non-standard pads (Firefox) also read a D-pad on axes 6/7. Each human's actions are their keys **combined** with their pad's, so the keyboard always works alongside a pad (that's how keyboard + pad mixing works, either way round). Any button on a new pad joins it to the first seat without one (P1 first; 1P has only P1's seat) and opens the CONTROLLERS overlay, which waits; the joining press does nothing else. In the overlay, left/right on a pad swaps sides (2P), and A / Start / Enter closes it; the button that closes it doesn't also hit. Unplugging a pad that plays opens "Controller disconnected" and the game waits; any pad's button press takes the empty seat and play carries straight on, or Enter carries on with the keyboard. A new pad seen with a button already down counts it as a press (that press is what made the browser show it).
  - **Checked in the browser** (http://localhost:8787/hogg-squash/?dev, with `navigator.getGamepads` faked and `hogg.step` driving the loop): 2P on two pads (join order, swap both ways, A closes without serving, the stick moves P1, A serves), Start from either pad pauses and unpauses and the sim stops between, unplug → overlay and the game waits, replug alone does nothing, replug + B carries on, unplug + Enter carries on with the keyboard; 1P: a pad joins P1, a second pad is turned away, Start closes the overlay, D-pad + B serve and a point is played; no console errors.
  - **Checked by the owner with two real Xbox controllers** (Chrome or Edge): both joined and worked; stick and D-pad both fine (dead zone neither stiff nor loose); 2P on two pads; keyboard + pad both ways; Start pauses; unplugging shows "Controller disconnected". The buttons felt right. **Not checked with real hardware:** PlayStation pads, Firefox, and replugging + a press to carry on (the owner reported the disconnect notice; carrying on was checked with faked pads).
  - **For S10:** the overlay (`render/pads.js`) and the join/swap/confirm handling in `main.js`'s `pollPads` are the parts the assignment screen replaces; the seat functions in `actions.js` can stay. **For S11b:** a touch source plugs into `combineActions` beside the keys and the pad; `PadInput.any` and pad movement are what "a gamepad was used" should read for hiding the touch controls.
- 2026-10-20, A1: palette and style test sprite. No game code changed; `npm test` 9/9 and `npm run typecheck` clean, as before.
  - **Spend:** 32 of the 64 approved credits (one GPT 2.5 Flare round, medium, 1K square, 4 variations, no reference images). The optional refine round wasn't needed. Account: Apprentice tier, 768 credits left. Everything is in `art/spritecook-manifest.md`.
  - **Base:** the owner picked concept 4 (asset `db1eb2a8-…`): red shirt with black side panels, black shorts with red stripes. It is the style reference for A2 and A3.
  - **Palette:** `art/palette/hogg-squash.gpl`, 36 colours (Hogg red `#c8102e`, kit red `#e8202a`; full list in `docs/theme.md`). Characters use only the neutrals, reds, skin and hair.
  - **Sprite:** the concept's 2859 colours, soft edges and 123 px height became a clean 100 px sprite (57 px wide) through a scripted pass, `art/tools/pixel-lib.lua`: crop, area-average downscale, alpha cut at 50%, nearest palette colour, 1 px outline, stray pixels removed. `art/tools/a1-build.lua` rebuilds every A1 output from the concept. `art/character/player.aseprite` (indexed, tag `ready`, `feet` slice with its pivot between the feet), plus `player-84` and `player-68` for the test only.
  - **Kit swap:** P2 / CPU in white and black, six reds → whites (table in `docs/art-style-guide.md` §2). Approved by the owner.
  - **Smooth height:** the ready frame at every height on `heightAt` (100 → 70 px) four ways, in `art/mockups/a1-smooth-height-strips.png` and `a1-smooth-height.gif`: 1 nearest-neighbour from 100 px, 1b the same smoothed, 2 an automatic cleanup every 2 px, 3 the nearest larger of three cleaned sizes. **The owner picked 1b** ("it looks the smoothest"): one 100 px sheet, scaled at draw time with smoothing on. Recorded in `docs/decisions.md` and `docs/art-style-guide.md`; the shared art rules, A2, A3 and S8 now use one `player-100` sheet.
  - **Mockup:** `art/mockups/a1-court-mockup.png`, on the game's own court (`drawCourt` rendered at 640×360 in the browser, kept as `a1-court-base.png`), with players at the back (97 px), middle (82 px, swapped kit) and front (71 px), placed with `project()` and `heightAt()`. The mockup uses nearest-neighbour scaling (method 1), made before the pick; the 1b look is in the GIF.
  - **Checked:** all "Done when" items. The owner saw and approved the palette, the sprite at the three sizes and the swapped kit, and picked the method; credits are within the approval; `npm test` passes and the page is unchanged (no files under `public/` changed).
  - **For S8:** with smoothing on, the player sprite's colours blend at in-between sizes, so don't palette-check rendered frames. Turn smoothing back off after drawing the players. **For A2/A3:** run each SpriteCook frame through `pixel-lib.lua` at the same scale (the A1 concept was 123 px tall, so ×100/123), then fix by hand, so every frame keeps the same height.
- 2026-10-20, A2: character animations, part 1 (ready, run, serve). No game code changed; `npm test` 9/9 and `npm run typecheck` clean, as before.
  - **Spend:** 120 of the 160 approved credits: five `animate_game_art` jobs on concept 4 (pixel-engine v1.1, 20 credits each, the price estimated) plus one re-run of `run_up`, whose first try lost the racket halfway through. Account: 648 credits left. Asset IDs, prompts and hashes are in `art/spritecook-manifest.md`; the raw sheets are in `art/spritecook/a2/`.
  - **What came back:** every output starts on the source pose (frame 1), so the run loops use frames 2–8. `ready` is a small knee bounce; `run_side` reads more like quick crossing steps than a side shuffle, but the body faces the front wall throughout; `run_down` backpedals with small steps; `serve` frames 2–7 raise the racket, swing overhead and follow through, then frames 8–12 lose the racket, so the serve ends on frame 7 and the game goes back to `ready`.
  - **Cleanup (scripted, `art/tools/a2-build.lua` with new `pixel-lib` helpers `loadCell`, `areaScale`, `cleanScaled`):** every frame at one scale, ×100/123 (the ready pose is 100 px, as in A1), uncropped so frames share an origin; palette-locked, outlined and despeckled as in A1. The generator lifted the body 1–7 px in many frames, so each frame's soles go on the ready pose's sole line. The run loops swayed 3–5 px sideways and back, so run frames are centred on the ready pose's torso (the game moves the sprite). No hand fixes were needed (`a2-fixes.lua` is optional; the build applies it if present). `a1-build.lua` now writes its test sprite to `player-a1.aseprite` so it can't overwrite A2's file.
  - **Sheet:** `art/character/player.aseprite` → `public/hogg-squash/assets/player-100.png` + `.json` (`art/tools/a2-export.sh`): 35 frames of 62×115 px, indexed, tags `ready` (8 × 125 ms), `run_side`, `run_up`, `run_down` (7 × 75 ms each), `serve` (40/40/42/64/64/64 ms: contact on its frame 4 at 122 ms and done at 314 ms, the sim's `SWING`), and the `feet` slice (pivot x 27, y 113). Table in `docs/art-style-guide.md` §3.
  - **For review:** `art/mockups/a2-strips.png` (every frame at 3×, with the ground line and feet pivot) and one GIF per tag (`art/mockups/a2-<tag>.gif`).
  - **Checked:** the JSON has every tag with its durations and the `feet` slice; the build's per-frame report shows every frame's soles on one line and each run frame's torso within 0.5 px of the ready pose; the strips show no stray pixels and the racket in every frame. **Not checked by watching:** the loops playing in Aseprite's preview (the tags were checked frame by frame in the strips; the owner's review of the GIFs covers the motion).
  - **For S8:** `run_side` faces right, so flip it for left. The runners stand up straighter than the ready pose (heads 4–10 px higher), which reads as standing up to run. `serve` is the sim's swing timing; whether the serve uses its own swing in the sim is for S8 to wire up. **For A3:** the serve's overhead frames (4–5) could also serve as a starting point for the overhead swing; the 140 px cells put the serve's racket tip at the top edge, so prompt for a lower racket or add edge margin for overheads.
- 2026-10-21, A3: character animations, part 2 (swings, dive, get-up). No game code changed; `npm test` 9/9 and `npm run typecheck` clean, as before.
  - **Spend:** 120 of the 160 approved credits: four `animate_game_art` jobs on concept 4 (pixel-engine v1.1, 20 credits each, also for 16 frames) plus two re-runs of the dive. Account: 528 credits left. Asset IDs, prompts and hashes are in `art/spritecook-manifest.md`; the raw sheets are in `art/spritecook/a3/`. The edge margin went up to 15 (swings, 164 px cells) and 25 (overhead and dive, 188 px; 25 is the service's maximum). Nothing was cut off: the overhead's racket tip clears the cell top by 3 px.
  - **What came back:** forehand, backhand and overhead kept the racket in the right hand first time. The overhead's follow-through passes in front of the body, so the racket is mostly hidden for three frames (about 115 ms). Dive try 1 dived sideways well, but the racket went to the left hand once the player was down; re-run 1 kept the racket but dived straight ahead toward the front wall; re-run 2 (used) dives to the right, lies flat with the racket on the floor at the end of the right arm, and springs back up, all in one 16-frame take. So the dive and the get-up are one tag, and the optional get-up job wasn't needed.
  - **Cleanup:** `a2-build.lua` now builds A2's and A3's tags into one sheet. Each file is read at its own cell size, A3 files are lined up on the ready pose by their own source pose (frame 1), every frame's soles go on the ground line (the generator drew the lying dive mid-cell), and a new `pixel-lib.dropIslands` removes detached specks such as the ball the generator drew near the racket. One hand fix (`art/tools/a2-fixes.lua`, new `erase` rectangles relative to the feet pivot) removes a ghost racket shaft from the forehand's contact frame. The canvas grew from 62×115 to 150×150 (feet pivot x 73, y 148); a check against A2's file shows all 35 A2 frames are pixel-for-pixel the same relative to the pivot, with the same durations.
  - **Sheet:** 73 frames. New tags `forehand`, `backhand`, `overhead` (8 frames each: 40/40/42 ms of wind-up, contact on tag frame 4 at 122 ms, done at 314 ms, the sim's `SWING`) and `dive` (14 frames: lunge, contact on tag frame 4 at 122 ms, 1.4 s lying down, get-up, done at 2003 ms, the sim's `DIVE`). The contact frame is marked in each tag's user data, exported as `"data": "contact=3"` (0-based, matching the frame names), and `serve` got the same marker; tags that play once have `"repeat": "1"`. Table in `docs/art-style-guide.md` §3.
  - **For review:** `art/mockups/a3-strips.png` (every A3 frame at 3× with the ground line, the feet pivot and a red bar under each contact frame, plus a row of the dive mirrored for left) and one GIF per tag (`art/mockups/a3-<tag>.gif`). `art/tools/a3-preview.lua` makes the strips.
  - **Checked:** contact at exactly 122 ms in every swing and the dive, and totals of 314 ms and 2003 ms (the build prints them); every tag, its durations, the contact data and the `feet` slice are in the JSON; the strips show the racket in the right hand in every frame (except the overhead's hidden follow-through) and no stray pixels. **Not checked by watching:** the tags playing in Aseprite's preview (checked frame by frame in the strips; the owner's review of the GIFs covers the motion).
  - **For S8:** the frames are now 150×150, so use the `feet` pivot from the JSON, and mirror `run_side` and `dive` about the pivot (x → 146 − x), not the frame centre. Mirrored, the racket is in the left hand. Read the contact frame from the tag data rather than hard-coding it. The sim has no overhead yet (`hand` is `fore` or `back`); `overhead` is ready for when a high ball should use it (S8 can pick it by ball height, or leave it unused). The dive tag covers the whole 115-frame lockout, including the get-up.
- 2026-10-21, S8: sprite and animation engine; the character is in the game. `squash-physics.js` and `js/sim/` unchanged; `npm test` golden/flight/shot/hit numbers exactly as the P0 baseline; unit tests 76 → 85; `npm run typecheck` clean.
  - **New:** `js/engine/assets.js` (`loadAssets`: image + JSON loads with a `{ done, total, error }` state), `js/render/sprites.js` (`parseSheet`, `frameAt`, `createAnimator` / `stepAnimator`, `buildAtlas`, `drawSprite`, `KIT_SWAP`), `test/sprites.test.js` (9 tests). **Changed:** `render/actors.js` (draws the sprites in depth order; boxes when there are none), `main.js` (a "Loading" screen until the sheet is in, then the game; the animators are stepped once per sim step; `\` or `?boxes` shows the placeholder boxes; the boxes are also the fallback if loading fails; `hogg.sprites`, `hogg.anims`, `hogg.boxes`), `render/debug.js` (each player's tag and frame, `<` = mirrored), `test/run-all.js`.
  - **Timing is in sim frames:** each tag's millisecond durations become start times in sim frames (rounded to the nearest 1/57.4 s), and loops count sim steps, so `?slow` and pausing slow or stop the animation too. A swing or dive keeps no clock of its own: it shows the frame for the sim's `swing.t`, so the contact frame read from the tag's `"data": "contact=3"` is on screen on the step the racket meets the ball. The test checks every swing tag's contact frame starts on `SWING.CONTACT` / `DIVE.CONTACT` (7) and lasts `swingLength` (18, dive 115). Play-once tags come from `"repeat": "1"`.
  - **What plays:** swing or dive (forehand / backhand from the sim's `hand`; the dive mirrored for a backhand) > serve > run > ready. Any sideways movement plays `run_side` (mirrored for left), straight up or down the court `run_up` / `run_down`; the three runs share one stride clock, so turning doesn't restart it, and a runner may stand still 3 steps before going to ready (the CPU pauses for a frame or two near its spot). A jump of more than 8 units in a step (a new rally's setup) isn't a run. `overhead` is loaded but unused (see "For CP-D").
  - **The serve:** the sim launches the ball on the press with no wind-up, so the serve tag starts on its contact frame on the serve step and plays its follow-through (11 steps); running off after the contact frame cuts it short. The 3 wind-up frames don't show.
  - **Drawing:** the 100 px art scaled to `heightAt(z)` with smoothing on (quality high) for the sprites only, off again after. The feet pivot is pixel (73, 148): the ready pose's soles end on row 148 and its head starts on row 49 (exactly 100 px), so the ground point is x 73.5 (the pixel's centre), y 149 (its bottom edge). Mirrored tags flip about it (x → 147 − x in continuous terms, which is pixel x → 146 − x). Positions are rounded to whole pixels, so at 100 px it is pixel-exact. Each kit is repacked at load into its own atlas with a 2 px transparent gutter round every frame, so smoothing never picks up a neighbour's pixels. P2 / CPU's atlas recolours the six reds once at load: all 45,912 red pixels changed, nothing else, alpha identical.
  - **Checked in the browser** (http://localhost:8787/hogg-squash/?dev, `?slow=100000` with `hogg.step` driving the real loop step; P1 played by a second CPU brain through dispatched WASD/F/G key events): 12 hits in a row, both players, forehand, backhand and a backhand dive (mirrored), each showing its tag's contact frame on the hit step; the serve shows its contact frame on the serve step; running from the glass to the front wall the height went 100 → 70 px in 30 one-pixel steps over 133 steps with the `run_up` clock never skipping; the mirrored side run (racket in the left hand), a dive lying flat on the right side drawn in front of the other player by depth, the white kit, and `\` switching to the boxes and back. With the pane in view: **57.47 sim steps/s** at a 75 Hz display; drawing the frame costs 0.14 ms with sprites against 0.11 with boxes. No console errors.
  - **Checked only by tests:** the contact and length timings for `overhead` (unused) and the animator rules above. **Not checked:** play at full speed with a person at the keys (the owner's CP-D), other display rates, Firefox.
  - **For CP-D:**
    - **Where the racket is at contact.** The timing is exact, but every contact frame holds the racket at shoulder height, while the sim's contacts are mostly lower: over 40 hits the ball was at y 8–27 units for the middle half (about 0.2–0.75 m), median 19 (0.55 m), max 55. So the racket usually meets the ball from above it, near it across. Fixes would be art (low and high contact variants) or a small sprite offset by ball height; nothing changed for now.
    - **The serve:** its contact frame swings the racket across to the left at the shoulder, while the sim holds the ball waist-high on the server's right (`SERVE_SPOT`), and the 3 wind-up frames never show because the sim serve has no wind-up. Options: a 7-frame serve wind-up in the sim (the ball leaves 0.12 s after the press; a gameplay change), showing the serve's frame 2 (racket up on the right) on the serve step instead of the marked contact frame, or new serve art.
    - **Overhead (not wired; the owner's call):** proposed rule: play `overhead` instead of forehand/backhand when the swing's contact is one of the classifier's overhead types (8–9, the ball above y 48), the same test `shotFor` already uses for overheads. It's a one-line choice in `stepAnimator` (the swing's `contact.index`), no sim change. In the 40 hits above, the highest was at y 55, so at least one would have used it.
- 2026-10-21, CP-D (planning only): the owner's answers (listed under CP-D) became a new fix-up session, **S8b**, before A4.
  - **Racket height at contact:** a small sprite offset by the ball's height at contact (eased in and out, capped at about 12% of the drawn height, vertical only). No new art: the racket head's point per contact frame goes in a `racket` slice (or a table).
  - **The serve:** a 7-frame wind-up in the sim (`SERVE_WINDUP` = `SWING.CONTACT`; the serve tag's wind-up is exactly 7 sim frames), so the ball leaves 0.12 s after the press and the 3 wind-up frames show. A gameplay change, so it gets world tests. `SERVE_SPOT` and the aim stay as they are.
  - **Overhead:** wired, by the S8 rule (contact types 8–9).
  - **Camera:** not final. The owner wants the court "a little wider". Measured while planning: a 1.10 stretch across only gives a 220 × 143 px front wall, a 484 px floor at the glass and 78 px margins, with heights unchanged. A 10% zoom (focal 612) also needs the eye line raised, or the floor at the glass ends at y 372, off screen. S8b builds both, the owner picks, and the camera is frozen there. A4 now depends on S8b. A5's score panel is sized to the new margins.
  - **No notes** on readability against the floor or the palette swap.
  - **Effort for S8b:** `high` (it changes the serve's timing in the sim, and freezes the camera that A4 paints over).
- 2026-10-21, after CP-D (owner request, between sessions): **players true to scale.** Researched an average man (about 1.75 m; the US average is 5 ft 9 in) and the court lines (World Squash: service line 1.78 m, tin 0.48, out-line 4.57, back-wall line 2.13). Our lines match: 63 / 17 / 161 / 75 units = 1.79 / 0.48 / 4.57 / 2.13 m, and the service line is 39% of the out-line's height, on court and on screen (55.9 of 142.9 px at the front wall). The CP-B half-strength curve gave 1.75 m only near z 120: 2.16 m at the front wall (70 px against a 58 px service line), 1.49 m at the back.
  - **Changed:** `heightAt` (`render/actors.js`) = 1.75 m × perspective scale (`CHARACTER_HEIGHT.METRES`): 57 px at z 12, 78 at z 100, 117 at z 179, at most 0.95 px per running frame. `?curve=half` keeps the CP-B curve. `main.js` parses it. `test/actors.test.js`: the new curve, the head under the service line at every depth, the half curve under `?curve=half`. `npm test` (86 unit tests) and `npm run typecheck` pass; `squash-physics.js` and `js/sim/` unchanged.
  - **Checked in the browser:** one player at the front wall (57 px, head just under the service line) and one at the back (117 px), no console errors. **Not checked:** full-speed play. The softer sprite at the back (enlarged 1.17×) is for the owner to judge.
  - **For S8b:** with the `zoom` camera the players grow too (about 129 px at the back). The racket shift cap is now ≈14 px at the back.
- 2026-10-21, after CP-D (owner request): **the back too big at 117 px; now 57 px at the front, 100 px at the back.** `heightAt` = 100 × (scale(z) ÷ scale(z 179))^k, with k ≈ 0.77 from the two ends (`CHARACTER_HEIGHT.FRONT` / `FRONT_Z` / `BACK` / `BACK_Z`): 57 / 61 / 66 / 73 / 81 / 90 / 100 px at z 12 / 39 / 70 / 100 / 130 / 155 / 179, at most 0.62 px per running frame. As a real height that's 1.76 m at the front wall down to 1.49 m at the back, so the head is under the service line everywhere (tested at every whole z). The art is drawn 1:1 at the back again. `?curve=true` shows the true-scale curve. `npm test` (87 unit tests) and `npm run typecheck` pass. Checked in the browser: 57 px at the front wall and 100 at the back, no console errors. The S8b text is updated (with `zoom` the players now keep their pixel size).
- 2026-10-21, S8b: CP-D fix-ups. `squash-physics.js` unchanged; `npm test` golden/flight/shot/hit numbers exactly the P0 baseline; unit tests 87 → 95; `npm run typecheck` clean.
  - **Camera: the owner picked `wide`, now frozen** (`CAMERA` in `render/projection.js`: the S1 camera with `widen` 1.10, a stretch across only). Front wall 220 × 143 px (x 210–430, y 52–195), floor y 195 → 345 (150 px deep), 484 px wide at the glass, margins 78 px. The three candidates were shown as screenshots with a player at the front wall (57 px) and the back (100 px); heights are 57 → 100 px under all three (`heightAt` uses ratios of the perspective scale, so the focal cancels; tested). `?cam=zoom|old` stay for comparison until S12. The HUD's margin width is now computed from the camera (`render/hud.js`); the scores and "FIRST TO" fit in 78 px. Recorded in `docs/decisions.md`, "FROZEN".
  - **Serve wind-up (sim):** `SERVE_WINDUP` = `SWING.CONTACT` = 7 in `sim/world.js`. The press sets `world.windup` and emits `serveSwing`; the ball launches on the 7th step after it (`serve`), with the pressed button, aimed from the held ball. The server is locked and later presses are ignored; the receiver moves. The CPU server presses once and then returns no actions until the launch (`sim/cpu.js`); `SERVE_WAIT` unchanged. New world test (launch exactly 7 frames after the press, nothing moves before, the button is the press's, mashing ignored); the world serve tests now step through the wind-up; the CPU test checks press → launch = 7.
  - **Serve timing in the browser:** every serve measured, human and CPU, launched 7 steps after the press; the animator shows `serve` frames 0, 0, 1, 1, 1, 2, 2 over the wind-up and the contact frame (3) on the launch step. S8's special case (starting on the contact frame) is gone.
  - **Overhead:** wired in `stepAnimator` for contact types 8–9 (`OVERHEAD`, now exported from `sim/player.js`), mirrored for a backhand. Seen in the browser on y 50–56 balls (5 of 80 contacts).
  - **Racket height:** a `racket <tag>` 1×1 slice per swing tag in `art/character/player.aseprite` (new `art/tools/racket-slices.lua`, also called by `a2-build.lua`), re-exported: the PNG is byte-for-byte the same and the JSON only gained the five slices. (The slice was preferred over a table in `sprites.js`.) `racketShift` (`render/sprites.js`) shifts a swinging sprite by the gap between the racket head and the ball at the planned contact (the classifier's ghost ball, which matched the ball at contact exactly in every hit checked), capped at `RACKET.MAX` 12% of the height, eased in (smoothstep) from the press to the contact frame and out over `RACKET.OUT` 10 frames (a serve: 3, so it is 0 before a running server can cut the follow-through short). `?racket=off` for comparison. Animator now keeps `contact`; `hogg.shifts` exposes the shift.
  - **Racket gaps, before → after** (80 contacts at seed 5, P1 played by a CPU brain through dispatched keys, `?slow=100000` + `hogg.step`, misses excluded; gap = racket head to the ball's drawn centre at contact, screen px): median **35 → 25**, mean 36 → 27; low balls (y < 12, 25 hits) 55 → 46; waist-high (y 12–40, 36) 34 → 25; high forehands (11) 3 → 0.5; overheads (5) 30 → 22; serves (8) 21 → 12. Against the ball as drawn on the contact step (it has already moved one frame on): 21 → 12. The cap binds on 73 of 80. A 20% cap would give a median of 19 px, 30% 11 px, but sinks the feet 20–30 px into the floor. Across, the head is a median 12 px off the ball (serves 32: the serve's racket is over the left shoulder, the ball on the right; overheads 35).
  - **Checked in the browser** (the static fallback server, http-server on 8080, because Wrangler kept failing on a locked SQLite file shared with another Wrangler): the three cameras and the frozen one, the HUD inside the margins, nothing cut off; serves and their timing; the overhead; the racket shift on and off at the same contact (a waist-high forehand: 11 px down, nearer the ball but still above it). No console errors. **Checked only by tests:** the shift's easing and cap, the overhead choice for every contact type, mashing during the wind-up. **Not checked:** play at full speed (the pane was hidden, so the real-time loop didn't run: 0 steps/s measured), Firefox, other display rates.
  - **For CP-E:** whether the racket gap at contact is good enough (question 5 added there). The shift helps waist-high and high balls but can't reach low ones within the cap; options are a bigger cap (feet sink), or low-contact art (SpriteCook spend).
- 2026-10-22, A4: court background, ball and effects. No game code changed; `npm test` (all 9 checks, 95 unit tests) and `npm run typecheck` pass.
  - **Spend:** 8 of the 16 approved credits (one GPT 2.5 Flare maple texture; the re-run wasn't needed). Account: 528 → 520. Everything else was drawn by script in Aseprite, no credits. Manifest updated.
  - **Court:** `assets/court.png` (640×360, indexed), from `art/court/court.aseprite`, built by `art/tools/a4-court.lua`, which inverts the frozen `wide` camera at 6×6 samples per pixel. The code-drawn court was exported from the default camera in the browser (`art/court/court-code.png`, also the file's hidden reference layer). **Line match:** 3,236 of the code's 3,242 line pixels (99.8%) are painted as lines, and all 3,438 painted line pixels are within 1 px of a code line. The thin floor lines are a little bolder than the code's antialiased ones (a line wins a pixel at 35% coverage). See `art/mockups/a4-court-compare.png`. White walls with corner and skirting seams, red lines, the tin, faint ball marks, perspective maple floor (quietened towards the front wall), glass edge, flat margins for the HUD (78 px).
  - **Wall boards (owner approved, hand-drawn):** "HOGG" on the left wall and "RAZORBACKS" on the right, white on Hogg red, z 70–178, with a Mission Success orange-and-teal stripe. The letters are spaced evenly on screen, so "RAZORBACKS" stays readable at its front end (1–2 px letter columns there). No school logo.
  - **Effects:** `assets/fx.png` + `fx.json` (48×48 frames, `centre` slice at 24, 24): `ball` ×5 (3–7 px by depth: 3 below z 36, 4 to 103, 5 to 145, 6 to 174, 7 beyond), `shadow` ×5, `landing` ×5 (z 40/80/115/145/172), `ring` ×6, `sparkle` ×4. Details in `docs/art-style-guide.md` §3.
  - **Checked:** the overlay comparison, and every ball size against the front wall, tin, side wall, both boards, wood and both kinds of line, at 4× (`art/mockups/a4-ball-contrast.png`). The two smallest balls were made all outline-black after the 3 px one looked weak on the tin. A scene mockup with balls, shadows, markers, a ring and a sparkle: `art/mockups/a4-court-scene.png`. **Not checked:** the art in the running game (S9 draws it), or the sprites next to the smoothly scaled player.
  - **For S9:** pick the ball frame from z alone (as `project()` does); the shadow is opaque (no alpha needed). Keep the code-drawn court behind the debug toggle, as planned.
- 2026-10-22, A5: font, callouts, score panel, title art. No game code changed; `npm test` (all 9 checks, 95 unit tests) and `npm run typecheck` pass.
  - **Spend:** 32 of the 64 approved credits (one 4-variation GPT 2.5 Flare mascot round; the refine round wasn't needed). Account: 520 → 488. Manifest updated.
  - **Font (owner approved):** `assets/font.png` + `font.json`, our own lettering built on A4's 5×7 board letters (`art/tools/a5-lib.lua`, `a5-font.lua`): A–Z, a–z, 0–9 (tabular), `- – : . ! ? ' , / ( ) < > +`. Eight fonts: `small` (7 px capitals) in white, grey, dark and red; `large` (14 px) and `huge` (28 px) in white (red shadow, for the margins) and red (grey shadow, for the walls), outlined. The bigger sizes double the 5×7 letters, adding pixels only on diagonal steps. The JSON format is in `docs/art-style-guide.md` §3. Lowercase is included because the HUD uses mixed case ("P1's point", "HARD to play again").
  - **UI (owner approved):** `assets/ui.png` + `ui.json` (Aseprite slices): score panels for P1 (red header) and P2/CPU (white header), 66 × 84 for the 78 px margins, with name/score/serve sub-slices; a serve tag and ball; dark and light 9-slice panels; a menu highlight bar (9-slice) and cursor; the callouts POINT, OUT, TIN, DOWN, GAME, WINS (28 px red lettering) and **DOUBLE BOUNCE** (the owner renamed NOT UP; two lines, 21 px, made "a little smaller" at the owner's request, so the lettering also has a 3× rule). Preview over the court: `art/mockups/a5-ui.png`.
  - **Title (owner approved):** `assets/title.png`, a front-wall scene with the "HOGG SQUASH" logotype (the lettering at 8×) and, **at the owner's request, the school's Hogg Razorbacks shield** in place of the mascot (open question 6 settled for the title; `docs/decisions.md`, Theme). The owner's file was a WebP named `.png`; it is converted and kept as `art/ui/hogg-logo-source.png`. The mascot (SpriteCook concept 3, cleaned from its 1024 px raw image at 292 px) is a hidden layer in `art/ui/title.aseprite`. The menu area for S10 is the `menu` slice (x 44–350, y 196–292).
  - **Checked:** the font against "Done when" (A–Z, 0–9, `- : . ! ?` and the en dash, plus more); the owner saw and approved the font, the HUD pieces, the callouts and the title; the resized DOUBLE BOUNCE was shown at the end of the session (`art/mockups/a5-ui.png`). Everything is indexed on the shared palette. **Not checked:** any of it in the running game (S9 draws it). `ui.json`'s slices and `font.json` were read back with Node.
  - **For S9:** map the rally reason `notUp` to the `callout DOUBLE BOUNCE` slice (it is 52 px tall, the others 32). The margin panels are 66 px wide, 6 px in from each edge. Draw text only with characters the font has. S9's "logo slot" is now only needed for a logo in the match itself; the title already has the shield.
