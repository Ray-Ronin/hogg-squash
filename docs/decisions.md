# Decisions

Settled decisions. Newest at the bottom of each section. If something here conflicts with `design-notes.md`, this file wins.

## Scope of version 1 (2026-10-18)
- **Modes:** 1 player vs CPU, and 2-player local versus. Single matches only.
- **Not in v1:** tournament / bracket, multiple courts, character select (one character only), audio, high-score table, crowd, drawn back wall.
- **One character** for v1. Test the gameplay with it before adding more.
- **No audio** in v1.

## Platform (2026-10-18)
- **Browser game, local play only.** There will never be online play, so no netcode, servers, matchmaking or leaderboards.
  (Determinism is still worth keeping: it makes testing, replays and the CPU's ball prediction reliable.)
- Hosted as static files on Cloudflare Workers at roninray.com/hogg-squash/ (already set up).

## Build tooling (2026-10-18)
- **No build step for now.** Plain JS ES modules served directly. Revisit Vite later if we want TypeScript, npm packages, or minified and cache-busted bundles.
- **Plain JavaScript with `// @ts-check` + JSDoc types** (type checking in the editor, no build).
- **Renderer: plain Canvas**, proven by a small test that is **step 1 of the build** and is kept (see `research/canvas-vs-phaser.md`, "The test"). Phaser stays the fallback if the test goes badly.
- **Confirmed at CP-A (2026-10-18): plain Canvas.** The S1 test needed about 150 lines of plumbing and nothing felt heavy. Phaser is no longer planned.
- **Type check allowed (2026-10-18, after S2):** `npm run typecheck` runs TypeScript's checker over `public/hogg-squash/js/` (settings in `tsconfig.json`). It is a check only: no build output, no runtime dependency, and TypeScript isn't installed in the repo (`npx` fetches one pinned version when the script runs). The game stays plain JavaScript.

## Repo layout (2026-10-18)
- Physics core: `public/hogg-squash/js/squash-physics.js` (moved in from `../prototype`; loads in the browser with no build).
- Tests + recorded arcade frame logs: `test/` (run `npm test` from the repo root; Node 18+). These stay outside `public/`, so they're never deployed.
- `.gitattributes` normalizes line endings; `.gitignore` keeps out node_modules, wrangler state and ROM/zip files.

## Controls (2026-10-18)
- Two players on **one keyboard**: **P1 = W A S D + F (HARD) / G (SOFT)**; **P2 = arrow keys + Numpad 0 (HARD) / Numpad . (SOFT)**. All keys remappable. See `controls.md`.
- **Two gamepads** connected to the PC also work, one per player.

## Art (2026-10-18)
- Pixel art, at a **higher resolution than the arcade's 320×240**.
- **Internal resolution: 640×360** (16:9). Scales cleanly to 1280×720 (2×), 1920×1080 (3×), 2560×1440 (4×).
- **The game fills the window (2026-10-18, after S3).** Instead of only whole-number scales with a border, the screen scales to fill the window with sharp-bilinear scaling (a whole-number upscale with no smoothing, then a smooth shrink to fit). Exact sizes (2×, 3×, 4×, so 1920×1080 fullscreen too) skip the smoothing and stay pixel-exact. `?scale=int` keeps the old whole-number-only behaviour. The page background matches the court's margin colour, so there's no visible box. **Confirmed at CP-B (2026-10-19):** sharp enough in a normal window, so it stays the default.
- **Tools:** Aseprite (drawing, cleanup, animation, export) and **SpriteCook** (AI generation of concepts, base sprites and animations). See `art-style-guide.md` §4.

## Theme (2026-10-18)
- The game is themed on **Hogg Middle School** (Houston ISD), whose squash courts are used by **Mission Success** (Mission Squash Academy). The school's **colours and logos can be used**. See `theme.md`.
- References are a general guide only. Nothing has to match or be copied exactly.

## Match rules (2026-10-18)
- **One match = one game.** Before the match, players choose **first to 5, 7, 9 or 11**.
- **Win by 2:** e.g. at 8–8 in a game to 9, play continues until one side leads by 2 (10–8, 11–9…).
- **Rally scoring** (a point on every rally, as in the arcade).
- **No "faults as lives".** The arcade's 5-faults-per-credit mechanic is dropped.
- **Serving:** vs CPU, the human always serves first. In 2-player versus, the first server is random. (After that, the rally winner serves.)
- **The serve crosses the court (2026-10-19).** The arcade serve flies straight (vx 0), so it came back down the server's own side. Now it keeps the arcade's height and depth but is angled across, so its first bounce lands in line with the opposite service box, about 1.9 m behind it (the opposite back quarter, where the receiver stands). `serveVx` in `js/sim/world.js` works out the angle with the real physics, so it still lands there at any game pace.
- **The serve is aimed (2026-10-19, CP-B).** Where the server stands in the box aims it: the first bounce lands at the mirror-image place across the opposite back quarter (near the centre line → near the centre line, near the side wall → near the side wall). **HARD serves deep, SOFT shorter**, and the server's depth in the box nudges it a little. Every serve stays legal (front wall between the service line and the out-line, first bounce in the opposite back quarter). Built in S4b; the target numbers are tuned at CP-C.
  - **As built (S4b):** `SERVE_AIM` in `js/sim/world.js`. The held ball's place across its reach in the box maps to the first bounce's |x| from **36** (centre-line edge) to **120** (side-wall edge); **HARD aims at z 168, SOFT at z 140**, and the server's depth moves both by **±8** (front of the box → 160 / 132, back → 176 / 148). The server starts each serve mid-reach, so an untouched HARD lands at x ∓78, z ≈ 167. `serveAim` keeps the arcade's height speed and solves the depth and sideways speeds with the real physics. The bounce happens on a whole frame, so the reachable depths come in small steps and a serve lands within about 4 units of its depth target (x within 2). To get the deep HARD spots it allows depth speeds up to 11 units/frame (the arcade's serve is 9), so HARD is a little faster than the arcade serve.
- **Turns are checked at the press (confirmed at CP-B):** a press before the ball has reached the front wall is a miss.

## Hitting (2026-10-19, CP-B)
- **A swing plants the player** for its whole 18 frames (≈0.31 s), as in the arcade. Confirmed: it feels fine.
- **Dives** happen on the classifier's special band (just beyond a stretch), as in the arcade. Confirmed. **Time on the ground: 2 s** (115 frames in all), shorter than the arcade's 2.5 s. Built in S4b (`DIVE.RECOVERY` 108).
- **SOFT from the front court is a short drop (2026-10-20, CP-C).** It ran deep: some of the arcade's front-court SOFT rows are hit at twice the drop's power, so the ball takes its second bounce near the back wall. For the human and the CPU, a front-court SOFT gets a capped power and lift (in `js/sim/`, not the physics file), so its second bounce is in front of the short line. This departs from the arcade's tables on purpose. Built in S6b.
- **Serves and the 2 s dive confirmed at CP-C (2026-10-20).** No change.
- **Court line heights approved (2026-10-18, after S2):** tin **17**, front-wall out-line **161**, side-wall out-line sloping from **161** at the front wall to **75** at the back (the top of the back glass), in game units. The lines count against the ball. They live in `js/sim/court-rules.js` (`LINES`).

## CPU difficulty (2026-10-18, revised)
- **Difficulty selector, levels 1–9** (1 = easiest, 9 = hardest), chosen before a 1P match.
- Later, when there are several characters, each CPU character may get its own level; the selector may change then.
- The arcade has 20 internal difficulty steps (4 DIP settings × 5 hidden skill levels), and they are **not** in a clean easy→hard order. The plan must map 1–9 onto a smooth, monotonic curve built from those values (see `research/squash-game-logic.md`, "Difficulty index").
- Note: in the arcade, difficulty changes **game pace too** (ball speed, gravity, shot power, bounce), not just how well the CPU plays. Default for the plan: keep that for 1P, and use one fixed mid-level pace for 2P versus.
- **Level 5's pace is the CP-B pace (2026-10-19).** The pace played at CP-B (arcade Normal skill 0: speed 280, power 17, bounce −1, gravity 0x1F80) is right for level 5, and 2P versus uses it. The plan's proposed table put this pace at level 3, so S6 re-anchors the pace columns around it.
- **The table as built (2026-10-19, S6)** (`LEVEL_TABLE` in `js/sim/difficulty.js`; tuned at CP-C). 1P plays the chosen level for both the pace and the CPU; 2P always plays level 5's pace. `?level=1..9` picks it (default 5) until the menus (S10).

  | Level | Like arcade… | Game speed | Gravity | Power mult | Bounce offset | CPU reaction (frames) | CPU error step | CPU shot sense |
  |---|---|---|---|---|---|---|---|---|
  | 1 | below anything | 256 (1.00×) | 0x1DC0 | 15 | +1 | 24 | 24 | 0 |
  | 2 | below Easy 0 | 262 | 0x1E30 | 16 | 0 | 20 | 20 | 0.125 |
  | 3 | | 268 | 0x1EA0 | 16 | 0 | 16 | 16 | 0.25 |
  | 4 | | 274 | 0x1F10 | 17 | −1 | 12 | 16 | 0.375 |
  | 5 | Normal 0 (CP-B pace) | 280 | 0x1F80 | 17 | −1 | 8 | 12 | 0.5 |
  | 6 | ≈ Normal 2 | 286 | 0x1FF0 | 18 | −2 | 6 | 10 | 0.625 |
  | 7 | ≈ Normal 4 | 292 | 0x2060 | 18 | −2 | 4 | 6 | 0.75 |
  | 8 | | 298 | 0x20D0 | 19 | −3 | 2 | 4 | 0.875 |
  | 9 | Hardest 4 | 304 (1.19×) | 0x2140 | 19 | −3 | 1 | 2 | 1 |

  - Speed and gravity step evenly through all nine levels (+6 and +0x70 a level). Power and bounce change every second level. Level 1's power 15 and bounce +1 are below the arcade's range (extrapolated); its shots take about 20% longer to reach the front wall than level 5's, and level 9's about 15% less.
  - The CPU columns are the plan's proposal. `latMult` = power mult.
  - **CPU shot sense** is new: how far the CPU's HARD/SOFT choice leans on the situation (drop when the opponent is deep, drive when they're up the court, and don't drop a ball at the floor, which went into the tin about half the time). 0 plays the S5 rule unchanged.
- **CP-C (2026-10-20): the levels need to differ more, and level 1 must be beatable.** The owner lost 4–9 at level 1, and levels 1, 5 and 9 felt about the same. In S6b:
  - the CPU reacts more slowly at the low levels (level 1: 36 frames ≈ 0.63 s; level 9 unchanged);
  - **how well the CPU hits scales with the level**: press-timing error, no angled shots, fewer drops and no volleys at the low levels, growing to today's CPU at level 9;
  - the pace columns stay as above. Widen them only if the levels still feel too close after S6b.
  - The 2P pace stays level 5's.

## Character (2026-10-18)
- v1 character: an **adult player in red and black** (Hogg colours).
- The CPU opponent and P2 in versus use the same character, **palette-swapped** to a different kit.

## Court look (2026-10-18)
- Like the Hogg courts: **white walls, red lines, light wood floor**. No court photos are needed.
- **No back wall drawn** in v1 (the camera looks in from behind). The ball still bounces off the back wall in the physics.
- **No crowd** in v1. Later.

## Camera and character size (2026-10-18, CP-A)
- **Camera stays as built in S1** (`CAMERA` in `js/render/projection.js`): 8.1 m behind the back wall, 4.0 m high, focal 557 px, eye line at y 70. The front wall is 200 × 143 px, the floor is 150 px deep and each side margin is 100 px. It can still change until CP-D. After that it is frozen, because A4 paints the court to match it.
- **Character height (open question 4): three pre-scaled sizes, not one fixed size.** With this camera a single 100 px sprite looks right at the back but like a giant at the front wall. True perspective would halve the height from back to front (about 67 px/m at z 178 against 33 px/m at z 22), so the sizes split the difference:

  | Depth band (game units) | Sprite height |
  |---|---|
  | back: z ≥ 130 | 100 px |
  | middle: 70 ≤ z < 130 | 84 px |
  | front: z < 70 | 68 px |

  - The band is chosen from the player's feet z, with a few units of hysteresis so a player standing on a band edge doesn't flicker between sizes.
  - These are starting values. S3 draws the placeholder boxes this way, and CP-B confirms the sizes and edges (or drops to two sizes).
  - Art is generated once at 100 px. The smaller sizes are downscaled and cleaned in Aseprite (no extra SpriteCook credits). Every size has the same tags, frame counts and timings.
- **Smooth height, not steps (2026-10-18, after S3).** Played in S3, the sizes were right, but the jump between bands was jarring. The placeholder boxes now change height smoothly with the feet z, 1 px at a time, through **68 px at z 39, 84 px at z 100 and 100 px at z 155** (the middle of each old band), holding 68 in front and 100 behind (`CHARACTER_HEIGHT` and `heightAt` in `js/render/actors.js`). There are no bands or hysteresis any more.
  - **Still open, settled in A1: how the sprites get smooth sizes.** Pixel art can't be resized freely without some cost, so A1 tries the options on the test sprite and the owner picks:
    1. scale the 100 px art at draw time to the exact height (no extra art work; pixels go slightly uneven or soft while the size changes);
    2. export many sizes, about every 2–4 px, downscaled automatically in Aseprite with only light cleanup;
    3. keep a few hand-cleaned sizes (100 / 84 / 68) and scale the nearest one at draw time for the heights in between.
  - Until A1 decides, the three hand-cleaned sizes below stay the art plan.
- **One smooth curve over the whole court (2026-10-19, CP-B).** The 68–100 px range is right, but the S3 curve didn't look natural: it stops growing near both walls and bends at mid-court. It is replaced (in S4b) by one smooth curve with no flat ends: height = 100 × √(perspective scale at z ÷ scale at the back), about 70 px at the front wall, 82 at mid-court and 100 at the back. That's half-strength perspective.
  - **As built (S4b):** `heightAt` in `js/render/actors.js`: **70 px at z 12, 73 at z 39, 77 at z 70, 82 at z 100, 87 at z 130, 93 at z 155, 100 at z 179**, rounded to whole pixels (at most 0.4 px of change per running frame). The box's left and right edges are each rounded from the unrounded size, so neither edge steps back and forth as the player walks (rounding the width first did, by 1 px, near the centre). `?curve=old` shows the S3 curve for comparison.
  - **For the sprites, the owner leans towards one sprite scaled to fit** (method 1 above), but wants to see real pixel art first. A1 still shows all three methods and the owner picks there.
- **The S4b height curve is confirmed (2026-10-20, CP-C):** it looks natural, with no difference visible against the old one while moving.
- **Ball feel and test feed:** the ball feels like the arcade, and the S1 feed (back to about the short line) is fine. No change.

## Screens (2026-10-18)
- Flow: **title → 1P / 2P → match length (5/7/9/11) → difficulty 1–9 (1P only) → controller assignment → match → result → rematch / menu.**
- **Pause menu on Esc** (and Start on a gamepad). Pause also triggers automatically when the window loses focus or leaves fullscreen.
- **Options screen:** key remapping and a key test.

## Art production (2026-10-18)
- **Claude does the Aseprite cleanup** of SpriteCook output, through the Aseprite connection.
- **SpriteCook credits:** the owner will upgrade the account when generation is needed. Ask before spending.

## Still open
Nothing blocking. Details for the plan to settle are in `open-questions.md`.
