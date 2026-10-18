# Plain Canvas vs Phaser

*Researched 2026-10-18.* **Decided 2026-10-18: plain Canvas, proven by the test below as step 1 of the build.** Phaser is the fallback.

## The two options
- **Plain HTML5 Canvas:** our own small engine: a game loop, sprite drawing, an animation player, input and screens. No dependencies.
- **Phaser:** the most widely used 2D browser game framework, free and open-source. **Phaser 4** came out in April 2026 with a rewritten WebGL renderer; the current release is 4.2.x (July 2026). Phaser 3 is still mature and has the most tutorials. Either version can be loaded from a single script file, **with no build step**. The library is roughly 1 MB minified (a few hundred KB over the network).

## What Hogg Squash needs, and who provides it

| Need | Plain Canvas | Phaser |
|---|---|---|
| Fixed-step sim at the arcade's 57.4 Hz | we write it (~30 lines) | we write it too: Phaser's loop runs at display rate, so we'd run our own accumulator inside it |
| Ball physics | **ours already** (verified port) | ours. Phaser's Arcade/Matter physics go unused |
| 3D→2D projection, depth sorting of players/ball/shadow | we write it | we write it (Phaser's `setDepth` helps a little) |
| Sprite animations from Aseprite | ~100 lines: read the JSON, play tags | **built in** (`createFromAseprite`) |
| Crisp pixel scaling | ~30 lines (no smoothing + integer scale) | **built in** (`pixelArt: true` + Scale Manager) |
| Keyboard + 2 gamepads | ~150 lines over browser APIs | **built in** (still needs the same pitfall handling) |
| Screens: title, menus, match, results, pause | simple state machine | **built in** (Scenes) |
| Text, tweens, particles (crowd, flashes, impact ring) | we write what we need | **built in** |
| Audio (later) | Web Audio, ~50 lines for simple SFX | built in |
| Fixed single screen, no scrolling world | perfect fit | cameras/tilemaps unused |

## Would Phaser's physics help the ball? (checked 2026-10-18): No
Phaser 4 ships two physics engines, **Arcade** (simple boxes and circles) and **Matter.js** (rigid bodies). Neither suits this game:

- **They are 2D only.** Gravity and velocity have just x and y. A squash ball needs **three** dimensions: across the court, **height**, and **depth** toward the front wall. The screen shows a 3D court from behind, so "up the screen" means both farther away *and* higher. A 2D engine can't tell those apart. You'd have to fake height on top of it, which is exactly what our own code already does properly.
- **Their bounce is a single number per object** (restitution 0–1; in Matter the bouncier of the two bodies wins). The arcade's feel comes from rules a general engine doesn't have: bounce that **changes with impact speed** (a table from 0.68 down to 0.31), a **front wall that kills most of the depth speed** (~25 m/s in, ~7 m/s out), a floor that keeps 1.5× depth speed, and floor friction. We'd be tuning by feel, trying to get back what we already have.
- **We already have the real thing.** The physics port matches the arcade **with zero error over 458 ball flights (29,634 frames)**, and all 244 shot selections are identical. Swapping to Phaser physics would throw away the most valuable piece of work in the project.
- **Determinism.** Our core uses integer fixed-point maths, so it gives identical results on every browser; that makes tests, replays and the CPU's ball prediction reliable. Matter uses floating point and doesn't promise this.

So physics is **not** a reason to choose Phaser. If we did use Phaser, it would be with its physics switched off, purely for drawing, animation, input and scenes.

## Trade-offs
**Plain Canvas, for:**
- The hard parts of this game (physics, projection, rules, CPU) are custom **either way**. Phaser's biggest features (physics, scrolling cameras, tilemaps) wouldn't be used.
- Total control over frame timing and the draw order, which matters for matching the arcade feel.
- Small, no dependency to upgrade (Phaser 3 → 4 changed a lot), and all the code is ours and easy to read.

**Plain Canvas, against:**
- Roughly 500–1,000 lines of plumbing (loader, animations, input, scenes, text) that Phaser already has.
- Menus, transitions and visual polish take more effort.

**Phaser, for:**
- Aseprite animations, pixel scaling, gamepads, scenes and tweens work on day one.
- Large community, docs and examples. Easier to add polish later (particles, transitions, sound).

**Phaser, against:**
- We'd be working around its game loop to keep our fixed 57.4 Hz sim.
- A large library for a single-screen game. Learning its API (and v3 vs v4 differences, since most tutorials are still v3).

## Leaning
**Lean toward plain Canvas** (a bit stronger now that Phaser's physics is ruled out), because the game is one fixed screen and the core is already custom code. But both are reasonable choices.
Whichever we pick, keeping the **sim separate from rendering** (see `CLAUDE.md`) means the renderer can be swapped later without touching gameplay.

## The test (proposed 2026-10-18)
Rather than build the same thing twice to compare, make the **first step of the real build** a small plain-Canvas test, and keep it:
- One page at 640×360, scaled crisp to the window.
- The court drawn with plain shapes (white walls, red lines, wood-coloured floor) using the 3D→2D projection.
- The real physics core bouncing a ball, with its shadow.
- One placeholder player (a coloured box) moving with WASD and hitting with F/G, using the arcade's shot tables.

That's a few hundred lines of code: one focused session, not a big token spend. It answers the questions that matter: does the projection look right, does the ball feel like the arcade, is plain Canvas pleasant to work with. If it is, we carry on from it. If the plumbing already feels heavy, we switch to Phaser before anything else is built on it, and the physics and projection code carry over unchanged.

## Sources
- Phaser downloads / current release: https://phaser.io/download/stable
- Phaser 4 release news (April 2026): https://gamedev.net/news/2759-phaser-4-released/
