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
- **Court line heights approved (2026-10-18, after S2):** tin **17**, front-wall out-line **161**, side-wall out-line sloping from **161** at the front wall to **75** at the back (the top of the back glass), in game units. The lines count against the ball. They live in `js/sim/court-rules.js` (`LINES`).

## CPU difficulty (2026-10-18, revised)
- **Difficulty selector, levels 1–9** (1 = easiest, 9 = hardest), chosen before a 1P match.
- Later, when there are several characters, each CPU character may get its own level; the selector may change then.
- The arcade has 20 internal difficulty steps (4 DIP settings × 5 hidden skill levels), and they are **not** in a clean easy→hard order. The plan must map 1–9 onto a smooth, monotonic curve built from those values (see `research/squash-game-logic.md`, "Difficulty index").
- Note: in the arcade, difficulty changes **game pace too** (ball speed, gravity, shot power, bounce), not just how well the CPU plays. Default for the plan: keep that for 1P, and use one fixed mid-level pace for 2P versus.

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
