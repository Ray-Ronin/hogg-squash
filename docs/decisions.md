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

## Mobile and touch (2026-10-20)
- **Phones and tablets are supported** with on-screen touch controls, built in S11b after the options screen.
- **The touch controls never show up for someone on a computer.** Hidden at start, shown on the first touch, hidden again when a key or gamepad is used.
- **No setting (2026-10-22, the owner's call after S11b):** the game chooses by itself from the device being used. S11b's "Touch controls: Auto / On / Off" option was removed; it always behaves as Auto did. A phone-like screen (coarse pointer, no hover) starts with them shown.
- Touch sets the same actions as the keyboard and pads; the simulation never knows the device.
- **Touch is 1P vs CPU only.** Two players on one touchscreen is too cramped, so 2P needs a keyboard or gamepads.

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
- **Shared palette (2026-10-20, A1):** 36 colours in `art/palette/hogg-squash.gpl` (room to grow to 48). Hogg red is `#c8102e` (the court lines), the kit red `#e8202a`. Every sprite, court piece and UI element is locked to it. The colours are listed in `theme.md`.
- **Our own bitmap font (2026-10-22, A5):** the blocky 5×7 letters of the A4 wall boards, extended to A–Z, a–z, 0–9 and punctuation, in three sizes (1×, 2× and 4×, the bigger ones outlined with a drop shadow) and a few fixed colours (`assets/font.png` + `font.json`). No outside font, so no licence file. The owner approved it and the HUD pieces.
- **"DOUBLE BOUNCE", not "NOT UP" (2026-10-22, A5, the owner's call):** the callout for a ball that bounces twice (the rally reason `notUp`) reads DOUBLE BOUNCE, on two lines and a size smaller than the other callouts so it fits the front wall. S9 shows it; the code's reason name stays `notUp`.

## Theme (2026-10-18)
- The game is themed on **Hogg Middle School** (Houston ISD), whose squash courts are used by **Mission Success** (Mission Squash Academy). The school's **colours and logos can be used**. See `theme.md`.
- References are a general guide only. Nothing has to match or be copied exactly.
- **The school's shield is on the title screen (2026-10-22, A5, the owner's call).** The owner supplied the Hogg Razorbacks shield ("HOGG RAZORBACKS IB STEM" over a red boar's head) and asked for it in place of the title mascot. This settles open question 6 for the title: the shield goes public with the next push. It is pixelated onto the palette in `assets/title.png` (`art/ui/hogg-logo-source.png` is the owner's file). Elsewhere (the court, the HUD) the game still uses only the colours and our own lettering. The original SpriteCook mascot is kept, unused, as a hidden layer in `art/ui/title.aseprite`.
- **The match's logo slot (2026-10-22, S9):** `LOGO` in `js/render/hud.js`. It sits in the right margin under P2's score panel, at most 66 px.
- **The shield is in the match (2026-10-22, S12d, the owner's call at the CP-F replay; open question 6 settled).** `assets/logo.png` is the title's shield (`art/ui/hogg-logo-source.png`) made at the slot's size, 61×66, by `art/tools/s12d-logo.lua` the way the title's crest was made (area-averaged, locked to the palette's neutrals and reds, 1 px outline; no shadow on the dark margin), so it is drawn 1:1. `LOGO.on` is true. Checked at 1280×720 and at 844×390 with the touch controls showing: clear of the SOFT button and the margin's key help. The court itself still has no shield.

## Match rules (2026-10-18)
- **One match = one game.** Before the match, players choose **first to 5, 7, 9 or 11**.
- **Win by 2:** e.g. at 8–8 in a game to 9, play continues until one side leads by 2 (10–8, 11–9…).
- **Rally scoring** (a point on every rally, as in the arcade).
- **No "faults as lives".** The arcade's 5-faults-per-credit mechanic is dropped.
- **Serving:** vs CPU, the human always serves first. In 2-player versus, the first server is random. (After that, the rally winner serves.)
- **The serve crosses the court (2026-10-19).** The arcade serve flies straight (vx 0), so it came back down the server's own side. Now it keeps the arcade's height and depth but is angled across, so its first bounce lands in line with the opposite service box, about 1.9 m behind it (the opposite back quarter, where the receiver stands). `serveVx` in `js/sim/world.js` works out the angle with the real physics, so it still lands there at any game pace.
- **The serve is aimed (2026-10-19, CP-B).** Where the server stands in the box aims it: the first bounce lands at the mirror-image place across the opposite back quarter (near the centre line → near the centre line, near the side wall → near the side wall). **HARD serves deep, SOFT shorter**, and the server's depth in the box nudges it a little. Every serve stays legal (front wall between the service line and the out-line, first bounce in the opposite back quarter). Built in S4b; the target numbers are tuned at CP-C.
  - **As built (S4b):** `SERVE_AIM` in `js/sim/world.js`. The held ball's place across its reach in the box maps to the first bounce's |x| from **36** (centre-line edge) to **120** (side-wall edge); **HARD aims at z 168, SOFT at z 140**, and the server's depth moves both by **±8** (front of the box → 160 / 132, back → 176 / 148). The server starts each serve mid-reach, so an untouched HARD lands at x ∓78, z ≈ 167. `serveAim` keeps the arcade's height speed and solves the depth and sideways speeds with the real physics. The bounce happens on a whole frame, so the reachable depths come in small steps and a serve lands within about 4 units of its depth target (x within 2). To get the deep HARD spots it allows depth speeds up to 11 units/frame (the arcade's serve is 9), so HARD is a little faster than the arcade serve.
- **The serve has a wind-up (2026-10-21, CP-D).** Pressing HARD or SOFT starts the serve swing, and the ball leaves 7 frames (≈0.12 s) later, on its contact frame, as a rally swing does. Until then the server is locked and the ball stays held. The aim is unchanged.
  - **As built (S8b):** `SERVE_WINDUP` (= `SWING.CONTACT`, 7) in `js/sim/world.js`. The press sets `world.windup` and sends a `serveSwing` event; the ball launches on the 7th step after it (the `serve` event), with the pressed button, aimed from the held ball (which hasn't moved). During the wind-up the server can't move and further presses are ignored; the receiver moves as before, and the phase stays `serve` until the launch. The CPU server presses once and then waits; its `SERVE_WAIT` (about 1 s on its spot before the press) is unchanged, so its ball now leaves about 1.1 s after it arrives.
- **Turns are checked at the press (confirmed at CP-B):** a press before the ball has reached the front wall is a miss.
- **The point freeze and the FIRST TO notice (2026-10-23, CP-F).** After a rally the front wall shows the reason's word (TIN, OUT, DOWN, DOUBLE BOUNCE) with the winner's point, then POINT and the score, each about 1.5 s (doubled from 0.75 s at the owner's request). On a point that raises the score needed to win (win by 2), a third step as long again says FIRST TO and the new finish: in a game to 11, 10–10 shows FIRST TO 12, 11–10 nothing, 11–11 FIRST TO 13; in a game to 5, 4–4 shows FIRST TO 6. Never on the match-winning point. GAME at the end is unchanged.
  - **As built (S12e):** `TIMING` in `js/sim/world.js` is `{ CALLOUT: 86, POINT: 86, FIRST_TO: 86 }` sim frames, so a point's freeze (`freezeLength`) is 172 frames, or 258 when `world.raised` is set. `winningScore(match)` in `js/sim/match.js` is the match length, or the lower score + 2 once both sides reach length − 1; `world.raised` is set where `scoreRally` runs (the finish went up and nobody has won). `js/render/hud.js` draws FIRST TO and the number on two lines in the huge red bitmap font (FIRST TO 12 is 234 px, wider than the wall's 220). The left margin's FIRST TO panel still shows the match length, with WIN BY 2 under it.

## Hitting (2026-10-19, CP-B)
- **A swing plants the player** for its whole 18 frames (≈0.31 s), as in the arcade. Confirmed: it feels fine.
- **Dives** happen on the classifier's special band (just beyond a stretch), as in the arcade. Confirmed. **Time on the ground: 2 s** (115 frames in all), shorter than the arcade's 2.5 s. Built in S4b (`DIVE.RECOVERY` 108).
- **SOFT from the front court is a short drop (2026-10-20, CP-C).** It ran deep: some of the arcade's front-court SOFT rows are hit at twice the drop's power, so the ball takes its second bounce near the back wall. For the human and the CPU, a front-court SOFT gets a capped power and lift (in `js/sim/`, not the physics file), so its second bounce is in front of the short line. This departs from the arcade's tables on purpose. Built in S6b.
  - **As built (S6b):** `DROP` and `shotFor` in `js/sim/player.js`: a FRONT-zone SOFT plays at **power ≤ 32** and **lift ≤ 1280** (the arcade's rows are 80–160 and 3072–6144). 1280 ÷ 32 launches it at about the angle of the arcade's row #0 (3072 ÷ 80), at 40% of its power. The plan's defaults (64 / 3072) still left 25–40% of drops past the short line. **Overheads (contact types 8–9, the ball above y 48) keep the arcade's entry**: they are hit downward, and at a drop's power 40–56% went into the tin.
  - Measured over a spread of front-court contacts up to y 30 at all nine levels (depth 20–72, across, aim, the shot's random factor, the incoming ball at 1–5 units/frame): **off a ball coming at up to 3 units/frame every drop's second bounce is in front of the short line; off a fast one (5) 94–100% are**, the deepest at z 112 (the arcade's rows: about 70% past it, up to z 189). **Tins fall from about 22% to 8%, but about 14% now fall short of the front wall** (from the back of the front court, about a quarter), so all lost together stay about as before (21–25%). A cap that grows with the distance from the wall (24 → 48) loses fewer (14%) but puts 4–5% past the short line; not used.
  - **MID-court SOFT is unchanged:** its second bounce is past the short line 61% of the time (mean z 113–116, up to 189), about where it was struck from. Changed only if it also feels too deep when played after S6b.
- **Serves and the 2 s dive confirmed at CP-C (2026-10-20).** No change.
- **Court line heights approved (2026-10-18, after S2):** tin **17**, front-wall out-line **161**, side-wall out-line sloping from **161** at the front wall to **75** at the back (the top of the back glass), in game units. The lines count against the ball. They live in `js/sim/court-rules.js` (`LINES`).
- **The hitting range (2026-10-22, S12b, the owner's calls after S12: "too big", and "more realistic").** Maps: `art/mockups/s12b-reach.png` and `s12b-ranges.png` (the latter drawn with the first 0.3 m cramp).
  - **Reach 90%** (S12b; replaced by S12c below): a human's hit zones (clean, stretch, dive, out of reach, across and in depth) were 90% of the arcade's. Forehand side: clean to 1.0 m, dive to 1.9 m; backhand side 0.4 m / 1.3 m; 1.9 m in front and behind. The owner compared 100/90/80/70% drawn on the court and in play.
  - **By direction, an oval (2026-10-22, S12c, the owner's CP-F notes: "shortening how far back you can hit it from", "the backhand a little wider", "the forehand a little shorter"; then, after the maps: the backhand's orange and red as wide as the forehand's, "an oval with the same dimensions" so the far corners can't be hit, and the red 0.1 m wider each side).** `HUMAN_REACH` in `js/sim/difficulty.js` = `{ front 0.9, behind 0.7, fore 0.75, back 1.05, even, oval, dive 0.1 }`, applied in `shrinkReach` (`js/sim/player.js`): the classifier is run on the ball moved so the arcade's band edges land on the wanted ones (piecewise, per side), the forehand/backhand split never moves, and a ball outside the oval through the four outer edges is out of reach. Straight out from the feet:

    | | clean to | stretch to | dive to |
    |---|---|---|---|
    | forehand | 0.8 m | 1.3 m | 1.7 m |
    | backhand | 0.7 m | 1.2 m | 1.6 m |

    In front 1.9 m, behind 1.5 m; the corners are rounded off (squarer since S12d, below). Maps: `art/mockups/s12c-reach.png` (candidates B/C/D), `s12c-even.png`, `s12c-oval.png`, `s12c-dive.png` (as built). **The CPU's reach is its `cpuReach` (95–99%) of the human's in every direction** (the extra dive width too). `?reach=front,behind,fore,back[,even][,oval][,diveN]` (shares 0.5–1.25; one number still sets all four) tries others.
  - **Squarer corners (2026-10-22, S12d, the owner's CP-F replay: "more like a rectangle with curved corners").** The oval became a superellipse through the same four outer edges: a ball is in reach if |across ÷ edge|ⁿ + |depth ÷ edge|ⁿ ≤ 1 (`outsideOval`, `js/sim/player.js`). n = 2 is S12c's oval; a bigger n cuts less off each corner. **The owner picked n = 3** (`oval: 3` in `HUMAN_REACH`) by playing 2, 3, 4 and 6 after the map (`art/mockups/s12d-corners.png`). The edges, bands, shares, `even` and `dive` are unchanged. `?reach=…,round4` (2–20) tries others; `oval` is still n = 2.
  - **Measured (S12d, round3):** the reference beginner wins 84, 77, 70, 57, 42, 22, 11, 7, 4% at levels 1–9 (S12c 85, 78, 72, 59, 41, 23, 12, 7, 4); no level moved more than 2 points. Cramped 7–10% of hits.
  - **Measured (S12c, `test/measure-levels.js`):** the reference beginner wins 85, 78, 72, 59, 41, 23, 12, 7, 4% at levels 1–9 (S12b 80, 74, 65, 54, 44, 23, 13, 8, 5). Levels 1, 3 and 4 moved by 5–7 points (the CPU's smaller reach behind and on the forehand hurts it more at low levels); level 5 → 6 is now 41 → 23%. Not re-tuned; for the owner to judge in play. Cramped: 7–10% of hits.
  - **Nobody reaches above 2.4 m** (`REACH_TOP` 84 units: a 1.75 m player's arm and racket up). The arcade's classifier has no top limit (above 1.36 m is an overhead), so a press for a higher ball is now a miss. The CPU never plans contacts above 1.6 m, so it isn't affected.
  - **Cramped shots** (squash coaching: a ball "jammed" into the body can't get a full swing): a ball met within **0.2 m across** of the feet and **below 1.5 m** is still hit, but with **80% of its pace** (lift cut the same, so it doesn't fly higher) and its aim moved by up to **±2 of the 8 timing steps** (`CRAMP` and `crampedAim` in `js/sim/player.js`). At 1.5 m or higher the player reaches up and plays a normal shot. Humans and the CPU alike. First built at 0.3 m; the owner made it a little smaller after play.
  - **Measured (`node test/measure-levels.js`, 1000 rallies a level):** the reference beginner wins **80, 74, 65, 54, 44, 23, 13, 8, 5%** of points at levels 1–9 (S6b: 78, 71, 67, 54, 43, 29, 14, 10, 5); 7–9% of all hits are cramped.

## CPU difficulty (2026-10-18, revised)
- **Difficulty selector, levels 1–9** (1 = easiest, 9 = hardest), chosen before a 1P match.
- Later, when there are several characters, each CPU character may get its own level; the selector may change then.
- The arcade has 20 internal difficulty steps (4 DIP settings × 5 hidden skill levels), and they are **not** in a clean easy→hard order. The plan must map 1–9 onto a smooth, monotonic curve built from those values (see `research/squash-game-logic.md`, "Difficulty index").
- Note: in the arcade, difficulty changes **game pace too** (ball speed, gravity, shot power, bounce), not just how well the CPU plays. Default for the plan: keep that for 1P, and use one fixed mid-level pace for 2P versus.
- **Level 5's pace is the CP-B pace (2026-10-19).** The pace played at CP-B (arcade Normal skill 0: speed 280, power 17, bounce −1, gravity 0x1F80) is right for level 5, and 2P versus uses it. The plan's proposed table put this pace at level 3, so S6 re-anchors the pace columns around it.
- **The table as built (2026-10-19, S6)** (`LEVEL_TABLE` in `js/sim/difficulty.js`; tuned at CP-C). *The CPU reaction column changed in S6b, which also added shot-quality columns: see "The CPU columns as built" below. The pace columns here still hold.* 1P plays the chosen level for both the pace and the CPU; 2P always plays level 5's pace. `?level=1..9` picks it (default 5) until the menus (S10).

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
- **The CPU columns as built (2026-10-20, S6b)** (`LEVEL_TABLE` in `js/sim/difficulty.js`; the pace columns are unchanged). Level 9 is the CPU as it was; level 1 a slow, clumsy one.

  | Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
  |---|---|---|---|---|---|---|---|---|---|
  | CPU reaction (frames) | 36 | 31 | 27 | 23 | 17 | 14 | 10 | 6 | 1 |
  | CPU error step | 24 | 20 | 16 | 16 | 12 | 10 | 6 | 4 | 2 |
  | CPU shot sense | 0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.625 | 0.75 | 0.875 | 1 |
  | Timing error (± frames) | 4 | 4 | 3 | 3 | 2 | 2 | 1 | 1 | 0 |
  | Aim jitter (± units) | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  | SOFT scale | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.75 | 0.85 | 0.9 | 1 |
  | Volleys | no | no | no | no | no | yes | yes | yes | yes |
  | Reach (share of a human's) | 0.95 | 0.955 | 0.96 | 0.965 | 0.97 | 0.975 | 0.98 | 0.985 | 0.99 |

  - **Timing error:** the CPU presses up to ±N frames off its planned press, fresh each shot (deterministic). It changes the aim as a human's timing does, and can make a stretch or a miss.
  - **Aim jitter:** how far in front of or behind the contact it may stand, so timing angles its shots; 0 = square, straight back.
  - **SOFT scale:** multiplies the plain SOFT chances in `chooseButton`; the shot sense works on top, so level 9 is unchanged.
  - **Volleys:** without them it lets the ball bounce and takes it nearest waist height (`COMFORT_Y` 20) when it can reach that, instead of the earliest contact. (The CPU's search only looks past the bounce once the ball has bounced, e.g. after a slow reaction; see the S6b Session log.)
  - **Reach (2026-10-20, after S6b, the owner's call):** every CPU's hit zones (clean, stretch, dive, out of reach) are smaller than a human's, by 5% at level 1 down to 1% at level 9 ("all the bots have too much range"). A CPU's press is classified as if the ball 7 frames ahead were further from its feet by 1 ÷ reach, with the arcade's own classifier (`shrinkReach` in `js/sim/player.js`), so a ball on a band's edge drops to the next band out. The human's zones are the arcade's. At these sizes it is a small change (level 1 loses about 3 units of forehand reach); the reference player's share moved from 78 to 79% at level 1 and 43 to 45% at level 5. Bigger cuts are a one-column change.
  - **Changed from the CP-C proposal:** reaction 36, 30, 24, 18, 12, 8, 5, 3, 1 became 36, 31, 27, 23, 17, 14, 10, 6, 1, and the timing error 4, 3, 3, 2, 2, 1, 1, 0, 0 became 4, 4, 3, 3, 2, 2, 1, 1, 0. The proposal stepped the timing on the same levels as the pace columns (power and bounce change at levels 2, 4, 6 and 8), which made big jumps between some levels and small ones between others, and left level 5 slightly too strong.
  - **Measured** against a beginner-like reference player (`test/reference-player.js`: 15-frame reaction, runs to the landing marker, ±3 frames of timing, ±16 units of position; it wins 34% of points against the S6 level 1, close to the owner's 4–9): it wins **78, 71, 67, 54, 43, 29, 14, 10 and 5%** of points at levels 1–9 (1000 rallies each). The plan's targets were ≥ 60% at level 1, 35–55% at 5 and ≤ 20% at 9.

## Character (2026-10-18)
- v1 character: an **adult player in red and black** (Hogg colours).
- The CPU opponent and P2 in versus use the same character, **palette-swapped** to a different kit.
- **Look and kits (2026-10-20, A1):** the base is SpriteCook concept 4 (`art/spritecook-manifest.md`): red shirt with black side panels, black shorts with red stripes, white socks and shoes. **P2 / CPU wear white and black:** the kit's reds become whites and greys, the black stays (the table is in `art-style-guide.md` §2).

## Court look (2026-10-18)
- Like the Hogg courts: **white walls, red lines, light wood floor**. No court photos are needed.
- **No back wall drawn** in v1 (the camera looks in from behind). The ball still bounces off the back wall in the physics.
- **No crowd** in v1. Later.
- **Wall boards (2026-10-22, A4, the owner's call):** a Hogg red board low on each side wall, "HOGG" on the left and "RAZORBACKS" on the right, hand-drawn, with a small Mission Success orange-and-teal stripe. No school logo (open question 6). The painted court is `assets/court.png`, made for the frozen camera only (`art-style-guide.md` §3).

## Camera and character size (2026-10-18, CP-A)
- **Camera stays as built in S1** (`CAMERA` in `js/render/projection.js`): 8.1 m behind the back wall, 4.0 m high, focal 557 px, eye line at y 70. The front wall is 200 × 143 px, the floor is 150 px deep and each side margin is 100 px. It can still change until CP-D. After that it is frozen, because A4 paints the court to match it. *(Changed at CP-D: frozen at the end of S8b instead, as the `wide` camera; see "FROZEN" below.)*
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
  - **Settled in A1 (method 1, smoothed; see "Sprites: one 100 px sheet, scaled smoothly" below): how the sprites get smooth sizes.** Pixel art can't be resized freely without some cost, so A1 tries the options on the test sprite and the owner picks:
    1. scale the 100 px art at draw time to the exact height (no extra art work; pixels go slightly uneven or soft while the size changes);
    2. export many sizes, about every 2–4 px, downscaled automatically in Aseprite with only light cleanup;
    3. keep a few hand-cleaned sizes (100 / 84 / 68) and scale the nearest one at draw time for the heights in between.
  - A1 replaced the three hand-cleaned sizes above with one 100 px sheet.
- **One smooth curve over the whole court (2026-10-19, CP-B).** The 68–100 px range is right, but the S3 curve didn't look natural: it stops growing near both walls and bends at mid-court. It is replaced (in S4b) by one smooth curve with no flat ends: height = 100 × √(perspective scale at z ÷ scale at the back), about 70 px at the front wall, 82 at mid-court and 100 at the back. That's half-strength perspective.
  - **As built (S4b):** `heightAt` in `js/render/actors.js`: **70 px at z 12, 73 at z 39, 77 at z 70, 82 at z 100, 87 at z 130, 93 at z 155, 100 at z 179**, rounded to whole pixels (at most 0.4 px of change per running frame). The box's left and right edges are each rounded from the unrounded size, so neither edge steps back and forth as the player walks (rounding the width first did, by 1 px, near the centre). `?curve=old` shows the S3 curve for comparison.
  - **For the sprites, the owner leans towards one sprite scaled to fit** (method 1 above), but wants to see real pixel art first. A1 still shows all three methods and the owner picks there.
- **The S4b height curve is confirmed (2026-10-20, CP-C):** it looks natural, with no difference visible against the old one while moving.
- **True to scale: a 1.75 m player (2026-10-21, after CP-D; replaces the half-strength curve).** The owner asked for the players to be the right size against the court. An average man is about 1.75 m (the US average is 5 ft 9 in), just under the front wall's 1.78 m service line. Our line heights match the World Squash numbers: service line 63 units = 1.79 m, tin 17 = 0.48 m, front-wall out-line 161 = 4.57 m, back-wall line 75 = 2.13 m (the service line is 39% of the out-line's height, on court and on screen). The half-strength curve made the player 1.75 m only near z 120. In front of that the player was too tall (2.16 m at the front wall, head 12 px above the service line), and behind it too short (1.49 m at the back).
  - **As built:** `heightAt` in `js/render/actors.js` = 1.75 m × `project()`'s scale at the feet z (`CHARACTER_HEIGHT.METRES`): **57 px at z 12, 62 at z 39, 69 at z 70, 78 at z 100, 89 at z 130, 102 at z 155, 117 at z 179**. At most 0.95 px of change per running frame. The head is always just under the service line.
  - **Trade-off accepted:** behind z ≈ 150 the 100 px art is drawn larger than 1:1 (1.17× at the back wall), so it's slightly soft there, and it's no longer pixel-exact at the back. The front-to-back range is about 2×, not 1.4×.
  - `?curve=half` shows the CP-B curve and `?curve=old` the S3 one, for comparison. `?h=` still sets the back height and scales the curve.
- **57 px at the front, 100 px at the back (2026-10-21, replaces true scale the same day).** Played, the back was too big at 117 px. The front stays true to scale (57 px: a 1.75 m player, the head just under the service line), and the back goes back to 100 px (the art drawn 1:1, never enlarged).
  - **As built:** `heightAt` = 100 × (scale(z) ÷ scale(z 179))^k, with k ≈ 0.77 worked out from the two ends (`CHARACTER_HEIGHT.FRONT` 57 at `FRONT_Z` 12, `BACK` 100 at `BACK_Z` 179). That makes it a smooth perspective curve with no flat ends or bend, between the CP-B curve (k 0.5) and true scale (k 1). **57 px at z 12, 61 at z 39, 66 at z 70, 73 at z 100, 81 at z 130, 90 at z 155, 100 at z 179**, at most 0.62 px of change per running frame. As a real height that's 1.76 m at the front wall down to 1.49 m at the back, so the head is under the service line everywhere.
  - `?curve=true` shows true scale; `?curve=half` and `?curve=old` stay.
- **Sprites: one 100 px sheet, scaled smoothly (2026-10-20, A1).** The owner compared the A1 test sprite done four ways (nearest-neighbour scaling of the 100 px art, the same with smoothing, an automatic cleanup every 2 px, and three hand-cleaned sizes) and picked **the 100 px art scaled at draw time with smoothing on** ("method 1b": it looks the smoothest while the size changes).
  - The character art is made and cleaned **at 100 px only**: one sheet per kit (`player-100.png` + `.json`). No 84 or 68 px sheets (the A1 ones in `art/character/` were only for the test).
  - At draw time the game scales the sheet to `heightAt(z)` with `imageSmoothingEnabled = true` (quality `high`) for the player sprites only, and turns smoothing off again for everything else. At the back wall (100 px) it is drawn 1:1, pixel-exact; nearer the front the edges are slightly soft. Smoothing blends colours, so in-between sizes aren't locked to the palette; that's accepted.
  - The swapped kit is recoloured once at load from the 100 px sheet, then scaled the same way.
- **The court gets a little wider (2026-10-21, CP-D).** The owner wants the court "a little wider", so the camera above is not final. S8b offers a stretch across only (`CAMERA.widen` 1.10: front wall 220 × 143 px, margins 78 px, heights unchanged) and a ~10% zoom, and the owner picks. **The camera is frozen at the end of S8b**, which records the final constants here. Character heights (57 → 100 px, see above) are set in pixels at the two ends, so they don't change with either camera.
- **FROZEN: the `wide` camera (2026-10-21, S8b, the owner's pick).** `CAMERA` in `js/render/projection.js`: **behind the back wall 8.1 m, height 4.0 m, x 0, focal 557 px, cx 320, cy 70, widen 1.10** (the S1 camera, with every screen x offset from the centre stretched by 1.10, so the court reads about 10% wider than a real one; heights and depths are unchanged).
  - **Front wall:** 220 × 143 px to the out-line (x 210–430, floor at y 195, out-line at y 52; the wall is drawn to y 45).
  - **Floor:** from y 195 at the front wall to y 345 at the glass (150 px deep), 484 px wide at the glass (x 78–562).
  - **Side margins:** 78 px at the glass. The HUD's margin width is computed from the camera (`js/render/hud.js`).
  - The players keep 57 → 100 px. The ball, shadow, landing marker and effects follow `project()`, so they stretch across with the court; the player sprites are never stretched.
  - **A4 paints the court to this camera only.** Moving it means repainting the court. `?cam=zoom` (focal 612, cy 43: front wall 220 × 157 px) and `?cam=old` (the S1 camera) stay until S12 for comparison only.
- **Racket height at contact (2026-10-21, CP-D).** The contact frames hold the racket at shoulder height, but most contacts are lower. The fix is to draw a swinging sprite a little up or down, by the ball's height at contact (eased in and out, capped), not new art. The `overhead` tag plays for overhead contacts (types 8–9).
  - **As built (S8b):** the racket head's point on each swing tag's contact frame is a 1×1 slice in the art, `racket <tag>` (`art/tools/racket-slices.lua`; the sheet's pixels are unchanged). `racketShift` in `js/render/sprites.js` draws the sprite down (or up) by the gap between that point and the ball's drawn centre at the planned contact (the classifier's ghost ball, which is exactly where the racket meets it; the held ball for a serve), capped at **12% of the drawn height** (`RACKET.MAX`), eased in with a smoothstep from 0 at the press to full on the contact frame and out over **10 frames** (`RACKET.OUT`, 0 on a swing's last locked frame; 3 for a serve, which a running server may cut short). Vertical only. `?racket=off` turns it off. `overhead` plays (mirrored for a backhand) when the swing's contact is type 8 or 9.
  - **Measured (80 contacts, both players, seed 5):** the cap binds on 73 of them. The median gap between the racket head and the ball at contact went from **35 px to 25 px** (against the ball as drawn on that step, which has already moved one frame up and away: 21 → 12 px). By height: low balls (below y 12, a third of all hits) 55 → 46 px; waist-high 34 → 25; high forehands 3 → 0.5; overheads 30 → 22 (the overhead art holds the racket well above a y 50–56 ball); serves 21 → 12. Across, the racket head is a median 12 px from the ball (serves 32, overheads 35). A 20% cap would give 19 px, 30% 11 px, but those sink the feet 20–30 px into the floor. The rest needs low-contact art; left for the owner at CP-E.
  - **Changed in S12 (2026-10-22, the owner's pick after playing them): 1% up / down and 1% across.** CP-E asked for the racket to look "more like it hit the ball", so S12 added a sideways shift towards the ball (`racketSideShift`, same easing, cap `RACKET.SIDE`) and showed 12% / none (S8b), 16% / 6% and 20% / 10% side by side (`art/mockups/s12-racket.png`). The owner then tried 12/12, 6/12, 5/6, 3/4 and 1/1 in the running game and chose **`RACKET.MAX` 0.01, `RACKET.SIDE` 0.01**: the player stays on their spot (at most 1 px off either way), and the racket is left nearer where the art holds it.
  - **Measured (90 contacts, both players, seed 5, against the planned contact):** median racket-to-ball gap **34 px with S8b's 12% → 39 px** now (low balls 51 → 57, waist-high 30 → 36, high forehands 9 → 9, overheads 42 → 46, serves 35 → 38); the feet sink at most 1 px (was 12) and slide at most 1 px. For comparison, 16% / 6% gave 29 px and 20% / 10% 24 px. `?racket=s8b` and `?racket=a` (16% / 6%) show those for comparing; `?racket=off` still turns the shift off.
- **Ball feel and test feed:** the ball feels like the arcade, and the S1 feed (back to about the short line) is fine. No change.

## Screens (2026-10-18)
- Flow: **title → 1P / 2P → match length (5/7/9/11) → difficulty 1–9 (1P only) → controller assignment → match → result → rematch / menu.**
- **Pause menu on Esc** (and Start on a gamepad). Pause also triggers automatically when the window loses focus or leaves fullscreen.
- **Options screen:** key remapping and a key test; the **Effects** level (S13). The pause menu also has **Sound on/off** (S13).
- **GO TO HOME on the title (2026-10-22, the owner's request; first named RONINRAY.COM):** the title's fourth item goes back to the website's start page (https://roninray.com/), where the game and the build log are.

## Version numbers (2026-10-22, the owner's call)
- **`0.<session>.<fix>`**, shown small in the bottom-right corner of every screen (`js/version.js`; `package.json` matches).
- The middle number is always the last finished session: S10 is **0.10.0**, S11 is 0.11.0, S12 is 0.12.0.
- A **b session** or any smaller update after a session bumps the last number: S11b is 0.11.1, a fix after S10 is 0.10.1.
- **1.0.0 is the full release** (CP-F).
- **After 1.0.0 (2026-10-23, the owner's call): `1.<session>.<fix>`.** The v2 plan's sessions carry on from S12 (S13, S14 …; art and sound sessions A6, A7 …). A session sets the middle number to its own (S13 → **1.13.0**); a b session or any smaller fix bumps the last (1.13.1). Art and sound sessions change no game code, so they don't change the version. **2.0.0 is the v2 release** (CP-J in `plan-v2.md`).

## Art production (2026-10-18)
- **Claude does the Aseprite cleanup** of SpriteCook output, through the Aseprite connection.
- **SpriteCook credits:** the owner will upgrade the account when generation is needed. Ask before spending.

## After v1 (2026-10-23, the owner's calls)
- v1 is released (1.0.0). The next plan is **`docs/plan-v2.md`**: **audio first, then more characters, a crowd and a tournament**, in that order.
- Of v1's "Not in v1" list, audio, character select, the crowd and a tournament are now planned. Still not planned: music, voice callouts, more courts, a high-score table, a 2P tournament. Online play: never.

## Audio (2026-10-23)
- **Effects only:** racket hits, the ball on the walls, floor, tin and glass, the serve, shoes, short point and game jingles, menu sounds. No music and no voice callouts for now.
- **Source: ElevenLabs Sound Effects on the paid Starter plan** (commercial licence, no credit line needed), generated by Claude through the official ElevenLabs connector behind a spend gate, like SpriteCook. Researched against Stable Audio 3 Small SFX (open weights, run locally), ChipTone / jsfxr (free retro bleeps, CC0) and Meta AudioGen (non-commercial only, not used); see `plan-v2.md`, "Decisions made while writing this plan". The free ElevenLabs plan isn't used (it needs a credit line and isn't licensed for commercial use). Every file's prompt, date, plan and cost goes in `audio/elevenlabs-manifest.md`.
- **Changed in A6 (2026-10-29, the owner's call): the free ElevenLabs plan is used, not Starter.** The game is a non-commercial school project (never sold), so the free plan's non-commercial terms fit. The free plan asks for a credit to ElevenLabs (elevenlabs.io) wherever the sounds are used, and the game is public on roninray.com, so the credit must be shown. **Where (S14, the owner's call): in THE TOOLS on the build page** (https://roninray.com/build/, the site repo), which names and links ElevenLabs as the maker of the game's sounds; not inside the game for now. Free generations can be refused when ElevenLabs is busy; wait a minute and try again.
- **Never the arcade's sounds**, as files or as a reference for a generator (IP rules in `CLAUDE.md`).
- **Volume:** an **Effects** level on the Options screen (Off, 1–10, saved in the browser like the keys), **Sound on/off** in the pause menu, and a speaker button beside the fullscreen button for touch. A Music level only if music is added later.
- **The first sound:** browsers allow sound only after a key press, click or tap (a gamepad button doesn't count). The game is **silent until the first key, click or tap**, with no extra screen; a gamepad-only player sees a small "Press a key or tap for sound" note on the title.
- **Sound stays out of the simulation:** it listens to the sim's events, as the effects do, and never changes the play.
- **As built in S13 (2026-10-24):** `js/audio/` holds the engine (`audio.js`: one Web Audio context, master and Effects gains, the first-input unlock, pause, the `sfx.json` loader), the table of events and menu moves to sound names (`sounds.js`) and a placeholder for every name made in code (`synth.js`: noise bursts and tones, no files). A6's files go in `assets/sfx/` and are listed in `assets/sfx/sfx.json` by those names (`{ "files": [...], "level": 0–1 }`, several files = variants); a name not listed plays its placeholder.
  - **Effects level:** Off or 1–10, **default 7** (**5 from S14b**, the owner's call at CP-G), a square curve (7 is about half of 10's loudness); OK on it steps up and wraps to Off, for taps. Saved with Sound on/off in `localStorage` (`hogg-squash.sound`).
  - **Silent until the first key, click or tap,** even in a browser that would allow sound sooner (the context is suspended until then). The sound is also suspended on the pause menu, with the window blurred, the tab hidden, the portrait warning up, Sound off or the level at Off. Sounds asked for meanwhile are dropped, not saved up.
  - **Which events sound:** hits by HARD / SOFT and the dive's stretch hit; a miss whooshes; the serve sounds on the launch, not the press; the ball on the front wall, side walls, floor and back glass; the tin's clang (or a buzz for out) replaces that step's ball sound; a jingle with each callout and a longer one on GAME. Shoe squeaks have names in A6's list but no event yet (S14 can add one, from the players' movement, without the sim).
  - **iPhone silent switch: respected** (iOS mutes Web Audio while it's on; settled at CP-G). Setting `navigator.audioSession.type = 'playback'` would make the game sound through it; not used.
  - **Checking without hearing:** `?sound=log` logs every sound by name as it plays (with the audio clock and page time, for S14's timing), and the context's state changes; `?sound=off` starts with Sound off for that visit.
- **As built in S14 (2026-10-29):** the sounds are shaped by what happened, in `sounds.js` (`cuesFor`, `SHAPE`; pure, tested), and played in `audio.js`.
  - **By what happened:** a ball sound's volume follows the ball's speed (the square root of speed / 4 units a frame, never below 0.25) and is up to 25% quieter at the back wall than at the front; every sound except the jingles pans by the ball's x, ±0.3 at the side walls; HARD is louder than SOFT by their levels in `sfx.json`.
  - **Variety:** the racket's and the ball's pitch varies ±3% each time; a variant is picked at random, never the same one twice running (every name has one file for now). `sfx.json` takes an optional `rate` per name (its pitch), so names sharing a file differ: the floor 0.92, the front wall 1.06, the soft swing 1.08.
  - **Loading:** each file is fetched and decoded once, however many names share it (11 files for 14 names).
  - **The mix:** a limiter (a `DynamicsCompressor`, -3 dB, ratio 20) after the master, so many sounds at once don't clip; the ball sounds' levels were raised a little to make up for the speed and depth shaping. For the owner to tune by ear at CP-G.
  - **Timing:** every sound starts on the step of its event (no queue); Chrome on the owner's PC reports 10 ms base + 40 ms output latency, so a sound is heard about 40–53 ms after its event, roughly one to two display frames after the frame that shows it. `?sound=log` now also prints each sound's volume, pan, rate, the latency and when it's heard.
- **Settled at CP-G (2026-10-29, the owner's calls after play-testing on a computer and a phone):**
  - **Kept as built:** the timing (the 40–53 ms delay can't be heard), the bounce pitches by surface, the glass (no hiss), the speed shaping, HARD against SOFT, the jingles' levels, the pause menu's Sound on/off, the speaker button, the gamepad-only note's wording, and the silent switch muting the game.
  - **The miss whoosh about twice as loud** (it was too quiet everywhere); **Effects default 5** (players' saved levels are kept). Both in S14b.
  - **Real files for the dive and the menu sounds** (A6b; the owner picks the menu style by ear, or keeps the in-code bleeps).
  - **Shoe squeaks: only when a player stops sharply or changes direction just before a hit, on about one such hit in three**, quieter than the hit. Worked out from the players' movement outside the sim (S14b).
  - **Music: on the title and menus only, never in play**, with its own **Music** level beside Effects. This replaces "no music" above; still no voice. The owner picks the style by ear from a few candidates (A6c). Music needs the full ElevenLabs connector (the one used for A6 has no music) and the free plan's terms checked for music (P2).

## Characters (2026-10-23)
- **Several new bodies:** three new SpriteCook characters (four in all), each with every animation of `player-100`'s sheet. More can be added later, one art session each.
- **Looks only:** everyone plays the same (no speed, reach or power differences).
- **Every character wears the same two kits:** P1 Hogg red and black, P2 / CPU white and black (the existing kit swap), so a mirror match is allowed.
- **Invented people only,** never real students or staff.
- **Credits:** 488 on 2026-10-23; the plan needs about 1,000, so a top-up of about 500–600 is needed before the third character's art.

## Still open
Nothing blocking. Details for the plan to settle are in `open-questions.md`.
